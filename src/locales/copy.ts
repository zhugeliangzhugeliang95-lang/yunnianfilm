import es from './data/es.json';
import fr from './data/fr.json';
import ar from './data/ar.json';
import type {TranslatedLocale} from './languages';
export const copy: Record<TranslatedLocale, Record<string, string>> = {es, fr, ar};
export function textIn(value: string, locale: TranslatedLocale): string {
  const key = value.trim().replace(/\s+/g, ' ');
  const dictionary = copy[locale];
  if (Object.hasOwn(dictionary, key)) {
    return value.replace(/\S[\s\S]*\S|\S/, () => dictionary[key]);
  }
  const title = key.match(/^(.*?) \| YUNNIAN$/);
  if (title) return textIn(title[1], locale) + ' | YUNNIAN';
  const card = key.match(/^View Color Card: (YN-\d+ .+)$/);
  if (card) return textIn('View Card', locale) + ' · ' + card[1];
  return value;
}
