import {parse, serialize} from 'parse5';
import {textIn} from './copy';
import {inLanguage, type TranslatedLocale} from './languages';

const pageRoute = /^\/(?:$|\?|#|(?:about|applications|blog|buyer-services|collections-guide|color-studio|company-library|contact|film-guide|film-lab|oem|privacy|products|resources|404)(?:\/|\?|#|$))/;
const labelAttributes = new Set(['alt', 'title', 'aria-label', 'placeholder', 'label', 'data-default-alt', 'data-default', 'data-gallery-caption']);
const normalized = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
function localURL(value: string, locale: TranslatedLocale) {
  if (value.startsWith('/automotive-studio/viewer/?')) {
    const u = new URL(value, 'https://yunnianfilm.com');
    u.searchParams.set('lang', locale);
    return u.pathname + u.search + u.hash;
  }
  return pageRoute.test(value) ? inLanguage(value, locale) : value;
}
export function renderLocale(markup: string, locale: TranslatedLocale) {
  const document = parse(markup);
  function visit(node: any, preserve = false) {
    if (node.nodeName === '#text') {
      if (!preserve) node.value = textIn(node.value, locale);
      return;
    }
    const attrs = node.attrs || [];
    const attr = (name: string) => attrs.find((a: {name: string}) => a.name === name);
    if (attr('data-language-link')) return;
    preserve ||= attr('translate')?.value === 'no';
    if (attr('data-lang')) attr('data-lang').value = locale;
    if (node.tagName === 'script' || node.tagName === 'style') return;
    if (node.tagName === 'option' && !attr('value')) attrs.push({name:'value', value:node.childNodes.map((n: any) => n.value || '').join('')});
    for (const a of attrs) {
      if (!preserve && labelAttributes.has(a.name)) a.value = textIn(a.value, locale);
      if (['href','action','data-contact-path'].includes(a.name)) a.value = localURL(a.value, locale);
    }
    if (node.tagName === 'meta' && ['description','og:title','og:description'].includes(attr('name')?.value || attr('property')?.value)) {
      const value = attr('content');
      if (value) value.value = textIn(value.value, locale);
    }
    for (const child of node.childNodes || []) visit(child, preserve);
    if (attr('data-search')) {
      const labels: string[] = [];
      function collect(n: any) {
        if (n.nodeName === '#text') labels.push(n.value);
        for (const child of n.childNodes || []) collect(child);
      }
      collect(node);
      attr('data-search').value += ' ' + normalized(labels.join(' '));
    }
  }
  visit(document);
  return serialize(document);
}
