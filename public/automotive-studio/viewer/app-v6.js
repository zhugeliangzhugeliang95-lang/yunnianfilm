import {settings,translateUI,t,sendSelection,isActive} from './site-integration.js';
import * as THREE from 'three';
import {usePhotoProduct,appearanceNote} from './photo-appearance.js';
import {products,colorName as catalogColorName,colorOrderName,catalogMeta} from './catalog/product-catalog.js';
import {setupCatalogue} from './catalog-ui.js';
import {OrbitControls} from './controls/OrbitControls.js';
import {GLTFLoader} from './loaders/GLTFLoader.js';
import {buildStudio,refineMaterials} from './studio-v5.js';
import {materialProfile,applyMaterialProfile} from './film-material.js';
import {createFilmSample} from './film-geometry.js';
import {EffectComposer} from './postprocessing/EffectComposer.js';
import {RenderPass} from './postprocessing/RenderPass.js';
import {GTAOPass} from './postprocessing/GTAOPass.js';
import {ShaderPass} from './postprocessing/ShaderPass.js';
import {FXAAShader} from './shaders/FXAAShader.js';
import {OutputPass} from './postprocessing/OutputPass.js';
const viewport=document.querySelector('#viewport'),loading=document.querySelector('#loading'),save=document.querySelector('#save'),status=document.querySelector('#status');
const palette=['酸性绿','珍珠白','法拉利红','液态金属古铜'].map(name=>products.find(p=>p.name===name)).filter(Boolean);
let currentProduct=palette[0],recent=[...palette],currentProfile=materialProfile(palette[0]);

let lightingPreference=null;
let renderer,scene,camera,controls,studio,composer,ao,fxaa,current='car',vehicle='car',finish='Gloss',hex=palette[0].hex,colorName=catalogColorName(palette[0],settings.lang),modelMap={},paint=[],ready=false,targetColor=new THREE.Color(hex),lastTime=0,viewMotion=null,needsRender=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function pressed(selector,key,value){document.querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[key]===value)));}
function notifySelection(){sendSelection({hex,finish,name:colorOrderName(currentProduct,settings.lang),sourceName:currentProduct?.sourceName||'',id:currentProduct?.id||'',reference:currentProduct?.reference||''});}
function renderQuick(){const box=document.querySelector('#colors');box.replaceChildren();for(const p of recent){const b=document.createElement('button');b.dataset.product=p.id;b.setAttribute('aria-label',p.reference+' '+catalogColorName(p,settings.lang));b.setAttribute('aria-pressed',String(currentProduct?.id===p.id));const photo=document.createElement('img');photo.src=p.thumbnail;photo.alt='';const label=document.createElement('span');label.textContent=p.reference+' · '+catalogColorName(p,settings.lang);b.append(photo,label);b.addEventListener('click',()=>chooseProduct(p));box.append(b);}}
function chooseProduct(p){
 if(!p?.canPreview)return;
 currentProduct=p;currentProfile=materialProfile(p);studio?.applyProduct(paint,p);usePhotoProduct(p,()=>{needsRender=true;});hex=p.hex;targetColor.set(hex);colorName=catalogColorName(p,settings.lang);finish=p.explicitFinish||p.sourceFinish||'Gloss';
 document.querySelector('#color-name').textContent=colorName;
 const printed=document.querySelector('#color-en');printed.lang='en';printed.dir='ltr';printed.textContent=colorName===p.nameEn?p.reference+' / TPU':p.reference+' · '+p.nameEn;
 document.querySelector('#product-reference').textContent=p.reference;document.documentElement.style.setProperty('--paint',hex);
 document.querySelector('#look-name').textContent=p.reference+' · '+colorName;
 const finishText=p.explicitFinish?({Gloss:'亮面',Matte:'哑面',Satin:'缎面'}[p.explicitFinish]):'以原图产品为准';
 document.querySelector('#finish-caption').textContent=finishText;document.querySelector('#look-finish').textContent=finishText;
 document.body.dataset.finish=finish;document.querySelector('#view-source').disabled=false;
 const photo=document.querySelector('#selected-card-photo');photo.src=p.card;photo.alt=colorName;
 document.querySelector('#preview-note').textContent=settings.lang==='zh'?'原图取色 · 未实物校准':'Photo Reference · Not Physically Calibrated';
 document.querySelector('.footnote').textContent=appearanceNote(p,settings.lang);
 document.querySelector('#photo-compare-label').textContent=settings.lang==='zh'?'原图对照':'Original Card Reference';
 const url=new URL(location.href);url.searchParams.set('card',p.id);url.searchParams.delete('color');url.searchParams.delete('finish');history.replaceState(null,'',url);
 recent=[p,...recent.filter(x=>x.id!==p.id)].slice(0,4);renderQuick();status.textContent='';notifySelection();
}
function activeFinish(){return currentProfile;}

setupCatalogue({products,meta:catalogMeta,onSelect:chooseProduct,getSelected:()=>currentProduct});
const linkedProduct=products.find(p=>p.id===settings.card&&p.canPreview);
chooseProduct(linkedProduct||palette[0]);
function frameScale(aspect){return aspect>1.35?Math.max(.82,1.35/aspect):Math.max(1,1.1/aspect);}
function reset(){if(!ready)return;viewMotion=null;controls.autoRotate=false;document.querySelector('#rotate').setAttribute('aria-pressed','false');const sample=current==='sample';controls.target.set(0,sample?.2:.62,0);camera.position.set(sample?2.7:5.8,sample?2.4:1.85,sample?-3.6:6.8);camera.position.sub(controls.target).multiplyScalar(frameScale(camera.aspect)*(current==='coupe'?1.13:1)).add(controls.target);controls.minDistance=sample?1.4:2.6;controls.maxDistance=(sample?8:15)*frameScale(camera.aspect);controls.update();pressed('[data-view]','view','front');}
const modelUrls={car:'../models/yunnian-aventador-v3.glb',coupe:'../models/yunnian-concept-coupe.glb'};
async function loadModel(kind){
 const root=kind==='sample'?createFilmSample():(await new GLTFLoader().loadAsync(modelUrls[kind])).scene;
 if(kind==='coupe'){const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());root.position.set(-center.x,-box.min.y,-center.z);}
 refineMaterials(root,paint,hex);paint.forEach(m=>applyMaterialProfile(m,currentProfile));studio.applyProduct(paint,currentProduct);modelMap[kind]=root;root.visible=false;scene.add(root);return root;
}
async function activate(kind){
 if(!ready)return;
 const picker=document.querySelector('#vehicle-model');
 if(!modelMap[kind]){picker.disabled=true;document.querySelectorAll('button[data-model]').forEach(b=>b.disabled=true);loading.hidden=false;try{await loadModel(kind);}catch(error){status.textContent=t('模型加载失败，请检查网络后刷新重试。');picker.value=vehicle;console.error(error);return;}finally{loading.hidden=true;picker.disabled=false;document.querySelectorAll('button[data-model]').forEach(b=>b.disabled=false);}}
 current=kind;document.body.dataset.model=kind;
 if(!lightingPreference){const mode=kind==='sample'?'studio':'day';studio.setLighting(mode==='day');pressed('button[data-env]','env',mode);document.body.dataset.env=mode;}
 const viewUrl=new URL(location.href);viewUrl.searchParams.set('view',kind==='sample'?'film':kind);history.replaceState(null,'',viewUrl);if(kind!=='sample'){vehicle=kind;picker.value=kind;}
 Object.entries(modelMap).forEach(([key,m])=>m.visible=key===kind);pressed('button[data-model]','model',kind==='sample'?'sample':'car');
 document.querySelector('.stage-heading h1').textContent=kind==='car'?'AVENTADOR':kind==='coupe'?'CONCEPT COUPE':'FILM';
 document.querySelector('.stage-heading .eyebrow').textContent=kind==='car'?t('LAMBORGHINI / 兰博基尼'):kind==='coupe'?'YUNNIAN / CONCEPT':'FLEXIBLE MATERIAL';
 document.querySelector('.stage-heading p').textContent=kind==='sample'?t('卷曲膜片与离型纸 · 形态与厚度为示意'):'Making Every Sheet of Film More Valuable';
 document.querySelector('.scene-number').textContent=kind==='car'?'01 — 03':kind==='coupe'?'02 — 03':'03 — 03';studio?.bake();needsRender=true;reset();
}
document.querySelector('#vehicle-model').addEventListener('change',e=>activate(e.target.value));
document.querySelectorAll('button[data-model]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.model==='car'?vehicle:'sample')));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
 if(!ready)return;
 const scale=frameScale(camera.aspect)*(current==='coupe'?1.13:1),sample=current==='sample',poses={front:[5.8,1.85,6.8],side:[8.7,1.85,0],rear:[-5.8,2.25,-6.8],detail:[2.7,1.65,4.0]};
 const target=b.dataset.view==='detail'?new THREE.Vector3(.25,.65,1.2):new THREE.Vector3(0,sample?.2:.62,0);controls.minDistance=b.dataset.view==='detail'?1.1:(sample?1.4:2.6);const destination=new THREE.Vector3().fromArray(poses[b.dataset.view]).sub(target).multiplyScalar(scale*(sample?.5:1));
 const start=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
 const end=new THREE.Spherical().setFromVector3(destination);
 end.theta=start.theta+THREE.MathUtils.euclideanModulo(end.theta-start.theta+Math.PI,Math.PI*2)-Math.PI;
 controls.autoRotate=false;document.querySelector('#rotate').setAttribute('aria-pressed','false');
 if(reduced){controls.target.copy(target);camera.position.copy(destination).add(target);controls.update();}else viewMotion={start,end,startTarget:controls.target.clone(),target,at:performance.now()};
 pressed('[data-view]','view',b.dataset.view);
}));
document.querySelector('#reset').addEventListener('click',reset);
document.querySelector('#rotate').addEventListener('click',e=>{if(!controls)return;controls.autoRotate=!controls.autoRotate;if(controls.autoRotate){viewMotion=null;pressed('[data-view]','view','');}e.currentTarget.setAttribute('aria-pressed',String(controls.autoRotate));});
for(const [id,factor] of [['zoom-in',.82],['zoom-out',1.22]])document.querySelector('#'+id).addEventListener('click',()=>{if(!ready)return;viewMotion=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();});
document.querySelectorAll('button[data-env]').forEach(b=>b.addEventListener('click',()=>{if(!studio)return;lightingPreference=b.dataset.env;pressed('button[data-env]','env',b.dataset.env);studio.setLighting(b.dataset.env==='day');document.body.dataset.env=b.dataset.env;needsRender=true;}));
document.querySelector('#light-angle').addEventListener('input',e=>{if(!studio)return;studio.rotateLighting(Number(e.target.value)*Math.PI/180);document.querySelector('#light-value').textContent=e.target.value+'°';needsRender=true;});
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='yunnian-select-product')return;const p=products.find(p=>p.id===e.data.card&&p.canPreview);if(p){chooseProduct(p);}});
const focusButton=document.querySelector('#focus-view');
function setFocus(focused){document.body.classList.toggle('focused',focused);focusButton.setAttribute('aria-pressed',String(focused));focusButton.setAttribute('aria-label',focused?'退出专注看车模式':'进入专注看车模式');focusButton.querySelector('span').textContent=focused?'返回定制':'专注看车';viewMotion=null;needsRender=true;}
focusButton.addEventListener('click',()=>setFocus(!document.body.classList.contains('focused')));
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||document.querySelector('dialog[open]'))return;if(document.body.classList.contains('focused')){setFocus(false);focusButton.focus();}else if(document.body.classList.contains('catalog-embed'))parent.postMessage({type:'yunnian-close-preview'},location.origin);});
async function boot(){
 save.disabled=true;let shaderFailed=false;
 try{
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.debug.onShaderError=(gl,program)=>{shaderFailed=true;console.error('Vehicle appearance shader could not compile.',gl.getProgramInfoLog(program));};renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:800px)').matches?1.5:2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;viewport.append(renderer.domElement);
 scene=new THREE.Scene();studio=await buildStudio(renderer,scene);
 camera=new THREE.PerspectiveCamera(32,1,.08,250);camera.zoom=1.08;camera.updateProjectionMatrix();controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.15;controls.enablePan=false;controls.autoRotateSpeed=.55;controls.addEventListener('change',()=>{needsRender=true;});controls.addEventListener('start',()=>{needsRender=true;viewMotion=null;pressed('[data-view]','view','');});
 const resize=()=>{const {width,height}=viewport.getBoundingClientRect();if(!width||!height)return;const oldScale=frameScale(camera.aspect);camera.aspect=width/height;const ratio=frameScale(camera.aspect)/oldScale;if(ready){camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target);controls.maxDistance*=ratio;controls.update();}camera.updateProjectionMatrix();renderer.setSize(width,height);needsRender=true;if(composer)composer.setSize(width,height);if(fxaa)fxaa.uniforms.resolution.value.set(1/(width*renderer.getPixelRatio()),1/(height*renderer.getPixelRatio()));};new ResizeObserver(resize).observe(viewport);resize();
 await Promise.all(['car','sample'].map(loadModel));modelMap.car.visible=true;
 studio.bake();const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});composer=new EffectComposer(renderer,rt);composer.addPass(new RenderPass(scene,camera));ao=new GTAOPass(scene,camera,1,1,undefined,{radius:.22,distanceExponent:1.5,thickness:.65,scale:1,samples:12},{radius:5,samples:12});ao.setSceneClipBox(new THREE.Box3(new THREE.Vector3(-5,-.5,-5),new THREE.Vector3(5,3,5)));ao.blendIntensity=.28;composer.addPass(ao);composer.addPass(new OutputPass());fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);resize();ready=true;document.querySelector('#vehicle-model').disabled=false;reset();loading.hidden=true;save.disabled=false;document.body.dataset.ready='true';if(parent!==window)parent.postMessage({type:'yunnian-studio-ready'},location.origin);
 paint.forEach(m=>{const f=activeFinish();m.color.copy(targetColor);for(const key of ['roughness','clearcoat','clearcoatRoughness','metalness','iridescence'])m[key]=f[key];m.normalScale?.setScalar(f.grain);m.clearcoatNormalScale?.setScalar(f.coatGrain);});composer.render();if(shaderFailed)throw new Error('Vehicle appearance shader unavailable');
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();loading.hidden=false;loading.textContent=t('三维显示暂时中断，请刷新页面重试。');save.disabled=true;});
 renderer.setAnimationLoop(time=>{if(!isActive()||document.hidden){lastTime=time;return;}const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;if(viewMotion){const m=viewMotion;const progress=Math.min(1,(time-m.at)/650),ease=progress*progress*(3-2*progress);const sph=new THREE.Spherical(THREE.MathUtils.lerp(m.start.radius,m.end.radius,ease),THREE.MathUtils.lerp(m.start.phi,m.end.phi,ease),THREE.MathUtils.lerp(m.start.theta,m.end.theta,ease));controls.target.lerpVectors(m.startTarget,m.target,ease);camera.position.setFromSpherical(sph).add(controls.target);if(progress===1)viewMotion=null;}const t=reduced?1:1-Math.exp(-dt*9);paint.forEach(m=>{
 const f=activeFinish();let changed=Math.abs(m.color.r-targetColor.r)+Math.abs(m.color.g-targetColor.g)+Math.abs(m.color.b-targetColor.b)>.0001;
 if(changed)m.color.lerp(targetColor,t);
 for(const key of ['roughness','clearcoat','clearcoatRoughness','metalness','iridescence'])if(Math.abs(m[key]-f[key])>.0001){m[key]=THREE.MathUtils.lerp(m[key],f[key],t);changed=true;}
 for(const [property,value]of [['normalScale',f.grain],['clearcoatNormalScale',f.coatGrain]]){if(m[property]&&Math.abs(m[property].x-value)>.0001){const v=THREE.MathUtils.lerp(m[property].x,value,t);m[property].set(v,v);changed=true;}}if(changed)needsRender=true;
 });controls.update();if(needsRender||controls.autoRotate||viewMotion){composer.render();needsRender=false;}});
 }catch(error){ready=false;save.disabled=true;document.body.dataset.ready='false';loading.hidden=false;loading.textContent=t('模型加载失败，请检查网络后刷新重试。');console.error(error);status.textContent=t('三维预览未能加载。');}
}
save.addEventListener('click',()=>{if(!ready)return;try{paint.forEach(m=>{m.color.copy(targetColor);for(const key of ['roughness','clearcoat','clearcoatRoughness','metalness','iridescence'])m[key]=activeFinish()[key];applyMaterialProfile(m,activeFinish());});composer.render();const c=document.createElement('canvas');c.width=renderer.domElement.width;c.height=renderer.domElement.height+100;const ctx=c.getContext('2d');ctx.fillStyle='#141a17';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(renderer.domElement,0,0);const pad=Math.min(30,c.width*.04);ctx.fillStyle='#e8efdc';ctx.font=Math.max(14,Math.min(24,c.width/30))+'px sans-serif';ctx.fillText('YUNNIAN · '+currentProduct.reference+' · '+colorName,pad,c.height-55,c.width-2*pad);ctx.font=Math.max(10,Math.min(16,c.width/45))+'px sans-serif';ctx.fillStyle='#94a38a';ctx.fillText((currentProduct?t('色卡图片取色 · 未按实物校色 | '):t('自选颜色 · 非目录产品 | '))+(current==='car'?'Aventador':current==='coupe'?'Concept Coupe':'Flexible Film Sample')+' / '+t('色彩与材质预览'),pad,c.height-23,c.width-2*pad);const a=document.createElement('a');a.download=currentProduct.reference+'-'+colorName+'.webp';a.href=c.toDataURL('image/webp',.94);a.click();status.textContent='效果图已生成，包含图片取色说明。';}catch{status.textContent='效果图保存失败，请重试。';}});
translateUI();
if(!settings.pet)boot().then(()=>{if(settings.view==='film')activate('sample');else if(settings.view==='coupe')activate('coupe');});
