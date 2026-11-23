// The release build injects only the public guide, matched catalogue fields and chat instructions.
const knowledge = __YUNNIAN_PUBLIC_KNOWLEDGE__;
const json = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'}});
const publicHosts = new Set(['yunnianfilm.com', 'www.yunnianfilm.com', 'yunnianfilm.pages.dev']);
const hex = value => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2,'0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
const id = () => crypto.randomUUID().replaceAll('-', '');
const zh = text => /[\u4e00-\u9fff]/.test(text);
const trade = /多少钱|单价|起订|质保|询价|报价|\b(?:quote|quotation|MOQ|warranty|price per roll|how much for)\b/i;
const human = /转人工|找人工|找真人|\b(?:speak|talk) to (?:a |an )?(?:human|person|representative|agent)\b/i;
const prices = /[$€¥￥]\s*\d|\d+(?:\.\d+)?\s*(?:元|美元|USD|EUR|年质保)|lifetime warranty|终身质保/i;

function redact(text) {
  return text.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[email]')
    .replace(/(?<!\w)\+?\d[\d ()-]{7,}\d(?!\w)/g,'[phone]')
    .replace(/(?:gsk_|sk-)[A-Za-z0-9_-]{12,}/g,'[key]')
    .replace(/((?:password|api[ _-]?key|密码|授权码|密钥)\s*[:：=]\s*)\S+/gi,'$1[redacted]');
}

function modelRows(text, history) {
  const mentioned = value => knowledge.models.filter(r =>
    value.toUpperCase().split(/[^A-Z0-9-]+/).includes(r.model.toUpperCase()));
  const current = mentioned(text);
  if (current.length) return current;
  for (const turn of history.slice().reverse()) {
    const matches = mentioned(turn.question + ' ' + turn.answer);
    if (matches.length) return matches;
  }
  return /型号|规格|产品表|\bmodels?\b|\bmil\b|catalog/i.test(text) ? knowledge.models : [];
}

function fallback(text, rows) {
  const cn = zh(text);
  if (trade.test(text) || human.test(text)) return {answer:cn ? '我把这条需求留给销售同事核实。你可以在下方留下邮箱，方便他们回复。' : 'I’ll flag this for our team. You can leave your email below so they can reply.',sources:[],handoff:true,mode:'knowledge_direct'};
  if (rows.length <= 3 && rows.length && /厚|规格|尺寸|thick|roll size|specification/i.test(text)) {
    return {answer:rows.map(r => cn ? r.model+' 的膜厚为 '+r.mil+' mil，卷材规格为 '+r.size+'。' : r.model+' is '+r.mil+' mil thick with a roll size of '+r.size+'.').join(' '),sources:rows.map(r=>r.source),handoff:false,mode:'knowledge_direct'};
  }
  const keepColor = /原车色|原车颜色|original (?:paint|colou?r)|keep.{0,16}colou?r/i.test(text);
  const softFinish = /不.{0,6}(?:亮面|亮闪|反光)|柔和|哑光|亚光|less (?:shine|gloss)|matte|not.{0,8}(?:glossy|shiny)/i.test(text);
  if (keepColor && softFinish) return {
    answer:cn ? '可以选透明哑光 TPU 车衣。原车颜色会透出来，表面的反光比亮面更柔和。' : 'Clear matte TPU paint protection film keeps the original color visible and softens reflections.',
    sources:knowledge.guide.finish.sources,handoff:false,mode:'knowledge_fallback'
  };
  const topics = [['finish',/哑光|亚光|亮面|matte|gloss/i],['pvc_wrap',/PVC|改色膜/i],['clear_paint',/原车色|透明|original colo[u]?r|clear film/i],['tpu_material',/TPU/i],['ppf_meaning',/PPF|车衣/i],['window',/窗膜|window film/i]];
  const topic = topics.find(([,pattern])=>pattern.test(text));
  if(topic) {
    const card=knowledge.guide[topic[0]];
    return {answer:card[cn?'zh':'en'], sources:card.sources, handoff:false,mode:'knowledge_fallback'};
  }
  return {answer:cn?'AI 暂时无法连接，请稍后再试。急需跟进的话，可以在下方留下需求。':'I’m having trouble connecting. Try again shortly, or leave a message for the team below.',sources:[],handoff:false,mode:'knowledge_fallback'};
}

async function answer(text, history, env) {
  const rows=modelRows(text, history);
  const backup = reason => ({...fallback(text, rows), engine_status:reason});
  if (human.test(text) || (trade.test(text) && !/区别|介绍|多厚|怎么选|以及|另外|比较|explain|difference|compare|\band\b/i.test(text))) return fallback(text,rows);
  if (!env.GROQ_API_KEY) return backup('unconfigured');
  const sources = Object.fromEntries(Object.entries(knowledge.guide).map(([k,v])=>[k,v.sources]));
  for (const row of rows) sources[row.id]=[row.source];
  const responseFormat = {type:'json_schema',json_schema:{name:'visitor_reply',strict:true,schema:{
    type:'object', additionalProperties:false, required:['kind','sources','handoff','answer'],
    properties:{kind:{type:'string',enum:['general','product','business']},
      sources:{type:'array',items:{type:'string',enum:Object.keys(sources)}},
      handoff:{type:'boolean'}, answer:{type:'string'}}
  }}};
  const guide=Object.fromEntries(Object.entries(knowledge.guide).map(([k,v])=>[k,v.en]));
  const context={guide,catalogue:rows.map(({id,model,mil,size})=>({id,model,mil,size}))};
  const turns=history.flatMap(t=>[{role:'user',content:redact(t.question.slice(0,1200))},{role:'assistant',content:t.answer.slice(0,1200)}]);
  try {
    const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(18000),
      headers:{Authorization:'Bearer '+env.GROQ_API_KEY,'Content-Type':'application/json','User-Agent':'YunnianCustomerService/1.0'},
      body:JSON.stringify({model:knowledge.model,reasoning_effort:'low',max_completion_tokens:1000,response_format:responseFormat,
        messages:[{role:'system',content:knowledge.prompt+'\nProducts offered: '+knowledge.range+'.\nPublic sources: '+JSON.stringify(context)},...turns,{role:'user',content:redact(text)}]})});
    if (!response.ok) {
      const err = await response.json().catch(()=>({}));
      const code = String(err?.error?.code || '').replace(/[^a-z0-9_]/gi,'').slice(0,50);
      return backup('provider_'+response.status+(code?'_'+code:''));
    }
    const choice=(await response.json()).choices?.[0];
    if(choice?.finish_reason!=='stop') return backup('incomplete');
    const result=JSON.parse(choice.message.content);
    const keys=result.sources;
    if(typeof result.answer!=='string' || !result.answer.trim() || result.answer.length>5000 ||
       !['general','business','product'].includes(result.kind) || typeof result.handoff!=='boolean' ||
       !Array.isArray(keys) || keys.some(k=>typeof k!=='string'|| !Object.hasOwn(sources,k)) ||
       (result.kind==='product' && !keys.length && !result.handoff) ||
       (result.kind!=='general' && prices.test(result.answer))) return backup('invalid_answer');
    if(result.kind!=='general' || keys.length) {
      if (/更耐磨|不发黄|更强.{0,2}保护|耐刮|自修复|终身|self.heal|scratch.resistant|more durable|stronger protection/i.test(result.answer)) return backup('unverified_performance');
      const cited = rows.filter(r=>keys.includes(r.id));
      for(const match of result.answer.matchAll(/(\d+(?:\.\d+)?)\s*mil\b/gi)) {
        if(!cited.some(r=>Number(r.mil)===Number(match[1]))) return backup('unverified_specification');
      }
    }
    const handoff=result.handoff || (result.kind!=='general' && trade.test(text));
    return {answer:result.answer,sources:[...new Set(keys.flatMap(k=>sources[k]))],handoff,mode:'groq_chat'};
  } catch (error) { return backup(error instanceof SyntaxError?'invalid_format':'connection_failed'); }
}

async function withinLimit(db,ip,now) {
  const bucket=Math.floor(now/60);
  const hashed=await digest(bucket+'|'+ip);
  const increment=key=>db.prepare('INSERT INTO chat_limit(bucket,hits,expires) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key,now+120);
  const [client,site]=await db.batch([increment('ip:'+hashed),increment('all:'+bucket)]);
  return client.results[0].hits<=12 && site.results[0].hits<=90;
}

async function handle(request,env,ctx) {
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/support/api/')) return env.ASSETS.fetch(request);
  const action=url.pathname.slice('/support/api/'.length);
  if(!publicHosts.has(url.hostname) || !['chat','contact'].includes(action)) return json({error:'Not found'},404);
  if(request.method!=='POST') return json({error:'POST required'},405);
  if(request.headers.get('Origin')!==url.origin) return json({error:'Origin denied'},403);
  if(!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'JSON required'},415);
  const length=Number(request.headers.get('Content-Length'));
  if(!length || length>22000) return json({error:'Invalid message size'},413);
  const data=await request.json().catch(()=>null);
  const message=typeof data?.message==='string'?data.message.trim():'';
  if(!message || message.length>(action==='chat'?4000:1000)) return json({error:'Please enter a shorter message.'},400);
  const token=data.session || id()+id();
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)) return json({error:'Invalid conversation'},400);
  const session=await digest(token);
  const now=Math.floor(Date.now()/1000), db=env.SUPPORT_DB;
  if(!await withinLimit(db,request.headers.get('CF-Connecting-IP')||'visitor',now)) return json({error:'Please wait a minute before sending another message.'},429);
  const previous=await db.prepare('SELECT question,answer FROM chat_turn WHERE session=? AND created>=? ORDER BY id DESC LIMIT 6').bind(session,now-30*86400).all();
  const history=previous.results.reverse();
  const result=action==='chat'?await answer(message, history, env):null;
  const writes=[];
  if(result) writes.push(db.prepare('INSERT INTO chat_turn(session,question,answer,created) VALUES(?,?,?,?)').bind(session,redact(message),result.answer,now));
  let ticket;
  if(!result || result.handoff) {
    ticket=id();
    // The bearer session stays in the browser. Only a non-secret correlation ID is recorded in tickets.
    const payload={channel:'website',conversation:session,history};
    if(result) payload.question=message; else payload.contact=message;
    writes.push(db.prepare('INSERT INTO website_ticket(id,kind,payload,created) VALUES(?,?,?,?)').bind(ticket,result?'handoff':'contact',JSON.stringify(payload),new Date().toISOString()));
  }
  await db.batch(writes);
  ctx.waitUntil(db.batch([db.prepare('DELETE FROM chat_limit WHERE expires<?').bind(now),db.prepare('DELETE FROM chat_turn WHERE created<?').bind(now-30*86400)]).catch(()=>{}));
  return json({...result,session:token,ticket});
}
export default {async fetch(request,env,ctx) {
  try { return await handle(request,env,ctx); }
  catch { return json({error:'Customer support is temporarily unavailable. Please try again shortly.'},503); }
}};
