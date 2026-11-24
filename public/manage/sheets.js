import {escapeHTML as e} from '/catalog-ui/product-view.js';

// Excel and WPS copy a rectangular selection as tab-separated text. Quoted
// cells can themselves contain newlines, tabs or doubled quotation marks.
export function readSheet(text) {
  const rows=[], row=[];
  let cell='', quoted=false;
  text=text.replace(/^\uFEFF/, '').replace(/\r\n?/g,'\n');
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(char==='"' && (quoted || cell==='')){
      if(quoted && text[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(!quoted && (char==='\t' || char==='\n')){
      row.push(cell);cell='';
      if(char==='\n')rows.push(row.splice(0));
    }else cell+=char;
  }
  if(quoted)throw new Error('有一格的引号未闭合，请从表格重新复制。');
  row.push(cell);rows.push(row);
  while(rows.length && rows.at(-1).every(value=>value===''))rows.pop();
  const [columns,...data]=rows;
  if(!columns || !columns.every(value=>value.trim()) || !data.length)throw new Error('请粘贴完整的列名和至少一行数据。');
  if(columns.length>28 || data.length>500)throw new Error('每张技术表最多支持 28 列、500 行。');
  const invalid=data.findIndex(values=>values.length!==columns.length || values.every(v=>!v.trim()));
  if(invalid>=0)throw new Error('第 '+(invalid+2)+' 行的列数或内容不完整。');
  return {columns,rows:data};
}
export function tableFields(tables) {
  const cell=(path,value,label)=>'<input aria-label="'+e(label)+'" data-bind="'+path+'" value="'+e(value)+'" dir="auto">';
  const control=(label,action,i,n)=>'<button type="button" data-sheet="'+action+'" data-table="'+i+'" data-at="'+n+'" aria-label="'+e(label)+'">'+e(label)+'</button>';
  return tables.map((table,i)=>{
    const path='tables.'+i;
    const cols=table.columns.map((name,n)=>'<th scope="col">'+cell(path+'.columns.'+n,name,'第 '+(n+1)+' 列名称')+control('删除第 '+(n+1)+' 列','remove-column',i,n)+'</th>').join('');
    const body=table.rows.map((row,r)=>'<tr>'+table.columns.map((name,c)=>'<td>'+cell(path+'.rows.'+r+'.'+c,row[c]||'','第 '+(r+1)+' 行 · '+(name||'第 '+(c+1)+' 列'))+'</td>').join('')+'<td>'+control('删除第 '+(r+1)+' 行','remove-row',i,r)+'</td></tr>').join('');
    return '<article class="tech-sheet"><div class="sheet-head"><label>表格标题（选填）'+cell(path+'.title',table.title,'表格标题')+'</label><div class="line-actions">'+control('粘贴表格','import',i,0)+control('移除整张表','remove-table',i,0)+'</div></div><div class="sheet-scroll" role="region" aria-label="可横向滚动的技术表" tabindex="0"><table><thead><tr>'+cols+'<th>操作</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="line-actions">'+control('＋ 加一行','add-row',i,0)+control('＋ 加一列','add-column',i,0)+'</div></article>';
  }).join('');
}
