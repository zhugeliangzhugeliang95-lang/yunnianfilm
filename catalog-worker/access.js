import {demand,json,now,readJSON} from './common.js';
const encoder=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const digest=async value=>hex(await crypto.subtle.digest('SHA-256',typeof value==='string'?encoder.encode(value):value));
const age=7*86400;
const cookieName='__Host-yn_catalog';
const cookie=(value,seconds)=>cookieName+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+seconds;
const sessionToken=req=>(req.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
async function verifier(password,salt) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256));
}
async function startSession(db, user) {
  const token=random(), key=await digest(token);
  await db.batch([
    db.prepare('DELETE FROM catalog_sessions WHERE expires<=?').bind(now()),
    db.prepare('INSERT INTO catalog_sessions VALUES(?,?,?)').bind(key,user.id,now()+age),
  ]);
  return json({login:user.login},200,{'Set-Cookie':cookie(token,age)});
}
export async function editor(req,db) {
  const value=sessionToken(req);
  if(!/^[0-9a-f]{64}$/.test(value))return null;
  return db.prepare('SELECT e.id,e.login FROM catalog_editors e JOIN catalog_sessions s ON s.editor=e.id WHERE s.digest=? AND s.expires>?').bind(await digest(value),now()).first();
}
export async function access(req,db,action) {
  if(action==='session') { const user=await editor(req,db);return json({login:user?.login||null}); }
  if(action==='logout') {
    await db.prepare('DELETE FROM catalog_sessions WHERE digest=?').bind(await digest(sessionToken(req))).run();
    return json({ok:true},200,{'Set-Cookie':cookie('',0)});
  }
  const input=await readJSON(req,3000);
  const login=String(input?.login||'').trim().normalize('NFKC').toLowerCase();
  const password=input?.password;
  demand(login.length>=2 && login.length<=100 && typeof password==='string' && password.length>=1 && password.length<=200,400,'请输入账号和密码。');
  const bucket=await digest('catalog/'+(req.headers.get('CF-Connecting-IP')||'local'));
  const instant=now();
  const [counter]=await db.batch([
    db.prepare('INSERT INTO catalog_attempts VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN expires<=? THEN 1 ELSE attempts+1 END,expires=CASE WHEN expires<=? THEN excluded.expires ELSE expires END RETURNING attempts').bind(bucket,instant+900,instant,instant),
    db.prepare('DELETE FROM catalog_attempts WHERE expires<?').bind(instant),
  ]);
  demand(counter.results[0].attempts<=15,429,'尝试次数较多，请稍后再试。');
  let user;
  if(action==='activate') {
    demand(password.length>=12 && /^[\p{L}\p{N}_.@+-]+$/u.test(login),400,'账号可用文字、数字或邮箱，密码至少需 12 个字符。');
    const token=String(input.invite||'');
    demand(/^[0-9a-f]{64}$/.test(token),400,'启用链接无效。');
    const invitation=await digest(token), id=crypto.randomUUID(), salt=random();
    const available=await db.prepare('SELECT 1 FROM catalog_invites WHERE digest=? AND claimed IS NULL AND expires>?').bind(invitation,now()).first();
    demand(available,410,'启用链接已使用或已过期。');
    const pw=await verifier(password,salt);
    try {
      const [claim]=await db.batch([
        db.prepare('UPDATE catalog_invites SET claimed=? WHERE digest=? AND claimed IS NULL AND expires>?').bind(id,invitation,now()),
        db.prepare('INSERT INTO catalog_editors(id,login,salt,verifier) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM catalog_invites WHERE digest=? AND claimed=?)').bind(id,login,salt,pw,invitation,id),
      ]);
      demand(claim.meta.changes===1,410,'启用链接已使用或已过期。');
    }catch(error){if(String(error).includes('UNIQUE'))demand(false,409,'此账号已使用，请换一个账号。');throw error;}
    user={id,login};
  }else{
    user=await db.prepare('SELECT * FROM catalog_editors WHERE login=?').bind(login).first();
    const actual=await verifier(password,user?.salt||'absent-catalog-account');
    demand(user && actual===user.verifier,401,'账号或密码不正确。');
  }
  await db.prepare('DELETE FROM catalog_attempts WHERE bucket=?').bind(bucket).run();
  return startSession(db,user);
}
