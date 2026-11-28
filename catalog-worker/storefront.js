import {baseCatalog,demand} from './common.js';
import {editor} from './access.js';
import {readSEO} from './seo.js';
import {locales,prefix,escapeHTML as e,copyFor,localeValue,galleryHTML,offerHTML} from '../public/catalog-ui/product-view.js';
import {modelTablesHTML} from '../public/catalog-ui/model-tables.js';
import {storyViews,storyGroupHTML} from '../src/scripts/customer-stories.ts';
import {tpuSchema} from '../src/data/tpu-schema.ts';
import {tpuComparisonRows} from '../src/data/tpu-comparison.ts';
import {tpuPagePath} from '../src/locales/tpu.ts';

const detailPath=(id,l)=>prefix(l)+'/products/'+id+'/';
const setText=(rw,selector,value)=>rw.on(selector,{element(el){el.setInnerContent(String(value??''));}});
const setHTML=(rw,selector,value)=>rw.on(selector,{element(el){el.setInnerContent(value,{html:true});}});
const setAttr=(rw,selector,name,value)=>rw.on(selector,{element(el){el.setAttribute(name,value);}});
const remove=(rw,selector)=>rw.on(selector,{element(el){el.remove();}});
async function homepage(req,env,locale) {
  const [original,record]=await Promise.all([
    env.ASSETS.fetch(req),
    env.SUPPORT_DB.prepare("SELECT live FROM catalog_documents WHERE kind='stories' AND id='home' AND live IS NOT NULL").first(),
  ]);
  if(!record || original.status!==200)return original;
  const views=storyViews(JSON.parse(record.live),locale),rw=new HTMLRewriter();
  if(!views.length)remove(rw,'#customer-stories');
  for(const kind of ['case','review']){
    const cards=storyGroupHTML(views,kind,locale);
    rw.on('[data-story-group="'+kind+'"]',{element(el){
      el.setInnerContent(cards,{html:true});
      if(cards)el.removeAttribute('hidden');else el.setAttribute('hidden','');
    }});
  }
  return rw.transform(fresh(original));
}
function fresh(response,privatePage=false) {
  const headers=new Headers(response.headers);
  for(const header of ['etag','last-modified','content-length'])headers.delete(header);
  headers.set('Cache-Control',privatePage?'private, no-store':'no-store');
  if(privatePage)headers.set('X-Robots-Tag','noindex, nofollow');
  return new Response(response.body,{status:response.status,headers});
}
const basePage=(req,env,path)=>env.ASSETS.fetch(new URL(path,req.url).href);
export async function publicEdits(db){
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
async function tpuLanding(req, env, locale) {
  const [original, edited] = await Promise.all([env.ASSETS.fetch(req), publicEdits(env.SUPPORT_DB)]);
  if (!edited.length || original.status !== 200) return original;
  const base = await baseCatalog(req, env);
  if (!edited.some(p => p.category === 'Clear PPF' || base.bySlug.get(p.slug)?.category === 'Clear PPF')) return original;
  const catalog = new Map(base.products.map(p => [p.slug, p]));
  for (const product of edited) catalog.set(product.slug, product);
  const series = [...catalog.values()].filter(p => p.category === 'Clear PPF');
  const graph = tpuSchema('https://yunnianfilm.com', locale, series.map(p => ({slug:p.slug, name:copyFor(p,locale).name})));
  const rw = new HTMLRewriter();
  setHTML(rw, '[data-tpu-series]', series.map(p => productCard(p,locale,base,false)).join(''));
  if (locale === 'en' || locale === 'zh') {
    const rows = tpuComparisonRows(series, locale, value => base.words[locale]?.[value] || value);
    setHTML(rw, '[data-tpu-comparison-rows]', rows);
    rw.on('[data-tpu-comparison]', {element(el) {
      if (rows) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    }});
  }
  setHTML(rw, 'script[type="application/ld+json"]', JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c'));
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
  setAttr(rw,'[data-product-category]','href',prefix(l)+(p.category==='Clear PPF'?tpuPagePath:'/products/?category='+encodeURIComponent(p.category)));
  setAttr(rw,'link[rel="canonical"]','href',canonical);
  setAttr(rw,'meta[property="og:url"]','content',canonical);
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
  const tables=p.tables ?? seed?.tables ?? [];
  const hasArchive=Boolean(seed && template.slug===seed.slug && base.sourceSlugs?.includes(seed.slug));
  const toggle=(selector,visible)=>rw.on(selector,{element(el){if(visible)el.removeAttribute('hidden');else el.setAttribute('hidden','');}});
  toggle('[data-product-library],[data-model-link]',tables.length>0 || hasArchive);
  toggle('[data-model-note]',tables.length>0 && p.category==='Window film');
  setHTML(rw,'[data-model-tables]',modelTablesHTML(tables,l,term=>Object.hasOwn(base.modelWords?.[l] || {},term)?base.modelWords[l][term]:term));
  if(!seed||template.slug!==seed.slug) {
    remove(rw,'[data-product-sources],[data-product-source-link],[data-product-detail-images]');
    setHTML(rw,'#variant-refs','{}');
  }
  if(preview)setAttr(rw,'meta[name="robots"]','content','noindex,nofollow');
  return rw.transform(fresh(original,preview));
}
function withSEO(response, settings, locale, cover, privatePage) {
  if(response.status!==200 || !(response.headers.get('Content-Type') || '').includes('text/html'))return response;
  const copy=settings?.copy[locale] || {};
  const alts=new Map(Object.entries(settings?.images || {}).filter(([,v])=>v[locale]).map(([src,v])=>[src,v[locale]]));
  if(!copy.title && !copy.description && !alts.size && !privatePage)return response;
  const rw=new HTMLRewriter();
  // The HTML rewriter quotes attributes but preserves literal ampersands.
  const attr=value=>value.replaceAll('&','&amp;');
  if(copy.title){
    setText(rw,'title',copy.title);
    setAttr(rw,'meta[property="og:title"]','content',attr(copy.title));
  }
  if(copy.description)setAttr(rw,'meta[name="description"],meta[property="og:description"]','content',attr(copy.description));
  if(alts.size){
    rw.on('.product-media-column img, [data-product-offer] img, .reference-gallery img',{element(el){
      const alt=alts.get(el.getAttribute('src'));if(alt)el.setAttribute('alt',attr(alt));
    }});
    rw.on('[data-photo][data-src]',{element(el){
      const alt=alts.get(el.getAttribute('data-src'));if(alt)el.setAttribute('data-alt',attr(alt));
    }});
    if(alts.has(cover)){
      setAttr(rw,'meta[property="og:image"]','content','https://yunnianfilm.com'+cover);
      rw.on('meta[property="og:image"]',{element(el){el.after('<meta property="og:image:alt" content="'+e(alts.get(cover))+'">',{html:true});}});
    }
  }
  if(privatePage){
    setAttr(rw,'meta[name="robots"]','content','noindex,nofollow');
    remove(rw,'script[data-public-tag]');
  }
  return rw.transform(fresh(response,privatePage));
}
export async function storefront(req,env) {
  const db=env.SUPPORT_DB,url=new URL(req.url);
  const home=/^\/(?:(zh|fr|es|ar)\/)?$/.exec(url.pathname);
  if(home)return homepage(req,env,home[1]||'en');
  const tpuLocale = locales.find(l => url.pathname === prefix(l) + tpuPagePath);
  if(tpuLocale)return tpuLanding(req,env,tpuLocale);
  if(url.pathname==='/sitemap.xml'){
    const edited=await publicEdits(db);if(!edited.length)return env.ASSETS.fetch(req);
    const base=await baseCatalog(req,env), more=edited.filter(p=>!base.bySlug.has(p.slug));
    const res=await basePage(req,env,'/sitemap.xml');if(!more.length)return res;
    const xml=more.map(p=>{
      const urls=locales.map(locale=>({tag:locale==='zh'?'zh-CN':locale,href:'https://yunnianfilm.com'+detailPath(p.slug,locale)}));
      const links=[...urls,{tag:'x-default',href:'https://yunnianfilm.com'+detailPath(p.slug,'en')}]
        .map(({tag,href})=>'<xhtml:link rel="alternate" hreflang="'+tag+'" href="'+e(href)+'"/>').join('');
      return urls.map(({href})=>'<url><loc>'+e(href)+'</loc>'+links+'</url>').join('');
    }).join('');
    return new Response((await res.text()).replace('</urlset>',xml+'</urlset>'),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
  }
  const route=/^\/(?:(zh|fr|ar|es)\/)?(products|contact)(?:\/([a-z0-9][a-z0-9-]{0,95}))?\/?$/.exec(url.pathname);
  if(!route)return env.ASSETS.fetch(req);
  const [,locale,section,slug]=route,l=locale||'en';
  if(section==='products' && slug){
    const previewProduct=url.searchParams.get('catalog-preview')==='1',previewSEO=url.searchParams.get('seo-preview')==='1';
    const preview=previewProduct || previewSEO;
    if(preview)demand(await editor(req,db),403,'请先登录产品后台。');
    const [edited,settings]=await Promise.all([publicEdits(db),readSEO(db,slug,previewSEO)]);
    let content=edited.find(p=>p.slug===slug);
    if(!content&&!edited.length&&!settings&&!preview)return env.ASSETS.fetch(req);
    const base=await baseCatalog(req,env),seed=base.bySlug.get(slug);
    if(previewProduct || (previewSEO && !content && !seed)){
      const draft=await db.prepare("SELECT draft FROM catalog_documents WHERE kind='product' AND id=?").bind(slug).first();
      if(draft)content=JSON.parse(draft.draft);
    }
    if(!content){
      let response=await env.ASSETS.fetch(req);
      if(!seed || response.status!==200)return response;
      if(edited.some(p=>p.category===seed.category||base.bySlug.get(p.slug)?.category===seed.category)){
        const rw=new HTMLRewriter();updateRelated(rw,seed,l,base,edited);response=rw.transform(fresh(response,preview));
      }
      return withSEO(response,settings,l,seed.gallery[0]?.src,preview);
    }
    if(!url.pathname.endsWith('/')){url.pathname+='/';return Response.redirect(url.href,308);}
    return withSEO(await productDetail(req,env,content,l,base,preview,edited),settings,l,content.gallery[0]?.src,preview);
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
