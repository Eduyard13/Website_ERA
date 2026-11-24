import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nodes,lines} from '../content/catalog.mjs';
import {dryLineNames} from '../content/line-names.mjs';
import {separation03,separation03Document,separation03Specification,separation03Power,separation03ConveyorPower} from '../content/separation-03.mjs';
import {separation03Diagram} from '../content/separation-03-diagram.mjs';
import {basePath,previewMode,render,routes,assetBaseVersion} from '../scripts/build.mjs';
import {revisedPage} from '../scripts/views.mjs';
import {publicLibraryDocuments} from '../content/document-library.mjs';
import {buildGalleryData} from '../scripts/gallery-data.mjs';
import {selectGalleryItems} from '../public/gallery-model.js';
import {imageSize} from '../scripts/image-size.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const release=assetBaseVersion;
const line=lines.find(l=>l.slug==='separatsiya-03');
test('PREMIUM опубликована в каталоге, три другие карточки сохранены',async()=>{
 assert.equal(lines.filter(l=>l.enabled).length,4);assert.ok(line.enabled);assert.equal(line.status,'source-checked');
 assert.ok(routes.includes(line.path));assert.equal(line.cardTitle,dryLineNames[line.slug].title);
 assert.deepEqual(separation03.cardMetrics.map(m=>[m.value,m.unit]),[['1 500','кг/ч'],['750','кг/ч'],['до 5','%'],['639,77','кВт'],['447,84','кВт'],['5','бункеров']]);
 const baseline=JSON.parse(await readFile('test/fixtures/separation-03-preserved.json'));
 const oldSlugs=new Set(baseline.cards.map(c=>c.slug));
 const cards=revisedPage('/catalog/lines').match(/<a class="line-card[\s\S]*?<\/a>/g).map(html=>({slug:html.match(/data-line-id="([^"]+)"/)[1],sha256:hash(html),html}));
 assert.equal(cards.length,4);
 assert.deepEqual(cards.filter(c=>oldSlugs.has(c.slug)).map(({slug,sha256})=>({slug,sha256})),baseline.cards);
 const card=cards.find(c=>c.slug===line.slug).html;
 for(const text of ['PREMIUM',line.cardTitle,line.cardDescription,line.cardFeature,'catalog-cover.webp','catalog-cover-768.webp 768w'])assert.ok(card.includes(text),text);
 assert.equal((card.match(/<dt>/g)||[]).length,6);assert.ok(!card.includes('В разработке'));
});
test('Исходный PDF на 28 страницах и все извлечённые изображения имеют проверенное происхождение',async()=>{
 const manifest=JSON.parse(await readFile('docs/separation-03-assets.json'));
 assert.equal(manifest.assets.length,32);assert.equal(manifest.sourcePdf.pages,28);
 assert.equal(manifest.sourceCover.sha256,'05c4028ab2c1a6b239d498443575fa996e236a80d1dfe9b6ef71000b9deb609c');
 const pdf=await readFile('public/documents/'+separation03Document.file);assert.equal(pdf.length,5397658);
 assert.equal(hash(pdf),'2b399241ee41e5a792d87ab051f1d764f65faa1071b27bc1950a75024a5b52f6');
 for(const a of manifest.assets){
  assert.ok(a.sourcePage===null||a.sourcePage>=1&&a.sourcePage<=28);
  if(a.sourcePage!==null)assert.ok(Number.isInteger(a.sourceXref)&&a.sourceXref>0);
  for(const [file,sha,width,height] of [[a.file,a.sha256,a.width,a.height],[a.smallFile,a.smallSha256,a.smallWidth,a.smallHeight]]){
   assert.equal(hash(await readFile('public/assets/'+file)),sha,file);assert.deepEqual(imageSize('public/assets/'+file),{width,height},file);
  }
 }
 for(const [file,key] of [['markers','markersSha256'],['occupancy','occupancySha256']])assert.equal(hash(await readFile(manifest.interactiveGeometry[file])),manifest.interactiveGeometry[key]);
});
test('Спецификация 1–37 точно учитывает повторяющиеся узлы и шесть существующих типов оборудования',()=>{
 assert.deepEqual(separation03Specification.map(s=>s.position),Array.from({length:37},(_,i)=>i+1));
 for(const [position,quantity] of [[6,2],[7,2],[8,2],[17,5],[18,4],[24,1],[25,2],[26,2],[29,5],[37,2]])assert.equal(separation03Specification.find(s=>s.position===position).quantity,quantity);
 assert.equal(separation03Specification.find(s=>s.position===10).name,'Роторная сушильная установка');
 assert.ok(separation03Specification.find(s=>s.position===34).name.includes('конденсации'));
 assert.equal(line.equipment.length,6);assert.equal(line.optionalEquipment.length,0);
 for(const slug of line.equipment)assert.ok(nodes.some(n=>n.slug===slug),slug);
 assert.ok(line.equipment.includes('predvaritelnyy-raspushitel'));assert.ok(!line.equipment.includes('kapsulyator'));
});
test('Мощности, 28 транспортёров, календарь и удельные расходы соответствуют первичному документу',()=>{
 const sum=(items,key)=>Math.round(items.reduce((s,r)=>s+r[key],0)*100)/100;
 assert.equal(separation03Power.length,10);assert.equal(separation03ConveyorPower.length,20);
 assert.equal(sum(separation03ConveyorPower,'quantity'),28);
 assert.equal(sum(separation03Power,'installed'),497.07);assert.equal(sum(separation03Power,'calculated'),347.95);
 assert.equal(sum(separation03ConveyorPower,'installed'),142.70);assert.equal(sum(separation03ConveyorPower,'calculated'),99.89);
 for(const row of [...separation03Power,...separation03ConveyorPower])assert.equal(Math.round(row.installed*.7*100),Math.round(row.calculated*100));
 assert.equal(sum([...separation03Power,...separation03ConveyorPower],'installed'),639.77);
 assert.equal(sum([...separation03Power,...separation03ConveyorPower],'calculated'),447.84);
 assert.deepEqual([24,720,8760].map(h=>(447.84*h/1000).toFixed(2)),['10.75','322.44','3923.08']);
 assert.equal(447.84/1.5,298.56);assert.equal(447.84/.75,597.12);assert.equal(.75*720,540);assert.equal(.75*8760,6570);
});
test('Один монитор содержит 37 позиций и все 42 точно привязанных исходных номера',async()=>{
 const d=separation03Diagram;assert.equal(d.width,1452);assert.equal(d.height,830);assert.equal(d.page,6);
 assert.deepEqual(d.parts.map(p=>p.number),Array.from({length:37},(_,i)=>i+1));
 const callouts=d.parts.flatMap(p=>p.callouts);assert.equal(callouts.length,42);assert.equal(new Set(callouts.map(c=>c.id)).size,42);
 const markers=JSON.parse(await readFile('content/separation-03-markers.json'));
 for(const p of d.parts){
  assert.ok(p.label&&p.description);assert.equal(p.callouts.length,[6,7,25,26,37].includes(p.number)?2:1);
  for(const c of p.callouts){
   assert.ok(c.badge[0]>0&&c.badge[0]<1000&&c.badge[1]>0&&c.badge[1]<d.height/d.width*1000);
   const original=markers.positions.find(m=>m.number===p.number).instances.find(m=>m.id===c.id);
   assert.ok(Math.hypot(...c.badge.map((value,axis)=>value*d.width/1000-original.badge[axis]))<1.5,c.id);
   assert.equal(c.leaders.length,1,'42 original PDF leaders are rebuilt natively');assert.ok(c.tooltipDescription);
   assert.notDeepEqual(c.leaders[0].at(-1),c.badge);
   assert.ok(c.regions.length&&c.regions.every(polygon=>polygon.length>=3));
  }
 }
 assert.ok(d.parts.find(p=>p.number===37).callouts[0].tooltipDescription.includes('Подача сырья'));
 assert.ok(d.parts.find(p=>p.number===37).callouts[1].tooltipDescription.includes('Выдача тюков'));
});
test('Детальная страница повторяет порядок эталона и содержит настоящий PDF, схемы, спецификацию и CTA',()=>{
 const html=render(line.path);const ids=['purpose','raw-materials','composition','process','quality','specs','equipment','placement','kair','photos','documents'];
 const offsets=ids.map(id=>html.indexOf(`id="${id}"`));assert.ok(offsets.every(i=>i>0));assert.deepEqual(offsets,[...offsets].sort((a,b)=>a-b));
 assert.equal((html.match(/data-diagram-mode="fit"/g)||[]).length,1);assert.equal((html.match(/data-part-guide="/g)||[]).length,42);
 assert.equal((html.match(/data-callout="/g)||[]).length,42);assert.equal((html.match(/data-separation03-position="/g)||[]).length,0);
 const nativeBlock=html.slice(html.indexOf('id="composition"'),html.indexOf('id="process"'));
 assert.doesNotMatch(nativeBlock,/data-line-layout-views|line03-view-reverse|Другой ракурс|Основной вид|Спецификация линии|Как устроены ключевые узлы/);
 assert.ok(nativeBlock.includes('/assets/lines/separatsiya-03/layout-native-v2.webp'));
 assert.ok(!nativeBlock.includes('layout-numbered.webp'));
 assert.equal((nativeBlock.match(/data-callout-region="/g)||[]).length,42);
 assert.equal((nativeBlock.match(/data-line-leader="/g)||[]).length,42);
 assert.equal((nativeBlock.match(/data-callout-hit="/g)||[]).length,42);
 assert.equal((html.match(/data-catalogue-image="/g)||[]).length,6);assert.equal((html.match(/id="pdf-viewer"/g)||[]).length,1);
 for(const text of ['при испытаниях отдельные партии имели засорённость до 80%','До 5%','639,77','447,84','298,56','597,12','540','6 570','4К','55″','Siemens','Пневмотранспорт на позициях 18 и 19 учтён один раз','data-dimension-tab="top"','data-dimension-tab="side"','data-hero-finish="titanium-gallery"'])assert.ok(html.includes(text),text);
 assert.ok(html.includes(`href="${basePath}/documents/${separation03Document.file}"`));assert.ok(html.includes(`data-pdf-open="${separation03Document.id}"`));
 assert.ok(html.includes('/separation-drying.js?v=')&&html.includes('/line-monitor.js?v='));
 assert.ok(html.includes(`href="${basePath}/catalog/lines/moyka-plenki"`));assert.ok(html.includes('data-project-request'));
 assert.ok(!html.includes('undefined')&&!html.includes('NaN'));assert.ok(html.includes('era-separatsiya-03-dimensions-a0.pdf'));
 const domIds=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(domIds).size,domIds.length);
});
test('Библиотека содержит три типа документов линии, медиатека — полный альбом без повторных файлов',()=>{
 const docs=publicLibraryDocuments.filter(d=>d.objectSlug===line.slug);
 assert.deepEqual(docs.map(d=>d.id).sort(),['separatsiya-03-brochure','separatsiya-03-dimensions',separation03Document.id]);
 const technical=docs.find(d=>d.category==='technical');assert.equal(technical.pages,28);
 const gallery=buildGalleryData();const selected=selectGalleryItems(gallery.items,{album:'separatsiya-03'});
 assert.equal(selected.length,32);assert.equal(gallery.albums.filter(a=>a.collection==='lines').length,4);
 assert.equal(new Set(gallery.items.map(m=>m.file)).size,gallery.items.length);
 assert.ok(selected.some(m=>m.kind==='photo')&&selected.some(m=>m.kind==='scheme')&&selected.some(m=>m.kind==='visualization'));
 assert.ok(!JSON.stringify(gallery).includes('undefined')&&!selected.some(m=>m.file.endsWith('.pdf')));
});
test('Неизменённые маршруты сохраняют структуру при глобальном обновлении согласия',async()=>{
  const baseline=JSON.parse(await readFile('test/fixtures/separation-03-preserved.json'));
  const changedPages=new Set(['/', '/contacts', '/technology',...lines.filter(line=>line.enabled).map(line=>line.path)]);
  const protectedPages=Object.keys(!previewMode?baseline.pagesProduction:basePath?baseline.pagesBase:baseline.pagesRoot).filter(path=>!changedPages.has(path));
  for(const path of protectedPages){
   const page=render(path);
   assert.ok(page.includes('<html lang="ru">') && page.includes('<main'),path);
   assert.ok(!page.includes('>undefined<'),path);
  }
});
