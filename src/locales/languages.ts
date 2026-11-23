export const languages = [
  {id: 'en', tag: 'en', name: 'English', short: 'EN', og: 'en_US'},
  {id: 'zh', tag: 'zh-CN', name: '简体中文', short: '中文', og: 'zh_CN'},
  {id: 'es', tag: 'es', name: 'Español', short: 'ES', og: 'es_ES'},
  {id: 'fr', tag: 'fr', name: 'Français', short: 'FR', og: 'fr_FR'},
  {id: 'ar', tag: 'ar', name: 'العربية', short: 'عربي', og: 'ar_SA'},
] as const;
export type Locale = typeof languages[number]['id'];
export const translatedLocales = ['es', 'fr', 'ar'] as const;
export type TranslatedLocale = typeof translatedLocales[number];
export const siteLanguage = (pathname: string) =>
  languages.find(language => language.id === pathname.split('/')[1]) || languages[0];
export function pagePath(pathname: string) {
  const path = pathname.replace(/^\/(?:zh|es|fr|ar)(?=\/|$)/, '') || '/';
  return path === '/404/' ? '/404.html' : path;
}
export function inLanguage(pathname: string, locale: Locale) {
  const path = pagePath(pathname);
  if (locale === 'en') return path;
  return '/' + locale + (path === '/404.html' ? '/404/' : path);
}
