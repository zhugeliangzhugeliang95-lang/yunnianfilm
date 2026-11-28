import {escapeHTML as e, prefix} from '/catalog-ui/product-view.js';

export function seoFields(doc, context, locale, languageField, slug, selected) {
  const copy=doc.copy[locale] || {}, defaults=context.defaults[locale];
  const url='yunnianfilm.com'+prefix(locale)+'/products/'+slug+'/';
  const photos=context.photos;
  const photo=photos[selected];
  const photoLabels=photos.map((p,i)=>(i+1)+' · '+(p.labels[locale] || p.src.split('/').pop()));
  const alt=photo ? doc.images[photo.src]?.[locale] || '' : '';
  const picture=photo ? `<div class="seo-photo-editor">
    <div class="seo-figure"><img id="seo-photo" src="${e(photo.src)}" alt="${e(photo.labels[locale])}"></div>
    <div class="seo-photo-fields"><label>选择产品图片<select id="seo-photo-select">${photoLabels.map((label,i)=>'<option value="'+i+'"'+(i===selected?' selected':'')+'>'+e(label)+'</option>').join('')}</select></label>
    <p class="hint seo-file" dir="ltr">${e(photo.src.split('/').pop())}</p>
    ${photo.visible?'':'<p class="hint">这张图片随产品内容发布后展示。</p>'}
    <label>图片替代文本（ALT）<textarea id="seo-alt" dir="auto" maxlength="600" rows="3" placeholder="描述画面中的产品、颜色或安装位置">${e(alt)}</textarea></label>
    <p class="hint">清空并发布后，恢复这张图片的默认描述。</p></div>
    <div class="seo-thumbs" role="group" aria-label="产品图片">${photos.map((p,i)=>'<button type="button" data-seo-photo="'+i+'" aria-label="'+e(photoLabels[i])+'" aria-pressed="'+(i===selected)+'"><img src="'+e(p.src)+'" loading="lazy" alt=""></button>').join('')}</div>
  </div>` : '<p class="hint">请先在产品图册里保存图片。</p>';
  return `<div class="seo-toolbar">${languageField}</div>
    <section class="block"><h2>搜索结果</h2><div class="seo-search-layout"><div class="seo-text-fields">
      <label>搜索标题<input dir="auto" id="seo-title" maxlength="240" value="${e(copy.title)}" placeholder="${e(defaults.title)}"></label>
      <label>搜索描述<textarea dir="auto" id="seo-description" maxlength="1200" rows="3" placeholder="${e(defaults.description)}">${e(copy.description)}</textarea></label>
      <p class="hint">留空时，官网沿用当前语言的产品标题和介绍。</p></div>
      <div class="seo-preview-box"><h3>搜索结果预览</h3><div dir="${locale==='ar'?'rtl':'ltr'}" lang="${locale}"><bdi class="seo-url" dir="ltr">${e(url)}</bdi><p id="seo-preview-title">${e(copy.title || defaults.title)}</p><p id="seo-preview-description">${e(copy.description || defaults.description)}</p></div></div></div></section>
    <section class="block"><h2>图片替代文本 <small id="seo-count"></small></h2>${picture}</section>`;
}

export function updateSeoPreview(doc, context, locale) {
  const row=doc.copy[locale] || {}, fallback=context.defaults[locale];
  document.getElementById('seo-preview-title').textContent=row.title?.trim() || fallback.title;
  document.getElementById('seo-preview-description').textContent=row.description?.trim() || fallback.description;
  const count=context.photos.filter(photo=>doc.images[photo.src]?.[locale]?.trim()).length;
  document.getElementById('seo-count').textContent=count+' / '+context.photos.length+' 张已填写';
}
