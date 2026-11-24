import {readFile,writeFile} from 'node:fs/promises';
import {rolldown} from 'rolldown';
const worker=new URL('../dist/_worker.js',import.meta.url);
const support=await readFile(worker,'utf8');
const bundle=await rolldown({
  input:'catalog-worker/entry.js',
  plugins:[{name:'existing-support',resolveId(id){if(id==='existing-support-worker')return '\0existing-support';},load(id){if(id==='\0existing-support')return support;}}],
});
try {
  const {output}=await bundle.generate({format:'esm'});
  if(output.length!==1 || output[0].type!=='chunk')throw new Error('Expected one Pages Worker');
  await writeFile(worker,output[0].code);
} finally {await bundle.close();}
