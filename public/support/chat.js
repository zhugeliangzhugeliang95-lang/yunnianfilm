const provider = document.querySelector('#use-groq');
const hosted = document.documentElement.dataset.hosted === 'true';
const base = hosted ? '/support' : '';
if (provider) provider.checked = sessionStorage.getItem('yun-chat-provider') !== 'local';
const providerName = () => hosted || provider?.checked ? 'groq' : 'local';
const sessionKey = () => 'yun-dialogue-' + providerName();
let session = sessionStorage.getItem(sessionKey()) || '';
const log = document.querySelector('#messages');
const greeting = log.firstElementChild.cloneNode(true);

function updateNotice() {
  document.querySelector('#privacy-note').textContent = provider.checked
    ? 'New chat messages go to Groq and are saved locally. / 新对话发给 Groq，并保存在本机。'
    : 'Messages stay on this computer. / 对话仅在本机处理。';
}
if (!hosted) updateNotice();
if (hosted) {
  const cn = new URLSearchParams(location.search).get('lang') === 'zh';
  document.documentElement.lang = cn ? 'zh-CN' : 'en';
  document.querySelector('#mode').textContent = cn ? '云辇产品助手' : 'YUNNIAN film assistant';
  log.firstElementChild.textContent = cn ? '你好，我是云辇的 AI 助手。想聊点什么？' : 'Hi, I’m Yun, YUNNIAN’s AI assistant. What’s on your mind?';
  document.querySelector('#message').placeholder = cn ? '给云辇助手留言…' : 'Message Yun…';
  document.querySelector('#chat-form button').textContent = cn ? '发送' : 'Send';
  document.querySelector('summary').textContent = cn ? '留下联系方式或采购需求' : 'Leave details for the team';
  document.querySelector('#contact').placeholder = cn ? '联系邮箱和采购需求' : 'Your email and enquiry';
  document.querySelector('#contact-form button').textContent = cn ? '提交给团队' : 'Save for follow-up';
  document.querySelector('#privacy-note').textContent = cn ? '对话由 Groq 处理，聊天记录用于客服跟进。' : 'Groq processes this chat. Conversations are stored for support.';
  const link = document.querySelector('#privacy-link'); link.href = cn ? '/zh/privacy/' : '/privacy/'; link.textContent = cn ? '隐私说明' : 'Privacy';
}
if (provider) provider.onchange = () => {
  sessionStorage.setItem('yun-chat-provider', providerName());
  session = sessionStorage.getItem(sessionKey()) || '';
  log.replaceChildren(greeting.cloneNode(true));
  updateNotice();
};

function add(text, role, meta = '') {
  const el = document.createElement('div');
  el.className = 'msg ' + role;
  el.textContent = text;
  if (meta) {
    const small = document.createElement('div');
    small.className = 'meta';
    small.textContent = meta;
    el.append(small);
  }
  log.append(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

document.querySelector('#chat-form').onsubmit = async event => {
  event.preventDefault();
  const field = document.querySelector('#message');
  const button = event.target.querySelector('button');
  const message = field.value.trim();
  if (!message || button.disabled) return;
  button.disabled = true;
  if (provider) provider.disabled = true;
  add(message, 'user');
  field.value = '';
  const pending = add('…', 'assistant');
  try {
    const response = await fetch(base + '/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({session, message, chat_provider: providerName()})});
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    session = data.session;
    sessionStorage.setItem(sessionKey(), session);
    const zh = /[\u4e00-\u9fff]/.test(data.answer);
    const notes = [...data.sources];
    if (data.mode === 'local_chat' && provider?.checked) notes.push(zh ? '本机 AI 回复' : 'Answered by local AI');
    if (data.mode === 'knowledge_fallback') notes.push(zh ? 'AI 暂不可用 · 资料回复' : 'AI unavailable · support fallback');
    if (data.handoff) notes.push(zh ? '已记录，待人工跟进' : 'Saved for team review');
    add(data.answer, 'assistant', notes.join(' · '));
  } catch (error) {
    add('Unable to connect. Please try again. ' + error.message, 'assistant');
  } finally {
    pending.remove();
    button.disabled = false;
    if (provider) provider.disabled = false;
    field.focus();
  }
};

document.querySelector('#contact-form').onsubmit = async event => {
  event.preventDefault();
  const button = event.target.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch(base + '/api/contact', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({session, message:document.querySelector('#contact').value})});
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    document.querySelector('#saved').textContent = (document.documentElement.lang === 'zh-CN' ? '已提交，编号 ' : 'Saved for the team. Reference: ') + data.ticket.slice(0,8);
  } catch (error) {
    document.querySelector('#saved').textContent = error.message;
  } finally {
    button.disabled = false;
  }
};

if (hosted) document.querySelectorAll('form button').forEach(button => { button.disabled = false; });
