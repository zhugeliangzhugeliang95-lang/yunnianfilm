import {defineMiddleware} from 'astro:middleware';
import {translatedLocales, siteLanguage, type TranslatedLocale} from './locales/languages';
import {renderLocale} from './locales/render';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const id = siteLanguage(context.url.pathname).id as TranslatedLocale;
  if (!translatedLocales.includes(id) || !response.headers.get('Content-Type')?.includes('text/html')) return response;
  return new Response(renderLocale(await response.text(), id), {
    status: response.status, statusText: response.statusText, headers: response.headers,
  });
});
