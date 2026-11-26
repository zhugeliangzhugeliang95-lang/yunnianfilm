import {copyFor, escapeHTML} from '../../public/catalog-ui/product-view.js';
import {inLanguage} from '../locales/languages';
import type {managedProducts} from './managed-products';

type Series = Pick<(typeof managedProducts)[number], 'slug' | 'copy' | 'specs'>;
export type BuyerLocale = 'en' | 'zh';

const thicknessKey = /^(?:thickness|listed thickness|厚度|标示厚度|标称厚度)$/i;
const detailKey = /^(?:topcoat|coating options|finish(?:es)?|roll size|表面涂层|涂层选项|表面质感|表面效果|卷材规格|卷材尺寸)$/i;

// Both the built page and the editable storefront render the published specification fields.
export function tpuComparisonRows(series: Series[], locale: BuyerLocale, translate: (s: string) => string) {
  const rows: string[] = [];
  for (const product of series) {
    const thickness = product.specs.find(([key]) => thicknessKey.test(key.trim()))?.[1]?.trim();
    if (!thickness) continue;
    const url = inLanguage('/products/' + encodeURIComponent(product.slug) + '/', locale);
    const name = escapeHTML(copyFor(product, locale).name);
    const details = product.specs
      .filter(([key, value]) => detailKey.test(key.trim()) && value.trim())
      .map(([key, value]) => '<div><small>' + escapeHTML(translate(key)) + '</small> ' + escapeHTML(translate(value)) + '</div>');
    const fallback = locale === 'zh' ? '按所选型号确认' : 'Confirm for the selected model';
    rows.push('<tr><th scope="row"><a href="' + escapeHTML(url) + '">' + name + '</a></th><td>' +
      escapeHTML(translate(thickness)) + '</td><td>' + (details.join('') || fallback) + '</td></tr>');
  }
  return rows.join('');
}
