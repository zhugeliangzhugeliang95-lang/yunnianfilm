import {ui, localeCode, localePrefix, loadInterface} from '../../locales/runtime.js';
const params=new URLSearchParams(location.search);
export const settings={view:params.get('view')||'car',lang:localeCode(params.get('lang') || 'zh'),pet:params.get('material')==='pet',card:/^[a-f0-9]{12}$/.test(params.get('card')||'')?params.get('card'):null};
document.documentElement.lang=settings.lang==='zh'?'zh-CN':settings.lang;
document.documentElement.dir=settings.lang==='ar'?'rtl':'ltr';
await loadInterface(settings.lang);
document.body.dataset.material=settings.pet?'pet':'tpu';document.body.classList.toggle('catalog-embed',params.get('embed')==='catalog');
document.title='YUNNIAN · '+(settings.lang==='zh'?'色彩工作室':ui('Color Studio'));
const base=localePrefix(settings.lang);
document.querySelector('.brand').href=base+'/';
document.querySelector('.project').href=base+'/products/';
if(settings.pet){document.body.hidden=true;location.replace(base+'/products/pet-tech-color-wrap/');}
else document.querySelector('.badge').textContent='云辇 TPU 色卡';
let active=true;
export const isActive=()=>active;
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='yunnian-studio-visibility')return;active=!!e.data.visible;});
export function sendSelection(selection){
 const inquiry=document.querySelector('#studio-inquiry');
 const product=settings.pet?'PET Tech Color Wrap':'TPU Color PPF · Color Catalog';
 const variant=[selection.reference,selection.name].filter(Boolean).join(' / ');
 inquiry.href=base+'/contact/?'+new URLSearchParams({product,intent:'Wholesale quote',variant,...(selection.id?{colors:selection.id}:{})});
 if(parent!==window)parent.postMessage({type:'yunnian-studio-selection',color:selection.hex,finish:selection.finish.toLowerCase(),card:selection.id},location.origin);
}
const dictionary={
 '摄影棚':'Photo Studio','户外日光':'Outdoor Daylight','膜材样片':'Film Sample','柔光对色':'Soft Light','展厅光线':'Showroom Light','卷曲膜片与离型纸 · 形态与厚度为示意':'Curled Film And Release Liner · Shape And Thickness Are Illustrative',
 '整车预览':'Vehicle Preview','显示方式':'Display Mode','原图取色对照':'Photo Color Reference','棚光观察':'Studio Lighting','放大原图':'Enlarge Original Card','原图对照':'Original Card Reference','对照模式保留照片色彩范围；棚光模式用于观察模拟光泽。':'Reference Mode Preserves Photo Colors; Studio Mode Shows Illustrative Reflections.',
'最近查看':'Recently Viewed','以原图产品为准':'As Pictured','哑面':'Matte','保存该款预览':'Save Product Preview','咨询购买这款颜色':'Enquire About This Color','查看车身示意':'View On Vehicle','搜索颜色、编号或英文名称':'Search Color, Reference Or English Name','按色系筛选':'Filter By Color Family','全部色系':'All Colors','只展示所选色卡产品；车身效果为示意，请以实物为准。':'Only The Selected Product Is Shown. Vehicle Rendering Is Illustrative; Confirm With A Physical Sample.',
 '选择车型':'Choose Vehicle','搜索中文或英文色名':'Search Chinese or English color names','随角变色示意 · 未实物校准':'Illustrative color shift · not calibrated','随角变色为示意效果，未按实物校准；请以实物为准。':'Color shift is illustrative and not calibrated. Confirm with a physical sample.',
 'YUNNIAN 首页':'YUNNIAN home','展示方式':'Preview mode','整车定制':'Vehicle','材质大样':'Material sample','产品中心':'Products',
 '三维模型展示区':'3D model studio','三维车衣预览，可拖动旋转和滚轮缩放':'3D wrap preview. Drag to rotate and scroll to zoom.',
 '正在准备你的色彩空间':'Preparing your color studio','载入车辆与光线':'Loading the vehicle and studio lighting',
 'LAMBORGHINI / 兰博基尼':'LAMBORGHINI','让色彩，成为你的个性。':'Make color your signature.',
 '进入专注看车模式':'Enter focus view','退出专注看车模式':'Exit focus view','专注看车':'Focus view','返回定制':'Back to colors',
 '视图控制':'View controls','放大':'Zoom in','缩小':'Zoom out','复位视角':'Reset view','预设观察角度':'Camera views',
 '前侧':'Front','侧面':'Side','后侧':'Rear','漆面细节':'Finish detail','自动旋转':'Auto rotate',
 '酸橙绿':'Lime green','珍珠白':'Pearl white','赤陶铜':'Terracotta','冰川银':'Glacier silver','石墨灰':'Graphite','深海蓝':'Deep blue','酒红':'Burgundy','鼠尾草绿':'Sage',
 '亮面':'Gloss','缎面':'Satin','哑光':'Matte','车衣配置':'Wrap configuration','云辇官方色卡':'YUNNIAN color library','云辇 TPU 色卡':'YUNNIAN TPU library','PET 改色 · 概念配色':'PET wrap · concept colors',
 '基础色预览':'Base color preview','图片取色 · 未实物校准':'Sampled from photos · not calibrated',
 '查看原始色卡 ↗':'View original color card ↗','车衣颜色':'Wrap color','图片取色参考值，非产品色号':'Photo-sampled RGB reference, not a product code',
 '浏览完整色卡':'Browse color library','最近试色':'Recent colors','探索专属颜色':'Explore your own color','自选车衣颜色':'Custom wrap color',
 '质感试调':'Finish preview','表面质感':'Surface finish','观察光线':'Lighting','中性棚光':'Neutral studio','明亮棚光':'Bright studio','高光方向':'Light direction','灯光角度':'Lighting angle',
 '保存这份灵感':'Save this look','咨询这组配色':'Enquire about this look','颜色取自色卡照片，质感为模拟；请以实物为准。':'Color sampled from photos; finish is simulated. Confirm with a physical sample.',
 '素材与色彩说明 ↗':'Model & color notes ↗','模型来源与说明':'Model source and notes','完整色卡':'Color library','关闭色库':'Close color library',
 '搜索颜色名称，例如：蜥蜴绿、液态金属':'Search the original color name','搜索色卡名称':'Search color cards','按效果筛选':'Filter by effect','全部效果':'All effects','按质感名称筛选':'Filter by finish','全部质感':'All finishes','亮面 / 未注明':'Gloss / unspecified','缎面 / 柔光':'Satin / soft','哑光 / 消光':'Matte',
 '没有找到匹配的色卡':'No matching color cards','清除筛选，查看全部':'Clear filters','继续浏览':'Load more','图片取色预览，特殊光学与纹理效果未完整复现。':'Photo-based color preview. Special optical effects and textures are not fully reproduced.',
 '原始色卡目录 ↗':'Original color library ↗','原始色卡':'Original color card','关闭原始色卡':'Close color card','打开来源图片 ↗':'Open source image ↗','应用基础色预览':'Preview this base color',
 '自选颜色':'Custom color','自选颜色 · 非目录产品':'Custom concept · not a catalog product','自选颜色与质感仅供模拟，不对应目录产品。':'Custom color and finish are concepts, not catalog products.',
 '外观模拟':'Appearance preview','亮面 · 清晰光泽':'Gloss · crisp highlights','缎面 · 柔和反光':'Satin · soft reflections','哑光 · 细腻雾面':'Matte · diffused reflections',
 '仅基础色 · 随角变色未复现':'Base color only · color shift not reproduced','图片取色 · 电镀反射近似模拟':'Photo-sampled color · approximate chrome reflection',
 '仅基础色预览，随角变色未复现；请以实物为准。':'Base color only. Color shift is not reproduced; confirm with a physical sample.',
 '电镀反射为近似模拟，颜色未实物校准。':'Chrome reflection is approximate; the color is not calibrated to a physical sample.',
 'SURFACE STUDY / 曲面观察':'SURFACE STUDY','观察同一颜色在不同曲率下的变化。':'Explore how light reveals the same color on a curved surface.',
 '三维显示暂时中断，请刷新页面重试。':'3D display interrupted. Refresh to try again.','模型加载失败，请检查网络后刷新重试。':'Model could not load. Check your connection and refresh.','三维预览未能加载。':'3D preview could not load.',
 '效果图已生成，包含图片取色说明。':'Look saved with a photo-sampled color note.','效果图保存失败，请重试。':'Could not save this look. Please try again.',
 '色彩与材质预览':'Color and material preview','色卡图片取色 · 未按实物校色 | ':'Photo-sampled color · not calibrated | ','自选颜色 · 非目录产品 | ':'Custom concept · not a catalog product | ',
 '基础色 / 未注明':'Solid / unspecified','金属':'Metallic','珠光 / 闪粉':'Pearl / flake','电镀':'Chrome','变色 / 幻彩':'Color shift','碳纤 / 纹理':'Carbon / texture','反光':'Reflective',
 '查看原图 ↗':'View original ↗','此效果暂仅支持查看原图':'Original image only for this effect',
 '模型仅预览基础色，尚未复现随角度变化的色彩。':'The model shows the base color only, without angle-dependent color shift.',
 '电镀反射为近似模拟，请对照原图与实物。':'Chrome reflection is approximate. Compare the original photo and physical sample.',
 '模型颜色取自这张图片，尚未经过实物校色。':'Model color is sampled from this photo and has not been calibrated to a physical sample.',
 '此款碳纤纹理尚未匹配到模型，当前保留原图供查看。':'This texture is not mapped onto the model. View the original image.',
 '此款反光效果尚未匹配到模型，当前保留原图供查看。':'This reflective effect is not modeled. View the original image.'
};
export function t(text){
 if(settings.lang==='zh')return text;
 if(dictionary[text])return ui(dictionary[text]);
 let s=text;
 for(const key of Object.keys(dictionary).sort((a,b)=>b.length-a.length))if(s.includes(key))s=s.replaceAll(key,ui(dictionary[key]));
 return ui(s).replace(/(\d+) 张色卡/g,(_,n)=>ui('{count} color cards',{count:n})).replace(/(\d+) 张可试基础色/g,(_,n)=>ui('{count} base color previews',{count:n})).replace(/ · 可试色/g,' · preview available').replace(/ · 仅色卡/g,' · image only').replace(/继续浏览 · 已显示/g,ui('Load more · showing')).replace(/Load more · 已显示/g,'Load more · showing').replace(/，应用基础色预览/g,', preview base color').replace(/，查看原始色卡/g,', view original').replace(/查看 (.+) 原始色卡/g,'View $1 original color card');
}
function translateNode(node){
 if(node.nodeType===Node.TEXT_NODE){if(['SCRIPT','STYLE','TEXTAREA'].includes(node.parentElement?.tagName))return;if(!settings.pet&&node.parentElement?.closest('.catalog-name,#card-title,#card-filename,#color-name,#color-en,#look-name,#colors button span'))return;const raw=node.nodeValue;const trimmed=raw.trim();const result=t(trimmed);if(result!==trimmed)node.nodeValue=raw.replace(trimmed,result);return;}
 if(node.nodeType!==Node.ELEMENT_NODE)return;
 if(['SCRIPT','STYLE'].includes(node.tagName))return;
 for(const attr of ['aria-label','title','placeholder','alt'])if(node.hasAttribute(attr)){const value=node.getAttribute(attr),result=t(value);if(result!==value)node.setAttribute(attr,result);}
 for(const child of node.childNodes)translateNode(child);
}
export function translateUI(){
 if(settings.lang==='zh')return;
 translateNode(document.body);
 new MutationObserver(mutations=>{for(const m of mutations){if(m.type==='characterData')translateNode(m.target);else if(m.type==='childList')for(const child of m.addedNodes)translateNode(child);else translateNode(m.target);}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
}
