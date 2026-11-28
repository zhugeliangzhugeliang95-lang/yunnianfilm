export function countPublicViews() {
  const query=new URLSearchParams(location.search);
  const optedOut=navigator.doNotTrack==='1' || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl;
  if(window.top!==window || optedOut || query.has('catalog-preview') || query.has('seo-preview') ||
    !document.querySelector('link[rel="canonical"]') || document.querySelector('meta[name="robots"]')?.getAttribute('content')?.includes('noindex'))return;
  let counted=false;
  const visible=()=>{
    if(counted || document.visibilityState!=='visible')return;
    counted=true;
    fetch('/catalog-api/view',{method:'POST',credentials:'same-origin',keepalive:true,referrerPolicy:'origin',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({path:location.pathname})}).catch(()=>{});
  };
  document.addEventListener('visibilitychange',visible);
  window.addEventListener('pageshow',event=>{if(event.persisted)counted=false;visible();});
  visible();
}
