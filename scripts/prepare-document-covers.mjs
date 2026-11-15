import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {publicLibraryDocuments} from '../content/document-library.mjs';
const run=promisify(execFile),digest=b=>createHash('sha256').update(b).digest('hex');
const metadata=JSON.parse(await readFile('content/document-covers.json','utf8'));
await mkdir('public/assets/document-covers',{recursive:true});const scratch=await mkdtemp(join(tmpdir(),'era-document-cover-'));
try{for(const d of publicLibraryDocuments){
 const pdf='public/documents/'+d.file,buffer=await readFile(pdf),sha=digest(buffer);
 if(sha!==d.sha256||buffer.length!==d.bytes)throw new Error('PDF metadata mismatch: '+d.id);
 const info=(await run('pdfinfo',[pdf])).stdout,pages=Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);if(pages!==d.pages)throw new Error('Page count mismatch: '+d.id);
 const output='public/assets/document-covers/'+d.id+'.webp';
 try{if(metadata[d.id]?.sourceSha256===sha&&digest(await readFile(output))===metadata[d.id]?.sha256){console.log('Current:',d.id);continue;}}catch{}
 const prefix=join(scratch,d.id);await run('pdftoppm',['-f','1','-singlefile','-scale-to','840','-png',pdf,prefix]);
 const python="from PIL import Image; import sys,json; im=Image.open(sys.argv[1]).convert('RGB'); im.save(sys.argv[2],format='WEBP',quality=88,method=6); print(json.dumps({'width':im.width,'height':im.height}))";
 const dimensions=JSON.parse((await run('python3',['-c',python,prefix+'.png',output])).stdout),cover=await readFile(output);
 metadata[d.id]={...dimensions,bytes:cover.length,sha256:digest(cover),sourceSha256:sha,page:1};console.log('Rendered:',d.id);
 }}finally{await rm(scratch,{recursive:true,force:true});}
await writeFile('content/document-covers.json',JSON.stringify(metadata,null,2)+'\n');
