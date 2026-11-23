import {selectedColors,colorSummary,colorInquiryText} from './color-selection.js';
export function setupInquiryColors(form:HTMLFormElement,chinese:boolean){
 const lang=chinese?'zh':'en';let selection=selectedColors(new URLSearchParams(location.search).get('colors'));
 const box=document.querySelector<HTMLElement>('#inquiry-colors')!;
 function render(){box.hidden=!selection.length;box.querySelector('#inquiry-color-grid')!.replaceChildren(...selection.map(p=>colorSummary(p,lang)));box.querySelector('#inquiry-color-count')!.textContent=String(selection.length);}
 box.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('[data-remove-color]');if(!b)return;selection=selection.filter(p=>p.id!==b.dataset.removeColor);render();const u=new URL(location.href);if(selection.length)u.searchParams.set('colors',selection.map(p=>p.id).join(','));else u.searchParams.delete('colors');history.replaceState(null,'',u);document.querySelectorAll<HTMLAnchorElement>('[data-language-link]').forEach(a=>{const other=new URL(a.href);if(selection.length)other.searchParams.set('colors',selection.map(p=>p.id).join(','));else other.searchParams.delete('colors');a.href=other.toString();});form.dispatchEvent(new Event('input'));if(selection.length)box.querySelector<HTMLButtonElement>('[data-remove-color]')?.focus();else (form.elements.namedItem('name') as HTMLInputElement).focus();});
 render();return ()=>colorInquiryText(selection.map(p=>p.id),lang);
}
