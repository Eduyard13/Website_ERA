import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {lines,nodes} from '../content/catalog.mjs';
import {hotFilmWashing,hotWashDocument,hotWashSpecification,hotWashPower,hotWashEnergy,hotWashMedia,hotWashProducts} from '../content/hot-film-washing.mjs';
import flow from '../content/hot-wash-flow.json' with {type:'json'};
import rawAssets from '../content/hot-wash-raw-assets.json' with {type:'json'};
import {formatLineNumber as fmt,linePowerData} from '../content/line-engineering.mjs';
import {hotWashDiagram} from '../content/hot-wash-diagram.mjs';
import {publicLibraryDocuments} from '../content/document-library.mjs';
import {buildGalleryData} from '../scripts/gallery-data.mjs';
import {selectGalleryItems,findGalleryItem} from '../public/gallery-model.js';
import {revisedPage} from '../scripts/views.mjs';
import {render,basePath,previewMode,routes,assetBaseVersion} from '../scripts/build.mjs';
import {imageSize} from '../scripts/image-size.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const line=lines.find(l=>l.slug==='moyka-plenki');
const release=assetBaseVersion;
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
 for(const text of ['70%','1 271,70','890,19','77,5','37,6','700–1 200','0,003–0,007%','190 °C / 2,16 кг','30 суток','720 ч','6 570'])assert.ok(html.includes(text),text);
 assert.match(html,/<dd>1–2<small>%<\/small>/);
 assert.match(html,/Номинал одного гранулятора/);
});
test('Монитор связывает 44 номера и 47 ветвей выносок с контурами 36 позиций',()=>{
 const d=hotWashDiagram,height=d.height/d.width*1000;
 assert.equal(d.width,2053);assert.equal(d.height,1305);assert.ok(d.file.endsWith('layout-native-v2.webp'));
 assert.deepEqual(d.parts.map(p=>p.number),Array.from({length:36},(_,i)=>i+1));
 const callouts=d.parts.flatMap(p=>p.callouts);assert.equal(callouts.length,44);assert.equal(new Set(callouts.map(c=>c.id)).size,44);
 for(const p of d.parts){
  assert.equal(p.label,hotWashSpecification[p.number-1].name);
  for(const c of p.callouts){
   assert.ok(c.regions.length&&c.regions.every(polygon=>polygon.length>=3));
   assert.ok(c.leaders.every(leader=>leader.length>=2));
   for(const [x,y] of [c.badge,...c.leaders.flat(),...c.regions.flat()])assert.ok(x>=0&&x<=1000&&y>=0&&y<=height,[c.id,x,y].join(':'));
  }
 }
 assert.deepEqual(callouts.filter(c=>c.leaders.length===2).map(c=>c.id),['09-2','12-1','13-1']);
 assert.equal(callouts.reduce((sum,c)=>sum+c.leaders.length,0),47);
 assert.equal(d.parts.find(p=>p.number===16).callouts.length,3);
 for(const number of [10,17,18,19])assert.equal(d.parts.find(p=>p.number===number).callouts.length,2);
 assert.ok(d.occupancy.occupiedTilesBase64&&d.occupancy.sourceSha256);
});
test('Новая страница использует общий fit-монитор, документы и порядок секций эталона',()=>{
 const html=render(line.path);
 const ids=['purpose','raw-materials','composition','process','quality','kair','specs','placement','photos','documents','request','equipment'];
 const nav=html.match(/<div class="line-section-nav" data-line-section-nav[^>]*>(.*?)<\/div>/s)[1];
 assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]),ids);
 const offsets=ids.map(id=>html.indexOf(`id="${id}"`));assert.ok(offsets.every((n,i)=>n>0&&(!i||n>offsets[i-1])));
 assert.equal((html.match(/data-diagram-mode="fit"/g)||[]).length,1);assert.equal((html.match(/data-part-guide="/g)||[]).length,44);
 assert.equal((html.match(/data-hotwash-position="/g)||[]).length,37);assert.equal((html.match(/data-hotwash-select="/g)||[]).length,36);
 const composition=html.slice(html.indexOf('id="composition"'),html.indexOf('id="process"'));
 assert.doesNotMatch(composition,/data-hotwash-position|data-hotwash-select|Техническая спецификация|Спецификация: все 37|37 — помещение цеха|Одна позиция может включать|Для 31 и 32 сохранены|<noscript>/);
 assert.ok(composition.includes('Каждый узел на своём месте.')&&composition.includes('Каждая функция — на результат.'));
 assert.ok(composition.includes('От подготовленной плёнки через горячую мойку'));
 assert.ok(composition.includes('data-architecture-list')&&composition.includes('dry-architecture-layout'));
 assert.ok(composition.includes('Каждая позиция на схеме — часть единого технологического маршрута.'));
 assert.equal((composition.match(/data-architecture-part="/g)||[]).length,36);
 assert.ok(composition.includes('href="#placement"')&&composition.includes('См. раздел размещения'));
 assert.ok(composition.includes('lines/moyka-plenki/layout-native-v2.webp'));
 assert.equal((composition.match(/data-callout-region="/g)||[]).length,44);
 assert.ok(!composition.includes('Документация ↓'));
 assert.ok(html.includes('/dry-architecture.css?v='));
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
test('Карта HOT-WASH воспроизводит направления материала, реагентов, воды и стоков',()=>{
 const html=render(line.path);
 const process=html.slice(html.indexOf('id="process"'),html.indexOf('id="quality"'));
 const routes=(attribute)=>[...process.matchAll(new RegExp(attribute+'="([^"]+)" data-hotwash-flow="([^"]+)"','g'))].map(m=>m.slice(1));
 assert.deepEqual(routes('data-hotwash-stage'),flow.material.map(([key,route])=>[key,route]));
 assert.deepEqual(routes('data-hotwash-product'),flow.products.map(([key,route])=>[key,route]));
 assert.deepEqual(routes('data-hotwash-water'),flow.water.map(([route],i)=>[['fresh','mill','hot','rinse','treatment'][i],route]));
 assert.deepEqual(routes('data-hotwash-reagent'),flow.reagents.map(([route],i)=>[['32А','32Б'][i],route]));
 assert.deepEqual(routes('data-hotwash-waste'),flow.waste.map(([route],i)=>[['solids','sludge'][i],route]));
 assert.match(process,/12А → 13А или 12Б → 13Б/);
 assert.match(process,/30 → 13\/15\/16А; 30 → 18А; 30 → 18Б/);
 assert.match(process,/штробы → 33 → 34 → 18А/);
 assert.doesNotMatch(process,/30 → 31|34 → 18Б|вторичн/i);
 assert.equal((process.match(/hw-flow-product--primary/g)||[]).length,1);
 assert.deepEqual(hotWashProducts.map(([,title,,route])=>[title,route]),flow.products.map(([,route,title])=>[title,route]));
 assert.equal((html.match(/hot-wash-process\.css\?v=/g)||[]).length,1);
 for(const slug of ['separatsiya-01','separatsiya-02','separatsiya-03'])assert.doesNotMatch(render('/catalog/lines/'+slug),/hot-wash-process\.css\?v=/);
});
test('Единая спецификация выводит все четыре значения мощности и суммы по проектным позициям',()=>{
 const html=render(line.path),specs=html.slice(html.indexOf('id="specs"'),html.indexOf('id="placement"'));
 const rows=[...specs.matchAll(/<tr data-hotwash-position="(\d+)"(?: data-power-position="\d+")?>([\s\S]*?)<\/tr>/g)];
 const powers=new Map(linePowerData[line.slug].rows.map(power=>[power.position,power]));
 assert.equal(powers.size,32);
 assert.deepEqual(rows.map(row=>Number(row[1])),hotWashSpecification.map(item=>item.position));
 for(const [,index,row] of rows){
  const position=Number(index),power=powers.get(position),item=hotWashSpecification[position-1];
  const values=[power?.installed_unit_kw,power?.installed_total_kw,power?.calculated_unit_kw,power?.calculated_total_kw];
  assert.deepEqual([...row.matchAll(/class="line-power-number">([^<]+)</g)].map(m=>m[1]),values.map(value=>value==null?'—':fmt(value)),index);
  assert.ok(row.includes('<td>'+item.quantity+'</td>'),index);
  assert.ok(row.includes(position===37?'href="#placement"':'data-hotwash-select="'+position+'"'),index);
 }
 assert.deepEqual(rows.map(row=>Number(row[1])).filter(position=>!powers.has(position)),[30,34,35,36,37]);
 assert.equal(Math.round([...powers.values()].reduce((sum,row)=>sum+100*row.installed_total_kw,0)),127170);
 assert.equal(Math.round([...powers.values()].reduce((sum,row)=>sum+100*row.calculated_total_kw,0)),89019);
 assert.match(specs,/Всего по линии<\/th><td>—<\/td><td>1 271,70<\/td><td>—<\/td><td>890,19/);
 for(const text of ['1 186,92','21,36','640,94','7 798,06','0,8%','До 3%','5–7%','термодеструкция'])assert.ok(specs.includes(text),text);
});
test('Сырьё HOT-WASH использует пять утверждённых иллюстраций и три полноценных карточки',async()=>{
 const html=render(line.path);
 const section=html.slice(html.indexOf('id="raw-materials"'),html.indexOf('id="composition"'));
 const figures=[...section.matchAll(/<figure[^>]*data-media-group="hot-wash-raw"[^>]*>([\s\S]*?)<\/figure>/g)].map(match=>match[1]);
 const keys=['raw-prepared-01','raw-prepared-02','raw-household','raw-agricultural','raw-stretch'];
 assert.equal(figures.length,5);
 assert.equal((section.match(/class="hw-raw-origin"/g)||[]).length,3);
 keys.forEach((key,index)=>assert.match(figures[index],new RegExp('/raw-prepared/'+key+'\\.webp"')));
 for(const [index,key] of keys.entries()){
  const {files,title}=rawAssets.find(asset=>asset.key===key);
  assert.ok(figures[index].includes(`alt="${title}"`));
  assert.match(figures[index],/loading="lazy"/);
  assert.deepEqual(files.map(file=>file.width).sort((a,b)=>a-b).slice(0,2),[480,768]);
  for(const {file,width,height,sha256} of files){
   assert.ok(figures[index].includes(`/raw-prepared/${file} ${width}w`),file);
   const local='public/assets/lines/moyka-plenki/raw-prepared/'+file;
   assert.deepEqual(imageSize(local),{width,height},file);
   assert.equal(hash(await readFile(local)),sha256,file);
  }
 }
 for(const label of ['Что отделяется на сухой стадии','Что остаётся для мойки','Что проверяем']){
  assert.equal(section.split(`<dt>${label}</dt>`).length-1,3);
 }
 assert.match(section,/Что удаляет мойка/);
 assert.ok(section.includes(`href="${basePath}/catalog/lines/separatsiya-02"`));
 assert.doesNotMatch(section,/<details|<table|Сырьё и контроль партии|raw-film-0[12]/);
 assert.doesNotMatch(render('/media'),/\/moyka-plenki\/raw-prepared\//);
});
test('На мойке сохранены основной КАИР, карта процесса и показатели готовой продукции',()=>{
 const html=render(line.path);
 const process=html.slice(html.indexOf('id="process"'),html.indexOf('id="quality"'));
 const quality=html.slice(html.indexOf('id="quality"'),html.indexOf('id="kair"'));
 const kair=html.slice(html.indexOf('id="kair"'),html.indexOf('id="specs"'));
 assert.doesNotMatch(process,/<details|hw-process-archive/);
 assert.equal((process.match(/data-hotwash-stage="/g)||[]).length,10);
 assert.doesNotMatch(quality,/<details|class="line-note"|Показатели из технического описания/);
 assert.equal((quality.match(/data-hotwash-output="/g)||[]).length,3);
 for(const value of ['30–70<small>ppm','1–2<small>%','0,8–1,2<small>г/10 мин','190 °C / 2,16 кг'])assert.ok(quality.includes(value),value);
 assert.doesNotMatch(kair,/<img|line-process-views|Экраны из технического описания/);
 assert.equal((kair.match(/data-dry-kair-feature="/g)||[]).length,6);
 assert.ok(kair.includes(`class="dry-kair-link" href="${basePath}/automation"`));
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
test('Все разделы вне комплектаций сохраняют корректную разметку после согласованного обновления',async()=>{
  for(const path of ['/','/catalog/equipment','/catalog','/automation','/economics','/about-us']){
   const page=render(path);
   assert.ok(page.includes('<html lang="ru">') && page.includes('<main'),path);
   assert.ok(!page.includes('>undefined<'),path);
  }
  const html=render('/technology');
  assert.ok(html.includes(`href="${basePath}/catalog/lines/moyka-plenki" data-technology-line="moyka-plenki"`));
  assert.ok(html.includes('catalog-cover-detailed.webp')&&html.includes('data-washing-configuration="existing-granulator"'));
});

test('В конце страницы мойки остаются только карточки с действующими страницами узлов',()=>{
 const html=render(line.path),start=html.indexOf('id="equipment"'),section=html.slice(start,html.indexOf('</section>',start));
 const cards=[...section.matchAll(/<article class="line-unit-card[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
 const linked=hotWashSpecification.filter(s=>s.catalogSlug);
 assert.equal(cards.length,linked.length);
 assert.ok(cards.length>0);
 for(const [i,item] of linked.entries()){const node=nodes.find(n=>n.slug===item.catalogSlug);assert.ok(node);assert.ok(cards[i].includes('href="'+basePath+node.path+'"')); }
 assert.doesNotMatch(section,/class="line-routing"|24 · Автоматическое тюкование|28 · Двухстадийная грануляция/);
 assert.ok(hotWashSpecification.find(s=>s.position===24));assert.ok(hotWashSpecification.find(s=>s.position===28));
});
