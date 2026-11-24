import {escapeHTML as e,locales,copyFor,localeValue,imagePath} from '/catalog-ui/product-view.js';

const $=id=>document.getElementById(id);
const languageNames={zh:'简体中文',en:'English',es:'Español',fr:'Français',ar:'العربية'};
const emptyCopy = keys => Object.fromEntries(locales.map(l=>[l,Object.fromEntries(keys.map(k=>[k,'']))]));
const id = () => crypto.randomUUID().slice(0,8);
const invite=new URLSearchParams(location.hash.slice(1)).get('activate');
if(invite) history.replaceState(null,'',location.pathname);
let dashboard,doc,type='product',key='',revision=0,locale='zh',fresh=false,dirty=false,busy=false,search='';
const at=path=>path.split('.').reduce((obj,k)=>obj?.[k],doc);
function put(path,value) {
  const parts=path.split('.'),last=parts.pop();let obj=doc;
  for(const k of parts){if(!obj[k])obj[k]={};obj=obj[k];}
  obj[last]=value;
}
function mark() {dirty=true;$('state').textContent='有未保存的修改';$('live-link').replaceChildren();}
function message(text='',error=false) {$('status').textContent=text;$('status').classList.toggle('error',error);}
function setBusy(value) {
  busy=value;$('fields').inert=value;
  for(const b of document.querySelectorAll('.savebar button,#head-actions button,aside button,#logout,#login-submit'))b.disabled=value;
}
async function api(path,method='GET',body) {
  const options={method,credentials:'same-origin',cache:'no-store',headers:{}};
  if(body!==undefined){
    if(body instanceof Blob){options.headers['Content-Type']='image/webp';options.body=body;}
    else{options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
  }
  const res=await fetch('/catalog-api/'+path,options);
  const result=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(result.error||'连接失败，请刷新后重试。');
  return result;
}
function field(label,path,area=false,wide=false) {
  const v=e(at(path)||'');
  const control=area?'<textarea data-bind="'+path+'" rows="3">'+v+'</textarea>':'<input data-bind="'+path+'" value="'+v+'">';
  return '<label'+(wide?' class="wide"':'')+'>'+e(label)+control+'</label>';
}
function button(label,action,index=''){
  return '<button type="button" data-action="'+action+'" data-index="'+index+'">'+e(label)+'</button>';
}
function option(value,label,chosen){return '<option value="'+e(value)+'"'+(value===chosen?' selected':'')+'>'+e(label)+'</option>';}
function upload(label,scope,index='',multiple=false){
  return '<label class="upload">'+e(label)+'<input type="file" accept="image/jpeg,image/png,image/webp" data-upload="'+scope+'" data-index="'+index+'"'+(multiple?' multiple':'')+'></label>';
}
function thumb(src,cls=''){
  return imagePath(src)?'<img class="'+cls+'" src="'+e(src)+'" alt="" loading="lazy">':'';
}
function languageField(){
  return '<label class="language-choice">正在编辑的语言<select data-language>'+Object.entries(languageNames).map(([v,n])=>option(v,n,locale)).join('')+'</select></label>';
}
function knownProducts() {
  const map=new Map(dashboard.products.map(p=>[p.slug,{...p}]));
  for(const row of dashboard.entries.filter(r=>r.kind==='product')){
    const prev=map.get(row.id)||{slug:row.id};
    map.set(row.id,{...prev,zh:row.zh||prev.zh,en:row.en||prev.en,entry:row});
  }
  return [...map.values()];
}
function listView(){
  type='product';doc=null;dirty=false;
  $('product-nav').setAttribute('aria-pressed','true');$('stories-nav').setAttribute('aria-pressed','false');
  $('editing').hidden=true;$('items').hidden=false;$('live-link').replaceChildren();
  $('title').textContent='产品目录';$('subtitle').textContent='选择已有产品进入编辑，或新增一个产品系列。';
  $('head-actions').innerHTML=button('＋ 新增产品','new');
  $('items').innerHTML='<label class="searchbox">搜索产品<input type="search" id="find-product" placeholder="产品名称或网址标识" value="'+e(search)+'"></label><div class="product-list" id="results"></div>';
  renderResults();message();
}
function renderResults(){
  const q=search.trim().toLowerCase();
  const items=knownProducts().filter(p=>[p.en,p.zh,p.slug].some(v=>(v||'').toLowerCase().includes(q)));
  $('results').innerHTML=items.map(p=>{
    const status=p.entry?.pending?'有草稿':p.entry?.published?'已发布':p.entry?'草稿':'现有产品';
    return '<button type="button" class="entry" data-open="'+e(p.slug)+'"><span><b>'+e(p.zh||p.en||p.slug)+'</b><small>'+e(p.en||p.slug)+'</small></span><em>'+status+'</em></button>';
  }).join('')||'<p class="block">没有匹配的产品。</p>';
}
function productFields(){
  const details='copy.'+locale+'.';
  const basic='<section class="block"><h2>基本资料</h2><div class="field-grid"><label>产品网址标识<input id="slug" value="'+e(key)+'"'+(fresh?'':' disabled')+' pattern="[a-z0-9-]+"></label><label>产品分类<select data-bind="category">'+dashboard.categories.map(c=>option(c.key,c.labels.zh,doc.category)).join('')+'</select></label></div>'+languageField()+'<div class="field-grid">'+field('产品名称',details+'name')+field('膜材或基材',details+'material')+field('产品介绍',details+'description',true,true)+'</div></section>';
  const gallery='<section class="block"><h2>主图与图册</h2><p class="hint">第一张为主图。上传的 JPG、PNG 和 WebP 会自动缩放并保存为 WebP。</p><div class="photos">'+doc.gallery.map((im,i)=>
    '<div class="photo">'+thumb(im.src)+field('图注 · '+languageNames[locale],'gallery.'+i+'.labels.'+locale)+'<div class="line-actions">'+(i?button('设为主图','cover',i):'<strong>主图</strong>')+button('移出图册','remove-photo',i)+'</div></div>').join('')+'</div>'+upload('添加图册图片','gallery','',true)+'</section>';
  const variants='<section class="block"><h2>SKU 型号与图片</h2><p class="hint">型号用于询价。展示名称可以按语言填写，点击 SKU 后买家会看到此处指定的图片。</p>'+doc.variants.map((v,i)=>{
    const start='variants.'+i+'.';
    return '<div class="sku-edit">'+(thumb(v.src)||'<span>待配图</span>')+field('型号 / 订货值',start+'value')+field('展示名称 · '+languageNames[locale],start+'labels.'+locale)+
      '<div class="sku-tools"><label>关联图片<select data-bind="'+start+'src">'+option('','请选择图片',v.src)+doc.gallery.map((im,j)=>option(im.src,(j+1)+' · '+(localeValue(im.labels,locale)||im.caption||'图册图片'),v.src)).join('')+'</select></label><div class="line-actions">'+upload('单独上传','variant',i)+'<label>图片类型<select data-bind="'+start+'kind">'+[['variant','该型号原图'],['series','系列图'],['spec','型号资料图']].map(([k,s])=>option(k,s,v.kind)).join('')+'</select></label>'+button('移除 SKU','remove-variant',i)+'</div></div></div>';
  }).join('')+'<div class="line-actions">'+button('＋ 添加 SKU','add-variant')+'</div></section>';
  const specs='<section class="block"><h2>规格参数</h2>'+doc.specs.map((row,i)=>'<div class="spec-row">'+field('参数','specs.'+i+'.0')+field('数值和单位','specs.'+i+'.1')+button('移除','remove-spec',i)+'</div>').join('')+button('＋ 添加参数','add-spec')+'</section>';
  return basic+gallery+variants+specs;
}
function storyFields(){
  const links=knownProducts();
  return '<section class="block"><h2>首页展示内容</h2>'+languageField()+'<p class="hint">示例会在官网标注。录入真实评价时，请保留客户原话及获准公开的署名。</p>'+doc.map((s,i)=>{
    const start=i+'.',copy=start+'copy.'+locale+'.';
    return '<article class="story-edit"><h3>'+e(s.copy?.zh?.title||s.copy?.en?.title||'新内容')+'</h3><div class="field-grid"><label>类型<select data-bind="'+start+'kind">'+option('case','客户案例',s.kind)+option('review','客户评价',s.kind)+'</select></label><label>展示标识<select data-sample="'+i+'">'+option('yes','情景示例',s.sample?'yes':'no')+option('no','真实客户资料',s.sample?'yes':'no')+'</select></label>'+field('标题',copy+'title',false,true)+field('案例说明',copy+'body',true,true)+field('评价原文',copy+'quote',true,true)+field('公开署名',copy+'credit')+'<label>关联产品<select data-bind="'+start+'product">'+option('','不关联',s.product)+links.map(p=>option(p.slug,p.zh||p.en||p.slug,s.product)).join('')+'</select></label></div>'+thumb(s.image,'story-image')+'<div class="line-actions">'+upload('上传案例图片','story',i)+(s.image?button('移除图片','clear-story-image',i):'')+(i?button('上移','move-story',i):'')+button('移除此条','remove-story',i)+'</div></article>';
  }).join('')+'<div class="line-actions">'+button('＋ 添加案例','add-case')+button('＋ 添加评价','add-review')+'</div></section>';
}
function renderEditor(){
  $('items').hidden=true;$('editing').hidden=false;
  $('product-nav').setAttribute('aria-pressed',String(type==='product'));$('stories-nav').setAttribute('aria-pressed',String(type==='stories'));
  $('title').textContent=type==='stories'?'客户案例与评价':fresh?'新增产品':copyFor(doc,'zh').name||key;
  $('subtitle').textContent=type==='stories'?'管理官网首页展示的案例与客户原话。':'保存草稿后可查看买家页面，发布后官网立即读取新版。';
  $('head-actions').innerHTML=button('返回目录','list');
  $('fields').innerHTML=type==='product'?productFields():storyFields();
  $('state').textContent=dirty?'有未保存的修改':revision?'已保存':'官网现有内容';
}
function discardOK(){return !dirty||confirm('离开会丢弃尚未保存的修改。继续离开？');}
async function openDocument(kind,id){
  if(busy||!discardOK())return;
  const row=await api('documents/'+kind+'/'+id);
  type=kind;key=id;doc=row.content;revision=row.revision;fresh=false;dirty=false;
  $('live-link').replaceChildren();renderEditor();message();window.scrollTo(0,0);
}
function newProduct(){
  if(!discardOK())return;
  type='product';key='film-'+id();fresh=true;revision=0;dirty=false;
  doc={slug:key,category:dashboard.categories[0].key,copy:emptyCopy(['name','description','material']),specs:[],gallery:[],variants:[]};
  renderEditor();$('state').textContent='新草稿';message();window.scrollTo(0,0);
}
function editAction(action,i){
  if(action==='cover')doc.gallery.unshift(doc.gallery.splice(i,1)[0]);
  if(action==='remove-photo'){
    if(doc.variants.some(v=>v.src===doc.gallery[i].src))throw new Error('这个图片已用于 SKU，请先更改该 SKU 的图片。');
    doc.gallery.splice(i,1);
  }
  if(action==='add-variant')doc.variants.push({value:'',labels:{},src:'',kind:'variant'});
  if(action==='remove-variant')doc.variants.splice(i,1);
  if(action==='add-spec')doc.specs.push(['','']);
  if(action==='remove-spec')doc.specs.splice(i,1);
  if(action==='add-case'||action==='add-review')doc.push({id:'story-'+id(),kind:action==='add-case'?'case':'review',sample:true,image:'',product:'',copy:emptyCopy(['title','body','credit','quote'])});
  if(action==='clear-story-image')doc[i].image='';
  if(action==='remove-story')doc.splice(i,1);
  if(action==='move-story'&&i>0)[doc[i-1],doc[i]]=[doc[i],doc[i-1]];
  mark();renderEditor();
}
async function optimize(file) {
  if(file.size>32*1024*1024)throw new Error('请选择小于 32 MB 的图片。');
  if(!['image/webp','image/jpeg','image/png'].includes(file.type))throw new Error('支持 JPG、PNG 和 WebP 图片。');
  const url=URL.createObjectURL(file), img=new Image();
  try {
    img.src=url;await img.decode();
    let side=Math.min(1800,Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');
    for(let attempt=0;attempt<7;attempt++){
      const scale=side/Math.max(img.naturalWidth,img.naturalHeight);
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',attempt===0?.88:.78));
      if(blob?.type!=='image/webp'){
        if(file.type==='image/webp'&&file.size<=900000)return file;
        throw new Error('此浏览器暂无法导出 WebP，请上传 WebP 原图或使用 Chrome。');
      }
      if(blob.size<=900000)return blob;side=Math.max(320,Math.floor(side*.8));
    }
    throw new Error('图片较大，请裁切后重试。');
  } finally {URL.revokeObjectURL(url);}
}
async function images(input){
  const files=Array.from(input.files),scope=input.dataset.upload,i=Number(input.dataset.index);
  if(!files.length)return;
  setBusy(true);
  try {
    for(const [n,file] of files.entries()){
      message('正在处理图片 '+(n+1)+' / '+files.length+'…');
      const {src}=await api('images','POST',await optimize(file));
      if(scope==='story') doc[i].image=src;
      else{
        if(!doc.gallery.some(im=>im.src===src))doc.gallery.push({src,caption:'',labels:{},kind:scope==='variant'?'variant':'series'});
        if(scope==='variant'){doc.variants[i].src=src;doc.variants[i].kind='variant';}
      }
      mark();
    }
    message('图片已上传，可保存草稿或直接发布。');
  } finally {setBusy(false);renderEditor();}
}
function linkTo(href,label){
  const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener';a.textContent=label;$('live-link').replaceChildren(a);
}
function storyPreview(){
  $('preview-stories').innerHTML=doc.map(s=>{
    const c=s.copy[locale]?.title?s.copy[locale]:Object.values(s.copy).find(v=>v.title)||{};
    return '<article><small>'+e(s.sample?'情景示例':s.kind==='case'?'客户案例':'客户评价')+'</small><h3>'+e(c.title)+'</h3>'+thumb(s.image)+'<p>'+e(c.body)+'</p><blockquote>'+e(c.quote)+'</blockquote><small>'+e(c.credit)+'</small></article>';
  }).join('');$('story-preview').showModal();
}
async function save(mode){
  if(busy)return;
  if(type==='product' && !/^[a-z0-9][a-z0-9-]{0,95}$/.test(key))throw new Error('网址标识请使用小写英文字母、数字和短横线。');
  if(fresh && knownProducts().some(p=>p.slug===key))throw new Error('网址标识已使用，请换一个。');
  const live=(locale==='en'?'':'/'+locale)+(type==='stories'?'/#customer-stories':'/products/'+key+'/');
  // Open inside the user's click, so browsers can show the saved private preview in a new tab.
  const tab=mode==='preview'&&type==='product'?window.open('about:blank','_blank'):null;
  if(tab)tab.opener=null;
  setBusy(true);
  try{
    const result=await api('documents/'+type+'/'+key,'PUT',{mode:mode==='publish'?'publish':'draft',revision,content:doc,new:fresh});
    revision=result.revision;fresh=false;dirty=false;
    dashboard=await api('dashboard');renderEditor();
    if(mode==='preview'){
      if(type==='stories')storyPreview();else{const url=live+'?catalog-preview=1';linkTo(url,'打开草稿预览');if(tab)tab.location.href=url;}
    }
    if(mode==='publish')linkTo(live,'打开官网查看已发布内容');
    $('state').textContent=mode==='publish'?'已发布到官网':'草稿已保存';message($('state').textContent);
  }catch(error){tab?.close();throw error;}finally{setBusy(false);}
}
async function signedIn(login) {
  dashboard=await api('dashboard');$('account-name').textContent=login;$('account').hidden=false;$('access').hidden=true;$('workspace').hidden=false;listView();
}
function signedOut(){
  $('workspace').hidden=true;$('account').hidden=true;$('access').hidden=false;
  $('access-title').textContent=invite?'启用甲方管理账号':'登录产品后台';
  $('access-intro').textContent=invite?'设置自己的账号和密码。以后用同一账号即可编辑和发布官网内容。':'使用管理账号编辑产品、图片及客户案例。';
  $('login-submit').textContent=invite?'设置账号并登录':'登录';
  $('login-password').minLength=invite?12:1;$('login-password').autocomplete=invite?'new-password':'current-password';message();
}
function report(error){message(error instanceof Error?error.message:'操作失败，请重试。',true);$('status').scrollIntoView({block:'nearest'});}
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();setBusy(true);
  try{const result=await api(invite?'activate':'login','POST',{login:$('login-name').value,password:$('login-password').value,invite});$('login-password').value='';await signedIn(result.login);}
  catch(err){report(err);}finally{setBusy(false);}
});
$('logout').onclick=async()=>{if(!discardOK())return;try{await api('logout','POST',{});dirty=false;location.replace('/manage/');}catch(err){report(err);}};
$('product-nav').onclick=()=>{if(discardOK())listView();};
$('stories-nav').onclick=()=>openDocument('stories','home').catch(report);
$('items').addEventListener('input',event=>{if(event.target.id==='find-product'){search=event.target.value;renderResults();}});
$('editing').addEventListener('submit',e=>e.preventDefault());
$('fields').addEventListener('input',event=>{
  const el=event.target;if(el.id==='slug'){key=el.value;doc.slug=key;mark();}
  if(el.hasAttribute('data-bind')){put(el.dataset.bind,el.value);mark();}
});
$('fields').addEventListener('change',event=>{
  const el=event.target;
  if(el.hasAttribute('data-upload')){images(el).catch(report);return;}
  if(el.hasAttribute('data-language')){locale=el.value;renderEditor();return;}
  if(el.hasAttribute('data-sample')){doc[Number(el.dataset.sample)].sample=el.value==='yes';mark();}
  if(el.tagName==='SELECT'&&el.hasAttribute('data-bind')){put(el.dataset.bind,el.value);mark();if(el.dataset.bind.endsWith('.src'))renderEditor();}
});
document.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b||busy)return;
  try{
    if(b.dataset.open){await openDocument('product',b.dataset.open);return;}
    const action=b.dataset.action;if(!action)return;
    if(action==='new')newProduct();
    else if(action==='list'){if(discardOK())listView();}
    else if(['save','preview','publish'].includes(action))await save(action);
    else editAction(action,Number(b.dataset.index));
  }catch(error){report(error);}
});
$('preview-close').onclick=()=>$('story-preview').close();
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
try{const session=await api('session');if(session.login&&!invite)await signedIn(session.login);else signedOut();}
catch(error){signedOut();report(error);}
