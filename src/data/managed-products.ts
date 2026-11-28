import {products} from './products';
import archive from './source-product-details.json';
import {translate} from './translate';
import {textIn} from '../locales/copy';
import {languages, type Locale} from '../locales/languages';
import {productMedia} from './product-media';
import {sourceTables, modelTermsZh} from './model-tables';
import {skuWord} from './sku-words';
import {products as swatches, colorName} from '../../public/automotive-studio/viewer/catalog/product-catalog.js';

const swatchesByName = new Map();
for (const card of swatches) {
  const key = card.nameEn.trim().toLowerCase();
  swatchesByName.set(key, swatchesByName.has(key) ? null : card);
}
export function productWord(value:string, locale:Locale) {
  if (!value) return value;
  const sku = skuWord(value,locale);
  if (sku !== undefined) return sku;
  if (locale === 'en') return value;
  const card = swatchesByName.get(value.trim().toLowerCase());
  if (card) return colorName(card,locale);
  return locale === 'zh' ? translate('zh',value) : textIn(value,locale);
}
export function modelWord(value: string, locale: Locale) {
  if (locale === 'zh' && Object.hasOwn(modelTermsZh, value)) return modelTermsZh[value];
  return productWord(value, locale);
}
const names = (value:string) => Object.fromEntries(languages.map(({id})=>[id,productWord(value,id)]));
function record(product:typeof products[number]) {
  const media = productMedia(product);
  const records = archive[product.slug as keyof typeof archive] ?? [];
  const colorCodes = new Map(product.category === 'PET color wraps'
    ? records.flatMap(r => r.variants.map(v => [v.title, v.sku] as const)) : []);
  function optionLabels(value: string) {
    const code = colorCodes.get(value);
    if (!code) return names(value);
    return Object.fromEntries(languages.map(({id}) => [id, code + ' · ' + productWord(value,id)]));
  }
  return {
    slug:product.slug, category:product.category,
    copy:Object.fromEntries(languages.map(({id}) => [id,{
      name:productWord(product.name,id), description:productWord(product.description,id), material:productWord(product.materials,id),
    }])),
    tables:sourceTables(product.slug), specs:product.specs, gallery:media.gallery.map(im=>({...im,labels:names(im.caption)})),
    variants:media.variants.map(v=>({value:v.value,src:v.src,kind:v.kind,labels:optionLabels(v.value)})),
  };
}
export const managedProducts = products.map(record);
export const managedBySlug = new Map(managedProducts.map(p=>[p.slug,p]));

export function productCardImage(product: {slug: string; image?: string}) {
  if (product.image) return product.image.startsWith('/') ? product.image : '/images/' + product.image;
  return managedBySlug.get(product.slug)?.gallery[0]?.src;
}
