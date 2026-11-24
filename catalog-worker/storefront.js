import {baseCatalog,demand} from './common.js';
import {editor} from './access.js';
import {locales,prefix,escapeHTML as e,copyFor,localeValue,galleryHTML,offerHTML} from '../public/catalog-ui/product-view.js';

const detailPath=(id,l)=>prefix(l)+'/products/'+id+'/';
const setText=(rw,selector,value)=>rw.on(selector,{element(el){el.setInnerContent(String(value??''));}});
const setHTML=(rw,selector,value)=>rw.on(selector,{element(el){el.setInnerContent(value,{html:true});}});
const setAttr=(rw,selector,name,value)=>rw.on(selector,{element(el){el.setAttribute(name,value);}});
const remove=(rw,selector)=>rw.on(selector,{element(el){el.remove();}});
function fresh(response,privatePage=false) {
  const headers=new Headers(response.headers);
  for(const header of ['etag','last-modified','content-length'])headers.delete(header);
  headers.set('Cache-Control',privatePage?'private, no-store':'no-store');
  if(privatePage)headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,headers});
}
const basePage=(req,env,path)=>env.ASSETS.fetch(new URL(path,req.url).href);
async function publicEdits(db){
  const result=await db.prepare("SELECT live FROM catalog_documents WHERE kind='product' AND live IS NOT NULL ORDER BY updated DESC").all();
  return result.results.map(row=>JSON.parse(row.live));
}
const translateSpecs=(p,l,base)=>p.specs.map(row=>row.map(term=>base.words[l]?.[term]||term));
const termsHTML=rows=>rows.map(([k,v])=>'<div><dt>'+e(k)+'</dt><dd>'+e(v)+'</dd></div>').join('');
function quickSpecs(p,l,base){
  const pairs=p.specs.filter(([k])=>/^(thickness|listed thickness|roll size|substrate|厚度|卷材尺寸|基材)$/i.test(k)).slice(0,2);
  return translateSpecs({specs:pairs},l,base);
}
const categoryName=(base,p,l)=>base.categories.find(c=>c.key===p.category)?.labels[l]||p.category;
function productCard(p,l,base,compare=true) {
  const c=copyFor(p,l),url=detailPath(p.slug,l),pic=p.gallery[0]?.src;
  const text=[...Object.values(p.copy).flatMap(row=>Object.values(row)),p.category,categoryName(base,p,l),...p.specs.flat(),...p.variants.map(v=>v.value)].join(' ').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
  const thick=p.specs.filter(([k])=>/thickness|厚度/i.test(k)).flatMap(([,v])=>v.match(/\d+(?:\.\d+)?/g)||[]);
  const finishText=p.specs.filter(([k])=>/finish|topcoat|质感|面涂层/i.test(k)).map(([,v])=>v).join(' ');
  const finishes=[['gloss',/gloss|亮面/i],['matte',/matt?e?|哑光/i],['satin',/satin|缎面/i]].filter(([,test])=>test.test(finishText)).map(([name])=>name).join(' ');
  const cmp={en:'Compare film',zh:'加入对比',es:'Comparar',fr:'Comparer',ar:'مقارنة'}[l];
  return '<article class="product" data-slug="'+e(p.slug)+'" data-category="'+e(p.category)+'" data-search="'+e(text)+'" data-finishes="'+e(finishes)+'" data-thickness="'+e(thick.join(' '))+'">'+
    '<a class="product-image" href="'+url+'"><img src="'+e(pic)+'" alt="'+e(c.name)+'" loading="lazy" width="800" height="800"></a>'+
    '<div class="product-heading"><div><span class="eyebrow">'+e(categoryName(base,p,l))+'</span><h3><a href="'+url+'">'+e(c.name)+'</a></h3></div></div><p>'+e(c.material)+'</p>'+
    '<div class="product-quick-specs">'+quickSpecs(p,l,base).map(([k,v])=>'<span><small>'+e(k)+'</small>'+e(v)+'</span>').join('')+'</div>'+
    (compare?'<button type="button" class="compare-toggle" data-compare="'+e(p.slug)+'" aria-pressed="false"><span aria-hidden="true">＋</span><span data-compare-label>'+cmp+'</span></button>':'')+'</article>';
}
function updateRelated(rw,p,l,base,edited) {
  const catalogue=new Map(edited.map(item=>[item.slug,item]));
  for(const item of base.products)if(!catalogue.has(item.slug))catalogue.set(item.slug,item);
  const related=[...catalogue.values()].filter(item=>item.slug!==p.slug && item.category===p.category).slice(0,4);
  rw.on('.related-products',{element(el){if(related.length)el.removeAttribute('hidden');else el.setAttribute('hidden','');}});
  setHTML(rw,'.related-products .product-grid',related.map(item=>productCard(item,l,base,false)).join(''));
}
async function listing(req,env,edited,l,base){
  const original=await basePage(req,env,prefix(l)+'/products/');
  const all=new Map(base.products.map(p=>[p.slug,p]));edited.forEach(p=>all.set(p.slug,p));
  const rw=new HTMLRewriter();
  const catalog=[...all.values()];
  const data=catalog.map(p=>({slug:p.slug,name:copyFor(p,l).name,image:p.gallery[0]?.src||'',category:categoryName(base,p,l),materials:copyFor(p,l).material,specs:translateSpecs(p,l,base),optionLabels:p.variants.map(v=>localeValue(v.labels,l)||v.value)}));
  setHTML(rw,'#catalog-data',JSON.stringify(data).replace(/</g,'\\u003c'));
  for(const p of edited) {
    if(base.bySlug.has(p.slug))rw.on('.catalog-grid [data-slug="'+p.slug+'"]',{element(el){el.replace(productCard(p,l,base),{html:true});}});
  }
  rw.on('.catalog-grid',{element(el){el.prepend(edited.filter(p=>!base.bySlug.has(p.slug)).map(p=>productCard(p,l,base)).join(''),{html:true});}});
  const counts=new Map(base.categories.map(c=>[c.key,catalog.filter(p=>p.category===c.key).length]));counts.set('All films',catalog.length);
  for(const [key,count] of counts)setText(rw,'[data-filter="'+key+'"] small',count);
  for(const c of base.categories){
    const links=catalog.filter(p=>p.category===c.key).map(p=>'<a href="'+detailPath(p.slug,l)+'">'+e(copyFor(p,l).name)+' <span>↗</span></a>').join('');
    setHTML(rw,'[data-category-context="'+c.key+'"] .subcategory-links',links);
  }
  return rw.transform(fresh(original));
}
async function productDetail(req,env,p,l,base,preview,edited){
  const seed=base.bySlug.get(p.slug);
  const template=seed?.category===p.category?seed:base.products.find(item=>item.category===p.category);
  const original=await basePage(req,env,detailPath(template.slug,l));
  const rw=new HTMLRewriter(),c=copyFor(p,l),cat=categoryName(base,p,l);
  const publicOrigin='https://yunnianfilm.com',canonical=publicOrigin+detailPath(p.slug,l);
  setText(rw,'title',c.name+' | YUNNIAN');setText(rw,'[data-product-name]',c.name);setText(rw,'[data-product-description]',c.description);
  setText(rw,'[data-product-label]',cat);setText(rw,'[data-product-category]',cat);
  setAttr(rw,'[data-product-category]','href',prefix(l)+'/products/?category='+encodeURIComponent(p.category));
  setAttr(rw,'link[rel="canonical"]','href',canonical);
  rw.on('link[hreflang],a[data-language-link]',{element(el){
    const tag=el.getAttribute('hreflang')||'en';const to=tag==='zh-CN'?'zh':locales.includes(tag)?tag:'en';
    const href=detailPath(p.slug,to);el.setAttribute('href',el.tagName==='link'?publicOrigin+href:href);
  }});
  setAttr(rw,'meta[name="description"],meta[property="og:description"]','content',c.description);
  setAttr(rw,'meta[property="og:title"]','content',c.name+' | YUNNIAN');
  if(p.gallery[0])setAttr(rw,'meta[property="og:image"]','content',publicOrigin+p.gallery[0].src);
  setHTML(rw,'[data-product-gallery]',galleryHTML(p,l));setHTML(rw,'[data-product-offer]',offerHTML(p,l));
  updateRelated(rw,p,l,base,edited);
  setHTML(rw,'[data-product-facts]',termsHTML(quickSpecs(p,l,base)));setHTML(rw,'[data-product-specs]',termsHTML(translateSpecs(p,l,base)));
  rw.on('a[href*="product="]',{element(el){
    const href=new URL(el.getAttribute('href'),req.url);
    if(!href.pathname.endsWith('/contact/'))return;
    href.searchParams.set('product',copyFor(p,'en').name);el.setAttribute('href',href.pathname+href.search);
  }});
  if(!seed||template.slug!==seed.slug) {
    remove(rw,'[data-product-sources],[data-product-source-link],[data-product-detail-images]');
    setHTML(rw,'#variant-refs','{}');
  }
  if(preview)setAttr(rw,'meta[name="robots"]','content','noindex,nofollow');
  return rw.transform(fresh(original,preview));
}
export async function storefront(req,env) {
  const db=env.SUPPORT_DB,url=new URL(req.url);
  if(url.pathname==='/sitemap.xml'){
    const edited=await publicEdits(db);if(!edited.length)return env.ASSETS.fetch(req);
    const base=await baseCatalog(req,env), more=edited.filter(p=>!base.bySlug.has(p.slug));
    const res=await basePage(req,env,'/sitemap.xml');if(!more.length)return res;
    const xml=more.flatMap(p=>locales.map(l=>'<url><loc>https://yunnianfilm.com'+detailPath(p.slug,l)+'</loc></url>')).join('');
    return new Response((await res.text()).replace('</urlset>',xml+'</urlset>'),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
  }
  const route=/^\/(?:(zh|fr|ar|es)\/)?(products|contact)(?:\/([a-z0-9][a-z0-9-]{0,95}))?\/?$/.exec(url.pathname);
  if(!route)return env.ASSETS.fetch(req);
  const [,locale,section,slug]=route,l=locale||'en';
  if(section==='products' && slug){
    const preview=url.searchParams.get('catalog-preview')==='1';
    if(preview)demand(await editor(req,db),403,'请先登录产品后台。');
    const edited=await publicEdits(db);
    let content=edited.find(p=>p.slug===slug);
    if(preview){
      const draft=await db.prepare("SELECT draft FROM catalog_documents WHERE kind='product' AND id=?").bind(slug).first();
      if(draft)content=JSON.parse(draft.draft);
    }
    if(!content&&!edited.length)return env.ASSETS.fetch(req);
    const base=await baseCatalog(req,env);
    if(!content){
      const seed=base.bySlug.get(slug);
      const original=await env.ASSETS.fetch(req);
      if(!seed||original.status!==200||!edited.some(p=>p.category===seed.category||base.bySlug.get(p.slug)?.category===seed.category))return original;
      const rw=new HTMLRewriter();updateRelated(rw,seed,l,base,edited);return rw.transform(fresh(original,preview));
    }
    if(!url.pathname.endsWith('/')){url.pathname+='/';return Response.redirect(url.href,308);}
    return productDetail(req,env,content,l,base,preview,edited);
  }
  const edited=await publicEdits(db);
  if(!edited.length)return env.ASSETS.fetch(req);
  const base=await baseCatalog(req,env);
  if(section==='products')return listing(req,env,edited,l,base);
  const rw=new HTMLRewriter();
  for(const p of edited)remove(rw,'option[data-product-slug="'+p.slug+'"]');
  rw.on('select[name="product"]',{element(el){el.append(edited.map(p=>'<option data-product-slug="'+e(p.slug)+'" value="'+e(copyFor(p,'en').name)+'">'+e(copyFor(p,l).name)+'</option>').join(''),{html:true});}});
  return rw.transform(fresh(await basePage(req,env,prefix(l)+'/contact/')));
}
