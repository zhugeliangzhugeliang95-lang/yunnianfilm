import {copyFor} from '../public/catalog-ui/product-view.js';
// Product identities, specifications and links always come from the public storefront record.
const folded = value => String(value || '').normalize('NFKC').replace(/[®™]/g,'').replace(/[‐‑–—]/g,'-').toLowerCase().trim();
const foldName = value => folded(String(value || '').replace(/[®™]/g,'')).replace(/\s+/g,' ');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const supplierNames = [
  ['路博润','Lubrizol','Loburun'], ['巴斯夫','BASF'], ['科思创','Covestro'], ['万华','Wanhua'],
];
const ordinal = /第\s*([一二三四1234])\s*(?:款|种|个)|\b(first|second|third|fourth)(?: one| option| film)?\b/i;
const follow = /这[款个两种]|那[款个两种]|第[一二三四1234]|它|呢[？?]?$|多厚|厚度|哑光|亮面|涂层|卷宽|规格|颜色|透光率|[\d.]\s*mil|\b(it|those|these|that one|the other|first|second|third|fourth|thickness|matte|gloss|coating|finishes|colors|colours)\b/i;
const productIntent = /车衣|汽车膜|[窗灯贴]膜|漆面|改色|产品|基材|系列|型号|颜色|车漆|玻璃|防护膜|贴车|透光|隔热|保护膜|涂层|色卡|\b(films?|tints?|ppf|wraps?|tpu|products?|paint|material|substrate|model|catalog\w*|windscreen|headlights?|sunroof|VLT)\b/i;
const optical = /透光|红外|紫外|总太阳能|隔热率|雾度|\b(VLT|IRR\w*|UV|TSER|haze|transmittance|transmission|rejection)\b/i;
const business = /多少钱|价格|报价|库存|现货|质保|认证|出货|交期|起订|样品|人工|代理|授权|原料|颗粒|\b(price|pricing|quote|stock|warranty|certified|dealer|distributor|resin|pellets|MOQ|sample|delivery|human)\b/i;
const thicknessKey = /^(?:(?:listed |film )?thickness|厚度|标示厚度|膜厚)$/i;
const finishKey = /^(?:finishes|finish|表面质感|表面效果)$/i;
const localeNames = new Set(['en','zh','es','fr','ar']);

function namesFor(product) {
  const names = new Set([product.slug, ...Object.values(product.copy).map(c=>c.name)]);
  const identity = foldName([product.copy.en?.name,product.copy.en?.material,product.copy.zh?.name,product.copy.zh?.material].join(' '));
  for (const group of supplierNames) if (group.slice(0,2).some(s=>identity.includes(foldName(s)))) group.forEach(s=>names.add(s));
  for (const code of identity.match(/\b(?:[a-z]{1,8}[- ]?\d+[a-z\d-]*|elastollan)\b/g) || []) names.add(code);
  const zh = product.copy.zh?.name || '';
  const stem = zh.split(/\s+(?:TPU|PET|APC|KPU)\s/i)[0].replace(/(?:TPU\s*)?(?:汽车窗膜|汽车膜|彩色车衣|隐形车衣|保护膜|窗膜|大灯膜|改色膜)$/,'').trim();
  if (stem.length >= 2 && !/^(?:透明|汽车|彩色|纳米|陶瓷|tpu|pet|pvc)$/i.test(stem)) names.add(stem);
  return [...names].filter(Boolean);
}
const patterns = new Map();
function namePattern(name) {
  const token = foldName(name);
  if (patterns.has(token)) return patterns.get(token);
  const pattern = escapeRegExp(token).replace(/([a-z])[- ]?(\d)/g,'$1[- ]?$2');
  const regex = new RegExp((/^[a-z0-9]/.test(token)?'(?<![a-z0-9])':'')+pattern+(/[a-z0-9]$/.test(token)?'(?![a-z0-9])':''));
  if(patterns.size>6500)patterns.clear();
  patterns.set(token,regex);
  return regex;
}
function find(text, name) {return text.search(namePattern(name));}
function matches(text, products) {
  const query = foldName(text);
  if (!query) return [];
  const found = [];
  for (const p of products) {
    const candidates = namesFor(p).map(n=>[find(query,n),foldName(n).length]).filter(([i])=>i>=0);
    for (const v of p.variants || []) {
      if (v.kind==='spec' || /^\d/.test(v.value)) continue;
      for (const label of new Set([v.value,v.labels?.zh].filter(s=>s && s.length>=3))) {
        const i=find(query,label);
        if(i>=0)candidates.push([i,foldName(label).length]);
      }
    }
    for(const table of p.tables || []) {
      if(!/^(model|color code|型号|色号)/i.test(table.columns[0]))continue;
      for(const row of table.rows) {
        if(!row[0] || row[0].length<3)continue;
        const i=find(query,row[0]);
        if(i>=0)candidates.push([i,foldName(row[0]).length]);
      }
    }
    for (const [pos,len] of candidates) found.push({p,pos,len});
  }
  // Prefer the complete product name when a shorter family name is contained in it.
  found.sort((a,b)=>a.pos-b.pos || b.len-a.len);
  const seen = new Set(), kept = [];
  for (const hit of found) {
    if (seen.has(hit.p.slug) || kept.some(k => k.len>hit.len && hit.pos>=k.pos && hit.pos+hit.len<=k.pos+k.len)) continue;
    kept.push(hit); seen.add(hit.p.slug);
  }
  return kept.map(x=>x.p);
}
function rowFor(p,lang,words) {
  const c = copyFor(p,lang);
  const specValue=key=>p.specs.find(([k])=>key.test(k))?.[1] || '';
  const finish=specValue(finishKey), coating=specValue(/^(?:topcoat|coating options|coating|涂层|涂层选项|表面涂层)$/i);
  const relative = (lang==='en'?'':'/'+lang)+'/products/'+p.slug+'/';
  const thickness = p.specs.find(([k])=>thicknessKey.test(k))?.[1] || '';
  return {
    id:'series-'+p.slug, name:c.name, material:c.material, description:c.description, category:p.category,
    specs:p.specs, tables:p.tables || [], variants:(p.variants || []).map(v=>v.labels?.[lang] || v.value),
    thickness, finish:words[finish] || finish, coating:words[coating] || coating,
    link:{label:c.name,url:'https://yunnianfilm.com'+relative},
  };
}
const simpleWords = /请问|你好|想要|了解|看看|介绍|一下|你们|给我|推荐|产品|系列|车衣|哪些|什么|没有|[请我想要有的看你这那款个种卖膜吗呢和与]|\b(?:i|we|hi|hello|do|you|have|carry|sell|any|a|an|the|would|like|want|need|your|our|can|get|please|show|me|tell|about|looking|for|films?|products?|range|ppf|and|from|made|with|using)\b|[\s，。、？！,.?!’'-]/gi;
function isSimple(text, products) {
  let rest = foldName(text);
  for (const n of products.flatMap(namesFor).sort((a,b)=>b.length-a.length)) {
    rest=rest.replace(namePattern(n),' ');
  }
  return !rest.replace(simpleWords,'');
}
function direct(text, products, rows, lang, explicit, prior) {
  const cn=lang==='zh';
  if(!rows.length || !['zh','en'].includes(lang) || business.test(text))return null;
  let answer;
  const r=rows[0];
  const dims = text.match(/(\d+(?:\.\d+)?)\s*(?:mils?\b|密耳)/i);
  const wantsMatte = /哑光|亚光|\bmatte?\b/i.test(text);
  const wantsGloss = /亮面|亮光|\bgloss(?:y)?\b/i.test(text);
  const simpleSpec = /^(?!.*(?:比|更|不想|不要|至少|以上|以下|为什么|如何|适合|推荐|区别|和|还是|\b(?:not|more|than|less|or|and|why|better|least|recommend|compare)\b)).{0,65}$/i.test(text);
  // Match the model and the column together. Preserve the exact unit supplied in the table.
  const query=foldName(text);
  const metrics=[
    [/透光率|可见光透过率|\bVLT\b|visible light transmi/i,/^VLT%?$/i],
    [/\bTSER\b|总太阳能阻隔率/i,/^TSER%?$/i],
    [/\bIRR\s*950\b|950\s*nm/i,/^IRR\s*950/i],
    [/\bIRR\s*1400\b|1400\s*nm/i,/^IRR\s*1400/i],
    [/雾度|\bhaze\b/i,/^Haze$/i],
  ].filter(([q])=>q.test(text));
  if(metrics.length && !/翻译|为什么|怎么|原理|意思|解释|推荐|合法|translate|why|mean|explain|legal|recommend/i.test(text)) {
    const lines=[];
    for(const row of rows) for(const table of row.tables) {
      if(!/^(?:model|型号)/i.test(table.columns[0]))continue;
      for(const cells of table.rows) {
        if(!cells[0] || find(query,cells[0])<0)continue;
        for(const [,pattern] of metrics) {
          const i=table.columns.findIndex(c=>pattern.test(c));
          if(i<0 || !cells[i])continue;
          const key=table.columns[i].replace(/%$/,'');
          lines.push(cells[0]+' · '+key+' '+cells[i]+(/^0\.\d+$/.test(cells[i])?(cn?'（表中原值）':' (as listed)'):''));
        }
      }
    }
    if(lines.length)answer=[...new Set(lines)].join('\n');
  }
  if (answer) {
    return {answer,mode:'knowledge_direct',handoff:false,links:rows.map(r=>r.link),sources:rows.map(r=>r.name)};
  }
  const asksCoating=/什么意思|有什么用|什么作用|是什么|解释|what does|what is|explain|how does/i.test(text);
  if(rows.length===1 && asksCoating && /疏水|hydrophobic/i.test(text) && /疏水|hydrophobic/i.test(r.coating) &&
     !/亲水|区别|防污|划痕|耐|寿命|油|hydrophilic|compare|scratch|durab|warranty|stain|damage|oil/i.test(text)) {
    answer=cn?'疏水说的是水落在膜上的样子：它更容易聚成水珠。'+r.name+' 的产品页列有疏水涂层。':
      'Hydrophobic means water tends to bead up on the surface. The product page for '+r.name+' lists a hydrophobic coating.';
    return {answer,mode:'knowledge_direct',handoff:false,links:[r.link],sources:[r.name]};
  }
  const compare = /区别|不同|对比|比较|有什么差别|difference|compare|versus|\bvs\b/i.test(text);
  const coatings = rows.map(row=>row.coating);
  if(rows.length===2 && rows.every(row=>row.category==='Clear PPF') && compare &&
      !/耐|防|寿命|施工|怎么选|选哪|适合|光泽|价格|性能|光学|建议|durab|strong|last|install|recommend|better|resist/i.test(text)) {
    const sameThickness=rows[0].thickness && rows[0].thickness===rows[1].thickness;
    answer=rows.map((row,i)=>row.name+(cn?'采用':' uses ')+row.material+(coatings[i]?(cn?'，涂层为 ':'; coating: ')+coatings[i]:'')+(cn?'。':'.')).join('\n');
    if(sameThickness)answer+=cn?'\n两款的厚度选项相同，都是 '+r.thickness+'。':'\nBoth list the same thickness options: '+r.thickness+'.';
    return {answer,mode:'knowledge_direct',handoff:false,links:rows.map(r=>r.link),sources:rows.map(r=>r.name)};
  }
  if (rows.length===1 && simpleSpec && !optical.test(text) && !/防|耐|寿命|划痕|安装|durab|resist|protect|install|last/i.test(text) && dims && /哑光|亚光|\bmatte?\b|亮面|亮光|\bgloss(?:y)?\b/i.test(text) && products[0].variants.some(v=>v.kind==='spec')) {
    const labels=products[0].variants.filter(v=>v.kind==='spec' && Number(v.value.match(/(\d+(?:\.\d+)?)\s*mil/i)?.[1])===Number(dims[1]) && (!wantsMatte||/matte|哑光/i.test(v.value)) && (!wantsGloss||/gloss|亮面/i.test(v.value)));
    answer=labels.length?(cn?'有，'+r.name+' 的目录里列有「'+(labels[0].labels?.zh || labels[0].value)+'」。':r.name+' lists '+labels[0].value+'.'):
      (cn?r.name+' 的目录里没有列出这个组合。':'That combination is not listed for '+r.name+'.');
  } else if(rows.length===1 && simpleSpec && /^(?:那|这款|它|有|是|什么|多少|的|可选|选|几个|哪几种|哪些|厚度|多厚|膜厚|规格|呢|吗|[\s？?。，.]|how |what |is |its |the |film |thick(?:ness)?|options?|are |available)*$/i.test(text) && r.thickness && /厚|thick/i.test(text)) {
    answer=cn?r.name+' 的厚度有 '+r.thickness+'。':r.name+' comes in '+r.thickness+'.';
  } else if((explicit && isSimple(text,products)) || (!explicit && prior && ordinal.test(text) && text.length<26 && !/厚|涂层|价格|价|颜色|thick|coat/i.test(text))) {
    answer=rows.map(row=>{
      const lead=cn?(row.category==='Clear PPF'?'这款云辇透明车衣采用'+row.material+' 基材。':row.name+'。'+row.description):
        (row.category==='Clear PPF'?'Our '+row.name+' uses '+row.material+' as its substrate.':row.name+'. '+row.description);
      return lead+(row.thickness?(cn?'厚度有 '+row.thickness+'。':' Thickness options: '+row.thickness+'.'):'')+
        (row.finish?(cn?'表面可选'+row.finish+'。':' Finishes: '+row.finish+'.'):'');
    }).join('\n');
  }
  return answer?{answer,mode:'knowledge_direct',handoff:false,links:rows.map(r=>r.link),sources:rows.map(r=>r.name)}:null;
}

const colorIndexes=new WeakMap();
function colorMatches(text,colors) {
  let index=colorIndexes.get(colors);
  if(!index) {
    index=colors.map(card=>({card,names:[...new Set(Object.values(card.names).map(foldName))].filter(n=>n.length>=3)}));
    colorIndexes.set(colors,index);
  }
  const query=foldName(text);
  const codes=new Set([...query.matchAll(/\byn[- ]?(\d{4})(?!\d)/g)].map(m=>'YN-'+m[1]));
  if(codes.size)return colors.filter(c=>codes.has(c.ref));
  return index.filter(({names})=>names.some(n=>query.includes(n) && find(query,n)>=0)).map(x=>x.card);
}
function colorRecord(c,lang) {
  const name=c.ref+' · '+c.names[lang], link={label:name,url:'https://yunnianfilm.com/'+(lang==='en'?'':lang+'/')+'color-studio/?q='+c.ref};
  const description=c.names.en+' · '+(lang==='zh'?c.finishZh:c.finish);
  return {id:'color-'+c.ref,name,description,material:'',category:'Color card',specs:[['Published finish',c.finish]],tables:[],
    variants:[],thickness:'',finish:c.finish,link};
}

export function querySeries(text, history, catalog, requestedLocale, selectedIds=[]) {
  const lang=localeNames.has(requestedLocale)?requestedLocale:'en';
  const products=catalog.products, words=catalog.words?.[lang] || {};
  const colors=catalog.colors || [];
  let swatches=colorMatches(text,colors);
  const explicit=matches(text,products);
  if(!swatches.length && !explicit.length &&
      (/(?:改色|车衣|车膜|色卡|颜色|色系|几款.*色|有没有.*色)|\b(?:wraps?|swatches|colou?rs?|finishes)\b/i.test(text)) &&
      !/(?:原车色|保持|不改色|不想|不要)|\b(?:original|keep|avoid|not)\b/i.test(text)) {
    const family=(catalog.colorFamilies || []).filter(f=>{
      const terms=[f.id,...f.zh.split(' / '),...f.en.toLowerCase().split(' / ')];
      return terms.some(term=>find(foldName(text),term)>=0);
    });
    if(family.length===1) {
      const all=colors.filter(c=>c.families.includes(family[0].id));
      const finish=/缎面|\bsatin\b/i.test(text)?'Satin':/哑光|哑面|亚光|\bmatte?\b/i.test(text)?'Matte':/亮面|亮光|\bgloss(?:y)?\b/i.test(text)?'Gloss':'';
      const pool=finish?all.filter(c=>c.finish===finish):all;
      if(pool.length)swatches=pool.slice(0,4);
      const simple=lang==='zh'?/^(?:(?:我想|我要|你们|请问|有哪几款|给我|看看|推荐|有哪些|有没有|什么|有|的|几款|色卡|色系|颜色|改色膜|车衣|贴膜|可以|吗|呢|[？?。，、\s])|(?:绿色|蓝色|红色|粉色|紫色|黄色|橙色|金色|银色|灰色|白色|黑色|棕色|铜色|米色|缎面|哑光|亮面))+$/i:
        /^(?:(?:do|you|have|carry|show|me|some|any|which|what|are|the|available|wraps?|in|colou?rs?|swatches|options|gloss|matte|satin|green|blue|red|pink|purple|yellow|orange|gold|silver|gray|grey|white|black|brown|beige)\b|[ ?.])+$/i;
      if(pool.length && ['zh','en'].includes(lang) && simple.test(text)) {
        const records=swatches.map(c=>colorRecord(c,lang)), names=records.map(r=>r.name).join(lang==='zh'?'、':', ');
        const answer=lang==='zh'?'色卡里有 '+pool.length+' 款符合，你可以先看'+names+'。':'There are '+pool.length+' matching cards. Here are a few to start with: '+names+'.';
        return {records,index:[],needsDiscovery:false,optical:false,direct:{answer,mode:'knowledge_direct',handoff:false,sources:records.map(r=>r.name),links:records.map(r=>r.link)}};
      }
    }
  }
  if(!swatches.length && !explicit.length && follow.test(text) && history.length) {
    const last=history.at(-1);
    swatches=colorMatches(last.question+' '+last.answer,colors);
  }
  let selected=explicit, prior=false;
  if (!selected.length && follow.test(text)) {
    const index=text.match(ordinal);
    for(const t of [...history].reverse()) {
      const context=matches(t.answer,products);
      const previouslyNamed=matches(t.question,products);
      const candidates=previouslyNamed.length>1?previouslyNamed:context.length?context:previouslyNamed;
      if(!candidates.length && !follow.test(t.question))break;
      if(index) {
        const n={'一':1,'二':2,'三':3,'四':4,first:1,second:2,third:3,fourth:4}[index[1]||index[2]?.toLowerCase()] || Number(index[1]);
        if(!candidates[n-1])continue;
        selected=[candidates[n-1]];
      }else selected=candidates;
      if(selected.length){prior=true;break;}
    }
  }
  if(selectedIds.length)selected=products.filter(p=>selectedIds.includes('series-'+p.slug));
  const records=selected.slice(0,6).map(p=>rowFor(p,lang,words));
  const index=products.map(p=>({id:'series-'+p.slug,name:copyFor(p,lang).name,category:p.category}));
  if(swatches.length) {
    const cards=swatches.slice(0,6).map(c=>colorRecord(c,lang));
    const directColor=(!business.test(text) && !explicit.length && swatches.length===1 &&
      /^(?:\s*(?:请问|我想看|看看|查一下|色卡|show me|color card)?\s*)?YN[- ]?\d{4}\s*(?:是什么颜色|是什么色|是什么|色卡|的色卡|是哪款|[?？。])?\s*$/i.test(text))?
      {answer:cards[0].name+' · '+(lang==='zh'?swatches[0].finishZh:swatches[0].finish),sources:[cards[0].name],
       handoff:false,mode:'knowledge_direct',links:[cards[0].link]}:null;
    return {records:[...records,...cards],index,needsDiscovery:false,optical:false,direct:directColor};
  }
  return {records,index,needsDiscovery:!records.length && productIntent.test(text), optical:optical.test(text),
    direct:direct(text,selected,records,lang,explicit.length,prior)};
}
