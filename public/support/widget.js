(() => {
  const script = document.currentScript;
  const endpoint = script.dataset.api || new URL(script.src).origin;
  const hosted = endpoint === '/support';
  const chinese = (script.dataset.lang || document.documentElement.lang).startsWith('zh');
  const chatUrl = new URL(hosted ? '/support/chat/' : endpoint + '/chat', location.href);
  chatUrl.searchParams.set('lang', chinese ? 'zh' : 'en');

  const host = document.createElement('div');
  const root = host.attachShadow({mode:'open'});
  root.innerHTML = `<style>
    :host { position:fixed; z-index:9999; left:max(20px,env(safe-area-inset-left)); bottom:max(20px,env(safe-area-inset-bottom)); font:inherit; }
    :host-context(body.menu-open), :host-context(body:has(dialog[open])) { visibility:hidden; }
    [hidden] { display:none !important; }
    ::slotted(button) { background:var(--accent,#ec3850);color:var(--ink,#111);border:1px solid transparent;border-radius:0;cursor:pointer;min-height:46px;padding:10px 16px;font:600 15px/1.35 Arial,Helvetica,sans-serif;letter-spacing:.01em;display:inline-flex;align-items:center;gap:16px; }
    ::slotted(button:focus-visible), .close:focus-visible { outline:2px solid var(--accent,#ec3850);outline-offset:3px; }
    .panel { position:relative; width:min(416px,calc(100vw - 40px)); height:min(632px,calc(var(--view-height,100dvh) - 40px)); background:#fff;border:1px solid var(--line,#d3d3d3);box-sizing:border-box;box-shadow:0 8px 40px #0003; }
    iframe { display:block;width:100%;height:100%;border:none; }
    .close { position:absolute;right:9px;top:8px;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;border:1px solid #ffffff65;border-radius:0;background:#0b0b0b;color:#fff;font:26px/1 Arial,sans-serif; }
    .close:hover { background:#fff;color:#111; }
    @media(max-width:600px){
      :host { left:max(14px,env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom,0px)); }
      :host([data-open]) { left:env(safe-area-inset-left,0px);right:env(safe-area-inset-right,0px);bottom:var(--keyboard-bottom,0px); }
      .panel { width:100%;height:min(660px,calc(var(--view-height,100dvh) - 8px)); }
    }
    @media(max-height:490px){ .close { top:2px; } }
    @media(prefers-reduced-motion:no-preference){ .panel:not([hidden]) { animation:appear .16s ease-out; } @keyframes appear { from { opacity:0;transform:translateY(6px); } } }
  </style><slot name="launch"></slot>
  <section class="panel" role="dialog" hidden><iframe title="YUNNIAN product support"></iframe>
  <button class="close" type="button"><span aria-hidden="true">×</span></button></section>`;
  const launcher = document.createElement('button');
  // Use the same light-DOM classes and arrow markup as the existing product and inquiry CTAs.
  launcher.type = 'button';
  launcher.className = 'button button-accent';
  launcher.slot = 'launch';
  launcher.append(document.createTextNode(chinese ? '咨询云辇' : 'Ask YUNNIAN'));
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden','true');
  arrow.textContent = '↗';
  launcher.append(arrow);
  launcher.setAttribute('aria-haspopup','dialog');
  launcher.setAttribute('aria-expanded','false');
  host.append(launcher);
  const panel = root.querySelector('.panel');
  const frame = root.querySelector('iframe');
  const close = root.querySelector('.close');
  const slot = root.querySelector('slot');
  panel.setAttribute('aria-label', chinese ? '云辇 AI 客服' : 'YUNNIAN AI support');
  close.setAttribute('aria-label', chinese ? '关闭' : 'Close');

  function sizePanel() {
    if (!window.visualViewport || panel.hidden) return;
    const viewport = window.visualViewport;
    host.style.setProperty('--view-height', viewport.height + 'px');
    host.style.setProperty('--keyboard-bottom', Math.max(0, innerHeight - viewport.height - viewport.offsetTop) + 'px');
  }
  function setOpen(open) {
    if (open && !frame.hasAttribute('src')) frame.src = chatUrl.href;
    panel.hidden = !open;
    slot.hidden = open;
    host.toggleAttribute('data-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      sizePanel();
      close.focus({preventScroll:true});
    } else launcher.focus({preventScroll:true});
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
  document.body.append(host);
})();
