// Site templates preload the selected interface. Standalone viewers load it on demand.
export const localeCode = value => ['en','zh','es','fr','ar'].includes(String(value).split('-')[0]) ? String(value).split('-')[0] : 'en';
export const pageLocale = () => localeCode(document.documentElement.lang);
export function localePrefix(lang) {
  const code = localeCode(lang);
  return code === 'en' ? '' : '/' + code;
}
export function ui(english, values) {
  const key = english.trim();
  const words = globalThis.YunnianWords;
  const phrase = words && Object.hasOwn(words, key) ? english.replace(/\S[\s\S]*\S|\S/, () => words[key]) : english;
  if (!values) return phrase;
  return phrase.replace(/\{(\w+)\}/g, (marker, name) => Object.hasOwn(values, name) ? String(values[name]) : marker);
}
export function loadInterface(lang) {
  const code = localeCode(lang);
  if (code === 'en' || code === 'zh' || globalThis.YunnianWords) return Promise.resolve();
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = '/locales/' + code + '.js';
    script.onload = script.onerror = () => resolve();
    document.head.append(script);
  });
}
