import {escapeHTML as e} from '/catalog-ui/product-view.js';

const periods=[['1','今天'],['7','最近 7 天'],['30','最近 30 天']];
const names={en:'英语',zh:'中文',es:'西班牙语',fr:'法语',ar:'阿拉伯语'};
const sections={'':'首页',products:'产品目录',blog:'博客','film-lab':'3D 材料工作室','color-studio':'色卡目录',contact:'联系询盘',about:'关于云辇','tpu-paint-protection-film':'TPU 漆面保护膜',resources:'资料中心',privacy:'隐私政策',oem:'OEM 合作'};
const number=value=>Number(value).toLocaleString('zh-CN');

export function trafficControls(period){
  return '<div class="traffic-periods" role="group" aria-label="统计时间范围">'+periods.map(([v,label])=>'<button type="button" data-period="'+v+'" aria-pressed="'+(period===v)+'">'+label+'</button>').join('')+'</div>';
}

export function trafficHTML(report,period,products) {
  const {daily,top,first,start,end}=report;
  const sum=key=>daily.reduce((a,d)=>a+d[key],0);
  const maximum=Math.max(1,...daily.map(d=>d.views));
  const pageName=path=>{
    const parts=path.split('/').filter(Boolean),lang=Object.hasOwn(names,parts[0])?parts.shift():'en';
    const name=parts[0]==='products' && parts[1]?products.find(p=>p.slug===parts[1])?.zh:null;
    return (name || (parts.length>1?parts.at(-1):sections[parts[0] || ''] || parts[0]))+' · '+names[lang];
  };
  const available=d=>Boolean(first && d.day>=first);
  const metrics='<div class="traffic-metrics"><section><h2>页面浏览量</h2><strong>'+number(sum('views'))+'</strong><p>每次打开公开页面计一次。</p></section><section><h2>'+(period==='1'?'访客数（估算）':'累计访客人次（估算）')+'</h2><strong>'+number(sum('visitors'))+'</strong><p>同一天去重，跨天分别计入。</p></section></div>';
  const dates='<p class="hint traffic-dates">'+e(start)+' 至 '+e(end)+' · 北京时间'+(first?' · 最早保留记录 '+e(first):'')+'</p>';
  const trend=first?'<section class="block traffic-trend"><h2>每日趋势</h2><div class="trend-key"><span>浏览量</span><span>访客估算</span></div><div class="traffic-chart" aria-hidden="true">'+daily.map(d=>'<div'+(!available(d)?' class="untracked"':'')+' title="'+e(d.day)+'"><i style="height:'+d.views/maximum*100+'%"></i><i style="height:'+d.visitors/maximum*100+'%"></i></div>').join('')+'</div><div class="traffic-axis"><span>'+e(start.slice(5))+'</span><span>'+e(end.slice(5))+'</span></div><details><summary>查看每日明细</summary><table><thead><tr><th scope="col">日期</th><th scope="col">浏览量</th><th scope="col">访客估算</th></tr></thead><tbody>'+daily.slice().reverse().map(d=>'<tr><th scope="row">'+e(d.day)+'</th><td>'+(available(d)?number(d.views):'—')+'</td><td>'+(available(d)?number(d.visitors):'—')+'</td></tr>').join('')+'</tbody></table></details></section>':'';
  const pages=top.length?'<ol class="traffic-pages">'+top.map(p=>'<li><a href="'+e(p.path)+'" target="_blank" rel="noopener"><b>'+e(pageName(p.path))+'</b><small dir="ltr">'+e(p.path)+'</small></a><strong>'+number(p.views)+'</strong></li>').join('')+'</ol>':'<p class="hint">这段时间还没有记录到公开页面浏览。首次访问记录后，刷新即可看到数据。</p>';
  return dates+metrics+trend+'<section class="block"><h2>热门页面 <small>按浏览量排序</small></h2>'+pages+'</section>';
}
