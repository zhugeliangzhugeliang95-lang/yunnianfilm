import {hasPendingChanges} from './content.js';

// Return just the fields needed to browse and search the catalogue.
function listing(product, original, change) {
  const variants = product.variants || [];
  const published = Boolean(original || change?.published);
  const status = !published ? 'draft' : change?.pending ? 'changed' : 'live';
  return {
    slug:product.slug, category:product.category, zh:product.copy.zh.name, en:product.copy.en.name,
    names:Object.values(product.copy).map(entry=>entry.name).filter(Boolean),
    cover:product.gallery[0]?.src || '', status, updated:change?.updated || 0,
    models:variants.map(variant=>variant.value), needsPhoto:variants.filter(variant=>!variant.src || variant.kind!=='variant').length,
  };
}
export async function dashboardData(db, base) {
  const {results}=await db.prepare('SELECT kind,id,revision,updated,live IS NOT NULL AS published,draft IS NOT live AS pending,draft FROM catalog_documents ORDER BY updated DESC').all();
  const products=new Map(base.products.map(p=>[p.slug,listing(p,true)]));
  const entries=results.map(({draft,...change})=>{
    change.pending=hasPendingChanges(change.kind,change.id,draft,change.published,change.pending,base);
    if(change.kind==='product'){
      const product=JSON.parse(draft);
      products.set(change.id,listing(product,base.bySlug.has(change.id),change));
      return {...change,zh:product.copy.zh.name,en:product.copy.en.name};
    }
    return change;
  });
  const defaults='{"copy":{},"images":{}}';
  const seo=await db.prepare('SELECT slug,live IS NOT NULL AND live<>? AS customized,draft IS NOT COALESCE(live,?) AS pending FROM catalog_seo').bind(defaults,defaults).all();
  for(const row of seo.results){
    const item=products.get(row.slug);
    if(!item)continue;
    item.seoStatus=row.pending?'changed':row.customized?'live':'default';
  }
  return {entries,categories:base.categories,products:[...products.values()].sort((a,b)=>b.updated-a.updated)};
}
