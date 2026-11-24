import {escapeHTML as e,locales,copyFor,localeValue,imagePath} from '/catalog-ui/product-view.js';

import {readSheet,tableFields} from './sheets.js';

const $=id=>document.getElementById(id);
const languageNames={zh:'简体中文',en:'English',es:'Español',fr:'Français',ar:'العربية'};
const emptyCopy = keys => Object.fromEntries(locales.map(l=>[l,Object.fromEntries(keys.map(k=>[k,'']))]));
const id = () => crypto.randomUUID().slice(0,8);
const fragmentInvite=new URLSearchParams(location.hash.slice(1)).get('activate') || '';
let enabling=Boolean(fragmentInvite);
let dashboard,doc,type='product',key='',revision=0,locale='zh',fresh=false,dirty=false,busy=false;
let search='',category='',status='',mediaFilter=false,section='basic',skuQuery='',onlyMissing=false;
let published=false,pending=false,importIndex=0;
const sections={basic:'基本资料',gallery:'主图与图册',variants:'SKU 型号',data:'规格与技术表'};
const states={live:'已发布',changed:'有待发布修改',draft:'仅草稿'};
const tidy=value=>String(value || '').normalize('NFKC').trim().toLocaleLowerCase();
const at=path=>path.split('.').reduce((obj,k)=>obj?.[k],doc);
function put(path,value) {
  const parts=path.split('.'),last=parts.pop();let obj=doc;
  for(const k of parts){if(!obj[k])obj[k]={};obj=obj[k];}
  obj[last]=value;
}
function mark() {dirty=true;const undo=document.querySelector('[data-action=restore]');if(undo)undo.hidden=false;$('state').textContent='有未保存的修改';$('live-link').replaceChildren();}
function message(text='',error=false) {$('status').textContent=text;$('status').classList.toggle('error',error);}
function setBusy(value) {
  busy=value;$('fields').inert=value;$('items').inert=value;
  for(const b of document.querySelectorAll('.savebar button,#head-actions button,aside button,#logout,#login-submit,#change-password'))b.disabled=value;
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
  const filled=type==='product'?locales.filter(l=>doc.copy[l]?.name?.trim() && doc.copy[l]?.description?.trim()).length:0;
  const indicator=type==='product'?'<small id="language-count">名称与介绍 '+filled+' / 5 种语言</small>':'';
  return '<label class="language-choice">正在编辑的语言<select data-language>'+Object.entries(languageNames).map(([v,n])=>option(v,n,locale)).join('')+'</select>'+indicator+'</label>';
}
function knownProducts(){return dashboard.products;}
function pageAddress(searchParams={}) {
  const url=new URL(location.href);
  url.search=new URLSearchParams(searchParams).toString();url.hash='';
  history.replaceState(null,'',url);
}
function listView(){
  type='product';doc=null;dirty=false;pageAddress();
  $('product-nav').setAttribute('aria-pressed','true');$('stories-nav').setAttribute('aria-pressed','false');
  $('editing').hidden=true;$('items').hidden=false;$('live-link').replaceChildren();
  $('title').textContent='产品目录';$('subtitle').textContent='管理官网产品、型号图片和发布内容。';
  $('head-actions').innerHTML=button('＋ 新增产品','new');
  $('items').innerHTML='<div class="filters"><label>搜索产品或型号<input type="search" id="find-product" placeholder="产品名称、SKU 或网址标识" value="'+e(search)+'"></label><label>产品分类<select id="filter-category">'+option('','全部分类',category)+dashboard.categories.map(c=>option(c.key,c.labels.zh,category)).join('')+'</select></label><label>发布状态<select id="filter-status">'+option('','全部状态',status)+Object.entries(states).map(([v,s])=>option(v,s,status)).join('')+'</select></label></div><div class="result-tools"><label class="checkbox"><input type="checkbox" id="filter-media"'+(mediaFilter?' checked':'')+'>待补 SKU 原图</label><span id="result-count" role="status"></span></div><div class="product-list" id="results"></div>';
  renderResults();message();
}
function renderResults(){
  const q=tidy(search);
  const products=knownProducts().filter(p=>(!category||p.category===category) && (!status||p.status===status) && (!mediaFilter||p.needsPhoto) && [p.slug,...p.names,...p.models].some(v=>tidy(v).includes(q)));
  $('result-count').textContent='显示 '+products.length+' / '+dashboard.products.length+' 个产品系列';
  $('results').innerHTML=products.map(p=>{
    const cat=dashboard.categories.find(c=>c.key===p.category)?.labels.zh||p.category;
    const match=q?p.models.filter(v=>tidy(v).includes(q)).slice(0,3).join('、'):'';
    const meta=[cat,p.models.length+' 个 SKU',p.needsPhoto?'待补 '+p.needsPhoto+' 张型号原图':''].filter(Boolean).join(' · ');
    return '<button type="button" class="entry" data-open="'+e(p.slug)+'"><span class="entry-photo">'+thumb(p.cover)+'</span><span class="entry-name"><b>'+e(p.zh||p.en||p.slug)+'</b><small>'+e(p.en||p.slug)+'</small><small>'+e(meta)+'</small>'+(match?'<small class="matched">'+e(match)+'</small>':'')+'</span><span class="pub-state '+p.status+'">'+states[p.status]+'</span><span class="chevron" aria-hidden="true">›</span></button>';
  }).join('')||'<div class="empty"><h2>没有符合条件的产品</h2><p>换一个型号或清除筛选，再试一次。</p>'+button('清除筛选','reset-filters')+'</div>';
}
function productFields(){
  const details='copy.'+locale+'.';
  const basic='<section id="edit-basic" class="block"><h2>基本资料</h2><div class="field-grid"><label>产品网址标识<input id="slug" value="'+e(key)+'"'+(fresh?'':' disabled')+' pattern="[a-z0-9-]+"></label><label>产品分类<select data-bind="category">'+dashboard.categories.map(c=>option(c.key,c.labels.zh,doc.category)).join('')+'</select></label></div><div class="field-grid">'+field('产品名称',details+'name')+field('膜材或基材',details+'material')+field('产品介绍',details+'description',true,true)+'</div></section>';
  const gallery='<section id="edit-gallery" class="block"><h2>主图与图册</h2><p class="hint">第一张为主图。上传的 JPG、PNG 和 WebP 会自动缩放并保存为 WebP。</p><div class="photos">'+doc.gallery.map((im,i)=>
    '<div class="photo">'+thumb(im.src)+field('图注 · '+languageNames[locale],'gallery.'+i+'.labels.'+locale)+'<div class="line-actions">'+(i?button('设为主图','cover',i):'<strong>主图</strong>')+(i?button('前移','prev-photo',i):'')+(i<doc.gallery.length-1?button('后移','next-photo',i):'')+upload('替换图片','replace',i)+button('移出图册','remove-photo',i)+'</div></div>').join('')+'</div>'+upload('添加图册图片','gallery','',true)+'</section>';
  const variants='<section id="edit-variants" class="block"><h2>SKU 型号与图片</h2><p class="hint">型号用于询价。展示名称可以按语言填写，点击 SKU 后买家会看到此处指定的图片。</p><div class="sku-filters"><label>搜索型号<input type="search" id="find-sku" placeholder="型号或展示名称" value="'+e(skuQuery)+'"></label><label class="checkbox"><input type="checkbox" id="sku-missing"'+(onlyMissing?' checked':'')+'>仅看待补原图</label><span id="sku-count" role="status"></span></div>'+doc.variants.map((v,i)=>{
    const start='variants.'+i+'.';
    return '<div class="sku-edit" data-sku-row="'+i+'">'+(thumb(v.src)||'<span>待配图</span>')+field('型号 / 订货值',start+'value')+field('展示名称 · '+languageNames[locale],start+'labels.'+locale)+
      '<div class="sku-tools"><label>关联图片<select data-bind="'+start+'src">'+option('','请选择图片',v.src)+doc.gallery.map((im,j)=>option(im.src,(j+1)+' · '+(localeValue(im.labels,locale)||im.caption||'图册图片'),v.src)).join('')+'</select></label><div class="line-actions">'+upload('单独上传','variant',i)+'<label>图片类型<select data-bind="'+start+'kind">'+[['variant','该型号原图'],['series','系列图'],['spec','型号资料图']].map(([k,s])=>option(k,s,v.kind)).join('')+'</select></label>'+button('移除 SKU','remove-variant',i)+'</div></div></div>';
  }).join('')+'<div class="line-actions">'+button('＋ 添加 SKU','add-variant')+'</div></section>';
  const specs='<section id="edit-data" class="block"><h2>规格参数</h2>'+doc.specs.map((row,i)=>'<div class="spec-row">'+field('参数','specs.'+i+'.0')+field('数值和单位','specs.'+i+'.1')+button('移除','remove-spec',i)+'</div>').join('')+button('＋ 添加参数','add-spec')+'<div class="sheet-title"><h2>型号技术表</h2><p class="hint">可逐格修改，也可从 Excel 或 WPS 粘贴整张表。百分号、小数和单位按填写内容展示。</p></div>'+tableFields(doc.tables)+button('＋ 添加技术表','add-table')+'</section>';
  const navigation=Object.entries(sections).map(([k,label])=>'<button type="button" data-section="'+k+'" aria-controls="edit-'+k+'" aria-pressed="'+(k===section)+'">'+label+'</button>').join('');
  return '<div class="editor-tools"><nav class="section-nav" aria-label="编辑栏目">'+navigation+'</nav>'+languageField()+'</div>'+basic+gallery+variants+specs;
}
function showSection(focus=false){
  for(const k of Object.keys(sections)){
    $('edit-'+k).hidden=k!==section;
    const button=document.querySelector('[data-section="'+k+'"]');button.setAttribute('aria-pressed',String(k===section));
    if(focus && k===section)button.focus();
  }
  if(section==='variants')filterSKUs();
}
function filterSKUs(){
  const q=tidy(skuQuery);
  let count=0;
  for(const row of document.querySelectorAll('[data-sku-row]')){
    const v=doc.variants[Number(row.dataset.skuRow)];
    row.hidden=(onlyMissing && v.kind==='variant' && Boolean(v.src)) || ![v.value,...Object.values(v.labels)].some(text=>tidy(text).includes(q));
    if(!row.hidden)count++;
  }
  $('sku-count').textContent=count+' / '+doc.variants.length+' 个 SKU';
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
  $('head-actions').innerHTML=(published?button('取回线上版本','restore'):'')+button('返回目录','list');
  const undo=document.querySelector('[data-action=restore]');
  if(undo)undo.hidden=!pending && !dirty;
  $('fields').innerHTML=type==='product'?productFields():storyFields();
  if(type==='product')showSection();
  $('state').textContent=dirty?'有未保存的修改':pending?(published?'草稿已保存，待发布':'仅草稿'):published?'已发布到官网':'新草稿';
}
function discardOK(){return !dirty||confirm('离开会丢弃尚未保存的修改。继续离开？');}
async function openDocument(kind,id){
  if(busy||!discardOK())return;
  setBusy(true);
  try{
    const row=await api('documents/'+kind+'/'+id);
    type=kind;key=id;doc=row.content;revision=row.revision;published=row.published;pending=row.pending;fresh=false;dirty=false;
    section='basic';skuQuery='';onlyMissing=false;
    pageAddress(kind==='product'?{product:id}:{view:'stories'});
    $('live-link').replaceChildren();renderEditor();message();window.scrollTo(0,0);
  }finally{setBusy(false);}
}
function newProduct(){
  if(!discardOK())return;
  type='product';key='film-'+id();fresh=true;revision=0;dirty=false;published=false;pending=false;section='basic';skuQuery='';onlyMissing=false;pageAddress();
  doc={slug:key,category:dashboard.categories[0].key,copy:emptyCopy(['name','description','material']),specs:[],gallery:[],variants:[],tables:[]};
  renderEditor();$('state').textContent='新草稿';message();window.scrollTo(0,0);
}
function editAction(action,i){
  if(action==='add-table')doc.tables.push({title:'',columns:['型号','规格'],rows:[['','']]});
  if(action==='prev-photo' || action==='next-photo'){
    const destination=i+(action==='prev-photo'?-1:1);
    if(destination>=0 && destination<doc.gallery.length)doc.gallery.splice(destination,0,doc.gallery.splice(i,1)[0]);
  }
  if(action==='cover')doc.gallery.unshift(doc.gallery.splice(i,1)[0]);
  if(action==='remove-photo'){
    if(doc.variants.some(v=>v.src===doc.gallery[i].src))throw new Error('这个图片已用于 SKU，请先更改该 SKU 的图片。');
    doc.gallery.splice(i,1);
  }
  if(action==='add-variant'){skuQuery='';onlyMissing=false;doc.variants.push({value:'',labels:{},src:'',kind:'variant'});}
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
      else if(scope==='replace'){
        const previous=doc.gallery[i].src;
        if(doc.gallery.some((im,n)=>n!==i && im.src===src))throw new Error('这张图已在图册中，可直接将 SKU 关联到它。');
        doc.gallery[i].src=src;
        for(const variant of doc.variants)if(variant.src===previous)variant.src=src;
      }
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
function readyForPublication() {
  if(type!=='product')return;
  function issue(tab,text,path){
    section=tab;skuQuery='';onlyMissing=false;renderEditor();
    const field=path?document.querySelector('[data-bind="'+path+'"]'):null;
    if(field)field.focus();else document.querySelector('[data-section="'+tab+'"]').focus();
    throw new Error(text);
  }
  if(!locales.some(l=>doc.copy[l]?.name?.trim() && doc.copy[l]?.description?.trim()))issue('basic','先用同一种语言填写名称和介绍，再发布。','copy.'+locale+'.name');
  if(!doc.gallery.length)issue('gallery','请先添加一张产品主图。');
  const codes=new Set();
  for(const [i,v] of doc.variants.entries()){
    const code=v.value.trim();
    if(!code || codes.has(code))issue('variants','请给每个 SKU 填写独立的订货型号。','variants.'+i+'.value');
    codes.add(code);
    if(!v.src)issue('variants','请为 '+code+' 选择一张图片。','variants.'+i+'.src');
  }
  for(const [i,row] of doc.specs.entries()){
    const missing=row.findIndex(value=>!value.trim());
    if(missing>=0)issue('data','请补全规格项目和数值，或移除空行。','specs.'+i+'.'+missing);
  }
  for(const table of doc.tables){
    if(!table.columns.every(value=>value.trim()) || !table.rows.length || table.rows.some(row=>row.length!==table.columns.length || !row.some(v=>v.trim())))
      issue('data','请检查技术表的列名、数据行和空行。');
  }
}
async function save(mode){
  if(busy)return;
  if(type==='product' && !/^[a-z0-9][a-z0-9-]{0,95}$/.test(key))throw new Error('网址标识请使用小写英文字母、数字和短横线。');
  if(fresh && knownProducts().some(p=>p.slug===key))throw new Error('网址标识已使用，请换一个。');
  if(mode==='publish')readyForPublication();
  const live=(locale==='en'?'':'/'+locale)+(type==='stories'?'/#customer-stories':'/products/'+key+'/');
  // Open inside the user's click, so browsers can show the saved private preview in a new tab.
  const tab=mode==='preview'&&type==='product'?window.open('about:blank','_blank'):null;
  if(tab)tab.opener=null;
  setBusy(true);
  try{
    const result=await api('documents/'+type+'/'+key,'PUT',{mode:mode==='publish'?'publish':'draft',revision,content:doc,new:fresh});
    revision=result.revision;fresh=false;dirty=false;
    published=published || mode==='publish';pending=mode!=='publish';
    pageAddress(type==='product'?{product:key}:{view:'stories'});
    let refreshProblem=false;
    try{
      dashboard=await api('dashboard');
      const saved=dashboard.entries.find(entry=>entry.kind===type && entry.id===key);
      if(saved)pending=Boolean(saved.pending);
    }catch{refreshProblem=true;}
    renderEditor();
    if(mode==='preview'){
      if(type==='stories')storyPreview();else{const url=live+'?catalog-preview=1';linkTo(url,'打开草稿预览');if(tab)tab.location.href=url;}
    }
    if(mode==='publish')linkTo(live,'打开官网查看已发布内容');
    $('state').textContent=mode==='publish'?'已发布到官网':'草稿已保存';message($('state').textContent+(refreshProblem?'。目录暂时无法刷新，稍后可重新打开后台。':''));
  }catch(error){tab?.close();throw error;}finally{setBusy(false);}
}
async function signedIn(login) {
  const url=new URL(location.href),wanted=url.searchParams.get('product'),stories=url.searchParams.get('view')==='stories';
  dashboard=await api('dashboard');
  $('account-name').textContent=login;$('account').hidden=false;$('access').hidden=true;$('workspace').hidden=false;
  listView();setBusy(false);
  if(stories)await openDocument('stories','home');
  else if(wanted && knownProducts().some(product=>product.slug===wanted))await openDocument('product',wanted);
}
function accessMode(activate){
  enabling=activate;
  $('mode-login').setAttribute('aria-pressed',String(!activate));$('mode-activate').setAttribute('aria-pressed',String(activate));
  $('access-title').textContent=activate?'启用你的管理账号':'登录产品后台';
  $('access-intro').textContent=activate?'使用交付文件中的专属启用链接，自行设置账号和密码。密码至少 12 个字符。':'使用已启用的账号，编辑产品资料并发布到官网。';
  $('invite-field').hidden=!activate;$('invite-code').required=activate;
  $('login-submit').textContent=activate?'设置账号并登录':'登录';
  $('login-password').minLength=activate?12:1;$('login-password').autocomplete=activate?'new-password':'current-password';
}
function signedOut(){
  $('workspace').hidden=true;$('account').hidden=true;$('access').hidden=false;
  $('invite-code').value=fragmentInvite;accessMode(enabling);message();
}
function activationCode(value) {
  const text=value.trim();
  if(/^[0-9a-f]{64}$/.test(text))return text;
  try{
    const url=new URL(text);
    if(url.origin===location.origin || url.origin==='https://yunnianfilm.com'){
      const code=new URLSearchParams(url.hash.slice(1)).get('activate');
      if(/^[0-9a-f]{64}$/.test(code||''))return code;
    }
  }catch{}
  throw new Error('请粘贴交付文件中的完整启用链接或启用码。');
}
async function restoreLive(){
  if(!confirm('将用当前官网版本替换编辑器里的内容。点“保存草稿”后才会覆盖已保存的草稿。继续？'))return;
  setBusy(true);
  try{
    const row=await api('documents/'+type+'/'+key+'?version=live');
    if(revision!==row.revision)throw new Error('这份草稿刚被其他页面修改，请重新打开后再操作。');
    doc=row.content;mark();renderEditor();message('已将官网内容载入编辑器，可检查后保存草稿。');
  }finally{setBusy(false);}
}
function report(error){message(error instanceof Error?error.message:'操作失败，请重试。',true);$('status').scrollIntoView({block:'nearest'});}
$('login-form').addEventListener('submit',async event=>{
  event.preventDefault();setBusy(true);
  try{
    const result=await api(enabling?'activate':'login','POST',{login:$('login-name').value,password:$('login-password').value,...(enabling?{invite:activationCode($('invite-code').value)}:{})});
    $('login-password').value='';$('invite-code').value='';history.replaceState(null,'',location.pathname+location.search);
    await signedIn(result.login);
  }
  catch(err){report(err);}finally{setBusy(false);}
});
$('logout').onclick=async()=>{if(!discardOK())return;try{await api('logout','POST',{});dirty=false;location.replace('/manage/');}catch(err){report(err);}};
$('product-nav').onclick=()=>{if(discardOK())listView();};
$('stories-nav').onclick=()=>openDocument('stories','home').catch(report);
$('items').addEventListener('input',event=>{if(event.target.id==='find-product'){search=event.target.value;renderResults();}});
$('editing').addEventListener('submit',e=>e.preventDefault());
$('fields').addEventListener('input',event=>{
  const el=event.target;
  if(el.id==='find-sku'){skuQuery=el.value;filterSKUs();return;}
  if(el.id==='slug'){key=el.value;doc.slug=key;mark();}
  if(el.hasAttribute('data-bind')){
    put(el.dataset.bind,el.value);mark();
    if(type==='product' && el.dataset.bind.startsWith('copy.')){
      const filled=locales.filter(l=>doc.copy[l]?.name?.trim() && doc.copy[l]?.description?.trim()).length;
      $('language-count').textContent='名称与介绍 '+filled+' / 5 种语言';
    }
  }
});
$('fields').addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='sku-missing'){onlyMissing=el.checked;filterSKUs();return;}
  if(el.hasAttribute('data-upload')){images(el).catch(report);return;}
  if(el.hasAttribute('data-language')){locale=el.value;renderEditor();return;}
  if(el.hasAttribute('data-sample')){doc[Number(el.dataset.sample)].sample=el.value==='yes';mark();}
  if(el.tagName==='SELECT'&&el.hasAttribute('data-bind')){put(el.dataset.bind,el.value);mark();
    if(el.dataset.bind.startsWith('variants.') && el.dataset.bind.endsWith('.src')){
      const variant=doc.variants[Number(el.dataset.bind.split('.')[1])], photo=doc.gallery.find(im=>im.src===el.value);
      if(photo)variant.kind=photo.kind;
      renderEditor();
    }else if(el.dataset.bind.endsWith('.kind') && onlyMissing)filterSKUs();}
});
document.addEventListener('click',async event=>{
  const b=event.target.closest('button');if(!b||busy)return;
  try{
    if(b.dataset.open){await openDocument('product',b.dataset.open);return;}
    if(b.dataset.section){section=b.dataset.section;showSection(true);return;}
    if(b.dataset.sheet){editSheet(b);return;}
    const action=b.dataset.action;if(!action)return;
    if(action==='reset-filters'){search='';category='';status='';mediaFilter=false;listView();$('find-product').focus();}
    else if(action==='restore')await restoreLive();
    else if(action==='new')newProduct();
    else if(action==='list'){if(discardOK())listView();}
    else if(['save','preview','publish'].includes(action))await save(action);
    else editAction(action,Number(b.dataset.index));
  }catch(error){report(error);}
});
$('mode-login').onclick=()=>{accessMode(false);message();};
$('mode-activate').onclick=()=>{accessMode(true);message();};
$('show-password').onclick=()=>{
  const input=$('login-password'),show=input.type==='password';
  input.type=show?'text':'password';$('show-password').textContent=show?'隐藏':'显示';$('show-password').setAttribute('aria-pressed',String(show));
};
$('items').addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='filter-category')category=el.value;
  else if(el.id==='filter-status')status=el.value;
  else if(el.id==='filter-media')mediaFilter=el.checked;
  else return;
  renderResults();
});
for(const b of document.querySelectorAll('[data-close-dialog]'))b.onclick=()=>b.closest('dialog').close();
$('change-password').onclick=()=>{
  const form=$('password-form');form.reset();form.querySelector('[role=alert]').textContent='';
  $('password-dialog').showModal();
};
$('password-form').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget, controls=form.elements, alert=form.querySelector('[role=alert]');
  alert.textContent='';
  if(controls.next.value!==controls.repeat.value){alert.textContent='两次输入的新密码不一致。';controls.repeat.focus();return;}
  const submit=form.querySelector('.primary');submit.disabled=true;
  try{
    await api('password','POST',{current:controls.current.value,password:controls.next.value});
    form.reset();$('password-dialog').close();message('新密码已保存。');
  }catch(err){alert.textContent=err.message;}finally{submit.disabled=false;}
};
function editSheet(button){
  const index=Number(button.dataset.table),n=Number(button.dataset.at),table=doc.tables[index],action=button.dataset.sheet;
  if(action==='import'){
    importIndex=index;$('import-form').reset();$('import-form').querySelector('[role=alert]').textContent='';
    $('sheet-size').textContent='第一行作为列名，下面每行对应一条记录。';$('import-dialog').showModal();return;
  }
  if(action==='add-row'){
    if(table.rows.length>=500)throw new Error('每张技术表最多支持 500 行。');
    table.rows.push(table.columns.map(()=>''));
  }else if(action==='add-column'){
    if(table.columns.length>=28)throw new Error('每张技术表最多支持 28 列。');
    table.columns.push('');for(const row of table.rows)row.push('');
  }else if(action==='remove-column'){
    if(table.columns.length===1)throw new Error('至少保留一列，或移除整张表。');
    if(!confirm('移除这一列及其所有数值？'))return;
    table.columns.splice(n,1);for(const row of table.rows)row.splice(n,1);
  }else if(action==='remove-row')table.rows.splice(n,1);
  else if(action==='remove-table'){
    if(!confirm('从编辑中的产品移除整张技术表？'))return;doc.tables.splice(index,1);
  }
  mark();renderEditor();
}
$('sheet-paste').oninput=()=>{
  try{const table=readSheet($('sheet-paste').value);$('sheet-size').textContent='识别到 '+table.columns.length+' 列、'+table.rows.length+' 行数据。';}
  catch(err){$('sheet-size').textContent=err.message;}
};
$('import-form').onsubmit=event=>{
  event.preventDefault();
  try{
    Object.assign(doc.tables[importIndex],readSheet($('sheet-paste').value));
    $('import-dialog').close();mark();renderEditor();message('表格已载入编辑器。');
  }catch(err){event.currentTarget.querySelector('[role=alert]').textContent=err.message;}
};
$('preview-close').onclick=()=>$('story-preview').close();
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
try{const session=await api('session');if(session.login&&!fragmentInvite)await signedIn(session.login);else signedOut();}
catch(error){signedOut();report(error);}
