import {demand} from './common.js';
import {locales, imagePath} from '../public/catalog-ui/product-view.js';

const string=(v,max=200)=>{demand(v==null || typeof v==='string',400,'文字字段格式有误。');const s=(v||'').trim();demand(s.length<=max,400,'文字超过可保存的长度。');return s;};
const list=(v,max)=>{demand(Array.isArray(v) && v.length<=max,400,'条目数量或格式有误。');return v;};
function picture(value) {
  const path=string(value,300);
  demand(!path || (imagePath(path) && (path.endsWith('.webp') || /^\/catalog-api\/images\/[a-f0-9]{64}$/.test(path))),400,'请从图册选择图片或上传 WebP 图片。');
  return path;
}
const labels=v=>Object.fromEntries(locales.map(l=>[l,string(v?.[l],280)]));
const kind=v=>['variant','series','spec'].includes(v)?v:'series';
function cleanTables(value, publish) {
  return list(value,24).map(table=>{
    demand(table && typeof table==='object',400,'技术表格式有误。');
    const columns=list(table.columns,28).map(cell=>string(cell,400));
    const rows=list(table.rows,500).map(row=>list(row,28).map(cell=>string(cell,1400)));
    if(publish) {
      demand(columns.length && columns.every(Boolean) && rows.length,400,'每张技术表都需要列名和至少一行型号数据。');
      demand(rows.every(row=>row.length===columns.length && row.some(Boolean)),400,'技术表每行的列数须与表头一致，请检查空行或缺列。');
    }
    return {title:string(table.title,280),columns,rows};
  });
}
export function cleanProduct(p,slug,base,publish) {
  demand(p && typeof p==='object' && base.categories.some(c=>c.key===p.category),400,'请选择一个产品分类。');
  const copy=Object.fromEntries(locales.map(l=>[l,{
    name:string(p.copy?.[l]?.name),description:string(p.copy?.[l]?.description,5000),material:string(p.copy?.[l]?.material,400),
  }]));
  const gallery=list(p.gallery,400).map(im=>({src:picture(im.src),caption:string(im.caption,280),labels:labels(im.labels),kind:kind(im.kind)})).filter(im=>im.src);
  const variants=list(p.variants,400).map(v=>({value:string(v.value,180),src:picture(v.src),labels:labels(v.labels),kind:kind(v.kind)}));
  const specs=list(p.specs,100).map(row=>{demand(Array.isArray(row)&&row.length===2,400,'每行规格需包含项目和数值。');return [string(row[0],180),string(row[1],1400)];});
  if(publish){
    demand(specs.every(([k,v])=>k&&v),400,'规格参数需同时填写项目和数值，或移除空行。');
    demand(new Set(variants.map(v=>v.value)).size===variants.length && variants.every(v=>v.value),400,'请为每个 SKU 填写不同的型号或颜色名称。');
    demand(Object.values(copy).some(c=>c.name && c.description),400,'至少填写一种语言的产品名称和介绍。');
    demand(gallery.length>0,400,'请添加主图后发布。');
    demand(variants.every(v=>v.src),400,'请为每个 SKU 选择或上传图片后发布。');
  }
  const unique=new Map(gallery.map(im=>[im.src,im]));
  for(const v of variants) if(v.src&&!unique.has(v.src)) unique.set(v.src,{src:v.src,caption:v.value,labels:v.labels,kind:v.kind});
  const tables=p.tables===undefined ? {} : {tables:cleanTables(p.tables,publish)};
  return {slug,category:p.category,copy,specs,gallery:[...unique.values()],variants,...tables};
}
export function cleanStories(value,publish) {
  const ids=new Set();
  return list(value,60).map(s=>{
    const id=string(s.id,100);
    demand(/^[\w-]+$/.test(id)&&!ids.has(id),400,'每条案例或评价需要独立编号。');ids.add(id);
    demand(s.kind==='case'||s.kind==='review',400,'请选择案例或评价。');
    const copy=Object.fromEntries(locales.map(l=>[l,{
      title:string(s.copy?.[l]?.title),body:string(s.copy?.[l]?.body,2500),credit:string(s.copy?.[l]?.credit),quote:string(s.copy?.[l]?.quote,1600),
    }]));
    const sample = s.sample!==false;
    if(publish){
      demand(Object.values(copy).some(c=>c.title && (s.kind==='review' ? c.quote : c.body)),400,'请填写案例说明或客户评价原文。');
      if(!sample && s.kind==='review') demand(Object.values(copy).some(c=>c.credit&&c.quote),400,'请填写客户同意展示的署名及评价原文。');
    }
    const product=string(s.product,100);
    demand(!product || /^[a-z0-9][a-z0-9-]*$/.test(product),400,'关联产品地址有误。');
    return {id,kind:s.kind,sample,image:picture(s.image),product,copy};
  });
}
export async function verifyImages(db,doc) {
  const ids=[...new Set(JSON.stringify(doc).match(/\/catalog-api\/images\/[a-f0-9]{64}/g)||[])].map(u=>u.split('/').pop());
  if(!ids.length)return;
  const result=await db.prepare('SELECT COUNT(*) AS n FROM catalog_images WHERE id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(ids)).first();
  demand(result.n===ids.length,400,'有图片尚未上传成功，请重新选择。');
}

// A shipped product also has a public version before it is ever edited in D1.
export function hasPendingChanges(kind,id,draft,published,pending,base) {
  if(published)return Boolean(pending);
  if(kind==='stories')return JSON.stringify(cleanStories(base.stories,false))!==draft;
  const original=base.bySlug.get(id);
  if(!original)return true;
  const stored=JSON.parse(draft);
  const originalFields=Object.hasOwn(stored,'tables')?original:{...original,tables:undefined};
  return JSON.stringify(cleanProduct(originalFields,id,base,false))!==draft;
}
