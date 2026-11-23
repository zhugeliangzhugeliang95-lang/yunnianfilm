import {translate,type Language} from './translate';
export {translate,canonicalValue,type Language} from './translate';
import {categories} from './categories';
import { products as sourceProducts, faqs as sourceFaqs, company as sourceCompany } from './products';

export const language = (url: URL): Language => url.pathname.startsWith('/zh/') ? 'zh' : 'en';
export function localizedPath(lang: Language, path: string) {
  return lang === 'zh' ? `/zh${path}` : path;
}
export function localizeProduct(product: typeof sourceProducts[number], lang: Language) {
  const t = (text: string) => translate(lang, text);
  return {
    ...product,
    originalName: product.name,
    name: t(product.name), label: t(product.label), description: t(product.description), materials: t(product.materials),
    optionLabels: product.options.map(t),
    specs: product.specs.map(([key, value]) => [t(key), t(value)]),
  };
}
export function content(url: URL) {
  const lang = language(url);
  const t = (text: string) => translate(lang, text);
  return {
    lang, t, path: (value: string) => localizedPath(lang, value),
    company: { ...sourceCompany, name: t(sourceCompany.name), address: t(sourceCompany.address) },
    products: sourceProducts.map(p => localizeProduct(p, lang)).sort((a,b)=>categories.findIndex(c=>c.key===a.category)-categories.findIndex(c=>c.key===b.category)),
    faqs: sourceFaqs.map(([q, a]) => [t(q), t(a)]),
  };
}
