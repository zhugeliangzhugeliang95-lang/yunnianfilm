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
const greens=query('有哪些绿色改色膜？').direct;
assert.ok(greens?.links.length && greens.links.every(link=>link.url.includes('/color-studio/?q=YN-')));
assert.match(query('路博润的疏水涂层有什么用？').direct.answer,/水珠/);

const onPage=(text,slug,history=[],opening=true,lang='zh')=>querySeries(text,history,catalog,lang,[],{slug,opening});
assert.match(onPage('这款多厚？','lubrizol-sm301-ppf').direct.answer,/SM301.*9\.5 mil/);
assert.equal(onPage('这款多厚？','does-not-exist').records.length,0);
assert.equal(onPage('ZZ999 这款多厚？','lubrizol-sm301-ppf').records.length,0);
assert.equal(onPage('讲个笑话','lubrizol-sm301-ppf').records.length,0);
assert.equal(onPage('我要巴斯夫的产品','lubrizol-sm301-ppf').records[0].id,'series-basf-elastollan-ppf');
const basfHistory=[{question:'我要巴斯夫的产品',answer:query('我要巴斯夫的产品').direct.answer}];
assert.match(onPage('这款多厚？','lubrizol-sm301-ppf',basfHistory,false).direct.answer,/BASF/);
assert.match(onPage('这款多厚？','lubrizol-sm301-ppf',basfHistory,true).direct.answer,/SM301/);
assert.match(onPage("What's it made of?",'lubrizol-sm301-ppf',[],true,'en').direct.answer,/aliphatic TPU/);
const useCase='想保留原车色，但不想太亮，选哪种膜？';
const recommendation=query(useCase).direct;
assert.match(recommendation.answer,/透明哑光/);
assert.equal(recommendation.links.length,2);
assert.match(query('第二款的厚度呢？',[{question:useCase,answer:recommendation.answer}]).direct.answer,/BASF/);
assert.equal(query('不想保留原车色，想要哑光改色').direct,null);
assert.equal(query('Keep the original paint, with a matte finish that resists scratches',[],'en').direct,null);
const greenHistory=[{question:'有哪些绿色改色膜？',answer:greens.answer}];
const nextCard=query('第二款是什么质感？',greenHistory).direct;
assert.equal(nextCard.links.length,1);
assert.equal(nextCard.links[0].url,greens.links[1].url);
assert.equal(query('那第一张呢？',[...greenHistory,{question:'第二款是什么质感？',answer:nextCard.answer}]).direct.links[0].url,greens.links[0].url);
const descending=[{question:'看这两张',answer:'YN-0404 / YN-0001'}];
assert.match(query('What finish is the second one?',descending,'en').direct.links[0].url,/YN-0001$/);
const angle=query('那水接触角是多少度？',history).direct;
assert.match(angle.answer,/没有列出水接触角实测值/);
assert.equal(angle.handoff,false);
assert.doesNotMatch(angle.answer,/\d+(?:\.\d+)?\s*°/);
const edited=structuredClone(catalog.products.find(p=>p.slug==='lubrizol-sm301-ppf'));
edited.specs.push(['Water contact angle','104°']);
assert.match(querySeries('SM301 的水接触角是多少度？',[],{products:[edited]},'zh').direct.answer,/104°/);

for(const [question,slug] of [
  ['Which of your films is intended for painted motorcycle bodywork?','motorcycle-ebike-protective-film'],
  ['办公室的玻璃应该选哪种膜？','architectural-window-film'],
  ['What film would you recommend for headlights?','photochromic-headlight-film'],
])assert.ok(query(question,[],/[\u4e00-\u9fff]/.test(question)?'zh':'en').direct.links[0].url.endsWith('/'+slug+'/'));
assert.equal(query('What film would you recommend for my motorcycle helmet?',[],'en').direct,null);
