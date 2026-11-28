async function startChat() {
const hostedSite = document.documentElement.dataset.hosted === 'true';
const {localeCode,localePrefix,loadInterface,ui} = hostedSite ? await import('/locales/runtime.js') : {
  localeCode: value => String(value).split('-')[0] === 'zh' ? 'zh' : 'en', localePrefix: lang => lang === 'zh' ? '/zh' : '',
  loadInterface: async () => {}, ui: text => text,
};
const $ = selector => document.querySelector(selector);
const hosted = document.documentElement.dataset.hosted === 'true';
const embedded = window.parent !== window;
const lang = new URLSearchParams(location.search).get('lang');
const locale = localeCode(lang || (hosted ? 'en' : navigator.language));
const cn = locale === 'zh';
document.documentElement.lang = cn ? 'zh-CN' : locale;
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
await loadInterface(locale);
const t = (english, chinese) => cn ? chinese : ui(english);
document.title = t('Ask YUNNIAN', '咨询云辇');
document.documentElement.classList.toggle('embedded', embedded);
if (embedded) {
  // The production iframe shares an origin with the site. Standalone and local previews use the same defaults.
  try {
    const site = getComputedStyle(parent.document.documentElement);
    for (const name of ['--accent', '--ink', '--muted', '--line']) {
      const value = site.getPropertyValue(name).trim();
      if (value) document.documentElement.style.setProperty(name, value);
    }
    document.documentElement.style.fontFamily = getComputedStyle(parent.document.body).fontFamily;
  } catch {}
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.referrer) parent.postMessage('yunnian-support:close', new URL(document.referrer).origin);
  });
}

const base = hosted ? '/support' : '';
const provider = $('#use-groq');
if (provider) provider.checked = sessionStorage.getItem('yun-chat-provider') !== 'local';
const providerName = () => hosted || provider?.checked ? 'groq' : 'local';
const sessionKey = () => 'yun-dialogue-' + providerName();
let session = sessionStorage.getItem(sessionKey()) || '';
let busy = false;
const field = $('#message'), send = $('#send'), contact = $('#contact');
const contactButton = $('#contact-form button'), saved = $('#saved');
const log = $('#messages'), thread = $('#thread'), welcome = $('#welcome');
const exampleButtons = [...document.querySelectorAll('[data-example]')];
const sendLabel = t('Send', '发送');
const contactLabel = t('Send to the team', '提交给团队');
$('#mode').textContent = t('AI film support', 'AI 产品客服');
$('#welcome-title').textContent = t('Which film are you looking for?', '想了解哪种汽车膜？');
$('.examples').setAttribute('aria-label', t('Suggested questions','快捷提问'));
field.placeholder = t('Ask about a film…', '输入你的问题…');
field.setAttribute('aria-label', t('Your message', '你的问题'));
function actionLabel(button, label) {
  const arrow = document.createElement('span');
  arrow.className = 'action-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  button.replaceChildren(label, arrow);
}
actionLabel(send, sendLabel);
$('#contact-panel summary').textContent = t('Contact the team', '联系销售团队');
$('#sales-email-label').textContent = t('Email', '发邮件');
$('#sales-phone-label').textContent = ({zh:'打电话',fr:'Appeler',es:'Llamar',ar:'اتصل'})[document.documentElement.lang.split('-')[0]] || 'Call';
$('#contact-label').textContent = t('Your email and enquiry', '联系邮箱和采购需求');
actionLabel(contactButton, contactLabel);

function updateNotice() {
  $('#privacy-note').textContent = hosted
    ? t('Groq processes this chat. Messages are saved for support.', '对话由 Groq 处理，记录用于客服跟进。')
    : provider.checked ? t('New messages go to Groq and are saved locally.', '新对话由 Groq 处理，并保存在本机。')
    : t('Messages stay on this computer.', '对话仅在本机处理。');
  const link = $('#privacy-link');
  if (link) {
    link.href = localePrefix(locale) + '/privacy/';
    link.textContent = t('Privacy', '隐私说明');
  }
}
function updateControls() {
  send.disabled = busy || !field.value.trim();
  contactButton.disabled = busy || !contact.value.trim();
  if (provider) provider.disabled = busy;
  for (const button of exampleButtons) button.disabled = busy;
}
function resizeField() {
  field.style.height = 'auto';
  field.style.height = Math.min(field.scrollHeight, 110) + 'px';
  updateControls();
}
field.addEventListener('input', resizeField);
contact.addEventListener('input', () => { saved.textContent = ''; updateControls(); });
if (provider) provider.addEventListener('change', () => {
  sessionStorage.setItem('yun-chat-provider', providerName());
  session = sessionStorage.getItem(sessionKey()) || '';
  log.replaceChildren();
  welcome.hidden = false;
  saved.textContent = '';
  updateNotice();
});
updateNotice();
function add(text, role) {
  const item = document.createElement('div');
  item.className = 'msg ' + role;
  item.textContent = text;
  log.append(item);
  thread.scrollTop = thread.scrollHeight;
  return item;
}
function showReply(data) {
  const reply = add(data.answer, 'assistant');
  for (const item of data.links || []) {
    let target;
    try { target = new URL(item.url); } catch { continue; }
    const product = /^\/(?:(?:zh|es|fr|ar)\/)?products\/[a-z0-9-]+\/$/.test(target.pathname);
    const swatch = /^\/(?:(?:zh|es|fr|ar)\/)?color-studio\/$/.test(target.pathname) && /^\?q=YN-\d{4}$/.test(target.search);
    if (target.origin !== 'https://yunnianfilm.com' || !(product || swatch)) continue;
    const link = document.createElement('a');
    link.className = 'model-link';
    link.href = target.href;
    link.textContent = item.label;
    link.target = '_blank';
    link.rel = 'noopener';
    reply.append(link);
  }
  if (data.sources?.length) {
    const details = document.createElement('details'), label = document.createElement('summary'), list = document.createElement('ul');
    details.className = 'references';
    label.textContent = t('Sources', '资料出处') + ' (' + data.sources.length + ')';
    for (const source of data.sources) {
      const row = document.createElement('li');
      row.textContent = source;
      list.append(row);
    }
    details.append(label, list);
    reply.append(details);
  }
  const notes = [];
  if (data.mode === 'local_chat' && provider?.checked) notes.push(t('Answered by local AI', '本机 AI 回复'));
  if (data.mode === 'knowledge_fallback') notes.push(t('AI unavailable · Answer from the guide', 'AI 暂不可用，已根据资料回复'));
  if (data.handoff) notes.push(t('Saved for team review', '已记录，待团队跟进'));
  if (notes.length) {
    const status = document.createElement('div');
    status.className = 'status-note';
    status.textContent = notes.join(' · ');
    reply.append(status);
  }
  thread.scrollTop = thread.scrollHeight;
}
async function submit(action, message) {
  const response = await fetch(base + '/api/' + action, {method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({session, message, locale, ...(action === 'chat' ? {chat_provider:providerName()} : {})})});
  if (!response.ok) throw new Error(response.status === 429 ? t('Please wait a minute and try again.', '请稍等一分钟再试。') :
    t('Could not submit. Please try again.', '提交未成功，请再试一次。'));
  const data = await response.json();
  if (data.session) {
    session = data.session;
    sessionStorage.setItem(sessionKey(), session);
  }
  return data;
}
async function ask(message, fromField) {
  if (busy || !message) return;
  busy = true;
  welcome.hidden = true;
  if (fromField) field.value = '';
  resizeField();
  add(message, 'user');
  const pending = add(t('Thinking…', '正在回复…'), 'assistant pending');
  try {
    const data = await submit('chat', message);
    pending.remove();
    showReply(data);
  } catch (error) {
    pending.remove();
    add(error instanceof TypeError ? t('Connection interrupted. Please try again.', '连接中断，请再试一次。') : error.message, 'assistant');
    if (!field.value) field.value = message;
  } finally {
    busy = false;
    resizeField();
    if (fromField && document.activeElement === send && matchMedia('(pointer:fine)').matches) field.focus();
  }
}
$('#chat-form').addEventListener('submit', event => { event.preventDefault(); ask(field.value.trim(), true); });
field.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && !matchMedia('(pointer:coarse)').matches) {
    event.preventDefault();
    $('#chat-form').requestSubmit();
  }
});
for (const button of exampleButtons) {
  const find = button.dataset.example === 'find';
  button.textContent = find ? t('Find a window film by thickness', '按膜厚找窗膜') : t('Compare two models', '对比两个型号');
  const question = find ? t('Show me two 3 mil titanium nitride window films.', '帮我找两款 3 mil 的氮化钛窗膜。') :
    t('Compare LX70 and VK7095HD. Which is thicker?', 'LX70 和 VK7095HD 哪个更厚？');
  button.addEventListener('click', () => ask(question, false));
}
$('#contact-form').addEventListener('submit', async event => {
  event.preventDefault();
  const message = contact.value.trim();
  if (busy || !message) return;
  if (!hosted && !session) {
    saved.textContent = t('Start the chat before leaving your details.', '请先发起对话，再提交联系方式。');
    return;
  }
  busy = true;
  updateControls();
  contactButton.textContent = t('Submitting…', '提交中…');
  saved.textContent = '';
  try {
    const data = await submit('contact', message);
    saved.textContent = t('Saved for the team. Reference ', '已提交，编号 ') + data.ticket.slice(0,8);
    if (contact.value.trim() === message) contact.value = '';
  } catch (error) {
    saved.textContent = error instanceof TypeError ? t('Connection interrupted. Please try again.', '连接中断，请再试一次。') : error.message;
  } finally {
    actionLabel(contactButton, contactLabel);
    busy = false;
    updateControls();
  }
});
updateControls();

}
startChat();
