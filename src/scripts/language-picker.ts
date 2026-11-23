export function initLanguagePicker() {
  const disclosure = document.querySelector<HTMLDetailsElement>('.site-languages');
  const trigger = disclosure?.querySelector<HTMLElement>('summary');
  const panel = disclosure?.querySelector<HTMLElement>('.locale-options');
  const close = panel?.querySelector<HTMLButtonElement>('.locale-close');
  if (!disclosure || !trigger || !panel || !close ||
      typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

  const dialog = document.createElement('dialog');
  dialog.id = 'locale-dialog';
  dialog.className = 'locale-dialog';
  dialog.setAttribute('aria-labelledby', 'locale-title');
  document.body.append(dialog);
  dialog.append(panel);
  close.hidden = false;
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', dialog.id);
  trigger.setAttribute('aria-expanded', 'false');
  const links = Array.from(panel.querySelectorAll<HTMLAnchorElement>('[data-language-link]'));
  const current = links.find(link => link.getAttribute('aria-current') === 'page');
  const mobile = matchMedia('(max-width: 640px)');

  function positionPanel() {
    if (!dialog.open || mobile.matches) return;
    const rect = trigger!.getBoundingClientRect();
    const width = dialog.offsetWidth;
    const start = document.documentElement.dir === 'rtl' ? rect.left : rect.right - width;
    const left = Math.max(8, Math.min(start, document.documentElement.clientWidth - width - 8));
    dialog.style.setProperty('--locale-left', left + 'px');
    dialog.style.setProperty('--locale-top', Math.max(8, rect.bottom + 8) + 'px');
  }

  function openPanel() {
    if (dialog.open) return;
    // If the header menu is open on a phone, put it away before opening the sheet.
    document.querySelector<HTMLButtonElement>('#menu-toggle[aria-expanded="true"]')?.click();
    document.querySelectorAll<HTMLDetailsElement>('.nav-explore[open]').forEach(item => { item.open = false; });
    trigger!.setAttribute('aria-expanded', 'true');
    dialog.showModal();
    positionPanel();
    (current || links[0])?.focus({preventScroll:true});
  }

  trigger.addEventListener('click', event => {
    event.preventDefault();
    openPanel();
  });
  trigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openPanel();
  });
  close.addEventListener('click', () => dialog.close());
  // Backdrop events target the dialog itself. The panel fills its entire interior.
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({preventScroll:true});
  });
  current?.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    dialog.close();
  });
  panel.addEventListener('keydown', event => {
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    let next: number;
    switch (event.key) {
      case 'ArrowDown': next = (index + 1) % links.length; break;
      case 'ArrowUp': next = index <= 0 ? links.length - 1 : index - 1; break;
      case 'Home': next = 0; break;
      case 'End': next = links.length - 1; break;
      default: return;
    }
    event.preventDefault();
    links[next].focus();
  });
  window.addEventListener('resize', positionPanel);
  window.addEventListener('pageshow', event => { if (event.persisted && dialog.open) dialog.close(); });
}
