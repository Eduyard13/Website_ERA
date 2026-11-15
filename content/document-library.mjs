import {nodes,lines} from './catalog.mjs';
import {documentCategories} from './document-manifest.mjs';
import {drySeparationOverview} from './technology-lines.mjs';
import covers from './document-covers.json' with {type:'json'};

/** @typedef {{id:string,title:string,category:string,type:string,objectType:'node'|'line'|'project',objectSlug:string|null,objectTitle:string,description:string,file:string|null,downloadName:string|null,pages:number|null,format?:string|null,bytes:number|null,sha256:string|null,cover:string|null,coverWidth:number|null,coverHeight:number|null,revision:string|null,publishedAt:string|null,access:'public'|'request-only',status:'published'|'preparing',relatedPage:string}} LibraryDocument */
// Future approved documents go here. Never place request-only source files in public/.
export const additionalDocuments=[{
 id:'separatsiya-02-dimensions-a0',objectType:'line',objectSlug:'separatsiya-02',category:'drawings',type:'Габаритный чертёж',
 title:'Габаритный чертёж линии сухой сепарации плёнок и пакетов',
 description:'Сухая сепарация: габариты, три проекции и размеры показанной компоновки линии. Привязка к площадке уточняется при проектировании.',
 file:'drawings/era-separatsiya-02-dimensions-a0.pdf',downloadName:'ЭРА — Сепарация 02 — Чертёж и габариты A0.pdf',
 format:'A0',pages:1,bytes:2239107,sha256:'8557bce36e8963146ec9fd33d11295c4483e2e4d4106f19ae41e7c50c39f98d0',
 access:'public',status:'published',revision:null,publishedAt:null,
}];
export const libraryObjects=[
 ...nodes.map(n=>({type:'node',slug:n.slug,title:n.title,path:n.path})),
 ...lines.filter(l=>l.enabled).map(l=>({type:'line',slug:l.slug,title:l.title+' · '+l.cardDescription,path:l.path})),
 {type:'project',slug:null,title:'Проект ЭРА',path:'/'},
];
export function normalizeLibraryDocument(entry,object){
 const category=documentCategories.find(c=>c.id===entry.category);
 const access=entry.access||'public',status=entry.status||'published',cover=entry.file&&access==='public'?`document-covers/${entry.id}.webp`:null;
 return {...entry,objectType:object?.type||entry.objectType,objectSlug:object?.slug??entry.objectSlug??null,objectTitle:object?.title||entry.objectTitle||'Проект ЭРА',
  description:entry.description||category?.detail||'',relatedPage:object?.path||entry.relatedPage||'/',access,status,
  file:entry.file||null,downloadName:entry.downloadName||null,pages:entry.pages||null,bytes:entry.bytes||null,sha256:entry.sha256||null,
  cover,coverWidth:covers[entry.id]?.width||null,coverHeight:covers[entry.id]?.height||null,revision:entry.revision||null,publishedAt:entry.publishedAt||null};
}
const lineOverview={...drySeparationOverview.document,id:'separatsiya-02-overview',category:'brochures',type:'Брошюра линии',description:'Сухая сепарация с сортировочной площадкой, пятью бункерами и автоматическим прессом.'};
/** @type {LibraryDocument[]} */
export const documentLibrary=[
 ...nodes.flatMap(n=>n.documents.map(d=>normalizeLibraryDocument({...d,description:d.description||n.description},libraryObjects.find(o=>o.type==='node'&&o.slug===n.slug)))),
 ...lines.filter(l=>l.enabled).flatMap(l=>l.documents.map(d=>normalizeLibraryDocument({...d,description:d.description||l.description},libraryObjects.find(o=>o.type==='line'&&o.slug===l.slug)))),
 normalizeLibraryDocument(lineOverview,libraryObjects.find(o=>o.type==='line'&&o.slug==='separatsiya-02')),
 ...additionalDocuments.map(d=>normalizeLibraryDocument(d,libraryObjects.find(o=>o.type===d.objectType&&o.slug===(d.objectSlug??null)))),
];
export const publicLibraryDocuments=documentLibrary.filter(d=>d.access==='public'&&d.status==='published');
export {documentCategories};
