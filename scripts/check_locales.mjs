// Verify the generated HTML, including the links search engines and script-free browsers receive.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {parse} from 'parse5';

const root = new URL('../dist/', import.meta.url);
const locales = {en:'en', zh:'zh-CN', es:'es', fr:'fr', ar:'ar'};
const xml = readFileSync(new URL('sitemap.xml', root), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
const routes = urls.map(url => url.pathname).filter(path => !/^\/(zh|es|fr|ar)\//.test(path));
const names = new Set(urls.map(url => url.href));
assert.equal(names.size, routes.length * Object.keys(locales).length);
const origin = urls[0].origin;
const pathFor = (locale, route) => (locale === 'en' ? '' : '/' + locale) + route;
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
function* elements(root) {
  if (root.tagName) yield root;
  for (const n of root.childNodes || []) yield* elements(n);
}
for (const route of routes) {
  for (const [locale, tag] of Object.entries(locales)) {
    const path = pathFor(locale, route);
    const expected = origin + path;
    const file = join(path.slice(1),'index.html');
    assert(names.has(expected), expected);
    const document = [...elements(parse(readFileSync(new URL(file, root),'utf8')))];
    const html = document.find(n => n.tagName === 'html');
    assert.equal(attr(html,'lang'),tag,path);
    assert.equal(attr(html,'dir'),locale === 'ar' ? 'rtl' : 'ltr',path);
    const links = document.filter(n => n.tagName === 'link');
    assert.equal(attr(links.find(n => attr(n,'rel') === 'canonical'),'href'),expected,path);
    const alternate = new Map(links.filter(n => attr(n,'hreflang')).map(n => [attr(n,'hreflang'),attr(n,'href')]));
    const menu = document.filter(n => n.tagName === 'a' && attr(n,'data-language-link') !== undefined);
    assert.equal(menu.length,5,path);
    assert.equal(alternate.size,6,path);
    assert.equal(alternate.get('x-default'),origin+route,path);
    for (const [other, otherTag] of Object.entries(locales)) {
      assert.equal(alternate.get(otherTag), origin + pathFor(other,route),path);
      assert.equal(attr(menu.find(n => attr(n,'hreflang') === otherTag),'href'),pathFor(other,route),path);
    }
    assert.equal(menu.filter(n => attr(n,'aria-current') === 'page').length,1,path);
    for (const node of document.filter(n => n.tagName === 'a' || n.tagName === 'form')) {
      if (attr(node,'data-language-link') !== undefined) continue;
      const href = attr(node,'href') || attr(node,'action') || '';
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const target = new URL(href,origin).pathname;
      const bare = target.replace(/^\/(zh|es|fr|ar)(?=\/)/,'');
      if (routes.includes(bare)) assert.equal(target,pathFor(locale,bare),path+' links to '+href);
    }
  }
}
for (const id of ['es','fr','ar']) assert(existsSync(new URL('locales/'+id+'.js',root)));
console.log(routes.length+' site pages × 5 languages, reciprocal alternates and language links verified.');
