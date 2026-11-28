// Run against each release's actual storefront records, including newly added series and cards.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {querySeries} from '../support/series-query.mjs';
const catalog=JSON.parse(await readFile(new URL('../dist/catalog-data/base.json',import.meta.url),'utf8'));
const query=(text,history=[],lang='zh')=>querySeries(text,history,catalog,lang);
for(const product of catalog.products) {
  for(const [lang,copy] of Object.entries(product.copy)) {
    const match=query(copy.name,[],lang).records.find(row=>row.id==='series-'+product.slug);
    assert.ok(match,lang+' / '+product.slug);
    assert.deepEqual(match.tables,product.tables);
    assert.deepEqual(match.specs,product.specs);
    assert.equal(match.variants.length,product.variants.length);
  }
}
for(const color of catalog.colors) {
  const result=query(color.ref).direct;
  assert.ok(result?.links[0].url.endsWith('?q='+color.ref),color.ref);
}
const request='我要路博润的产品';
const film=query(request).direct;
assert.match(film.answer,/Lubrizol.*SM301/);
assert.equal(film.handoff,false);
assert.match(film.links[0].url,/\/zh\/products\/lubrizol-sm301-ppf\/$/);
const history=[{question:request,answer:film.answer}];
assert.match(query('8.5 mil 有哑光吗？',history).direct.answer,/8\.5 mil — 哑光/);
assert.match(query('12 mil 有哑光吗？',history).direct.answer,/没有列出/);
assert.match(query('Do you carry Lubrizol film?',[],'en').direct.answer,/substrate/);
assert.ok(query('SM-301').records.some(r=>r.id==='series-lubrizol-sm301-ppf'));
assert.match(query('那第二款呢',[{question:'比较路博润和巴斯夫',answer:''}]).direct.answer,/BASF/);
assert.equal(query('讲个笑话',history).records.length,0);
assert.equal(query('路博润的是现货吗？').direct,null);
assert.equal(query('Y999SM301X').records.length,0);
assert.match(query('VK7095HD 的透光率？').direct.answer,/VLT 65%/);
console.log('Support catalogue verified:',catalog.products.length,'series in five languages,',catalog.colors.length,'color cards');
