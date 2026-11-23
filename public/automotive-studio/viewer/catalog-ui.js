import {families,matchesProduct,finishLabel} from './catalog/product-catalog.js';
import {appearanceNote} from './photo-appearance.js';
import {settings} from './site-integration.js';
export const effectLabels={solid:'基础色 / 未注明',metallic:'金属',pearl:'珠光 / 闪粉',chrome:'电镀',shift:'变色 / 幻彩',carbon:'碳纤 / 纹理',reflective:'反光'};
export function setupCatalogue({products,meta,onSelect,getSelected}){
 const dialog=document.querySelector('#catalog-dialog'),detail=document.querySelector('#card-dialog');
 const grid=document.querySelector('#catalog-grid'),search=document.querySelector('#catalog-search'),effect=document.querySelector('#catalog-effect'),family=document.querySelector('#catalog-family'),more=document.querySelector('#catalog-more');
 const byId=new Map(products.map(p=>[p.id,p]));let limit=36,shown=[],detailProduct=null;
 for(const f of families){const option=document.createElement('option');option.value=f[0];option.textContent=f[settings.lang==='zh'?2:1];family.append(option);}
 const ordered=[...products].sort((a,b)=>a.nameEn.localeCompare(b.nameEn,'en'));
 for(const [value,label]of Object.entries(effectLabels)){const o=document.createElement('option');o.value=value;o.textContent=label+' · '+products.filter(p=>p.effect===value).length;effect.append(o);}
 function draw(reset=false){
  if(reset){limit=36;document.querySelector('.catalog-content').scrollTop=0;}
  const q=search.value.trim().toLocaleLowerCase().replace(/\s/g,'');shown=ordered.filter(p=>matchesProduct(p,search.value,family.value)&&(!effect.value||p.effect===effect.value));
  grid.replaceChildren();const fragment=document.createDocumentFragment();
  for(const p of shown.slice(0,limit)){
   const card=document.createElement('article');card.className='catalog-item';if(getSelected()?.id===p.id)card.classList.add('is-selected');
   const choose=document.createElement('button');choose.className='catalog-choose';choose.dataset.choose=p.id;choose.setAttribute('aria-label',p.nameEn+(p.canPreview?'，应用基础色预览':'，查看原始色卡'));
   const photo=document.createElement('img');photo.src=p.thumbnail;photo.loading='lazy';photo.decoding='async';photo.alt=p.nameEn+' 原始色卡';photo.width=424;photo.height=240;
   const name=document.createElement('span');name.className='catalog-name';name.textContent=p.reference+' · '+p.nameEn;
   const info=document.createElement('span');info.className='catalog-kind';info.textContent=finishLabel(p,settings.lang);
   choose.append(photo,name,info);const view=document.createElement('button');view.className='card-original';view.dataset.detail=p.id;view.textContent='查看原图 ↗';view.setAttribute('aria-label','查看 '+p.nameEn+' 原始色卡');card.append(choose,view);fragment.append(card);
  }
  grid.append(fragment);document.querySelector('#catalog-count').textContent=shown.length+' 张色卡';document.querySelector('#catalog-empty').hidden=shown.length!==0;
  more.hidden=shown.length<=limit;more.textContent='继续浏览 · 已显示 '+Math.min(limit,shown.length)+' / '+shown.length;
 }
 function viewProduct(p){if(!p)return;detailProduct=p;document.querySelector('#card-title').textContent=p.reference+' · '+p.nameEn;const img=document.querySelector('#card-image');img.src=p.card;img.alt=p.nameEn+' 原始色卡';document.querySelector('#card-filename').textContent=p.reference+' · '+finishLabel(p,settings.lang);document.querySelector('#card-origin').href=p.sourceUrl;document.querySelector('#card-tag').textContent=effectLabels[p.effect];document.querySelector('#card-apply').disabled=!p.canPreview;document.querySelector('#card-apply').textContent=p.canPreview?'查看车身示意':'此效果暂仅支持查看原图';document.querySelector('#card-note').textContent=p.canPreview?appearanceNote(p,settings.lang):(settings.lang==='zh'?'原图纹理不清晰，暂不生成车身效果；请对照实物。':'The Source Texture Is Unclear. A Vehicle Preview Is Unavailable; Confirm With A Physical Sample.');document.querySelector('#card-order').href=(settings.lang==='en'?'':'/'+settings.lang)+'/contact/?'+new URLSearchParams({product:'TPU Color PPF · Color Catalog',colors:p.id,intent:'Wholesale quote'});if(!detail.open)detail.showModal();}
 function select(p){if(!p.canPreview){viewProduct(p);return;}onSelect(p);if(detail.open)detail.close();if(dialog.open)dialog.close();}
 document.querySelector('#open-catalog').addEventListener('click',()=>{draw();dialog.showModal();search.focus();});
 document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.closeDialog).close()));
 for(const modal of [dialog,detail])modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
 search.addEventListener('input',()=>draw(true));effect.addEventListener('change',()=>draw(true));family.addEventListener('change',()=>draw(true));more.addEventListener('click',()=>{limit+=36;draw();});
 document.querySelector('#catalog-reset').addEventListener('click',()=>{search.value='';effect.value='';family.value='';draw(true);search.focus();});
 grid.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.choose)select(byId.get(b.dataset.choose));if(b?.dataset.detail)viewProduct(byId.get(b.dataset.detail));});
 document.querySelector('#card-apply').addEventListener('click',()=>{if(detailProduct?.canPreview)select(detailProduct);});
 document.querySelector('#view-source').addEventListener('click',()=>viewProduct(getSelected()));document.querySelector('#open-reference-photo').addEventListener('click',()=>viewProduct(getSelected()));
 document.querySelector('#catalog-total').textContent=meta.count;document.querySelector('#library-summary').textContent=meta.count+' 张色卡 · '+meta.previewCount+' 张可试基础色';
 return {viewProduct};
}
