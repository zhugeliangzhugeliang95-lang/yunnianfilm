import {copyFor} from '../public/catalog-ui/product-view.js';
// Product identities, specifications and links always come from the public storefront record.
const folded = value => String(value || '').normalize('NFKC').replace(/[®™]/g,'').replace(/[‐‑–—]/g,'-').toLowerCase().trim();
const foldName = value => folded(String(value || '').replace(/[®™]/g,'')).replace(/\s+/g,' ');
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const supplierNames = [
  ['路博润','Lubrizol','Loburun'], ['巴斯夫','BASF'], ['科思创','Covestro'], ['万华','Wanhua'],
];
const ordinal = /第\s*([一二三四1234])\s*(?:款|种|个|张)|\b(first|second|third|fourth)(?: one| option| film)?\b/i;
function itemNumber(text) {
  const match=text.match(ordinal);
  if(!match)return 0;
  const value=(match[1] || match[2]).toLowerCase();
  return {一:1,二:2,三:3,四:4,first:1,second:2,third:3,fourth:4}[value] || Number(value);
}
const follow = /这[款个两种]|那[款个两种]|第[一二三四1234]|它|呢[？?]?$|多厚|厚度|哑光|亮面|涂层|卷宽|规格|颜色|透光率|接触角|剥离强度|剥离力|断裂伸长率|contact angle|peel strength|peel adhesion|elongation at break|[\d.]\s*mil|\b(it|those|these|that one|the other|first|second|third|fourth|thickness|matte|gloss|coating|finishes|colors|colours)\b/i;
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
function catalogueReply(answer, rows) {
  return {answer,mode:'knowledge_direct',handoff:false,links:rows.map(r=>r.link),sources:rows.map(r=>r.name)};
}

function fieldQuestion(text, product, row, cn) {
  let subject=foldName(text);
  for(const name of namesFor(product).sort((a,b)=>b.length-a.length))subject=subject.replace(namePattern(name),' ');
  subject=subject.replace(ordinal,' ').replace(/[，。？！,.?!]/g,' ').trim();
  // Respond to one technical question. Leave explanations, comparisons and compound requests to the model.
  const thickness=/^(?:请问|请|那|这(?:一)?款|这[个页]|页面上|它|有|是|什么|多少|的|可选|选|几个|哪几种|哪些|厚度|多厚|膜厚|规格|呢|吗|\s)+$/.test(subject) && /厚/.test(subject)
    || /^(?:(?:how|what|is|are|the|thick|thickness|thicknesses|options|does|it|come|in|this|page|film|its|available|one|product)\b|\s)+$/i.test(subject) && /thick/.test(subject);
  if(thickness && row.thickness) {
    return cn?row.name+'的标注厚度是 '+row.thickness+'。':row.name+' comes in '+row.thickness+'.';
  }
  const material=/^(?:(?:它|这款|这个|这|用的|用|采用|的|是|什么|哪种|材质|材料|基材|做的|呢|啊)|\s)+$/.test(subject) && /材质|材料|基材/.test(subject)
    || /^(?:(?:what|which|this|that|one|film|product|it|is|does|use|material|substrate|made|of|from|the)\b|[\s'’s])+$/i.test(subject) && /material|substrate|made (?:of|from)/i.test(subject);
  if(material && row.material)return cn?row.name+'使用的材料是'+row.material+'。':row.name+' uses '+row.material+'.';
  const measurements=[
    {field:/水?接触角|contact angle/i,label:cn?'水接触角':'water contact angle'},
    {field:/剥离(?:强度|力)|peel (?:strength|adhesion)/i,label:cn?'剥离强度':'peel strength'},
    {field:/断裂伸长率|elongation at break/i,label:cn?'断裂伸长率':'elongation at break'},
  ];
  const requested=measurements.filter(m=>m.field.test(text));
  if(requested.length!==1 || /what is (?:a|an) |what does|原理|什么意思|什么是|解释|为何|为什么|区别|翻译|以及|还有|和.{0,10}率|\b(and|why|means?|explain|translate|compare)\b/i.test(text))return '';
  if(!/多少|几度|数值|数据|测过|有测|\b(value|measured|degrees|data|what is|what.s|do you have)\b/i.test(text))return '';
  const [{field,label}]=requested;
  const pairs=[...row.specs,...row.tables.filter(t=>t.columns.length===2 && !/^(?:model|型号)/i.test(t.columns[0])).flatMap(t=>t.rows)];
  const values=[...new Set(pairs.filter(([k,v])=>field.test(k) && v?.trim()).map(([,v])=>v))];
  if(values.length===1)return cn?row.name+'的产品资料把'+label+'列为 '+values[0]+'。':'The product sheet for '+row.name+' lists the '+label+' as '+values[0]+'.';
  // Values in a model table may depend on the variant. Let the model read the row and its test conditions.
  if(values.length || row.tables.some(t=>t.columns.some(c=>field.test(c))) || field.test(row.description))return '';
  return cn?row.name+'的公开规格里没有列出'+label+'实测值。如果选材需要这个数据，可以向销售索取对应型号的测试报告。':
    'The public specifications for '+row.name+' don’t give a measured '+label+'. If that figure matters for your application, ask sales for the test report for this model.';
}

function direct(text, products, rows, lang, explicit, prior) {
  const cn=lang==='zh';
  if(!rows.length || !['zh','en'].includes(lang) || business.test(text))return null;
  let answer;
  const r=rows[0];
  if(rows.length===1) {
    const detail=fieldQuestion(text,products[0],r,cn);
    if(detail)return catalogueReply(detail,rows);
  }
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
  if(codes.size)return [...codes].map(code=>colors.find(c=>c.ref===code)).filter(Boolean);
  return index.filter(({names})=>names.some(n=>query.includes(n) && find(query,n)>=0)).map(x=>x.card);
}
function colorRecord(c,lang) {
  const name=c.ref+' · '+c.names[lang], link={label:name,url:'https://yunnianfilm.com/'+(lang==='en'?'':lang+'/')+'color-studio/?q='+c.ref};
  const description=c.names.en+' · '+(lang==='zh'?c.finishZh:c.finish);
  return {id:'color-'+c.ref,name,description,material:'',category:'Color card',specs:[['Published finish',c.finish]],tables:[],
    variants:[],thickness:'',finish:c.finish,link};
}

// A finish is a physical variant. Only suggest series whose public options actually include it.
function appearanceChoices(text, catalog, lang) {
  if(!['en','zh'].includes(lang) || business.test(text) ||
     /翻译|文案|对比|区别|为什么|教程|自行安装|前挡|车窗|车灯|天窗|translate|rewrite|compare|why|window|headlight|sunroof/i.test(text))return null;
  const original=/原厂漆色|原(?:厂|车)(?:的)?[漆颜]?色|保留.{0,5}车漆|不(?:想)?(?:改变|改|换)(?:车身)?(?:颜)?色|keep.{0,20}(?:paint|colou?r)|original (?:factory )?(?:paint|colou?r)|without changing.{0,16}colou?r/i.test(text);
  if(!original || /不(?:想|要|用)?保留|不要原车色|(?:don't|do not|not to) keep/i.test(text))return null;
  const lessShine=/不要.{0,3}(?:亮|反光)|不想.{0,8}(?:亮|反光)|别.{0,5}(?:亮|反光)|少[一一点些]*反光|柔和|less (?:glossy|shiny|shine|reflective)|not (?:too |so )?(?:shiny|glossy)|tone down.{0,8}shine/i.test(text);
  const noMatte=/不(?:想|要|喜欢).{0,3}[哑亚]光|(?:don.t want|not|avoid).{0,5}matte/i.test(text);
  const matte=lessShine || /[哑亚]光|哑面|\bmatt(?:e)?\b/i.test(text) && !noMatte;
  const gloss=!lessShine && /亮面|高光|有光泽|\bgloss(?:y)?\b/i.test(text);
  if(matte===gloss || (noMatte && matte) || /水接触角|防|耐|磨损|划痕|石击|隔热|透光|剥离|施工|安装|清洗|预算|便宜|最贵|抗|省钱|划算|保值|scratch|chip|abrasion|angle|peel|install|clean|budget|cheapest|heat rejection|还是|能用多久|耐不耐|寿命|硬度|和.{0,4}哪个好|how long|durab|last longer/i.test(text))return null;
  const hydrophobic=/疏水|拨水|hydrophobic|water.repellent/i.test(text);
  if(/亲水|[不避].{0,3}疏水|hydrophilic|avoid.{0,10}hydrophobic/i.test(text))return null;
  const mil=text.match(/(\d+(?:\.\d+)?)\s*(?:mils?\b|密耳)/i)?.[1];
  const options=catalog.products.filter(p=>{
    if(p.category!=='Clear PPF')return false;
    if(hydrophobic && !p.specs.some(([k,v])=>/coat|涂层/i.test(k) && /hydrophobic|疏水/i.test(v)))return false;
    return p.variants.some(v=>{
      const label=[v.value,v.labels?.en,v.labels?.zh].join(' ');
      return v.kind==='spec' && (matte?/matte|哑光|哑面/i:/gloss|亮面/i).test(label) &&
        (!mil || Number(label.match(/(\d+(?:\.\d+)?)\s*mils?\b/i)?.[1])===Number(mil));
    });
  });
  if(!options.length)return null;
  const rows=options.slice(0,2).map(p=>rowFor(p,lang,catalog.words?.[lang]||{}));
  const cn=lang==='zh', finish=matte?(cn?'透明哑光':'clear matte'):(cn?'透明亮面':'clear gloss');
  const choice=cn?'可以选'+finish+'车衣。原车颜色会透出来，'+(matte?'哑光会让反光柔和一些。':'亮面会保留光泽感。'):
    'Go with '+finish+' paint protection film. It keeps your paint color visible and '+(matte?'softens reflections.':'keeps a glossy look.');
  const names=rows.map(r=>r.name).join(cn?'、':' and ');
  const description=cn?'可以先看'+names+'，产品页都列有'+(mil?mil+' mil 的':'')+finish+'选项'+(hydrophobic?'和疏水涂层':'')+'。':
    names+' '+(rows.length===1?'lists':'both list')+' a '+(mil?mil+' mil ':'')+finish+' option'+(hydrophobic?' and a hydrophobic coating':'')+'.';
  return {records:rows,index:[],needsDiscovery:false,optical:false,direct:catalogueReply(choice+(cn?'':' ')+description,rows)};
}

export function querySeries(text, history, catalog, requestedLocale, selectedIds=[], page={}) {
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
        const answer=lang==='zh'?'色卡里有 '+pool.length+' 款符合，可以先看这几张：'+names+'。':'There are '+pool.length+' matching cards. Here are a few to start with: '+names+'.';
        return {records,index:[],needsDiscovery:false,optical:false,direct:{answer,mode:'knowledge_direct',handoff:false,sources:records.map(r=>r.name),links:records.map(r=>r.link)}};
      }
    }
  }
  if(!explicit.length && !swatches.length && !/这款|那款|这张|它能|它可以|\b(this film|that film|could it|can it|does it|will it)\b/i.test(text)) {
    const appearance=appearanceChoices(text,catalog,lang);
    if(appearance)return appearance;
  }
  const number=itemNumber(text);
  const pointsToPage=/这个页面|这页|页面上|on this (?:page|product page)|on the page|cette page|esta página|هذه الصفحة/i.test(text);
  const pointsToProduct=/^(?:那|其)?(?:水?接触角|剥离(?:力|强度)|断裂伸长率)|^what(?: is|'s) the (?:water contact angle|peel strength|elongation at break)|这款|这一款|这张膜|它的|它用|它是什么|\b(?:ce film|ce produit|cette pellicule|esta película|esta lámina|este producto)\b|هذا (?:الفيلم|المنتج)|^(?:what(?: is|'s) (?:it|this) made (?:from|of)|有多厚|多厚|厚度|膜厚|什么材质|what thickness|how thick|what finish|what material)|\b(?:this|that) (?:film|product|one)|\bits (?:finish|thickness|substrate)\b/i.test(text);
  const otherCode=/\b(?!(?:IRR|VLT|TSER)\d*\b)[a-z]{1,10}[- ]?\d{2,}[a-z0-9-]*\b/i.test(text);
  const pageProduct=page?.slug && !otherCode && !swatches.length && !explicit.length && !number && (pointsToPage || pointsToProduct)
    && products.find(p=>p.slug===page.slug);
  const pageFirst=pageProduct && (pointsToPage || page.opening || !history.length);
  let selected=explicit, prior=false, priorColors=[];
  if(!pageFirst && !explicit.length && !swatches.length && (follow.test(text) || number)) {
    for(const turn of [...history].reverse()) {
      const shown=colorMatches(turn.answer,colors);
      if(shown.length) {
        if(number && shown.length===1 && itemNumber(turn.question))continue;
        priorColors=shown;
        swatches=number?(shown[number-1]?[shown[number-1]]:[]):shown;
        break;
      }
      const named=matches(turn.question,products), shownSeries=matches(turn.answer,products);
      // Follow the order the customer actually saw. Some generic product descriptions omit the series name.
      const candidates=shownSeries.length?shownSeries:named;
      if(!candidates.length && !follow.test(turn.question))break;
      if(number && candidates.length===1 && itemNumber(turn.question))continue;
      if(number && !candidates[number-1])continue;
      selected=number?[candidates[number-1]]:candidates;
      if(selected.length){prior=true;break;}
    }
  }
  const pageFocused=Boolean(pageProduct && (pageFirst || (!selected.length && !swatches.length && !priorColors.length)));
  if(pageFocused)selected=[pageProduct];
  if(selectedIds.length)selected=products.filter(p=>selectedIds.includes('series-'+p.slug));
  const records=selected.slice(0,6).map(p=>rowFor(p,lang,words));
  const index=products.map(p=>({id:'series-'+p.slug,name:copyFor(p,lang).name,category:p.category}));
  const needsDiscovery=!records.length && !swatches.length && productIntent.test(text);
  // Give the catalogue selector the use case and material; names alone omit supplier and coating details.
  const discovery=needsDiscovery?products.map((p,i)=>{
    const copy=copyFor(p,lang);
    const features=p.specs.filter(([k])=>/^(?:application|coating options|topcoat|coating|finishes|用途|应用|表面涂层|表面质感)$/i.test(k))
      .map(([,v])=>words[v] || v);
    return {...index[i],material:copy.material,purpose:copy.description.slice(0,180),features};
  }):[];
  if(number && priorColors.length && !swatches.length && ['en','zh'].includes(lang)){
    const listed=priorColors.map(c=>colorRecord(c,lang));
    const answer=lang==='zh'?'上一条列了 '+listed.length+' 张色卡。你想看哪张？告诉我色卡编号就行。':
      'I showed '+listed.length+' color cards. Which one did you mean? You can send the YN number.';
    return {records:listed,index,needsDiscovery:false,optical:false,direct:catalogueReply(answer,listed)};
  }
  if(swatches.length) {
    const cards=swatches.slice(0,6).map(c=>colorRecord(c,lang));
    const pointsToCard=swatches.length===1 && (!records.length || priorColors.length) && ['zh','en'].includes(lang);
    const rest=foldName(text).replace(ordinal,' ').replace(/\byn[- ]?\d{4}\b/i,' ').replace(/[？?。，,.!！]/g,' ').trim();
    const asksCard=/^(?:第|那|这|一?张|款|个|的|呢|是|什么|哪个|编号|色号|叫|名字|颜色|质感|表面|吗|它|有|哑光|哑面|亚光|亮面|缎面|还是|\s)*$/.test(rest)
      || /^(?:(?:what|which|is|it|its|the|one|card|name|number|ref|reference|colou?r|finish|that|this|matte|glossy?|satin|or|does|have)\b|[\s'’s])*$/i.test(rest);
    if(pointsToCard && asksCard && !business.test(text)) {
      const c=swatches[0], r=cards[0], cn=lang==='zh';
      const detail=c.finish==='As Pictured'?(cn?'色卡上没单独标注质感，可以看原图，再用实物样卡确认。':'The card doesn’t specify a finish. Use the photo as a reference and confirm the finish with a physical swatch.'):
        (cn?'色卡标注为'+c.finishZh+'。':'The listed finish is '+c.finish.toLowerCase()+'.');
      return {records:cards,index,needsDiscovery:false,optical:false,direct:catalogueReply(r.name+(cn?'。':'. ')+detail,cards)};
    }
    const directColor=(!business.test(text) && !explicit.length && swatches.length===1 &&
      /^(?:\s*(?:请问|我想看|看看|查一下|色卡|show me|color card)?\s*)?YN[- ]?\d{4}\s*(?:是什么颜色|是什么色|是什么|色卡|的色卡|是哪款|[?？。])?\s*$/i.test(text))?
      {answer:cards[0].name+' · '+(lang==='zh'?swatches[0].finishZh:swatches[0].finish),sources:[cards[0].name],
       handoff:false,mode:'knowledge_direct',links:[cards[0].link]}:null;
    return {records:[...records,...cards],index,needsDiscovery:false,optical:false,direct:directColor};
  }
  return {records,index,discovery,pageFocused,needsDiscovery, optical:optical.test(text),
    direct:direct(text,selected,records,lang,explicit.length,prior)};
}
