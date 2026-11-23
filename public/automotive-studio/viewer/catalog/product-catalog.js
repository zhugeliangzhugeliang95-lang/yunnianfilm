import {products as sourceProducts,catalogMeta as sourceMeta} from './catalog-data.js';
import {photoProfiles} from './photo-profiles.js';
import {references} from './catalog-references.js';
import {printedNames,nameChecks} from './printed-names.js';
export const families=[
 ['green','Green','绿色','绿|翠|翡翠|橄榄|碧|green|jade|emerald|olive|mint|sage'],
 ['blue','Blue','蓝色','蓝|blue|cyan|aqua|teal'],
 ['red','Red','红色','红|red|burgundy|ruby|crimson|wine'],
 ['pink','Pink','粉色','粉|pink|rose|sakura'],
 ['purple','Purple','紫色','紫|purple|violet|lavender'],
 ['yellow','Yellow','黄色','黄|yellow|lemon'],
 ['orange','Orange','橙色','橙|橘|orange|tangerine'],
 ['gold','Gold / Bronze','金色 / 铜色','金|铜|gold|bronze|copper|champagne'],
 ['silver','Silver','银色','银|silver|aluminum|aluminium'],
 ['gray','Gray','灰色','灰|gray|grey|ash|graphite'],
 ['white','White','白色','白|white|ivory'],
 ['black','Black','黑色','黑|black|obsidian'],
 ['brown','Brown / Beige','棕色 / 米色','棕|咖|奶茶|米色|沙漠|卡其|brown|beige|khaki|sand|tan|coffee|mocha'],
];
export const products=sourceProducts.map(p=>{
 const nameEn=printedNames[p.id]||p.nameEn;
 const text=p.name+' '+nameEn;
 const explicitFinish=/\bsatin\b|缎面|柔光/i.test(text)?'Satin':/\bmatte?\b|哑|消光|磨砂|亚灰|亚光/i.test(text)?'Matte':/\bgloss(?:y)?\b|亮面|亮光|亮[曼水石]|高亮|高光/i.test(text)?'Gloss':'';
 return {...p,canPreview:p.canPreview||p.effect==='reflective'||!!photoProfiles[p.id]?.textureRegion,reference:references[p.id],nameEn,explicitFinish,nameCheck:nameChecks.includes(p.id),families:families.filter(f=>f[3].split('|').some(word=>new RegExp(/^[a-z]+$/.test(word)?'\\b'+word+'\\b':word,'i').test(text))).map(f=>f[0])};
});
export const catalogMeta={...sourceMeta,previewCount:products.filter(p=>p.canPreview).length,colorMethod:'Original photo appearance profiles; not physically calibrated',catalogRevision:'2026-11-11-photo-reference'};
export const normalize=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/[\s\-_/]/g,'');
const alias={绿:'green',绿色:'green',绿色系:'green',green:'green',greens:'green',蓝:'blue',蓝色:'blue',blue:'blue',红:'red',红色:'red',red:'red',粉:'pink',粉色:'pink',pink:'pink',紫:'purple',紫色:'purple',purple:'purple',黄:'yellow',黄色:'yellow',yellow:'yellow',橙:'orange',橙色:'orange',orange:'orange',金:'gold',金色:'gold',gold:'gold',银:'silver',银色:'silver',silver:'silver',灰:'gray',灰色:'gray',gray:'gray',grey:'gray',白:'white',白色:'white',white:'white',黑:'black',黑色:'black',black:'black',棕:'brown',棕色:'brown',brown:'brown'};
const localizedFamilies = {
 green:'verde verdes vert verts verte vertes أخضر اخضر خضراء الأخضر الاخضر', blue:'azul azules bleu bleue bleus أزرق ازرق زرقاء الأزرق',
 red:'rojo roja rojos rouge rouges أحمر احمر حمراء الأحمر', pink:'rosa rosas rose roses وردي وردية زهري',
 purple:'violeta morado púrpura violet violette mauve بنفسجي أرجواني', yellow:'amarillo amarilla jaune أصفر اصفر صفراء',
 orange:'naranja anaranjado orangé برتقالي', gold:'dorado oro bronce doré bronze cuivre ذهبي برونزي نحاسي',
 silver:'plata plateado argent argenté فضي', gray:'gris grise رمادي رصاصي',
 white:'blanco blanca blanc blanche أبيض ابيض بيضاء', black:'negro negra noir noire أسود اسود سوداء',
 brown:'marrón marron brun brune beige بني بيج',
};
for (const [family, words] of Object.entries(localizedFamilies)) {
 for (const word of words.split(' ')) alias[normalize(word)] = family;
}
export function matchesProduct(p,query='',family=''){
 if(family&&!p.families.includes(family))return false;
 const q=normalize(query);if(!q)return true;
 const word=q.replace(/^ال(?=[\u0600-\u06ff])/u,'');
 if(Object.hasOwn(alias,word))return p.families.includes(alias[word]);
 return normalize([p.reference,p.nameEn,p.name,p.sourceName].join(' ')).includes(q);
}
export const finishLabel=(p,lang='en')=>p.explicitFinish?({Gloss:['Gloss','亮面'],Matte:['Matte','哑面'],Satin:['Satin','缎面']}[p.explicitFinish][lang==='zh'?1:0]):(lang==='zh'?'以原图产品为准':'As Pictured');

export const nameCheckLabel=(lang='en')=>lang==='zh'?'请对照原图，并按编号确认产品名称。':'Confirm The Product Name Against The Original Card And Reference.';
