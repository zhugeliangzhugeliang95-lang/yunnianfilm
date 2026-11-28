(() => {
  const script = document.currentScript;
  const endpoint = script.dataset.api || new URL(script.src).origin;
  const hosted = endpoint === '/support';
  const lang = (script.dataset.lang || document.documentElement.lang || 'en').split('-')[0];
  const chinese = lang === 'zh';
  const label = (en,zh) => chinese ? zh : globalThis.YunnianWords?.[en] ?? en;
  const chatUrl = new URL(hosted ? '/support/chat/' : endpoint + '/chat', location.href);
  chatUrl.searchParams.set('lang', lang);

  const host = document.createElement('div');
  host.className = 'inquiry-widget';
  const main = document.getElementById('main');
  const hero = main?.querySelector('.video-hero');
  host.toggleAttribute('data-bounded', Boolean(main));
  host.toggleAttribute('data-video-page', Boolean(hero));
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host {
      --edge:max(20px,env(safe-area-inset-right,0px));
      --launch-right:var(--inquiry-right,var(--edge));
      --lift:max(calc(28px + env(safe-area-inset-bottom,0px)),var(--tray-clearance,0px));
      --footer-gap:12px;
      display:block; position:fixed; left:0; right:0; bottom:calc(var(--lift) - var(--footer-gap));
      height:0; z-index:19; pointer-events:none; font:inherit;
    }
    /* At the end of main the sticky launcher stays just above the footer. */
    :host([data-bounded]) { position:sticky; }
    :host([data-open]) { position:fixed; left:auto; right:var(--edge); bottom:max(20px,env(safe-area-inset-bottom,0px)); height:auto; z-index:9999; pointer-events:auto; }
    :host-context(body.menu-open), :host-context(body:has(dialog[open])) { visibility:hidden; }
    [hidden] { display:none !important; }
    .launch-lane {
      position:absolute; right:var(--launch-right); bottom:var(--footer-gap);
      max-width:calc(100% - var(--launch-right) - 12px); box-sizing:content-box;
      margin:-6px; padding:6px; overflow:hidden; overflow:clip;
    }
    .launch-motion { display:flex; pointer-events:auto; }
    :host([data-open]) .launch-lane { visibility:hidden; }
    ::slotted(button) { background:var(--accent,#ec3850);color:var(--ink,#111);border:1px solid transparent;border-radius:0;cursor:pointer;min-height:46px;max-width:100%;padding:10px 16px;font:600 15px/1.35 Arial,Helvetica,sans-serif;letter-spacing:.01em;display:inline-flex;align-items:center;gap:16px; }
    ::slotted(button:focus-visible), .close:focus-visible { outline:2px solid var(--accent,#ec3850);outline-offset:3px; }
    .panel { position:relative; width:min(416px,calc(100vw - 40px)); height:min(632px,calc(var(--view-height,100dvh) - 40px)); background:#fff;border:1px solid var(--line,#d3d3d3);box-sizing:border-box;box-shadow:0 8px 40px #0003; }
    iframe { display:block;width:100%;height:100%;border:none; }
    .close { position:absolute;right:9px;top:8px;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;border:1px solid #ffffff65;border-radius:0;background:#0b0b0b;color:#fff;font:26px/1 Arial,sans-serif; }
    .close:hover { background:#fff;color:#111; }
    @media(max-width:600px){
      :host([data-open]) { left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px);bottom:var(--keyboard-bottom,0px); }
      .panel { width:100%;height:min(660px,calc(var(--view-height,100dvh) - 8px)); }
    }
    @media(max-height:490px){ .close { top:2px; } }
    @media(prefers-reduced-motion:no-preference){
      :host([data-video-page]) .launch-motion { animation:inquiry-arrival 1.1s cubic-bezier(.22,.61,.36,1) both; }
      @keyframes inquiry-arrival { from { opacity:0;transform:translateX(100%); } to { opacity:1;transform:translateX(0); } }
      .panel:not([hidden]) { animation:appear .16s ease-out; }
      @keyframes appear { from { opacity:0;transform:translateY(6px); } }
    }
  </style><div class="launch-lane"><div class="launch-motion"><slot name="launch"></slot></div></div>
  <section class="panel" role="dialog" hidden><iframe title="YUNNIAN product support"></iframe>
  <button class="close" type="button"><span aria-hidden="true">×</span></button></section>`;
  const launcher = document.createElement('button');
  // Use the same light-DOM classes and arrow markup as the existing product and inquiry CTAs.
  launcher.type = 'button';
  launcher.className = 'button button-accent';
  launcher.slot = 'launch';
  launcher.append(document.createTextNode(label('Ask YUNNIAN','咨询云辇')));
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden','true');
  arrow.textContent = '↗';
  launcher.append(arrow);
  launcher.setAttribute('aria-haspopup','dialog');
  launcher.setAttribute('aria-expanded','false');
  host.append(launcher);
  const panel = root.querySelector('.panel');
  const frame = root.querySelector('iframe');
  frame.title = label('YUNNIAN AI support','云辇 AI 客服');
  const close = root.querySelector('.close');
  const lane = root.querySelector('.launch-lane');
  panel.setAttribute('aria-label', label('YUNNIAN AI support','云辇 AI 客服'));
  close.setAttribute('aria-label', label('Close','关闭'));

  function syncHero() {
    lane.hidden = Boolean(hero && hero.getBoundingClientRect().bottom > 0);
  }

  function sizePanel() {
    if (!window.visualViewport || panel.hidden) return;
    const viewport = window.visualViewport;
    host.style.setProperty('--view-height', viewport.height + 'px');
    host.style.setProperty('--keyboard-bottom', Math.max(0, innerHeight - viewport.height - viewport.offsetTop) + 'px');
  }
  function setOpen(open) {
    if (open && !frame.hasAttribute('src')) frame.src = chatUrl.href;
    panel.hidden = !open;
    host.toggleAttribute('data-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      sizePanel();
      close.focus({preventScroll:true});
    } else if (!lane.hidden) {
      launcher.focus({preventScroll:true});
    } else {
      document.querySelector('.header-cta')?.focus({preventScroll:true});
    }
  }
  launcher.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  window.addEventListener('message', event => {
    if (!panel.hidden && event.source === frame.contentWindow && event.origin === chatUrl.origin &&
        event.data === 'yunnian-support:close') setOpen(false);
  });
  window.visualViewport?.addEventListener('resize', sizePanel);
  window.visualViewport?.addEventListener('scroll', sizePanel);
  syncHero();
  (main || document.body).append(host);
  if (hero) {
    if ('IntersectionObserver' in window) new IntersectionObserver(syncHero).observe(hero);
    else window.addEventListener('scroll', syncHero, {passive:true});
    window.addEventListener('pageshow', syncHero);
    window.addEventListener('resize', syncHero);
  }
  const tray = main?.querySelector('.shortlist-tray, .comparison-tray');
  if (tray && 'ResizeObserver' in window) {
    const clearTray = () => {
      const height = tray.offsetHeight;
      const bottom = parseFloat(getComputedStyle(tray).bottom) || 0;
      host.style.setProperty('--tray-clearance', (height ? height + bottom + 12 : 0) + 'px');
    };
    new ResizeObserver(clearTray).observe(tray);
  }
})();
