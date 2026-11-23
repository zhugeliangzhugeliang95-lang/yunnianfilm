import present from './zh.json';
import migrated from './catalog-translations.json';
const zh: Record<string,string> = { ...migrated, ...present };
export type Language = 'en' | 'zh';
export const translate = (lang: Language, value: string): string => lang === 'zh' ? (zh as Record<string, string>)[value] ?? value : value;
export const canonicalValue = (value: string): string => Object.entries(zh).find(([, translated]) => translated === value)?.[0] ?? value;
