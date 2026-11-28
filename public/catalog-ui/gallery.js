function setup() {
  const gallery = document.querySelector('[data-sku-gallery]');
  const picker = document.querySelector('#variant');
  const tiles = Array.from(document.querySelectorAll('.sku-tile'));
  const thumbs = Array.from(gallery?.querySelectorAll('[data-photo]') || []);
  const image = gallery?.querySelector('#gallery-image'), stage = gallery?.querySelector('#gallery-enlarge');
  const caption = gallery?.querySelector('#gallery-caption'), dialog = gallery?.querySelector('dialog');
  const large = dialog?.querySelector('img'), close = dialog?.querySelector('#gallery-close');
  const mobile = matchMedia('(max-width: 760px)');
  let active = 0, origin = null, swipedAt = -Infinity;
  function show(index, label) {
    const thumb = thumbs[index];
    if (!thumb || !image || !stage) return;
    active = index;
    const title = label || thumb.dataset.caption;
    image.src = thumb.dataset.src;
    image.alt = thumb.dataset.alt || title;
    stage.href = image.src;
    caption.textContent = title;
    const counter = (index+1)+' / '+thumbs.length;
    gallery.querySelector('[data-gallery-counter]').textContent = counter;
    thumbs.forEach((b,i) => b.setAttribute('aria-pressed', String(index===i)));
    if(mobile.matches && thumb.parentElement.scrollWidth>thumb.parentElement.clientWidth){
      const rail=thumb.parentElement,box=thumb.getBoundingClientRect(),visible=rail.getBoundingClientRect();
      if(box.left<visible.left || box.right>visible.right)rail.scrollBy({left:box.left-visible.left+(box.width-visible.width)/2,behavior:'instant'});
    }
    gallery.querySelector('[data-zoom-counter]').textContent = counter;
    dialog.querySelector('#lightbox-caption').textContent = title;
    if (dialog.open) { large.src=image.src; large.alt=image.alt; }
  }
  function enlarge(button) {
    if (!dialog || !stage) return;
    if (typeof dialog.showModal !== 'function') { location.assign(stage.href); return; }
    origin=button; large.src=image.src; large.alt=image.alt;
    dialog.querySelector('#lightbox-caption').textContent=caption.textContent;
    dialog.showModal(); close.focus({preventScroll:true});
  }
  function syncSelection(share) {
    if (!picker) return;
    const tile=tiles.find(b=>b.dataset.skuValue===picker.value);
    tiles.forEach(b=>b.setAttribute('aria-pressed',String(b===tile)));
    if (tile) {
      const index=thumbs.findIndex(b=>b.dataset.src===tile.dataset.skuSrc);
      if (index>=0) show(index, tile.querySelector('bdi').textContent + (tile.querySelector('small') ? ' · '+tile.querySelector('small').textContent : ''));
    }
    for (const a of document.querySelectorAll('[data-language-link]')) {
      const url=new URL(a.href);
      if (picker.value) url.searchParams.set('variant',picker.value); else url.searchParams.delete('variant');
      a.href=url.href;
    }
    if (share) {
      const url=new URL(location.href);
      if (picker.value) url.searchParams.set('variant',picker.value); else url.searchParams.delete('variant');
      history.replaceState(history.state,'',url);
    }
  }
  function fromURL() {
    if (!picker) return;
    const raw=new URLSearchParams(location.search).get('variant')||'';
    const refs=JSON.parse(document.querySelector('#variant-refs')?.textContent||'{}');
    picker.value=Object.hasOwn(refs,raw)?refs[raw]:raw;
    syncSelection(false);
  }
  if (picker && tiles.length) {
    picker.hidden=true; document.querySelector('.sku-grid').hidden=false;
    tiles.forEach(b=>b.addEventListener('click',()=>{picker.value=b.dataset.skuValue;syncSelection(true);if(mobile.matches)enlarge(b);}));
    picker.addEventListener('change',()=>syncSelection(true));
  }
  thumbs.forEach((b,i)=>b.addEventListener('click',()=>show(i)));
  stage?.addEventListener('click',event=>{event.preventDefault();if(performance.now()-swipedAt>350)enlarge(stage);});
  close?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('close',()=>origin?.focus({preventScroll:true}));
  const step=delta=>{ if(thumbs.length) show((active+delta+thumbs.length)%thumbs.length); };
  dialog?.querySelector('[data-photo-prev]').addEventListener('click',()=>step(-1));
  dialog?.querySelector('[data-photo-next]').addEventListener('click',()=>step(1));
  dialog?.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step((e.key==='ArrowRight'?1:-1)*(document.dir==='rtl'?-1:1));}
  });
  for(const surface of [stage,dialog].filter(Boolean)){
    let swipe=null;
    surface.addEventListener('touchstart',e=>{swipe=e.touches.length===1?[e.touches[0].clientX,e.touches[0].clientY]:null;},{passive:true});
    surface.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
    surface.addEventListener('touchend',e=>{
      if(swipe && !e.touches.length && (window.visualViewport?.scale || 1) === 1){
        const dx=e.changedTouches[0].clientX-swipe[0],dy=e.changedTouches[0].clientY-swipe[1];
        if(Math.abs(dx)>48 && Math.abs(dx)>Math.abs(dy)*1.4 && thumbs.length>1){
          step((dx<0?1:-1)*(document.dir==='rtl'?-1:1));swipedAt=performance.now();
        }
      }
      swipe=null;
    },{passive:true});
  }
  if(thumbs.length) show(0);
  fromURL(); addEventListener('popstate',fromURL);
}
setup();
