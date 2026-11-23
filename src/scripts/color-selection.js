import {products,finishLabel} from '../../public/automotive-studio/viewer/catalog/product-catalog.js';

export const MAX_COLORS=6;
export const SELECTION_KEY='yunnian-color-shortlist-v1';
const byId=new Map(products.map(p=>[p.id,p]));
export function selectedColors(value){
 const ids=Array.isArray(value)?value:typeof value==='string'?value.split(','):[];
 return [...new Set(ids)].filter(id=>typeof id==='string'&&byId.has(id)).slice(0,MAX_COLORS).map(id=>byId.get(id));
}
export function colorInquiryUrl(value,lang='en',intent='Sample request'){
 return (lang==='zh'?'/zh':'')+'/contact/?'+new URLSearchParams({product:'TPU Color PPF · Color Catalog',intent,colors:selectedColors(value).map(p=>p.id).join(',')});
}
export function colorInquiryText(value,lang='en'){
 const colors=selectedColors(value);if(!colors.length)return '';
 return (lang==='zh'?'所选现有颜色（网站目录编号）：':'Selected existing colors (website catalog references):')+'\n'+colors.map(p=>`• ${p.reference} / ${p.nameEn} / ${finishLabel(p,lang)}`).join('\n');
}
export function readColors(){try{return selectedColors(JSON.parse(localStorage.getItem(SELECTION_KEY)||'[]'));}catch{return [];}}
export function writeColors(value){try{localStorage.setItem(SELECTION_KEY,JSON.stringify(selectedColors(value).map(p=>p.id)));return true;}catch{return false;}}

// Reuse original photographs and catalogue text; no synthetic color or finish choices.
export function colorSummary(p,lang='en'){
 const z=lang==='zh',article=document.createElement('article');article.className='selected-color';
 const img=document.createElement('img');img.src='/automotive-studio/viewer/'+p.card;img.alt=p.nameEn;img.width=424;img.height=240;
 const copy=document.createElement('div'),ref=document.createElement('span'),name=document.createElement('h3'),finish=document.createElement('p'),remove=document.createElement('button');
 ref.className='selected-reference';ref.textContent=p.reference;name.textContent=p.nameEn;finish.textContent=finishLabel(p,lang);
 remove.type='button';remove.dataset.removeColor=p.id;remove.textContent=z?'移除':'Remove';remove.setAttribute('aria-label',(z?'移除 ':'Remove ')+p.reference+' '+p.nameEn);
 copy.append(ref,name,finish,remove);article.append(img,copy);return article;
}
