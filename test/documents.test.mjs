import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp,cp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {documentLibrary,publicLibraryDocuments,documentCategories,libraryObjects,normalizeLibraryDocument} from '../content/document-library.mjs';
import {validateDocumentLibrary,safeDocumentPath} from '../scripts/validate-document-library.mjs';
import {renderDocuments} from '../scripts/documents.mjs';
import {readLibraryState,filterLibraryDocuments,libraryStateUrl,selectionSummary,zipLimitBytes} from '../public/document-library-model.js';
import {render,basePath,routes} from '../scripts/build.mjs';
import covers from '../content/document-covers.json' with {type:'json'};
const options={objects:libraryObjects,categories:documentCategories.map(c=>c.id)};
test('Единая библиотека регистрирует все 27 оригинальных PDF без дубликатов и с проверенными обложками',async()=>{
 const result=await validateDocumentLibrary();assert.equal(result.publicCount,publicLibraryDocuments.length);assert.ok(result.publicCount>=27);assert.deepEqual(result.unregistered,[]);
 assert.equal(new Set(publicLibraryDocuments.map(d=>d.file)).size,publicLibraryDocuments.length);assert.equal(new Set(publicLibraryDocuments.filter(d=>d.objectType==='node').map(d=>d.objectSlug)).size,12);
 assert.equal(new Set(publicLibraryDocuments.filter(d=>d.objectType==='line').map(d=>d.objectSlug)).size,2);
 assert.ok(publicLibraryDocuments.filter(d=>d.category==='technical').length>=14);assert.ok(publicLibraryDocuments.filter(d=>d.category==='brochures').length>=13);
 for(const d of publicLibraryDocuments){assert.equal(covers[d.id].sourceSha256,d.sha256);assert.equal(covers[d.id].page,1);assert.ok(Math.max(d.coverWidth,d.coverHeight)<=840);}
});
test('Пять маршрутов используют общий renderer, настоящие PDF и честные пустые категории',async()=>{
 for(const category of documentCategories){
  const path='/documents/'+category.id;assert.ok(routes.includes(path));const html=render(path);
  assert.ok(html.includes(`<h1>${category.title}.</h1>`));assert.ok(html.includes('data-document-library'));assert.ok(html.includes(`${basePath}/document-library.js?v=`));
  assert.ok(html.includes(`href="${basePath}/documents/"`));assert.ok(html.includes(`href="${basePath}/documents/${category.id}/"`));
  if(!publicLibraryDocuments.some(d=>d.category===category.id)){assert.ok(html.includes('Материалы готовятся'));assert.ok(html.includes('Запросить документацию'));assert.ok(!publicLibraryDocuments.some(d=>d.category===category.id));}
  assert.ok(!(html.match(/href="#"/g)||[]).length);
 }
 const main=render('/documents');assert.ok(main.includes('<h1>Инженерная библиотека ЭРА.</h1>'));
 assert.equal((main.match(/data-library-document="/g)||[]).length,documentLibrary.filter(d=>d.status==='published').length);assert.equal((main.match(/data-pdf-open="/g)||[]).length,publicLibraryDocuments.length);
 assert.ok(main.includes(publicLibraryDocuments.length+' документов'));assert.ok(main.includes('12 узлов'));assert.ok(main.includes('2 производственные линии'));
 for(const d of publicLibraryDocuments){assert.ok(main.includes(`href="${basePath}/documents/${d.file}"`));assert.ok(main.includes(`src="${basePath}/assets/${d.cover}"`));assert.ok(main.includes(`download="${d.downloadName}"`));}
 assert.ok(!render('/economics').includes('/document-library.js?'));assert.ok(!render('/catalog/equipment/ballisticheskiy-separator').includes('/document-library.js?'));
 for(const path of ['vendor/pdfjs/pdf.mjs','vendor/pdfjs/pdf.worker.mjs','vendor/fflate.js'])assert.ok((await readFile('dist/'+path)).length>1000);
});
test('Поиск, старые параметры и сочетания фильтров различают две комплектации и ё/е',()=>{
 const state=readLibraryState('?product=ballisticheskiy-separator',options);assert.equal(state.objectType,'node');const ballistic=filterLibraryDocuments(documentLibrary,state);assert.ok(ballistic.length>=2);assert.ok(ballistic.every(d=>d.objectType==='node'&&d.objectSlug==='ballisticheskiy-separator'));for(const id of ['ballisticheskiy-separator-technical','ballisticheskiy-separator-brochure'])assert.ok(ballistic.some(d=>d.id===id));
 const full=filterLibraryDocuments(documentLibrary,readLibraryState('?objectType=line&product=separatsiya-02&category=technical',options));assert.ok(full.some(d=>d.file==='technical/era-separatsiya-01-technical-description.pdf'));assert.ok(full.every(d=>d.objectType==='line'&&d.objectSlug==='separatsiya-02'&&d.category==='technical'));
 const mini=filterLibraryDocuments(documentLibrary,readLibraryState('?objectType=line&product=separatsiya-01',options));assert.ok(mini.some(d=>d.id==='separatsiya-01-mini-technical'));assert.ok(mini.every(d=>d.objectType==='line'&&d.objectSlug==='separatsiya-01'));
 assert.equal(filterLibraryDocuments(documentLibrary,readLibraryState('?kind='+encodeURIComponent('Брошюра')+'&product=ballisticheskiy-separator',options)).length>=1,true);
 const search=q=>filterLibraryDocuments(documentLibrary,{q});assert.deepEqual(search('плёночный–флотатор').map(d=>d.id),search('ПЛЕНОЧНЫЙ   ФЛОТАТОР').map(d=>d.id));assert.ok(search('ПЛЕНОЧНЫЙ   ФЛОТАТОР').length>=2);assert.equal(search('несуществующийдокумент').length,0);assert.ok(search('рабочей моющей жидкости').some(d=>d.objectSlug==='ochistka-stokov'));
 const url=libraryStateUrl('https://era.invalid/documents/technical/?v=0.36.0&kind=old',{q:'плёнка',category:'technical',objectType:'line',product:'separatsiya-02',sort:'name'},{category:'technical'});assert.equal(url.searchParams.get('v'),'0.36.0');assert.equal(url.searchParams.get('kind'),null);assert.equal(url.searchParams.get('category'),null);assert.equal(url.searchParams.get('product'),'separatsiya-02');
});
test('Валидатор отвергает небезопасные пути, неправильные байты, SHA и публикацию закрытого файла',async()=>{
 const original=publicLibraryDocuments[0],check=entry=>validateDocumentLibrary({entries:[entry],warn:false});
 for(const file of ['../secret.pdf','technical/../../a.pdf','https://host/a.pdf','/a.pdf','technical/a\\b.pdf'])assert.equal(safeDocumentPath(file),false);
 await assert.rejects(check({...original,file:'../secret.pdf'}),/Unsafe/);
 await assert.rejects(check({...original,bytes:original.bytes+1}),/size mismatch/);
 await assert.rejects(check({...original,sha256:'0'.repeat(64)}),/SHA mismatch/);
 await assert.rejects(check({...original,objectSlug:'unknown'}),/Unknown document object/);
 await assert.rejects(check({...original,category:'unknown'}),/classification/);
 await assert.rejects(check({...original,access:'request-only'}),/must not expose/);
 await assert.rejects(check({...original,downloadName:'../other.pdf'}),/download name/);
 await assert.rejects(validateDocumentLibrary({entries:[original,{...original}],warn:false}),/duplicate document id/);
 await assert.rejects(validateDocumentLibrary({entries:[original,{...original,id:'duplicate-file'}],warn:false}),/duplicate PDF path/);
 const requested={...original,id:'confirmed-request',access:'request-only',file:null,cover:null};await validateDocumentLibrary({entries:[requested],warn:false});
 const html=renderDocuments();assert.ok(!html.includes('confirmed-request'));
});
test('ZIP выбирает только опубликованные публичные PDF и отказывает сверх лимита без потери списка',()=>{
 const ids=new Set(documentLibrary.map(d=>d.id));const all=selectionSummary(documentLibrary,ids);assert.equal(all.selected.length,publicLibraryDocuments.length);assert.ok(all.overLimit);assert.ok(all.bytes>zipLimitBytes);assert.equal(ids.size,documentLibrary.length);
 const restricted={...documentLibrary[0],id:'private',access:'request-only',file:null};assert.equal(selectionSummary([restricted],new Set(['private'])).selected.length,0);
 const single=selectionSummary(documentLibrary,new Set([documentLibrary[0].id]));assert.equal(single.selected.length,1);assert.equal(single.overLimit,false);
});
test('Новая схема добавляется записью и обложкой без изменения renderer и фильтров',async()=>{
 const initialLength=documentLibrary.length,initialCategoryCount=publicLibraryDocuments.filter(d=>d.category==='layouts').length,initialObjectCount=filterLibraryDocuments(documentLibrary,{category:'layouts',objectType:'line',product:'separatsiya-02'}).length;
 const folder=await mkdtemp(join(tmpdir(),'era-doc-library-fixture-')),source=publicLibraryDocuments.find(d=>d.pages===1),id='fixture-line-layout';
 const entry=normalizeLibraryDocument({...source,id,category:'layouts',type:'Схема / компоновка',title:'Тестовая схема — только для проверки',file:'layouts/fixture.pdf',description:'Изолированная проверка будущего пополнения.'},libraryObjects.find(o=>o.type==='line'&&o.slug==='separatsiya-02'));
 Object.assign(entry,{coverWidth:source.coverWidth,coverHeight:source.coverHeight});
 try{
  await mkdir(join(folder,'documents/layouts'),{recursive:true});await mkdir(join(folder,'assets/document-covers'),{recursive:true});
  await cp('public/documents/'+source.file,join(folder,'documents',entry.file));await cp('public/assets/'+source.cover,join(folder,'assets',entry.cover));
  assert.equal((await validateDocumentLibrary({entries:[entry],root:folder,coverMetadata:{[id]:covers[source.id]}})).publicCount,1);
  documentLibrary.push(entry);publicLibraryDocuments.push(entry);
  try{
   const html=renderDocuments({categoryId:'layouts'});const start=html.indexOf('data-library-category="layouts"'),categoryHtml=html.slice(start,html.indexOf('</a>',start));assert.ok(categoryHtml.includes((initialCategoryCount+1)+' PDF'));assert.ok(html.includes('data-library-document="fixture-line-layout"'));assert.ok(html.includes('href="/documents/layouts/fixture.pdf"'));
   assert.equal(filterLibraryDocuments(documentLibrary,{category:'layouts',objectType:'line',product:'separatsiya-02'}).length,initialObjectCount+1);
   const artifact=process.env.ERA_DOCUMENT_FIXTURE_DIR;
   if(artifact){await mkdir(artifact,{recursive:true});await writeFile(join(artifact,'index.html'),render('/documents/layouts'));await cp(join(folder,'documents',entry.file),join(artifact,'fixture.pdf'));await cp(join(folder,'assets',entry.cover),join(artifact,'fixture.webp'));}
  }finally{documentLibrary.pop();publicLibraryDocuments.pop();}
 }finally{await rm(folder,{recursive:true,force:true});}
 assert.equal(documentLibrary.length,initialLength);
});
