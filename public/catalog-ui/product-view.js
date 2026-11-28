export const locales = ['en', 'zh', 'es', 'fr', 'ar'];
const labels = {
  en: ['Choose a model', 'Product photos', 'Enlarge image', 'Close', 'Previous image', 'Next image', 'Series image', 'Model reference', 'Request a wholesale quote', 'Discuss samples', 'Select an option', 'Product overview', 'Choose an existing product color'],
  zh: ['选择型号或颜色', '产品图册', '查看大图', '关闭', '上一张', '下一张', '系列图', '型号资料图', '咨询批发报价', '咨询样品', '请选择', '产品概览', '浏览现有产品色卡'],
  es: ['Elige un modelo', 'Fotos del producto', 'Ampliar imagen', 'Cerrar', 'Imagen anterior', 'Imagen siguiente', 'Imagen de la serie', 'Ficha del modelo', 'Solicitar una cotización', 'Consultar muestras', 'Elegir una opción', 'Vista del producto', 'Ver los colores disponibles'],
  fr: ['Choisir un modèle', 'Photos du produit', 'Agrandir l’image', 'Fermer', 'Image précédente', 'Image suivante', 'Photo de la gamme', 'Fiche du modèle', 'Demander un devis', 'Demander des échantillons', 'Choisir une option', 'Vue du produit', 'Voir les couleurs disponibles'],
  ar: ['اختر الطراز أو اللون', 'صور المنتج', 'تكبير الصورة', 'إغلاق', 'الصورة السابقة', 'الصورة التالية', 'صورة السلسلة', 'بطاقة الطراز', 'اطلب عرض سعر للجملة', 'استفسر عن العينات', 'اختر أحد الخيارات', 'صورة المنتج', 'عرض الألوان المتاحة'],
};
const entities = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'};
export const escapeHTML = input => String(input ?? '').replace(/[&<>"']/g, char => entities[char]);
export const prefix = locale => locale === 'en' ? '' : '/' + locale;
export const localeValue = (values, locale) => values?.[locale] || values?.en || values?.zh || Object.values(values || {}).find(Boolean) || '';
export const copyFor = (p, locale) => Object.fromEntries(['name','description','material'].map(key => [
  key, localeValue(Object.fromEntries(Object.entries(p.copy).map(([l,row]) => [l,row[key]])), locale),
]));
export function imagePath(value) {
  return typeof value === 'string' && /^(?:\/images\/|\/automotive-studio\/viewer\/catalog\/(?:cards|thumbs)\/|\/catalog-api\/images\/)[\w./%-]+$/i.test(value) &&
    !/(?:\.\.|%2e|%2f|%5c|\/\/)/i.test(value) ? value : '';
}
const esc = escapeHTML;
const zoomIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/></svg>';

export function galleryHTML(p, locale) {
  const l = labels[locale];
  const photos = p.gallery.filter(photo => imagePath(photo.src));
  if (!photos.length) return '';
  const name = copyFor(p,locale).name;
  const caption = (photo) => localeValue(photo.labels,locale) || photo.caption || l[11];
  const thumbs = photos.map((im,i) => '<button type="button" class="sku-thumb" data-photo="'+i+'" data-src="'+esc(im.src)+'" data-caption="'+esc(caption(im))+'" data-alt="'+esc(name+' · '+caption(im))+'" aria-label="'+esc(caption(im)+' · '+(i+1))+'" aria-pressed="'+(i===0)+'"><img src="'+esc(im.src)+'" alt="" width="72" height="72" loading="'+(i < 4 ? 'eager' : 'lazy')+'"></button>').join('');
  return '<div class="sku-gallery" data-sku-gallery><div class="sku-gallery-body"><div class="sku-rail" role="group" aria-label="'+l[1]+'">'+thumbs+'</div>'+
    '<a class="sku-stage" id="gallery-enlarge" href="'+esc(photos[0].src)+'" aria-label="'+l[2]+'"><img id="gallery-image" src="'+esc(photos[0].src)+'" alt="'+esc(name+' · '+caption(photos[0]))+'" width="1000" height="1000" fetchpriority="high"><span>'+zoomIcon+'</span></a></div>'+
    '<div class="sku-caption"><span id="gallery-caption">'+esc(caption(photos[0]))+'</span><bdi data-gallery-counter>1 / '+photos.length+'</bdi></div>'+
    '<dialog class="sku-zoom" id="gallery-lightbox" aria-labelledby="lightbox-caption"><div class="sku-zoom-bar"><strong id="lightbox-caption"></strong><button id="gallery-close" type="button" aria-label="'+l[3]+'">×</button></div><div class="sku-zoom-canvas"><img id="lightbox-image" alt=""></div><div class="sku-zoom-controls"><button type="button" data-photo-prev aria-label="'+l[4]+'">‹</button><bdi data-zoom-counter></bdi><button type="button" data-photo-next aria-label="'+l[5]+'">›</button></div></dialog></div>';
}

export function offerHTML(p, locale) {
  const l = labels[locale], path = prefix(locale), options = p.variants;
  const optionLabel = v => localeValue(v.labels, locale) || v.value;
  const colorLink = ['Color PPF','PET color wraps'].includes(p.category) ? '<a class="sku-catalog-link" href="'+path+'/color-studio/">'+l[12]+' ↗</a>' : '';
  const tiles = options.map(v => {
    const note = v.kind === 'spec' ? l[7] : v.kind === 'series' ? l[6] : '';
    const img = imagePath(v.src);
    return '<button class="sku-tile" type="button" data-sku-value="'+esc(v.value)+'" data-sku-src="'+esc(img)+'" aria-pressed="false">'+
      (img ? '<img src="'+esc(img)+'" loading="lazy" alt="" width="64" height="64">' : '')+
      '<span><bdi>'+esc(optionLabel(v))+'</bdi>'+(note ? '<small>'+note+'</small>' : '')+'</span></button>';
  }).join('');
  return '<form class="product-inquiry sku-offer" action="'+path+'/contact/" method="get"><input type="hidden" name="product" value="'+esc(copyFor(p,'en').name)+'">'+
    (options.length ? '<fieldset><legend>'+l[0]+'</legend><select id="variant" name="variant" aria-label="'+l[0]+'"><option value="">'+l[10]+'</option>'+options.map(v=>'<option value="'+esc(v.value)+'">'+esc(optionLabel(v))+'</option>').join('')+'</select><div class="sku-grid" hidden>'+tiles+'</div></fieldset>' : '')+
    colorLink+'<button id="quote-link" type="submit" class="button button-accent">'+l[8]+' <span aria-hidden="true">↗</span></button><button class="sample-link" type="submit" name="intent" value="Sample request">'+l[9]+' ↗</button></form>';
}
