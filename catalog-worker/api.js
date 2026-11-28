import {baseCatalog,demand,json,limitedBytes,now,readJSON} from './common.js';
import {access,digest,editor} from './access.js';
import {dashboardData} from './directory.js';
import {seoDocument} from './seo.js';
import {collectView,trafficReport} from './traffic.js';
import {cleanProduct,cleanStories,verifyImages,hasPendingChanges} from './content.js';

function checkWebp(bytes) {
  const chars=(at,n)=>String.fromCharCode(...bytes.slice(at,at+n));
  demand(bytes.length>=30 && chars(0,4)==='RIFF' && chars(8,4)==='WEBP',415,'请上传 WebP 图片。');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  demand(view.getUint32(4,true)+8===bytes.length,400,'图片文件不完整。');
  const chunk=chars(12,4);
  let width,height;
  if(chunk==='VP8X'){
    width=1+bytes[24]+bytes[25]*256+bytes[26]*65536; height=1+bytes[27]+bytes[28]*256+bytes[29]*65536;
    demand((bytes[20]&2)===0,400,'请上传静态图片。');
  }else if(chunk==='VP8 '){
    width=view.getUint16(26,true)&16383;height=view.getUint16(28,true)&16383;
  }else if(chunk==='VP8L' && bytes[20]===47){
    const dimensions=view.getUint32(21,true);width=1+(dimensions&16383);height=1+((dimensions>>>14)&16383);
  }
  demand(width>0 && height>0 && width<=8192 && height<=8192,400,'图片尺寸或格式无效。');
}
async function servePhoto(req,db,id) {
  const shared=await db.prepare('SELECT 1 FROM catalog_public_images WHERE image=? LIMIT 1').bind(id).first();
  demand(shared || await editor(req,db),404,'找不到图片。');
  const img=await db.prepare('SELECT bytes FROM catalog_images WHERE id=?').bind(id).first();
  demand(img,404,'找不到图片。');
  return new Response(req.method==='HEAD'?null:new Uint8Array(img.bytes),{headers:{
    'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Cache-Control':shared?'public, max-age=300':'private, no-store','ETag':'"'+id+'"',
  }});
}
export async function handleCatalogAPI(req,env) {
  const db=env.SUPPORT_DB, url=new URL(req.url), action=url.pathname.slice('/catalog-api/'.length), method=req.method;
  const write=!['GET','HEAD'].includes(method);
  if(write) demand(req.headers.get('Origin')===url.origin,403,'请从本站后台操作。');
  if(action==='view' && method==='POST')return collectView(req,env);
  if(action==='stories'&&method==='GET'){
    const story=await db.prepare("SELECT live FROM catalog_documents WHERE kind='stories' AND id='home' AND live IS NOT NULL").first();
    return json({configured:!!story,stories:story?JSON.parse(story.live):[]});
  }
  if(/^images\/[a-f0-9]{64}$/.test(action)&&!write) return servePhoto(req,db,action.slice(7));
  if((action==='session'&&method==='GET')||(['login','activate','logout','password'].includes(action)&&method==='POST'))return access(req,db,action);
  demand(await editor(req,db),401,'请登录产品后台。');
  if(action==='traffic' && method==='GET')return trafficReport(db,url.searchParams.get('days') || '7');
  if(action==='images'&&method==='POST'){
    demand(req.headers.get('Content-Type')==='image/webp',415,'请上传 WebP 图片。');
    const bytes=await limitedBytes(req,900000);checkWebp(bytes);
    const id=await digest(bytes);
    await db.prepare('INSERT OR IGNORE INTO catalog_images(id,bytes,created) VALUES(?,?,?)').bind(id,bytes.buffer,now()).run();
    return json({src:'/catalog-api/images/'+id},201);
  }
  const base=await baseCatalog(req,env);
  if(action==='dashboard'&&method==='GET'){
    return json(await dashboardData(db,base));
  }
  const seo=/^documents\/seo\/([a-z0-9][a-z0-9-]{0,95})$/.exec(action);
  if(seo)return seoDocument(req,db,base,seo[1]);
  const route=/^documents\/(product|stories)\/([a-z0-9][a-z0-9-]{0,95})$/.exec(action);
  demand(route && (route[1]==='product'||route[2]==='home'),404,'找不到该内容。');
  const [,type,id]=route;
  if(method==='GET'){
    const row=await db.prepare('SELECT draft,live,revision,live IS NOT NULL AS published,draft IS NOT live AS pending FROM catalog_documents WHERE kind=? AND id=?').bind(type,id).first();
    const original=type==='stories'?base.stories:base.bySlug.get(id);
    demand(row||original,404,'找不到该内容。');
    const liveOnly=url.searchParams.get('version')==='live';
    const stored=liveOnly?row?.live:row?.draft;
    const content=stored?JSON.parse(stored):original;
    demand(content,404,'这个草稿还没有线上版本。');
    if(type==='product' && !content.tables)content.tables=original?.tables || [];
    return json({content,revision:row?.revision||0,published:!!(row?.published||original),pending:row?hasPendingChanges(type,id,row.draft,row.published,row.pending,base):false});
  }
  demand(method==='PUT',405,'此操作不支持。');
  const input=await readJSON(req,300000), publish=input?.mode==='publish';
  demand(input && (publish||input.mode==='draft') && Number.isSafeInteger(input.revision) && input.revision>=0,400,'请刷新后重试。');
  if(type==='product' && input.new===true) demand(!base.bySlug.has(id),409,'此产品网址已使用，请重新选择。');
  const doc=type==='product'?cleanProduct(input.content,id,base,publish):cleanStories(input.content,publish);
  if(type==='product' && !('tables' in doc) && input.revision>0) {
    const saved=await db.prepare("SELECT json_extract(draft,'$.tables') AS tables FROM catalog_documents WHERE kind=? AND id=? AND revision=?").bind(type,id,input.revision).first();
    if(saved?.tables)doc.tables=JSON.parse(saved.tables);
  }
  await verifyImages(db,doc);
  const data=JSON.stringify(doc);
  let saved;
  if(input.revision===0){
    saved=await db.prepare('INSERT INTO catalog_documents(kind,id,draft,live,revision,updated) VALUES(?,?,?,?,1,?) ON CONFLICT(kind,id) DO NOTHING RETURNING revision').bind(type,id,data,publish?data:null,now()).first();
  }else{
    saved=await db.prepare('UPDATE catalog_documents SET draft=?,live=CASE WHEN ?=1 THEN ? ELSE live END,revision=revision+1,updated=? WHERE kind=? AND id=? AND revision=? RETURNING revision').bind(data,publish?1:0,data,now(),type,id,input.revision).first();
  }
  demand(saved,409,'此内容已在其他页面修改，请重新打开再编辑。');
  return json({revision:saved.revision,published:publish});
}
