import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {lines,nodes} from '../content/catalog.mjs';
import {hotFilmWashing,hotWashDocument,hotWashSpecification,hotWashPower,hotWashEnergy,hotWashMedia} from '../content/hot-film-washing.mjs';
import {hotWashDiagram} from '../content/hot-wash-diagram.mjs';
import {publicLibraryDocuments} from '../content/document-library.mjs';
import {buildGalleryData} from '../scripts/gallery-data.mjs';
import {selectGalleryItems,findGalleryItem} from '../public/gallery-model.js';
import {revisedPage} from '../scripts/views.mjs';
import {render,basePath,previewMode,routes} from '../scripts/build.mjs';
import {imageSize} from '../scripts/image-size.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const line=lines.find(l=>l.slug==='moyka-plenki');
const release=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
test('Горячая мойка сохраняет показатели после публикации Сепарации 03',()=>{
 assert.ok(line.enabled);assert.equal(line.status,'source-checked');assert.equal(line.group,'Мойка');assert.equal(line.number,undefined);
 assert.ok(routes.includes('/catalog/lines/moyka-plenki'));
 assert.equal(lines.filter(l=>l.enabled).length,4);assert.equal(lines.find(l=>l.slug==='separatsiya-03').enabled,true);
 assert.equal(hotFilmWashing.cardMetrics.length,6);
 assert.deepEqual(hotFilmWashing.cardMetrics.map(m=>[m.label,m.value,m.unit]),[
  ['Входной поток','1 500','кг/ч'],['Выпуск гранулы','750','кг/ч'],['Установленная мощность','1 271,70','кВт'],
  ['Потребляемая мощность','890,19','кВт'],['Рабочий персонал','3','чел./смена'],['Готовая продукция','3','вида'],
 ]);
 assert.ok(hotFilmWashing.cardMetrics.every(m=>m.note));
 const card=revisedPage('/catalog/lines').match(/<a class="line-card[^>]*data-line-id="moyka-plenki"[\s\S]*?<\/a>/)[0];
 assert.ok(card.includes('ГОРЯЧАЯ МОЙКА / ГОТОВАЯ ЛИНИЯ'));
 assert.ok(card.includes('catalog-cover-detailed.webp')&&card.includes('catalog-cover-detailed-768.webp 768w'));
 assert.equal((card.match(/<dt>/g)||[]).length,6);assert.ok(!card.includes('В разработке'));
});
test('Все 44 WebP, размеры, исходный PDF и единственная обложка сохраняют происхождение',async()=>{
 const manifest=JSON.parse(await readFile('docs/moyka-plenki-assets.json','utf8'));
 assert.equal(manifest.assets.length,22);
 assert.equal(manifest.sourceCover.sha256,'2a2cbf49b57a105ac3009995964c1dd50d4e92c0d42299a313c52a0fc0705b61');
 for(const asset of [...manifest.assets,...(manifest.catalogCardUpdate?.assets||[])]){
  for(const [file,sha,width,height] of [[asset.file,asset.sha256,asset.width,asset.height],[asset.smallFile,asset.smallSha256,asset.smallWidth,asset.smallHeight]]){
   assert.equal(hash(await readFile('public/assets/'+file)),sha,file);
   assert.deepEqual(imageSize('public/assets/'+file),{width,height},file);
  }
  assert.ok(asset.smallWidth<=768&&asset.smallWidth<=asset.width);
 }
 const pdf=await readFile('public/documents/'+hotWashDocument.file);
 assert.equal(pdf.length,4430978);assert.equal(hash(pdf),'5648714c2f667ddb9d2168803aac50faf927fedbecb5147deebb57b0186a704a');assert.equal(hotWashDocument.pages,22);
 const docs=publicLibraryDocuments.filter(d=>d.objectSlug==='moyka-plenki');assert.deepEqual(docs.map(d=>d.id).sort(),['moyka-plenki-brochure','moyka-plenki-dimensions','moyka-plenki-technical']);
 assert.equal(hash(await readFile('public/assets/'+manifest.documentCover.file)),manifest.documentCover.sha256);
 assert.equal(manifest.documentCover.sourceSha256,hotWashDocument.sha256);
});
test('Спецификация содержит 37 проектных позиций, узлы и количества имеют точные соответствия',()=>{
 assert.deepEqual(hotWashSpecification.map(s=>s.position),Array.from({length:37},(_,i)=>i+1));
 for(const [position,quantity] of [[9,3],[10,2],[12,2],[13,2],[16,3],[17,2],[18,2],[19,2],[32,2],[35,3],[36,1],[37,1]])assert.equal(hotWashSpecification.find(s=>s.position===position).quantity,quantity);
 assert.deepEqual(line.equipment,[...new Set(hotWashSpecification.map(s=>s.catalogSlug).filter(Boolean))]);assert.equal(line.equipment.length,9);
 for(const slug of line.equipment)assert.ok(nodes.some(n=>n.slug===slug),slug);
 assert.ok(!line.equipment.includes('rotornyy-raspushitel')&&!line.equipment.includes('vintovoy-press'));
 assert.equal(hotWashSpecification.find(s=>s.position===26).catalogSlug,'kapsulyator');
 assert.ok(hotWashSpecification.find(s=>s.position===28).characteristic.includes('750'));
 assert.equal(hotWashSpecification.find(s=>s.position===37).name,'Помещение цеха');
});
test('Ведомость, календарные величины и энергия следуют ТО, без подмены паспортами или финансовой моделью',()=>{
 assert.equal(hotWashPower.length,11);
 const sum=key=>Math.round(hotWashPower.reduce((sum,r)=>sum+r[key],0)*100)/100;
 assert.equal(sum('installed_kW'),1271.70);assert.equal(sum('calculated_kW'),890.19);
 for(const r of hotWashPower)assert.equal(Math.round(r.installed_kW*.7*100),Math.round(r.calculated_kW*100));
 assert.deepEqual([24,720,744,8760].map(h=>hotWashEnergy(h).toFixed(2)),['21.36','640.94','662.30','7798.06']);
 assert.equal(.75*24,18);assert.equal(.75*720,540);assert.equal(.75*8760,6570);assert.equal(68*33,2244);
 const html=revisedPage(line.path);
 for(const text of ['70%','1 271,70','890,19','77,5','37,6','700–1 200','240–250','0,003–0,007%','190 °C / 2,16 кг','30 суток','720 часов','6 570'])assert.ok(html.includes(text),text);
 assert.ok(html.includes('номинал одного гранулятора')&&html.includes('потери плёнки 1–2%'));
});
test('Монитор имеет 36 уникальных позиций, реальные исходные badges и безопасный fallback 31/32',()=>{
 const d=hotWashDiagram,height=d.height/d.width*1000;
 assert.equal(d.width,2053);assert.equal(d.height,1305);assert.ok(d.file.endsWith('layout-numbered.webp'));
 assert.deepEqual(d.parts.map(p=>p.number),Array.from({length:36},(_,i)=>i+1));
 const callouts=d.parts.flatMap(p=>p.callouts);assert.equal(callouts.length,44);assert.equal(new Set(callouts.map(c=>c.id)).size,44);
 for(const p of d.parts){
  assert.equal(p.label,hotWashSpecification[p.number-1].name);
  for(const [x,y] of [...p.regions.flat(),...p.callouts.flatMap(c=>[c.badge,c.target,...c.pdfLeader])])assert.ok(x>=0&&x<=1000&&y>=0&&y<=height,[p.number,x,y].join(':'));
 }
 for(const number of [31,32]){
  const p=d.parts.find(p=>p.number===number);assert.deepEqual(p.regions,[]);
  for(const c of p.callouts){assert.deepEqual(c.target,c.badge);assert.deepEqual(c.pdfLeader,[]);}
 }
 assert.equal(d.parts.find(p=>p.number===16).callouts.length,3);
 for(const number of [10,17,18,19])assert.equal(d.parts.find(p=>p.number===number).callouts.length,2);
 assert.ok(d.occupancy.occupiedTilesBase64&&d.occupancy.sourceSha256);
});
test('Новая страница использует общий fit-монитор, документы и порядок секций эталона',()=>{
 const html=render(line.path);
 const ids=['purpose','raw-materials','specs','process','composition','quality','placement','kair','photos','documents','equipment'];
 const nav=html.match(/<nav class="anchor-nav line-anchor-nav"[^>]*>(.*?)<\/nav>/s)[1];
 assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]),ids);
 const offsets=ids.map(id=>html.indexOf(`id="${id}"`));assert.ok(offsets.every((n,i)=>n>0&&(!i||n>offsets[i-1])));
 assert.equal((html.match(/data-diagram-mode="fit"/g)||[]).length,1);assert.equal((html.match(/data-part-guide="/g)||[]).length,36);
 assert.equal((html.match(/data-hotwash-position="/g)||[]).length,37);assert.equal((html.match(/data-hotwash-select="/g)||[]).length,36);
 assert.equal((html.match(/id="pdf-viewer"/g)||[]).length,1);assert.equal((html.match(/data-library-document="moyka-plenki-technical"/g)||[]).length,1);
 assert.ok(html.includes(`href="${basePath}/documents/${hotWashDocument.file}"`)&&html.includes('download="'+hotWashDocument.downloadName+'"'));
 assert.ok(html.includes('/line-monitor.js?v=')&&html.includes('/line-documents.js?v=')&&html.includes('/hot-film-washing.js?v='));
 assert.equal((html.match(/src="[^"]*\/hot-film-washing.js/g)||[]).length,1);
 assert.ok(html.includes('data-hero-finish="titanium-gallery"')&&html.includes('Проектная визуализация линии')&&html.includes('catalog-cover-detailed.webp'));
 for(const view of ['top','side','opposite','section-b'])assert.ok(html.includes(`data-dimension-tab="${view}"`));
 assert.ok(html.includes('era-moyka-plenki-dimensions-a0.pdf'));
 assert.ok(!html.includes('undefined')&&!html.includes('NaN')&&!html.includes('javascript:'));
 const htmlIds=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(htmlIds).size,htmlIds.length);
});
test('Медиатека объединяет повторно используемые фотографии, считает материалы и выделяет новую линию',()=>{
 const gallery=buildGalleryData(),items=selectGalleryItems(gallery.items,{album:'moyka-plenki'});
 assert.equal(items.length,22);assert.equal(gallery.albums.filter(a=>a.collection==='lines').length,4);
 assert.equal(new Set(gallery.items.map(i=>i.file)).size,gallery.items.length);
 for(const m of Object.values(hotWashMedia))assert.ok(m.page===null||m.page>=1&&m.page<=22);
 for(const id of ['moyka-plenki-centrifuge','moyka-plenki-flotator','moyka-plenki-raw-film-02','moyka-plenki-kair-overview','moyka-plenki-kair-parameters']){
  const item=findGalleryItem(gallery.items,id);assert.ok(item);assert.ok(item.albumIds.includes('moyka-plenki'));assert.ok(!item.file.startsWith('lines/moyka-plenki/'));
  assert.deepEqual({width:item.width,height:item.height},imageSize('public/assets/'+item.file));
 }
 assert.ok(items.some(i=>i.kind==='photo')&&items.some(i=>i.kind==='scheme')&&items.some(i=>i.kind==='visualization'));
 assert.ok(items.every(i=>!i.file.endsWith('.pdf')));
 assert.equal(gallery.albums.find(a=>a.id==='moyka-plenki').title,hotFilmWashing.cardTitle);
 assert.ok(!JSON.stringify(gallery).includes('undefined')&&!JSON.stringify(gallery).includes('NaN'));
});
test('Страницы вне комплектаций сохраняют утверждённые снимки',async()=>{
 const original=JSON.parse(await readFile('test/fixtures/hot-wash-preserved.json','utf8'));
 for(const [path,sha256] of Object.entries(!previewMode?original.unchangedPagesProduction:basePath?original.unchangedPagesBase:original.unchangedPages)){
  if(!lines.some(entry=>entry.enabled&&entry.path===path))assert.equal(hash(render(path).replaceAll(release,'RELEASE').replace(/<link rel="canonical" href="[^"]*">/g,'')),sha256,path);
 }
 const html=render('/technology');
 assert.ok(html.includes(`href="${basePath}/catalog/lines/moyka-plenki" data-technology-line="moyka-plenki"`));
 assert.ok(html.includes('catalog-cover-detailed.webp')&&html.includes('data-washing-configuration="existing-granulator"'));
});
