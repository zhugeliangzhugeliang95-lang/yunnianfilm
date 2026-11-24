import {categories} from '../../data/categories';
import {managedProducts, productWord} from '../../data/managed-products';
import {languages} from '../../locales/languages';
import stories from '../../data/customer-stories.json';

export function GET() {
  const specificationTerms = new Set(managedProducts.flatMap(p=>p.specs.flat()));
  const words = Object.fromEntries(languages.map(({id})=>[id,Object.fromEntries(Array.from(specificationTerms,v=>[v,productWord(v,id)]))]));
  return Response.json({
    products:managedProducts, stories, words,
    categories:categories.map(c=>({key:c.key,labels:Object.fromEntries(languages.map(({id})=>[id,id==='zh'?c.zh:productWord(c.en,id)]))})),
  });
}
