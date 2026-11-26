import {inLanguage, languages, type Locale} from '../locales/languages';
import {tpuCopy, tpuPagePath} from '../locales/tpu';

export function tpuBreadcrumbs(locale: Locale) {
  const copy = tpuCopy[locale];
  return [
    {name: copy.home, path: '/'}, {name: copy.catalog, path: '/products/'},
    {name: copy.heading, path: tpuPagePath},
  ];
}

export function tpuSchema(origin: URL | string, locale: Locale, series: {slug: string; name: string}[]) {
  const copy = tpuCopy[locale];
  const absolute = (path: string) => new URL(inLanguage(path, locale), origin).href;
  const canonical = absolute(tpuPagePath);
  return [
    {
      '@type': 'CollectionPage', '@id': canonical, url: canonical,
      name: copy.heading, description: copy.description, inLanguage: languages.find(item => item.id === locale)!.tag,
      isPartOf: {'@id': new URL('/#website', origin).href}, breadcrumb: {'@id': canonical + '#breadcrumbs'},
      mainEntity: {
        '@type': 'ItemList', name: copy.series, numberOfItems: series.length,
        itemListElement: series.map((product, index) => ({
          '@type': 'ListItem', position: index + 1, name: product.name, url: absolute('/products/' + product.slug + '/'),
        })),
      },
    },
    {
      '@type': 'BreadcrumbList', '@id': canonical + '#breadcrumbs',
      itemListElement: tpuBreadcrumbs(locale).map((item, index) => ({
        '@type': 'ListItem', position: index + 1, name: item.name, item: absolute(item.path),
      })),
    },
  ];
}
