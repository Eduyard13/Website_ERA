import {readFile,readdir,realpath} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {documentLibrary,documentCategories,libraryObjects} from '../content/document-library.mjs';
import storedCovers from '../content/document-covers.json' with {type:'json'};
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
export function safeDocumentPath(file){return typeof file==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_/-]*\.pdf$/.test(file)&&!file.split('/').some(p=>p==='.'||p==='..')&&!file.includes('//');}
export async function validateDocumentLibrary({entries=documentLibrary,root='public',requireCovers=true,coverMetadata=storedCovers,warn=true}={}){
 const ids=new Set(),files=new Set(),categories=new Set(documentCategories.map(c=>c.id));let publicCount=0;
 for(const d of entries){
  if(!/^[a-z0-9][a-z0-9-]*$/.test(d.id)||ids.has(d.id))throw new Error('Invalid or duplicate document id: '+d.id);ids.add(d.id);
  if(!categories.has(d.category)||!['node','line','project'].includes(d.objectType)||!['public','request-only'].includes(d.access)||!['published','preparing'].includes(d.status))throw new Error('Invalid document classification: '+d.id);
  if(!d.title||!d.type||!d.description||!libraryObjects.some(o=>o.type===d.objectType&&o.slug===d.objectSlug))throw new Error('Unknown document object or missing metadata: '+d.id);
  if(d.access==='request-only'||d.status==='preparing'){
   if(d.file||d.cover)throw new Error('Restricted or preparing document must not expose a public file: '+d.id);continue;
  }
  if(!safeDocumentPath(d.file)||files.has(d.file))throw new Error('Unsafe or duplicate PDF path: '+d.file);files.add(d.file);
  if(!d.downloadName||!d.downloadName.endsWith('.pdf')||/[\\/\x00-\x1f]/.test(d.downloadName))throw new Error('Invalid download name: '+d.id);
  const path=resolve(root,'documents',d.file),directory=resolve(root,'documents')+sep;
  if(!path.startsWith(directory))throw new Error('PDF path leaves documents directory');
  if(!(await realpath(path)).startsWith(await realpath(resolve(root,'documents'))+sep))throw new Error('PDF symlink leaves documents directory');
  const buffer=await readFile(path);
  if(buffer.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid PDF header: '+d.id);
  if(d.bytes&&buffer.length!==d.bytes)throw new Error('PDF size mismatch: '+d.id);
  if(d.sha256&&digest(buffer)!==d.sha256)throw new Error('PDF SHA mismatch: '+d.id);
  if(!Number.isInteger(d.pages)||d.pages<1)throw new Error('Missing confirmed page count: '+d.id);
  if(requireCovers){
   if(d.cover!==`document-covers/${d.id}.webp`||!d.coverWidth||!d.coverHeight)throw new Error('Missing verified cover metadata: '+d.id);
   const cover=await readFile(resolve(root,'assets',d.cover));
   if(cover.subarray(0,4).toString()!=='RIFF'||cover.subarray(8,12).toString()!=='WEBP')throw new Error('Invalid cover: '+d.id);
   const meta=coverMetadata[d.id];
   if(!meta||meta.sourceSha256!==d.sha256||meta.sha256!==digest(cover)||meta.width!==d.coverWidth||meta.height!==d.coverHeight||meta.page!==1)throw new Error('Cover provenance mismatch: '+d.id);
  }
  publicCount++;
 }
 const disk=[];async function scan(folder){for(const item of await readdir(folder,{withFileTypes:true})){const path=resolve(folder,item.name);if(item.isDirectory())await scan(path);else if(item.name.endsWith('.pdf'))disk.push(relative(resolve(root,'documents'),path).split(sep).join('/'));}}
 await scan(resolve(root,'documents'));const unregistered=disk.filter(file=>!files.has(file));
 if(warn&&unregistered.length)console.warn('Unregistered public PDFs:',unregistered.join(', '));
 return {publicCount,unregistered};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=await validateDocumentLibrary();console.log(JSON.stringify(result));}
