import {categories} from '../../data/categories';
import {managedProducts, productWord, modelWord} from '../../data/managed-products';
import {languages} from '../../locales/languages';
import details from '../../data/source-product-details.json';
import stories from '../../data/customer-stories.json';

export function GET() {
  const specificationTerms = new Set(managedProducts.flatMap(p=>p.specs.flat()));
  const words = Object.fromEntries(languages.map(({id})=>[id,Object.fromEntries(Array.from(specificationTerms,v=>[v,productWord(v,id)]))]));
  const terms = new Set(managedProducts.flatMap(p=>p.tables.flatMap(table=>[table.title, ...table.columns, ...table.rows.flat()])));
  const modelWords = Object.fromEntries(languages.map(({id})=>[id,Object.fromEntries(Array.from(terms,v=>[v,modelWord(v,id)]).filter(([raw,translated])=>raw!==translated))]));
  return Response.json({
    products:managedProducts, stories, words, modelWords, sourceSlugs:Object.keys(details),
    categories:categories.map(c=>({key:c.key,labels:Object.fromEntries(languages.map(({id})=>[id,id==='zh'?c.zh:productWord(c.en,id)]))})),
  });
}
