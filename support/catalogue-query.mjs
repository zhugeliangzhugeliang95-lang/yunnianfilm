// This lookup receives only rows approved for public display.
const windowTerm = /窗膜|玻璃膜|隔热膜|氮化钛|碳化钛|window (?:films?|tints?)|titanium (?:nitride|carbide)/i;
const otherProduct = /TPU|PPF|PVC|车衣|改色膜|车灯膜|paint protection|headlight film/i;
const specRequest = /型号|规格|尺寸|宽|多长|厚|薄|比较|对比|区别|差别|哪[几些款个]|列[举出]|几款|推荐.{0,4}款|每卷|一卷|各多少|\b(?:models?|options?|dimensions?|sizes?|specs?|compare|differences?|differ|versus|vs\.?|rolls?|list|thick\w*|thin\w*|wide|long)\b/i;
const reference = /那|这[几两三款个些]|刚才|上一|第[一二三四五六七八\d]|改[成为]|换成|它|两者|what about|how about|those|these|their|the (?:first|second|third)|instead|\b(?:both|it|them)\b/i;
const otherIntent = /翻译|英文怎么|写一|文案|笑话|为什么|为何|适合|怎么选|原理|安装|施工|定义|材质|是什么|采购建议|translate|rewrite|slogan|why|how to|how do|suitable|recommend.{0,20}for|best for|install/i;
const business = /报价|价格|多少钱|折扣|发货|交期|库存|质保|保修|起订|认证|样品|人工|投诉|\b(?:pric\w*|cost|quot\w*|how much|warranty|stock|discount|sample|MOQ|certif\w*|shipping|delivery|human|sales rep)\b/i;
const optics = /透光|隔热率|更隔热|更遮光|紫外|红外|隔绝|阻隔|防晒|合规|合法|性能|效果|\b(?:VLT|IRR|TSER|UV|heat rejection|legal|performance|transmission)\b/i;
const normalize = s => s.normalize('NFKC').replace(/[‐‑–—]/g,'-').toUpperCase();

export function mentionedModels(text, models) {
  const body = normalize(text);
  const hits = [];
  for (const row of models) {
    const name = normalize(row.model);
    let index = body.indexOf(name);
    while (index >= 0) {
      if (!/[A-Z0-9-]/.test(body.charAt(index - 1)) && !/[A-Z0-9-]/.test(body.charAt(index + name.length))) {
        hits.push([index, row]);
        break;
      }
      index = body.indexOf(name, index + 1);
    }
  }
  return hits.sort(([a], [b]) => a - b).map(([, row]) => row);
}

function seriesIn(text) {
  if (/氮化钛|\bnitride\b/i.test(text)) return 'nitride';
  if (/碳化钛|\bcarbide\b/i.test(text)) return 'carbide';
  return '';
}

function thicknessFilter(text) {
  const value = text.match(/(\d+(?:\.\d+)?)\s*-?\s*(?:mils?\b|密耳)/i);
  if (!value) return null;
  const n = Number(value[1]);
  if (/至少|不低于|以上|at least|or more/i.test(text)) return x => x >= n;
  if (/至多|不超过|不高于|以下|at most|or less|up to/i.test(text)) return x => x <= n;
  if (/超过|大于|more than|over\s+\d|thicker than/i.test(text)) return x => x > n;
  if (/低于|小于|less than|under\s+\d|thinner than/i.test(text)) return x => x < n;
  return x => x === n;
}

const numbers = {一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,first:1,second:2,third:3};
function numberWord(word) { return numbers[word.toLowerCase()] ?? Number(word); }
const isWindow = row => row.id.startsWith('window-');
const nameForSeries = (row, cn) => row.id.startsWith('window-nitride-') ? (cn ? '氮化钛' : 'titanium nitride') : (cn ? '碳化钛' : 'titanium carbide');
function answer(text, rows, cn) {
  const groups = new Map();
  for (const row of rows) {
    if (!row.page || !/^[a-z0-9-]+$/.test(row.page)) continue;
    if (!groups.has(row.page)) groups.set(row.page, []);
    groups.get(row.page).push(row.model);
  }
  const links = Array.from(groups, ([slug, names]) => ({
    label: names.join(' / ') + (cn ? ' 型号表' : ' model table'),
    url: 'https://yunnianfilm.com/' + (cn ? 'zh/' : '') + 'products/' + slug + '/#model-library'
  }));
  return {answer:text, sources:[...new Set(rows.map(row => row.source))], links, handoff:false, mode:'knowledge_direct'};
}

export function queryWindowFilms(text, history, models, cn) {
  if (business.test(text) || otherIntent.test(text) || otherProduct.test(text)) return null;
  // Leave compound or qualitative comparisons to the conversational assistant.
  if (/\d(?:\.\d+)?\s*(?:mils?)?\s*(?:[-~～至到或与和]|to\b|or\b|and\b)\s*\d/i.test(text) ||
      (/氮化钛|nitride/i.test(text) && /碳化钛|carbide/i.test(text))) return null;
  const current = mentionedModels(text, models);
  if (current.some(row => !isWindow(row))) return null;
  const last = history.at(-1) || {question:'', answer:''};
  const listed = last.answer.split('\n').filter(line => line.includes(' · ')).join('\n');
  const previous = mentionedModels(listed || last.answer, models).filter(isWindow);
  const mil = thicknessFilter(text);
  const series = seriesIn(text);
  const spec = specRequest.test(text);
  const referring = reference.test(text);
  const lastWasWindow = windowTerm.test(last.question) || previous.length > 0;
  if (!windowTerm.test(text) && !current.length && !(lastWasWindow && (spec || referring || mil || series))) return null;

  const prose = current.reduce((s, row) => s.replace(normalize(row.model), ''), normalize(text));
  if (!/[\u4e00-\u9fff]/.test(prose) && /\b[A-Z]{2,}\b/.test(prose)) cn = false;
  if (optics.test(text)) {
    if (!/透光率|隔热率|紫外线阻隔率|红外线阻隔率|VLT|TSER|IRR|heat rejection|light transmission/i.test(text) ||
        /解释|指什么|意思|定义|区别|meaning|explain|stand for|what (?:is|does) (?:VLT|TSER|IRR)\??$/i.test(text)) return null;
    const rows = current.length ? current : previous;
    if (!rows.length) return null;
    const names = rows.map(row => row.model).join(' / ');
    const detail = rows.every(row => row.page)
      ? (cn ? '你可以打开下方型号表查看原始技术参数。' : 'You can open the linked model tables for the published figures.')
      : (cn ? '我把问题留给技术同事核对。' : 'I’ll flag the missing figure for our team to check.');
    const result = answer((cn ? '我能从选型表核实 '+names+' 的膜厚和卷材尺寸。' :
      'For '+names+', the selection sheet confirms thickness and roll dimensions. ') + detail, rows, cn);
    if (rows.every(row => row.page)) return result;
    return {...result, handoff:true};
  }
  const namesOnly = current.length && current.reduce((s,r) => s.replace(normalize(r.model),''), normalize(text)).replace(/\b(?:AND|VS|VERSUS)\b|[\s、，,。？?和与&/]/g,'') === '';
  const ordinal = text.match(/第\s*([一二三四五六七八1-8])\s*(?:个|款|种)?|\b(?:the )?(first|second|third)(?: one| model| option)?\b/i);
  if (!spec && !mil && !namesOnly && !(referring && (series || ordinal))) return null;
  let rows = current;
  if (!rows.length && !mil && !series && !windowTerm.test(text)) {
    rows = previous;
    if (ordinal) {
      const selected = rows[numberWord(ordinal[1] || ordinal[2]) - 1];
      if (!selected) return null;
      rows = [selected];
    }
  }
  if (rows.length && (series || mil) && rows.some(r => (series && !r.id.startsWith('window-'+series+'-')) || (mil && !mil(r.mil)))) return null;
  const listing = !rows.length;
  if (listing) {
    // Retain filters only across consecutive catalogue turns and only for an explicit refinement.
    let family = series, thickness = mil;
    if (referring && lastWasWindow) {
      for (const turn of history.slice().reverse()) {
        if (!windowTerm.test(turn.question) && !reference.test(turn.question) && !thicknessFilter(turn.question)) break;
        family ||= seriesIn(turn.question);
        thickness ||= thicknessFilter(turn.question);
        if (!reference.test(turn.question)) break;
      }
    }
    rows = models.filter(row => isWindow(row) && (!family || row.id.startsWith('window-'+family+'-')) && (!thickness || thickness(row.mil)));
  }
  if (!rows.length) return answer(cn ? '公开窗膜规格表里没有符合这个条件的型号。可以换一个膜厚或系列查。' : 'There’s no match for that combination in our public window-film sheet. Try a different thickness or series.', [], cn);
  const quantity = text.match(/([一二两三四五六七八1-8])\s*(?:个型号|款|种型号)|\b(?:show|list|give me|pick|suggest)\s+(?:me\s+)?(one|two|three|four|five|six|seven|eight|[1-8])\b/i);
  const shown = listing ? rows.slice(0, quantity ? numberWord(quantity[1] || quantity[2]) : 3) : rows;
  const lines = [];
  if (listing) {
    if (cn) lines.push('规格表里有 '+rows.length+' 款符合条件'+(shown.length<rows.length ? '，先列 '+shown.length+' 款。' : '。'));
    else lines.push(rows.length+' matching '+(rows.length===1?'model':'models')+' in the sheet.'+(shown.length<rows.length?' Here are '+shown.length+'.':''));
  }
  if (!listing && rows.length === 2 && /比|厚|薄|差别|区别|compare|differ|versus|\bvs\b|thick|thin/i.test(text)) {
    const [a,b] = [...rows].sort((x,y) => y.mil-x.mil);
    const diff = Number((a.mil-b.mil).toFixed(3));
    if (!diff) lines.push(cn ? '两款标注的厚度相同。' : 'Both have the same listed thickness.');
    else lines.push(cn ? a.model+' 比 '+b.model+' 厚 '+diff+' mil。' : a.model+' is '+diff+' mil thicker than '+b.model+'.');
  }
  for (const row of shown) {
    const size = row.size.replace(/\s*[x×*]\s*/gi,' × ');
    if (!listing && shown.length === 1) {
      lines.push(cn ? row.model+' 属于'+nameForSeries(row,true)+'系列，膜厚 '+row.mil+' mil，每卷 '+size+'。' :
        row.model+' is a '+row.mil+' mil '+nameForSeries(row,false)+' film. Each roll measures '+size+'.');
    } else lines.push([row.model, nameForSeries(row,cn), row.mil+' mil', size].join(' · '));
  }
  return answer(lines.join('\n'), shown, cn);
}
