import {copy} from '../../locales/copy';
import {translatedLocales, type TranslatedLocale} from '../../locales/languages';
import keys from '../../locales/interface-keys.json';
export function getStaticPaths() {
  return translatedLocales.map(id => ({params: {id}}));
}
export function GET({params}: {params: {id: TranslatedLocale}}) {
  const all = copy[params.id];
  const words = Object.fromEntries(keys.filter(key => Object.hasOwn(all, key)).map(key => [key, all[key]]));
  return new Response('globalThis.YunnianWords=' + JSON.stringify(words).replace(/</g, '\\u003c') + ';', {
    headers: {'Content-Type': 'application/javascript; charset=utf-8'},
  });
}
