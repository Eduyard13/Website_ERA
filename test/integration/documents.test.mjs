import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,mkdtemp,cp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {documentLibrary,publicLibraryDocuments,documentCategories,libraryObjects,normalizeLibraryDocument} from '../../content/documents/document-library.mjs';
import {validateDocumentLibrary,safeDocumentPath} from '../../scripts/build/validate-document-library.mjs';
import {renderDocuments} from '../../scripts/render/documents/documents.mjs';
import {readLibraryState,filterLibraryDocuments,libraryStateUrl,selectionSummary,zipLimitBytes} from '../../public/assets/js/documents/document-library-model.js';
import {render,basePath,routes} from '../../scripts/build/build.mjs';
import {dryLineNames} from '../../content/lines/shared/line-names.mjs';
import covers from '../../content/documents/document-covers.json' with {type:'json'};
const options={objects:libraryObjects,categories:documentCategories.map(c=>c.id)};
test('Исходный A0 зарегистрирован у комплектации PRO, находится поиском и выводит реальные метаданные',async()=>{
 const d=publicLibraryDocuments.find(d=>d.id==='separatsiya-02-dimensions-a0');
 assert.ok(d);assert.equal(d.objectType,'line');assert.equal(d.objectSlug,'separatsiya-02');assert.equal(d.category,'drawings');
 assert.equal(d.format,'A0');assert.equal(d.pages,1);assert.equal(d.bytes,2239107);
 assert.equal(d.sha256,'8557bce36e8963146ec9fd33d11295c4483e2e4d4106f19ae41e7c50c39f98d0');
 assert.equal(d.revision,null);assert.equal(d.publishedAt,null);
 assert.equal(d.objectTitle,dryLineNames['separatsiya-02'].title);
 for(const q of ['затюковкой','габариты','чертёж','сухой сепарации'])assert.ok(filterLibraryDocuments(documentLibrary,{q}).some(e=>e.id===d.id),q);
 const page=render('/documents/drawings');assert.ok(page.includes('PDF · A0 · 1 лист · 2,2 МБ'));
 assert.equal((page.match(/data-library-document="/g)||[]).length,publicLibraryDocuments.filter(d=>d.category==='drawings').length);
 assert.ok(page.includes(`data-pdf-open="${d.id}"`));assert.ok(page.includes(`download="${d.downloadName}"`));
 assert.equal(selectionSummary(documentLibrary,new Set([d.id])).selected[0],d);
 assert.ok(!filterLibraryDocuments(documentLibrary,{product:'separatsiya-01'}).includes(d));
});
test('Полная линия сохраняет показатели, один fit-монитор и новый порядок разделов с тремя документами',async()=>{
 const page=render('/catalog/lines/separatsiya-02');
 const ids=['purpose','raw-materials','composition','process','quality','kair','specs','placement','photos','documents','request','equipment'];
 let previous=-1;
 for(const id of ids){const index=page.indexOf(`id="${id}"`);assert.ok(index>previous,id);previous=index;}
 const nav=page.match(/<div class="line-section-nav" data-line-section-nav[^>]*>(.*?)<\/div>/s)[1];
 assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]),ids);
 assert.equal((page.match(/data-diagram data-diagram-mode="fit"/g)||[]).length,1);
 const composition=page.slice(page.indexOf('id="composition"'),page.indexOf('id="process"'));
 assert.equal((composition.match(/data-part-guide="/g)||[]).length,27);
 assert.equal((composition.match(/data-line-leader="/g)||[]).length,28);assert.equal((composition.match(/class="guide-end"/g)||[]).length,28);assert.ok(!composition.includes('pin-masks'));
 assert.ok(!page.includes('data-line-source-diagram'));assert.ok(!page.includes('id="line02-workshop"'));
 assert.ok(!composition.includes('line-unit-grid'));assert.ok(page.includes('data-pro-process-map'));assert.ok(!page.includes('line-flow-diagram'));
 const documents=page.slice(page.indexOf('id="documents"'),page.indexOf('class="section contact line-request"'));
 assert.equal((documents.match(/data-library-document="/g)||[]).length,3);
 for(const id of ['separatsiya-02-overview','separatsiya-02-technical','separatsiya-02-dimensions-a0'])assert.ok(documents.includes(`data-pdf-open="${id}"`));
 assert.equal((page.match(/id="pdf-viewer"/g)||[]).length,1);assert.ok(page.includes('/assets/js/equipment/shared/line-documents.js?v='));
 const equipment=page.slice(page.indexOf('id="equipment"'),page.indexOf('</section>',page.indexOf('id="equipment"')));assert.ok(equipment.includes('line-unit-grid'));assert.equal((equipment.match(/data-catalogue-image=/g)||[]).length,5);assert.doesNotMatch(equipment,/Предварительный распушитель|ДОПОЛНИТЕЛЬНЫЙ МОДУЛЬ|Пресс и рольганги/);
 for(const text of ['405,2','283,64','4,7','750 кг/ч','50%','810 м²','9 м','≈6,5 м','2–10','Пять раздельных потоков'])assert.ok(page.includes(text)||text==='Пять раздельных потоков'&&page.includes('5 раздельных потоков'),text);
 const mini=render('/catalog/lines/separatsiya-01');assert.ok(!mini.includes('data-line-source-diagram'));assert.ok(mini.includes('/assets/js/equipment/shared/line-monitor.js?'));assert.ok(mini.includes('/assets/js/equipment/shared/line-documents.js?'));assert.ok(!mini.includes('dimensions-a0.pdf'));
});
test('Все четыре проекции имеют происхождение из единственного A0 и доступны в HTML',async()=>{
 const manifest=JSON.parse(await readFile('content/lines/pro/separatsiya-02-dimensions.json','utf8'));
 const assets=JSON.parse(await readFile('content/lines/pro/separatsiya-02-dimensions-assets.json','utf8'));
 const {createHash}=await import('node:crypto'),page=render('/catalog/lines/separatsiya-02');
 assert.equal(assets.sourceSha256,manifest.sourceSha256);assert.equal(assets.page,1);
 assert.deepEqual(assets.views.map(v=>v.id),['top','side-1','side-2','sheet']);
 for(const v of assets.views){
  const source=manifest.views.find(e=>e.id===v.id);assert.deepEqual(v.clipPt,source.clipPt);
  assert.ok(v.width>=3200);assert.ok(v.height>600);
  const bytes=await readFile('public/assets/'+v.file);assert.equal(bytes.length,v.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),v.sha256);
  assert.ok(page.includes(`data-engineering-src="${basePath}/assets/${v.file}"`));assert.ok(page.includes(`data-dimension-tab="${v.id}"`));
 }
 const top=page.match(/<button[^>]*id="dimension-tab-top"[^>]*>/s)?.[0];
 assert.ok(top?.includes('aria-controls="pro-engineering-stage"')&&top.includes('aria-pressed="true"'));
 assert.ok(page.includes('Складские запасы, проезды, безопасные зоны и коммуникации учитывают при проектной привязке.'));
});
test('Единая библиотека регистрирует все оригинальные PDF без дубликатов и с проверенными обложками',async()=>{
 const result=await validateDocumentLibrary();assert.equal(result.publicCount,publicLibraryDocuments.length);assert.ok(result.publicCount>=27);assert.deepEqual(result.unregistered,[]);
 assert.equal(new Set(publicLibraryDocuments.map(d=>d.file)).size,publicLibraryDocuments.length);assert.equal(new Set(publicLibraryDocuments.filter(d=>d.objectType==='node').map(d=>d.objectSlug)).size,12);
 assert.equal(new Set(publicLibraryDocuments.filter(d=>d.objectType==='line').map(d=>d.objectSlug)).size,4);
 assert.ok(publicLibraryDocuments.filter(d=>d.category==='technical').length>=14);assert.ok(publicLibraryDocuments.filter(d=>d.category==='brochures').length>=13);
 for(const d of publicLibraryDocuments){assert.equal(covers[d.id].sourceSha256,d.sha256);assert.equal(covers[d.id].page,1);assert.ok(Math.max(d.coverWidth,d.coverHeight)<=840);}
});
test('Пять маршрутов используют общий renderer, настоящие PDF и честные пустые категории',async()=>{
 for(const category of documentCategories){
  const path='/documents/'+category.id;assert.ok(routes.includes(path));const html=render(path);
  assert.ok(html.includes(`<h1>${category.title}</h1>`));assert.ok(html.includes('data-document-library'));assert.ok(html.includes(`${basePath}/assets/js/documents/document-library.js?v=`));
  assert.ok(html.includes(`href="${basePath}/documents/"`));assert.ok(html.includes(`href="${basePath}/documents/${category.id}/"`));
  if(!publicLibraryDocuments.some(d=>d.category===category.id)){assert.ok(html.includes('Материалы готовятся'));assert.ok(html.includes('Запросить документацию'));assert.ok(!publicLibraryDocuments.some(d=>d.category===category.id));}
  assert.ok(!(html.match(/href="#"/g)||[]).length);
 }
 const main=render('/documents');assert.ok(main.includes('<h1>Инженерная библиотека ЭРА.</h1>'));
 assert.equal((main.match(/data-library-document="/g)||[]).length,documentLibrary.filter(d=>d.status==='published').length);assert.equal((main.match(/data-pdf-open="/g)||[]).length,publicLibraryDocuments.length);
 assert.ok(main.includes(publicLibraryDocuments.length+' документов'));assert.ok(main.includes('12 узлов'));assert.ok(main.includes('4 производственные линии'));
 for(const d of publicLibraryDocuments){assert.ok(main.includes(`href="${basePath}/documents/${d.file}"`));assert.ok(main.includes(`src="${basePath}/assets/${d.cover}"`));assert.ok(main.includes(`download="${d.downloadName}"`));}
 assert.ok(!render('/economics').includes('/assets/js/documents/document-library.js?'));assert.ok(!render('/catalog/equipment/ballisticheskiy-separator').includes('/assets/js/documents/document-library.js?'));
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
   const html=renderDocuments({categoryId:'layouts'});assert.ok(html.includes(`<span class="dl-compact-count">${initialCategoryCount+1} PDF</span>`));assert.ok(html.includes('data-library-document="fixture-line-layout"'));assert.ok(html.includes('href="/documents/layouts/fixture.pdf"'));
   assert.equal(filterLibraryDocuments(documentLibrary,{category:'layouts',objectType:'line',product:'separatsiya-02'}).length,initialObjectCount+1);
   const artifact=process.env.ERA_DOCUMENT_FIXTURE_DIR;
   if(artifact){await mkdir(artifact,{recursive:true});await writeFile(join(artifact,'index.html'),render('/documents/layouts'));await cp(join(folder,'documents',entry.file),join(artifact,'fixture.pdf'));await cp(join(folder,'assets',entry.cover),join(artifact,'fixture.webp'));}
  }finally{documentLibrary.pop();publicLibraryDocuments.pop();}
 }finally{await rm(folder,{recursive:true,force:true});}
 assert.equal(documentLibrary.length,initialLength);
});
