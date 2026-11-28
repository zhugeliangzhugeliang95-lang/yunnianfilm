import {demand, json, readJSON} from './common.js';
import {editor} from './access.js';

const DAY=86400000;
const shanghaiDay=timestamp=>new Date(timestamp+8*3600000).toISOString().slice(0,10);
const ignored=()=>new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
let sitePaths, cachedKey;

async function isPublicPage(req,env,path) {
  if(typeof path!=='string' || path.length>500 || !path.startsWith('/') || !path.endsWith('/') || /[?#]/.test(path))return false;
  if(!sitePaths)sitePaths=(async()=>{
    const file=await env.ASSETS.fetch(new URL('/sitemap.xml',req.url).href);
    if(!file.ok)throw new Error('Sitemap unavailable');
    return new Set(Array.from((await file.text()).matchAll(/<loc>([^<]+)<\/loc>/g),m=>new URL(m[1]).pathname));
  })().catch(error=>{sitePaths=undefined;throw error;});
  if((await sitePaths).has(path))return true;
  const product=/^\/(?:zh\/|es\/|fr\/|ar\/)?products\/([a-z0-9][a-z0-9-]{0,95})\/$/.exec(path);
  return !!(product && await env.SUPPORT_DB.prepare("SELECT 1 FROM catalog_documents WHERE kind='product' AND id=? AND live IS NOT NULL").bind(product[1]).first());
}

async function dayKey(db,day,time) {
  if(cachedKey?.day===day)return cachedKey.key;
  let row=await db.prepare('SELECT salt FROM traffic_days WHERE day=?').bind(day).first();
  if(!row){
    const yesterday=shanghaiDay(time-DAY), oldest=shanghaiDay(time-89*DAY);
    const changes=await db.batch([
      db.prepare('INSERT OR IGNORE INTO traffic_days(day,salt) VALUES(?,hex(randomblob(32)))').bind(day),
      db.prepare('SELECT salt FROM traffic_days WHERE day=?').bind(day),
      db.prepare('DELETE FROM traffic_visitors WHERE day < ?').bind(yesterday),
      db.prepare('UPDATE traffic_days SET salt=NULL WHERE day < ? AND salt IS NOT NULL').bind(yesterday),
      db.prepare('DELETE FROM traffic_pages WHERE day < ?').bind(oldest),
      db.prepare('DELETE FROM traffic_days WHERE day < ?').bind(oldest),
    ]);
    row=changes[1].results[0];
  }
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(row.salt),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  cachedKey={day,key};return key;
}

export async function collectView(req,env) {
  const url=new URL(req.url);
  if(!['yunnianfilm.com','www.yunnianfilm.com','localhost','127.0.0.1','[::1]'].includes(url.hostname))return ignored();
  const agent=req.headers.get('User-Agent') || '';
  if(!agent || req.headers.get('DNT')==='1' || req.headers.get('Sec-GPC')==='1' || req.cf?.botManagement?.verifiedBot || /bot\b|crawl|spider|headless|preview|lighthouse/i.test(agent))return ignored();
  const path=(await readJSON(req,1000))?.path;
  if(!await isPublicPage(req,env,path) || await editor(req,env.SUPPORT_DB))return ignored();
  const db=env.SUPPORT_DB, time=Date.now(),day=shanghaiDay(time), key=await dayKey(db,day,time);
  const writes=[db.prepare('INSERT INTO traffic_pages(day,path,views) VALUES(?,?,1) ON CONFLICT(day,path) DO UPDATE SET views=views+1').bind(day,path)];
  const address=req.headers.get('CF-Connecting-IP');
  if(address){
    // Only the day's pseudonym is persisted. No individual paths or timestamps are attached to it.
    const hash=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(address+'\n'+agent));
    const fingerprint=Array.from(new Uint8Array(hash).slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
    writes.push(db.prepare('INSERT OR IGNORE INTO traffic_visitors(day,fingerprint) VALUES(?,?)').bind(day,fingerprint));
  }
  await db.batch(writes);
  return ignored();
}

export async function trafficReport(db,period) {
  demand(['1','7','30'].includes(period),400,'请选择今天、最近 7 天或最近 30 天。');
  const n=Number(period),now=Date.now(),end=shanghaiDay(now),start=shanghaiDay(now-(n-1)*DAY);
  const [totals,rank,first]=await db.batch([
    db.prepare('SELECT d.day,d.visitors,COALESCE(SUM(p.views),0) AS views FROM traffic_days d LEFT JOIN traffic_pages p ON p.day=d.day WHERE d.day BETWEEN ? AND ? GROUP BY d.day ORDER BY d.day').bind(start,end),
    db.prepare('SELECT path,SUM(views) AS views FROM traffic_pages WHERE day BETWEEN ? AND ? GROUP BY path ORDER BY views DESC,path LIMIT 12').bind(start,end),
    db.prepare('SELECT MIN(day) AS day FROM traffic_days'),
  ]);
  const days=new Map(totals.results.map(row=>[row.day,row]));
  const daily=Array.from({length:n},(_,i)=>{
    const day=shanghaiDay(now-(n-1-i)*DAY);
    return days.get(day) || {day,visitors:0,views:0};
  });
  return json({daily,top:rank.results,first:first.results[0].day,start,end});
}
