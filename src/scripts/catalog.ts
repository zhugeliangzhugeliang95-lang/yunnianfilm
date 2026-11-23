const chinese=document.documentElement.lang==='zh-CN';
const L=(en:string,zh:string)=>chinese?zh:en;
type Film={slug:string;name:string;image:string;category:string;materials:string;specs:string[][];optionLabels:string[]};
const films:Film[]=JSON.parse(document.querySelector('#catalog-data')!.textContent!);
const base=chinese?'/zh':'';
const input=document.querySelector<HTMLInputElement>('#product-search')!;
const finish=document.querySelector<HTMLSelectElement>('#finish-filter')!;
const thickness=document.querySelector<HTMLSelectElement>('#thickness-filter')!;
const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
const cards=Array.from(document.querySelectorAll<HTMLElement>('.catalog-grid .product'));
let active='All films';let selected:string[]=[];
const dialog=document.querySelector<HTMLDialogElement>('#comparison-dialog')!;
function languageLinks(url:URL){document.querySelectorAll<HTMLAnchorElement>('[data-language-link]').forEach(a=>{const destination=new URL(a.href);destination.search=url.search;a.href=destination.toString();});}
function syncUrl(){const url=new URL(location.href);for(const [key,value] of Object.entries({category:active==='All films'?'':active,q:input.value.trim(),finish:finish.value,thickness:thickness.value,compare:selected.join(',')})){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState(null,'',url);languageLinks(url);}
function filter(){
 let count=0;const terms=input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 cards.forEach(p=>{const match=(active==='All films'||p.dataset.category===active||(active==='Specialty films'&&['Headlight films','Windshield protection'].includes(p.dataset.category||'')))&&terms.every(q=>(p.dataset.search||'').includes(q))&&(!finish.value||(p.dataset.finishes||'').split(' ').includes(finish.value))&&(!thickness.value||(p.dataset.thickness||'').split(' ').includes(thickness.value));p.hidden=!match;if(match)count++;});
 document.querySelectorAll<HTMLElement>('[data-category-context]').forEach(el=>el.hidden=el.dataset.categoryContext!==(active==='Specialty films'?'All films':active));
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===active)));
 document.querySelector('#result-count')!.textContent=L(`${count} of ${films.length} series`,`${films.length} 个系列中，找到 ${count} 个`);
 document.querySelector<HTMLElement>('#empty-state')!.hidden=count>0;
 document.querySelector<HTMLButtonElement>('#reset-filters')!.disabled=active==='All films'&&!input.value&&!finish.value&&!thickness.value;
}
function readUrl(){const params=new URLSearchParams(location.search);const category=params.get('category');active=category==='Specialty films'?'Specialty films':buttons.some(b=>b.dataset.filter===category)?category!:'All films';input.value=(params.get('q')||'').slice(0,100);for(const [select,key] of [[finish,'finish'],[thickness,'thickness']] as const){const value=params.get(key)||'';select.value=[...select.options].some(o=>o.value===value)?value:'';}selected=[...new Set((params.get('compare')||'').split(','))].filter(s=>films.some(p=>p.slug===s)).slice(0,3);filter();updateSelection();languageLinks(new URL(location.href));}
function updateSelection(){document.querySelectorAll<HTMLButtonElement>('[data-compare]').forEach(b=>{const on=selected.includes(b.dataset.compare!);const name=films.find(p=>p.slug===b.dataset.compare)!.name;b.setAttribute('aria-pressed',String(on));b.disabled=!on&&selected.length===3;b.setAttribute('aria-label',on?L(`Remove ${name} from comparison`,`从对比中移除${name}`):L(`Add ${name} to comparison`,`将${name}加入对比`));b.querySelector('[data-compare-label]')!.textContent=on?L('Selected','已加入'):L('Compare film','加入对比');b.querySelector('span')!.textContent=on?'✓':'＋';});document.querySelector<HTMLElement>('#comparison-tray')!.hidden=selected.length===0;document.body.classList.toggle('has-comparison',selected.length>0);document.querySelector('#selection-summary')!.textContent=selected.length===1?L('1 selected · choose one more','已选 1 款 · 再选一款开始对比'):L(`${selected.length} selected · up to 3`, `已选 ${selected.length} 款 · 最多 3 款`);document.querySelector<HTMLButtonElement>('#open-comparison')!.disabled=selected.length<2;}
buttons.forEach(b=>b.addEventListener('click',()=>{active=b.dataset.filter!;input.value='';finish.value='';thickness.value='';filter();syncUrl();}));
[input,finish,thickness].forEach(el=>el.addEventListener(el===input?'input':'change',()=>{filter();syncUrl();}));
function reset(){active='All films';input.value='';finish.value='';thickness.value='';filter();syncUrl();input.focus();}
document.querySelector('#reset-filters')?.addEventListener('click',reset);document.querySelector('#empty-reset')?.addEventListener('click',reset);
document.querySelectorAll<HTMLButtonElement>('[data-compare]').forEach(b=>b.addEventListener('click',()=>{const slug=b.dataset.compare!;selected=selected.includes(slug)?selected.filter(s=>s!==slug):[...selected,slug].slice(0,3);updateSelection();syncUrl();}));
document.querySelector('#clear-comparison')?.addEventListener('click',()=>{selected=[];updateSelection();syncUrl();document.querySelector<HTMLButtonElement>('[data-compare]')?.focus();});
function cell(tag:string,text:string){const node=document.createElement(tag);node.textContent=text;return node;}
function showComparison(){const chosen=selected.map(s=>films.find(p=>p.slug===s)!);const table=document.querySelector('#comparison-table')!;table.replaceChildren();const head=document.createElement('thead');const row=document.createElement('tr');row.append(cell('th',L('Compare by','对比项目')));chosen.forEach(p=>{const th=document.createElement('th');th.scope='col';const img=document.createElement(p.image?'img':'span');if(img instanceof HTMLImageElement){img.src='/images/'+p.image;img.alt=p.name;}else{img.className='compare-series-label';img.textContent=L('SERIES PROFILE','系列资料');}const link=document.createElement('a');link.href=base+'/products/'+p.slug+'/';link.textContent=p.name+' ↗';th.append(img,link);row.append(th);});head.append(row);table.append(head);const body=document.createElement('tbody');const spec=(p:Film,keys:string[])=>p.specs.find(([k])=>keys.includes(k))?.[1]||L('Confirm with your quote','询价时确认');const rows:[string,(p:Film)=>string][]=[
 [L('Film family','产品类别'),p=>p.category],[L('Material','基材'),p=>p.materials],
 [L('Listed thickness','标示厚度'),p=>spec(p,['Thickness','Listed thickness','厚度','标示厚度'])],
 [L('Roll format','卷材规格'),p=>spec(p,['Roll size','卷材规格'])],
 [L('Application','应用部位'),p=>spec(p,['Application','应用范围'])],
 [L('Finish / coating','质感 / 涂层'),p=>spec(p,['Finish','Finishes','Topcoat','Coating options','Coating','Appearance','质感','表面质感','表面涂层','涂层选项','涂层','外观'])],
 [L('Sample options','样品选项'),p=>p.optionLabels.slice(0,4).join(' / ')]
 ];rows.forEach(([name,get])=>{const tr=document.createElement('tr');const th=cell('th',name);th.setAttribute('scope','row');tr.append(th);chosen.forEach(p=>tr.append(cell('td',get(p))));body.append(tr);});table.append(body);document.querySelector<HTMLAnchorElement>('#compare-samples')!.href=base+'/contact/?'+new URLSearchParams({intent:'Sample request',selection:selected.join(',')});dialog.showModal();document.body.classList.add('comparison-open');}
document.querySelector('#open-comparison')?.addEventListener('click',showComparison);document.querySelector('#close-comparison')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{document.body.classList.remove('comparison-open');document.querySelector<HTMLButtonElement>('#open-comparison')?.focus();});addEventListener('popstate',readUrl);readUrl();
