import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {posix} from 'node:path';
import {init,parse} from 'es-module-lexer';
import CleanCSS from 'clean-css';
import registry from '../../content/shared/browser-assets.json' with {type:'json'};
import project from '../../package.json' with {type:'json'};

export const assetBaseVersion=project.version;
const publicRoot=new URL('../../public/',import.meta.url);
const projectRoot=new URL('../../',import.meta.url);
const paths=new Map(Object.entries(registry.paths));
const keys=new Map([...paths].map(([name,path])=>[path,name]));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const vendorPath=(path)=>path==='vendor/fflate.js'?'node_modules/fflate/esm/browser.js':
 path.startsWith('vendor/pdfjs/')?'node_modules/pdfjs-dist/build/'+path.slice('vendor/pdfjs/'.length):null;

// Keep values relative to the source file so the same paths work at either site root.
function relativeFile(file,specifier){
 return posix.normalize(posix.join(posix.dirname(file),specifier.split(/[?#]/,1)[0]));
}
function relativeUrl(from,to){
 const path=posix.relative(posix.dirname(from),to);
 return path.startsWith('.')?path:'./'+path;
}
function relativeCss(source,fn){
 return source.replace(/url\(\s*(['"]?)([^'"\s)]+)\1\s*\)/g,(original,quote,url)=>{
  if(/^(?:[a-z]+:|[#/])/i.test(url))return original;
  return 'url('+quote+fn(url)+quote+')';
 });
}

await init;
const sources=new Map(await Promise.all([...keys.keys()].map(async path=>[path,await readFile(new URL(path,publicRoot),'utf8')])));
const styles=new Map();
const cssCompiler=new CleanCSS({level:0,rebase:false});
const dependencies=new Map();
const checksums=new Map();
const importRecords=new Map();
for(const [path,source] of sources){
 const style=path.endsWith('.css');
 if(style){
  const output=cssCompiler.minify(source);
  if(output.errors.length||output.warnings.length)throw new Error(path+': '+[...output.errors,...output.warnings].join('; '));
  styles.set(path,output.styles);
 }
 checksums.set(path,hash(style?styles.get(path):source));
 const imports=style?[]:parse(source,path)[0].filter(record=>record.n?.startsWith('.'));
 importRecords.set(path,imports);
 const linked=new Set(imports.map(record=>relativeFile(path,record.n)));
 if(style)relativeCss(source,url=>{linked.add(relativeFile(path,url));return url;});
 for(const dependency of registry.dynamic[keys.get(path)]??[])linked.add(paths.get(dependency)??dependency);
 dependencies.set(path,linked);
}
for(const [source,linked] of dependencies)for(const path of linked){
 if(checksums.has(path))continue;
 const vendor=vendorPath(path);
 try{checksums.set(path,hash(await readFile(new URL(vendor??'public/'+path,projectRoot))));}
 catch(error){throw new Error('Missing browser dependency '+path+' from '+source,{cause:error});}
}

const revisions=new Map();
export function browserAssetPath(name){return paths.get(name)??name;}
export function assetRevision(file,fallback=assetBaseVersion){
 const path=browserAssetPath(file);
 if(!checksums.has(path))return fallback;
 if(revisions.has(path))return revisions.get(path);
 const closure=new Set([path]);
 for(const item of closure)for(const dependency of dependencies.get(item)??[])closure.add(dependency);
 const revision=hash([...closure].sort().map(item=>item+':'+checksums.get(item)).join('\n')).slice(0,12);
 revisions.set(path,revision);
 return revision;
}
const withRevision=(url,revision)=>{
 if(/[?&]v=/.test(url))return url.replace(/([?&]v=)[^&#]+/,(_,key)=>key+revision);
 const [path,fragment]=url.split('#',2);
 return path+(path.includes('?')?'&':'?')+'v='+revision+(fragment?'#'+fragment:'');
};

export function publicMarkup(html,basePath,legacy){
 const resolve=value=>{
  if(!/^\/(?!\/)/.test(value))return value;
  const local=basePath&&(value===basePath||value.startsWith(basePath+'/'))?value.slice(basePath.length)||'/':value;
  const key=local.slice(1).split(/[?#]/,1)[0];
  const destination=paths.get(key);
  if(!destination)return basePath+local;
  if(legacy&&Object.hasOwn(registry.legacyLegal,key))
   return basePath+withRevision(local,registry.legacyLegal[key]);
  return basePath+withRevision('/'+destination+local.slice(key.length+1),assetRevision(key));
 };
 return html.replace(/\b(href|src|poster|data-product|data-image|data-video|data-poster|data-gallery-base|data-engineering-src|data-engineering-full|value)="(\/[^"]*)"/g,
  (_,attribute,value)=>attribute+'="'+resolve(value)+'"')
  .replace(/\bsrcset="([^"]+)"/g,(_,items)=>'srcset="'+items.replace(/(^|,)(\s*)(\/(?!\/)[^\s,]+)/g,
   (_,separator,space,url)=>separator+space+resolve(url))+'"');
}

function versionedSource(sourcePath,outputPath){
 const source=sources.get(sourcePath);
 if(sourcePath.endsWith('.css')){
  if(sourcePath===outputPath)return styles.get(sourcePath);
  return relativeCss(source,url=>relativeUrl(outputPath,relativeFile(sourcePath,url)) + (url.match(/[?#].*$/)?.[0]??''));
 }
 let result=source;
 for(const record of [...importRecords.get(sourcePath)].reverse()){
  const path=relativeFile(sourcePath,record.n);
  const url=withRevision(relativeUrl(outputPath,path),assetRevision(path));
  const hasQuotes=source[record.s]==="'"||source[record.s]==='"';
  const start=record.s+(hasQuotes?1:0),end=record.e-(hasQuotes?1:0);
  result=result.slice(0,start)+url+result.slice(end);
 }
 return result;
}

export async function writeBrowserAssets(dist){
 for(const path of sources.keys()){
  const content=versionedSource(path,path);
  if(content!==sources.get(path))await writeFile(dist+'/'+path,content);
 }
 // These entries serve the immutable legal HTML. They have no separate source copy.
 for(const key of [...Object.keys(registry.legacyLegal),...registry.legacyDependencies]){
  const content=versionedSource(browserAssetPath(key),key);
  await writeFile(dist+'/'+key,key==='context-history.js'?content.replace("new URL('../../../',import.meta.url)","new URL('.',import.meta.url)"):content);
 }
}
