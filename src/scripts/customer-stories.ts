import {escapeHTML} from '../../public/catalog-ui/product-view.js';
import {inLanguage, languages, type Locale} from '../locales/languages';

export const storyLabels = {
  en: {heading: 'Customer cases & reviews', case: 'Customer case', review: 'Customer review', caseSample: 'Illustrative case', reviewSample: 'Illustrative review', product: 'View this film'},
  zh: {heading: '客户案例与评价', case: '客户案例', review: '客户评价', caseSample: '案例示例', reviewSample: '示例评价', product: '查看这款膜'},
  es: {heading: 'Casos y opiniones de clientes', case: 'Caso de cliente', review: 'Opinión de cliente', caseSample: 'Caso ilustrativo', reviewSample: 'Opinión de ejemplo', product: 'Ver esta lámina'},
  fr: {heading: 'Cas clients et avis', case: 'Cas client', review: 'Avis client', caseSample: 'Exemple de cas', reviewSample: 'Exemple d’avis', product: 'Voir ce film'},
  ar: {heading: 'تجارب العملاء وآراؤهم', case: 'حالة عميل', review: 'رأي عميل', caseSample: 'حالة توضيحية', reviewSample: 'رأي توضيحي', product: 'عرض هذا الفيلم'},
};

type Kind = 'case' | 'review';
type Copy = {title: string; body: string; credit: string; quote?: string};
type Story = {id: string; kind: Kind; sample: boolean; image: string; product: string; copy: Partial<Record<Locale, Copy>>};
export type StoryView = Copy & {id: string; kind: Kind; lang: string; image: string; link: string; label: string};

function imagePath(value: string) {
  if (typeof value !== 'string' || value.includes('..') || value.includes('//')) return '';
  if (/^\/catalog-api\/images\/[a-zA-Z0-9_-]+(?:\.webp)?$/.test(value)) return value;
  return /^\/(?:images|automotive-studio\/viewer\/catalog\/(?:cards|thumbs))\/[a-zA-Z0-9_./-]+\.webp$/.test(value) ? value : '';
}

export function storyViews(stories: Story[], locale: Locale): StoryView[] {
  const result: StoryView[] = [];
  const labels = storyLabels[locale];
  for (const story of stories) {
    if (!story?.copy || !['case', 'review'].includes(story.kind)) continue;
    const language = [locale, ...languages.map(language => language.id)].find(id => {
      const copy = story.copy[id];
      return copy && typeof copy.title === 'string' && copy.title.trim() &&
        [copy.body, copy.quote].some(text => typeof text === 'string' && text.trim());
    });
    if (!language) continue;
    const copy = story.copy[language]!;
    const label = story.sample !== false
      ? labels[story.kind === 'case' ? 'caseSample' : 'reviewSample']
      : labels[story.kind];
    const product = typeof story.product === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.product) ? story.product : '';
    result.push({
      id: story.id, kind: story.kind, label, lang: language === 'zh' ? 'zh-CN' : language,
      title: copy.title, body: typeof copy.body === 'string' ? copy.body : '',
      credit: typeof copy.credit === 'string' ? copy.credit : '', quote: typeof copy.quote === 'string' ? copy.quote : '',
      image: imagePath(story.image), link: product ? inLanguage('/products/' + product + '/', locale) : '',
    });
  }
  return result;
}

export function storyGroupHTML(views: StoryView[], kind: Kind, locale: Locale) {
  const linkText = storyLabels[locale].product;
  return views.filter(view => view.kind === kind).map(view => {
    const lang = escapeHTML(view.lang);
    const text = (tag: string, field: 'title' | 'body' | 'quote' | 'credit') => view[field]
      ? `<${tag} class="story-${field}" lang="${lang}" dir="auto">${escapeHTML(view[field])}</${tag}>` : '';
    const media = view.image
      ? `<div class="story-media"><img src="${escapeHTML(view.image)}" loading="lazy" decoding="async" width="900" height="580" alt=""></div>` : '';
    const link = view.link
      ? `<a class="story-product" href="${escapeHTML(view.link)}" aria-label="${escapeHTML(linkText + ' · ' + view.title)}">${escapeHTML(linkText)}</a>` : '';
    return `<article class="story-entry" data-customer-story="${escapeHTML(view.id)}">${media}<div class="story-text"><p class="story-kind">${escapeHTML(view.label)}</p>${text('h3','title')}${text('p','body')}${text('blockquote','quote')}${text('p','credit')}${link}</div></article>`;
  }).join('');
}
