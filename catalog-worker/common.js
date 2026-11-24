export class CatalogError extends Error {
  constructor(status, message) { super(message); this.status=status; }
}
export function demand(condition, status, message) {
  if (!condition) throw new CatalogError(status,message);
}
export const now = () => Math.floor(Date.now()/1000);
export function json(data, status=200, headers={}) {
  return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
}
export async function limitedBytes(request, max) {
  demand(Number(request.headers.get('Content-Length')||0)<=max,413,'文件或内容过大。');
  const stream=request.body?.getReader();
  if(!stream) return new Uint8Array();
  let length=0; const chunks=[];
  for(;;) {
    const {value,done}=await stream.read();
    if(done) break;
    length+=value.byteLength;
    if(length>max){await stream.cancel();throw new CatalogError(413,'文件或内容过大。');}
    chunks.push(value);
  }
  const bytes=new Uint8Array(length); let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
}
export async function readJSON(request, max=240000) {
  demand((request.headers.get('Content-Type')||'').split(';')[0]==='application/json',415,'请以 JSON 格式提交。');
  try { return JSON.parse(new TextDecoder().decode(await limitedBytes(request,max))); }
  catch(error){if(error instanceof CatalogError)throw error;throw new CatalogError(400,'提交内容格式有误。');}
}
let baseline;
export async function baseCatalog(request,env) {
  if (!baseline) {
    baseline=(async()=>{
      const response=await env.ASSETS.fetch(new URL('/catalog-data/base.json',request.url).href);
      if(!response.ok) throw new Error('Base catalogue unavailable');
      const value=await response.json();
      value.bySlug=new Map(value.products.map(p=>[p.slug,p]));
      return value;
    })().catch(error=>{baseline=undefined;throw error;});
  }
  return baseline;
}
