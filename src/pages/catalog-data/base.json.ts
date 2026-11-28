import {products as colors, colorName, finishLabel} from '../../../public/automotive-studio/viewer/catalog/product-catalog.js';
import {categories} from '../../data/categories';
import {managedProducts, productWord, modelWord} from '../../data/managed-products';
import {languages} from '../../locales/languages';
import details from '../../data/source-product-details.json';
import stories from '../../data/customer-stories.json';
import detailImages from '../../data/detail-images.json';
import {products} from '../../data/products';

export function GET() {
  const specificationTerms = new Set(managedProducts.flatMap(p=>p.specs.flat()));
  const words = Object.fromEntries(languages.map(({id})=>[id,Object.fromEntries(Array.from(specificationTerms,v=>[v,productWord(v,id)]))]));
  const terms = new Set(managedProducts.flatMap(p=>p.tables.flatMap(table=>[table.title, ...table.columns, ...table.rows.flat()])));
  const detailsLabel={en:'Product details',zh:'产品详情',es:'Detalles del producto',fr:'Détails du produit',ar:'تفاصيل المنتج'};
  const sheetLabel={en:'Specification sheet',zh:'规格资料',es:'Ficha técnica',fr:'Fiche technique',ar:'ورقة المواصفات'};
  const detailPhotos=Object.fromEntries(products.map(p=>[p.slug,[
    ...((detailImages as Record<string,string[]>)[p.slug] || []).map(src=>({src,labels:detailsLabel})),
    ...(p.sheet?[{src:p.sheet,labels:sheetLabel}]:[]),
  ]]));
  const modelWords = Object.fromEntries(languages.map(({id})=>[id,Object.fromEntries(Array.from(terms,v=>[v,modelWord(v,id)]).filter(([raw,translated])=>raw!==translated))]));
  return Response.json({
    products:managedProducts,
    colors:colors.map(c=>({ref:c.reference, names:Object.fromEntries(languages.map(({id})=>[id,colorName(c,id)])),
      finish:finishLabel(c,'en'),finishZh:finishLabel(c,'zh'),families:c.families})), stories, words, modelWords, detailPhotos, sourceSlugs:Object.keys(details),
    categories:categories.map(c=>({key:c.key,labels:Object.fromEntries(languages.map(({id})=>[id,id==='zh'?c.zh:productWord(c.en,id)]))})),
  });
}
