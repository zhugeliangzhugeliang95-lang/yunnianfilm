import {pageLocale, localePrefix, ui} from '../../public/locales/runtime.js';
import {MAX_COLORS,SELECTION_KEY,selectedColors,readColors,writeColors,colorInquiryUrl,colorSummary} from './color-selection.js';
const root=document.querySelector<HTMLElement>('[data-existing-colors]');
if(root){
 const lang=pageLocale(),z=lang==='zh';let selection=readColors(),trigger:HTMLElement|null=null;
 const dialog=root.querySelector<HTMLDialogElement>('#shortlist-dialog')!,status=root.querySelector<HTMLElement>('#shortlist-status')!;
 function render(){
  const ids=selection.map(p=>p.id);
  root!.querySelectorAll('[data-shortlist-count]').forEach(el=>el.textContent=String(ids.length));
  root!.querySelectorAll<HTMLButtonElement>('[data-save-color]').forEach(b=>{const saved=ids.includes(b.dataset.saveColor);b.setAttribute('aria-pressed',String(saved));b.textContent=saved?(z?'✓ 已加入':ui('✓ Saved')):(z?'+ 加入清单':ui('+ Save color'));});
  const thumbs=root!.querySelector('#shortlist-thumbnails')!;thumbs.replaceChildren(...selection.map(p=>{const img=document.createElement('img');img.src='/automotive-studio/viewer/'+p.thumbnail;img.alt='';return img;}));
  root!.querySelector('#shortlist-grid')!.replaceChildren(...selection.map(p=>colorSummary(p,lang)));
  root!.querySelector<HTMLElement>('#shortlist-tray')!.hidden=!ids.length;
  root!.querySelector<HTMLElement>('#shortlist-empty')!.hidden=!!ids.length;
  root!.querySelector<HTMLElement>('#shortlist-clear')!.hidden=!ids.length;
  document.body.classList.toggle('has-color-shortlist',!!ids.length);
  root!.querySelectorAll<HTMLAnchorElement>('[data-shortlist-inquiry]').forEach(a=>{a.href=colorInquiryUrl(ids,lang);a.hidden=!ids.length;});
 }
 function persist(){const saved=writeColors(selection.map(p=>p.id));if(!saved)root!.querySelector('#shortlist-storage')!.textContent=z?'浏览器未允许保存；本页仍可对比并询价。':ui('Browser storage is unavailable. You can still compare and enquire on this page.');render();}
 root.addEventListener('click',e=>{
  const target=(e.target as Element).closest<HTMLElement>('[data-save-color],[data-remove-color],[data-open-shortlist]');if(!target)return;
  if(target.hasAttribute('data-open-shortlist')){trigger=target;render();dialog.showModal();return;}
  const id=target.dataset.saveColor||target.dataset.removeColor;
  const exists=selection.some(p=>p.id===id);
  if(exists){selection=selection.filter(p=>p.id!==id);status.textContent=z?'已从清单移除。':ui('Color removed from your shortlist.');}
  else if(selection.length>=MAX_COLORS){status.textContent=z?'清单已保留 6 款颜色，请先移除一款再添加。':ui('Your shortlist holds 6 colors. Remove one before adding another.');return;}
  else{selection=selectedColors([...selection.map(p=>p.id),id]);status.textContent=z?'已加入选色清单，可继续选色或一起询问样品。':ui('Color saved. Continue browsing or enquire about your selected samples.');}
  persist();
  if(target.dataset.removeColor)dialog.querySelector<HTMLButtonElement>('[data-remove-color]')?.focus();
 });
 root.querySelector('#shortlist-close')!.addEventListener('click',()=>dialog.close());
 root.querySelector('#shortlist-browse')!.addEventListener('click',()=>dialog.close());
 root.querySelector('#shortlist-clear')!.addEventListener('click',()=>{selection=[];persist();status.textContent=z?'选色清单已清空。':ui('Shortlist cleared.');root.querySelector<HTMLButtonElement>('#shortlist-browse')!.focus();});
 dialog.addEventListener('close',()=>{if(trigger&&!trigger.closest('[hidden]'))trigger.focus();else root!.querySelector<HTMLButtonElement>('.shortlist-open')!.focus();});
 window.addEventListener('storage',e=>{if(e.key===SELECTION_KEY||e.key===null){selection=readColors();render();}});
 root.addEventListener('color-card-open',render);
 render();
}
