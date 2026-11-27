import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {fetchCbrRates} from './cbr-rates.mjs';
const output=process.argv[2];
if(!output?.endsWith('.json'))throw new Error('Pass the output JSON path');
let result;
for(let attempt=1;attempt<=3;attempt++){
 try{result=await fetchCbrRates();break;}
 catch(error){
  if(attempt===3)throw error;
  console.error(`CBR attempt ${attempt}: ${error.message}`);
  await new Promise(resolve=>setTimeout(resolve,2000));
 }
}
result.data.sourceSha256=createHash('sha256').update(result.bytes).digest('hex');
await mkdir(dirname(output),{recursive:true});
await writeFile(output,JSON.stringify(result.data,null,2)+'\n');
await writeFile(output.replace(/\.json$/,'.xml'),result.bytes);
console.log(`CBR: requested ${result.data.requestedDate}; effective ${result.data.effectiveDate}; USD, EUR, CNY verified`);
