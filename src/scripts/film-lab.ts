import {pageLocale, localePrefix, ui} from '../../public/locales/runtime.js';
const root=document.querySelector<HTMLElement>('[data-film-lab]');
if(root){
 const z=root.dataset.lang==='zh';const L=(en:string,zh:string)=>z?zh:ui(en);
 const modes=['tpu-color','ppf','window','pet-color'];const params=new URLSearchParams(location.search);
 const mode=modes.includes(params.get('lab')||'')?params.get('lab')!:root.dataset.initialMode||'tpu-color';
 const state={mode,card:/^[a-f0-9]{12}$/.test(params.get('card')||'')?params.get('card')!:'',color:'',finish:'gloss',explode:65,layer:2,uv:95,vlt:70,tser:45,rotate:false};
 let api:any;let starting=false;let inView=false;let loadedMaterial='';
 const canvas=root.querySelector<HTMLElement>('[data-lab-canvas]')!;
 const frame=root.querySelector<HTMLIFrameElement>('[data-studio-frame]')!;
 const colorStudio=root.querySelector<HTMLElement>('[data-color-studio]')!;
 const materialStudio=root.querySelector<HTMLElement>('[data-material-workspace]')!;
 const tabs=[...root.querySelectorAll<HTMLButtonElement>('[data-lab-mode]')];
 function colorMode(){return state.mode==='tpu-color';}
 function studioUrl(){const q=new URLSearchParams({lang:pageLocale()});if(state.card)q.set('card',state.card);return '/automotive-studio/viewer/?'+q;}
 function updateUrl(){const u=new URL(location.href);u.searchParams.set('lab',state.mode);u.searchParams.delete('color');u.searchParams.delete('finish');if(colorMode()&&state.card)u.searchParams.set('card',state.card);else u.searchParams.delete('card');history.replaceState(null,'',u);document.querySelectorAll<HTMLAnchorElement>('[data-language-link]').forEach(a=>{const x=new URL(a.href);x.search=u.search;a.href=x.toString();});}
 function visibility(){const visible=inView&&!document.hidden;api?.visible(visible&&!colorMode()&&state.mode!=='pet-color');frame.contentWindow?.postMessage({type:'yunnian-studio-visibility',visible:visible&&colorMode()},location.origin);}
 function update(){
  root.dataset.mode=state.mode;
  tabs.forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.labMode===state.mode));b.tabIndex=b.dataset.labMode===state.mode?0:-1;});
  root.querySelector('#lab-stage-panel')!.setAttribute('aria-labelledby','lab-tab-'+state.mode);
  colorStudio.hidden=!colorMode();materialStudio.hidden=colorMode()||state.mode==='pet-color';root.querySelector<HTMLElement>('[data-pet-product]')!.hidden=state.mode!=='pet-color';
  (root.querySelector('[data-open-studio]') as HTMLAnchorElement).href=studioUrl();
  root.querySelectorAll<HTMLElement>('[data-lab-controls]').forEach(p=>p.hidden=p.dataset.labControls!==state.mode);
  root.querySelector('[data-lab-scene-label]')!.textContent=ui(state.mode==='window'?'PET / SOLAR CONTROL':'TPU / LAYERS');
  root.querySelector('[data-explode-output]')!.textContent=state.explode+'%';
  root.querySelectorAll<HTMLButtonElement>('[data-lab-layer]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.labLayer)===state.layer)));
  root.querySelectorAll<HTMLElement>('[data-lab-layer-note]').forEach(p=>p.hidden=Number(p.dataset.labLayerNote)!==state.layer);
  for(const k of ['uv','vlt','tser'] as const)root.querySelector(`[data-optical-output="${k}"]`)!.textContent=state[k]+'%';
  root.querySelector('[data-uv-result]')!.textContent=z ? `每 100 份入射 UV：阻隔 ${state.uv} 份，透过 ${100-state.uv} 份。` : ui('For every 100 UV units: {blocked} blocked, {through} transmitted.',{blocked:state.uv,through:100-state.uv});
  root.querySelector('[data-lab-rotate]')!.setAttribute('aria-pressed',String(state.rotate));
  if(!colorMode())api?.update({...state,color:state.color||'#1d4038'});
  visibility();
 }
 async function start(){
  if(state.mode==='pet-color')return;
  if(colorMode()){
   const material=state.mode==='pet-color'?'pet':'tpu';
   if(loadedMaterial!==material){frame.src=studioUrl();loadedMaterial=material;}
   visibility();return;
  }
  if(api||starting)return;starting=true;
  try{const {createFilmStudio}=await import('./film-studio');api=createFilmStudio(canvas,{...state,color:state.color||'#1d4038'},(layer:number)=>{state.layer=layer;update();});root.classList.add('lab-ready');root.querySelector<HTMLElement>('.lab-loading')!.hidden=true;root.querySelector('[data-lab-status]')!.textContent=L('3D ready','3D 已就绪');visibility();}
  catch{root.querySelector('[data-lab-status]')!.textContent=L('3D is unavailable on this device. You can still use the selection controls.','当前设备暂无法显示 3D，仍可使用旁边的选型控件。');root.querySelector<HTMLButtonElement>('[data-lab-retry]')!.hidden=false;}
  finally{starting=false;}
 }
 frame.addEventListener('load',visibility);
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='yunnian-studio-selection'||!colorMode())return;const {color,finish,card}=e.data;if(!/^#[0-9a-f]{6}$/i.test(color)||!['gloss','satin','matte'].includes(finish))return;state.color=color;state.finish=finish;state.card=/^[a-f0-9]{12}$/.test(card||'')?card:'';(root.querySelector('[data-open-studio]') as HTMLAnchorElement).href=studioUrl();updateUrl();});
 tabs.forEach(b=>{b.addEventListener('click',()=>{state.mode=b.dataset.labMode!;state.rotate=false;update();updateUrl();start();});b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=tabs.indexOf(b);const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].focus();tabs[n].click();});});
 root.querySelector<HTMLInputElement>('#lab-explode')!.addEventListener('input',e=>{state.explode=Number((e.target as HTMLInputElement).value);update();});
 root.querySelectorAll<HTMLButtonElement>('[data-lab-layer]').forEach(b=>b.addEventListener('click',()=>{state.layer=Number(b.dataset.labLayer);update();}));
 root.querySelectorAll<HTMLInputElement>('[data-optical]').forEach(i=>i.addEventListener('input',()=>{state[i.dataset.optical as 'uv'|'vlt'|'tser']=Number(i.value);update();}));
 root.querySelectorAll<HTMLButtonElement>('[data-lab-view]').forEach(b=>b.addEventListener('click',()=>api?.view(b.dataset.labView)));
 root.querySelector('[data-lab-rotate]')!.addEventListener('click',()=>{state.rotate=!state.rotate;update();});
 root.querySelector('[data-lab-retry]')!.addEventListener('click',start);
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();api?.nudge(e.key);}});
 const observer=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);if(inView)start();visibility();},{rootMargin:'160px'});observer.observe(root.querySelector('#lab-stage-panel')!);
 document.addEventListener('visibilitychange',visibility);update();
}
