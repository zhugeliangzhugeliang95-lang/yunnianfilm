import {pageLocale, localePrefix, ui} from '../../public/locales/runtime.js';
import {products,colorName,matchesProduct,finishLabel} from '../../public/automotive-studio/viewer/catalog/product-catalog.js';
const root=document.querySelector<HTMLElement>('[data-existing-colors]');
if(root){
 const z=root.dataset.lang==='zh',base='/automotive-studio/viewer/';
 const search=root.querySelector<HTMLInputElement>('#color-product-search')!,family=root.querySelector<HTMLSelectElement>('#color-family')!,more=root.querySelector<HTMLButtonElement>('#color-show-more')!,dialog=root.querySelector<HTMLDialogElement>('#color-card-dialog')!;
 const cards=[...root.querySelectorAll<HTMLElement>('[data-color-product]')];const byId=new Map(products.map(p=>[p.id,p]));let limit=48,lastTrigger:HTMLElement|null=null;
 const params=new URLSearchParams(location.search);search.value=(params.get('q')||'').slice(0,100);family.value=params.get('family')||'';
 function update(reset=false){if(reset)limit=48;const matching=products.filter(p=>matchesProduct(p,search.value,family.value));const ids=new Set(matching.slice(0,limit).map(p=>p.id));cards.forEach(c=>c.hidden=!ids.has(c.dataset.colorProduct));root!.querySelector('#color-result-count')!.textContent=z?`${matching.length} 款现有产品颜色`:ui('{count} Existing Product Colors',{count:matching.length});root!.querySelector<HTMLElement>('#color-no-results')!.hidden=matching.length>0;more.hidden=matching.length<=limit;more.textContent=z?`查看更多 · 已显示 ${Math.min(limit,matching.length)} / ${matching.length}`:ui('View More · {shown} / {total}',{shown:Math.min(limit,matching.length),total:matching.length});const u=new URL(location.href);for(const [k,v]of [['q',search.value.trim()],['family',family.value]]){if(v)u.searchParams.set(k,v);else u.searchParams.delete(k);}history.replaceState(null,'',u);document.querySelectorAll<HTMLAnchorElement>('[data-language-link]').forEach(a=>{const other=new URL(a.href);other.search=u.search;a.href=other.toString();});}
 search.addEventListener('input',()=>update(true));family.addEventListener('change',()=>update(true));more.addEventListener('click',()=>{limit+=48;update();});root.querySelector('#color-reset')!.addEventListener('click',()=>{search.value='';family.value='';update(true);search.focus();});
 root.querySelectorAll<HTMLButtonElement>('[data-view-card]').forEach(button => button.addEventListener('click', () => {
  const p = byId.get(button.dataset.viewCard!)!;
  const lang = pageLocale();
  const name = colorName(p,lang);
  lastTrigger = button;
  root.querySelector('#color-card-reference')!.textContent = p.reference;
  root.querySelector('#color-card-title')!.textContent = name;
  root.querySelector('#color-card-english bdi')!.textContent = p.nameEn;
  root.querySelector<HTMLElement>('#color-card-english')!.hidden = name === p.nameEn;
  const image = root.querySelector<HTMLImageElement>('#color-card-image')!;
  image.src = base + p.card;
  image.alt = name;
  root.querySelector('#color-card-finish')!.textContent = ui(finishLabel(p,lang));
  root.querySelector<HTMLElement>('#color-card-name-check')!.hidden = !p.nameCheck;
  root.querySelector<HTMLAnchorElement>('#color-card-order')!.href = localePrefix(lang)+'/contact/?'+new URLSearchParams({product:'TPU Color PPF · Color Catalog',colors:p.id,intent:'Wholesale quote'});
  const model = root.querySelector<HTMLAnchorElement>('#color-card-model')!;
  model.hidden = !p.canPreview;
  model.dataset.previewProduct = p.id;
  model.href = base+'?'+new URLSearchParams({lang,card:p.id});
  root.querySelector<HTMLButtonElement>('#color-card-save')!.dataset.saveColor = p.id;
  root.dispatchEvent(new Event('color-card-open'));
  dialog.showModal();
 }));
 const vehicle=root.querySelector<HTMLDialogElement>('#color-vehicle-dialog')!,frame=root.querySelector<HTMLIFrameElement>('#color-vehicle-frame')!;let activeProduct:any=null,vehicleTrigger:HTMLElement|null=null,pendingCard='';
 const sendSelection=()=>{if(!activeProduct)return;frame.contentWindow?.postMessage({type:'yunnian-select-product',card:activeProduct.id},location.origin);frame.contentWindow?.postMessage({type:'yunnian-studio-visibility',visible:vehicle.open&&!document.hidden},location.origin);};
 function updateVehicleHeading(p:any){root!.querySelector('#color-vehicle-title')!.textContent=p.reference+' · '+colorName(p,pageLocale());root!.querySelector<HTMLAnchorElement>('#color-vehicle-full')!.href=base+'?'+new URLSearchParams({lang:pageLocale(),card:p.id});}
 root.querySelectorAll<HTMLAnchorElement>('[data-preview-product]').forEach(a=>a.addEventListener('click',e=>{const p=byId.get(a.dataset.previewProduct!);if(!p?.canPreview)return;e.preventDefault();vehicleTrigger=a;activeProduct=p;pendingCard=p.id;if(dialog.open)dialog.close();updateVehicleHeading(p);vehicle.showModal();if(!frame.getAttribute('src'))frame.src=base+'?'+new URLSearchParams({lang:pageLocale(),card:p.id,embed:'catalog'});else sendSelection();}));
 frame.addEventListener('load',sendSelection);
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;if(e.data?.type==='yunnian-studio-ready')sendSelection();if(e.data?.type==='yunnian-close-preview')vehicle.close();if(e.data?.type==='yunnian-studio-selection'){if(pendingCard&&e.data.card!==pendingCard)return;const p=byId.get(e.data.card);if(p?.canPreview){pendingCard='';activeProduct=p;updateVehicleHeading(p);}}});
 root.querySelector('#color-vehicle-close')!.addEventListener('click',()=>vehicle.close());vehicle.addEventListener('close',()=>{frame.contentWindow?.postMessage({type:'yunnian-studio-visibility',visible:false},location.origin);if(vehicleTrigger?.isConnected&&!vehicleTrigger.closest('dialog:not([open])'))vehicleTrigger.focus();else lastTrigger?.focus();});
 document.addEventListener('visibilitychange',()=>frame.contentWindow?.postMessage({type:'yunnian-studio-visibility',visible:vehicle.open&&!document.hidden},location.origin));
 root.querySelector('#color-card-close')!.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>lastTrigger?.focus());update();
}
