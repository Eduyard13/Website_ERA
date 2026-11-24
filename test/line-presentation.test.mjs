import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {render,basePath,assetBaseVersion} from '../scripts/build.mjs';
import {nodes,lines} from '../content/catalog.mjs';
import {lineUnits,filmSeparationMedia} from '../content/film-separation.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {fullLineDiagram,miniLineDiagram} from '../content/line-diagrams.mjs';
import assets from '../content/separatsiya-02-presentation-assets.json' with {type:'json'};
import mask from '../content/separatsiya-02-occupancy.json' with {type:'json'};
import miniAssets from '../content/separatsiya-01-presentation-assets.json' with {type:'json'};
import miniMask from '../content/separatsiya-01-occupancy.json' with {type:'json'};

test('Мини-линия сохраняет свои исходники, 11 точных выносок, 13 позиций и синюю каталожную заставку',async()=>{
 const page=render('/catalog/lines/separatsiya-01');
 const ids=['purpose','raw-materials','composition','process','quality','kair','specs','placement','photos','documents','request','equipment'];
 const order=ids.map(id=>page.indexOf(`id="${id}"`));
 assert.ok(order.every((position,index)=>position>=0&&(!index||position>order[index-1])));
 assert.deepEqual([...page.match(/<nav class="anchor-nav line-anchor-nav"[^>]*>(.*?)<\/nav>/s)[1].matchAll(/href="#([^"]+)"/g)].map(m=>m[1]),ids);
 assert.ok(page.includes('data-line-catalog-cover'));
 const mini=lines.find(line=>line.slug==='separatsiya-01');
 assert.ok(page.includes('width="1536" height="1024"'));
 assert.ok(page.includes(`srcset="${basePath}/assets/${mini.cardSmallFile} 768w, ${basePath}/assets/${mini.cardFile} 1536w"`));
 assert.ok(page.includes(`data-image="${basePath}/assets/${mini.cardFile}"`));
 for(const asset of [miniAssets.hero,miniAssets.hero.small,miniAssets.hero.source,miniAssets.hero.background,miniAssets.diagram]){
  const bytes=await readFile('dist/assets/'+asset.file);
  assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
 }
 assert.deepEqual([miniAssets.hero.small.width,miniAssets.hero.small.height],[768,517]);
 assert.equal(miniAssets.hero.background.sha256,assets.hero.background.sha256);
 assert.equal(miniMask.imageSha256,miniAssets.diagram.sha256);
 const sourcePoints=[[1970,260,1780,307],[1440,224,1464,394],[1158,112,1090,358],[632,245,737,367],[399,458,548,652],[76,768,264,814],[535,1221,703,1045],[803,730,977,790],[1655,826,1398,828],[889,1173,1043,1010],[1560,1210,1410,1135]];
 assert.equal(miniLineDiagram.parts.length,11);assert.equal(miniLineDiagram.defaultPart,3);
 assert.deepEqual([miniLineDiagram.width,miniLineDiagram.height],[2042,1350]);
 for(const [index,part] of miniLineDiagram.parts.entries()){
  const callout=part.callouts[0];assert.equal(part.callouts.length,1);
  const actual=[...callout.badge,...callout.target].map(v=>v*2042/1000);
  for(let n=0;n<4;n++)assert.ok(Math.abs(actual[n]-sourcePoints[index][n])<.002);
  assert.deepEqual(callout.pdfLeader.at(-1),callout.target);assert.ok(callout.tooltipDescription.length>35);
 }
 const composition=page.slice(page.indexOf('id="composition"'),page.indexOf('id="process"'));
 for(const attribute of ['data-line-leader','data-callout-hit'])assert.equal([...composition.matchAll(new RegExp(attribute+'="','g'))].length,11);
 assert.equal([...composition.matchAll(/class="guide-end"/g)].length,11);
 assert.ok(!composition.includes('pin-masks'));assert.ok(composition.includes('layout-native.webp'));
 assert.ok(!composition.includes('line-unit-grid'));
 assert.ok(page.indexOf('id="options"')>page.indexOf('id="quality"')&&page.indexOf('id="options"')<page.indexOf('id="placement"'));
 const documents=page.slice(page.indexOf('id="documents"'),page.indexOf('class="section contact line-request"'));
 assert.equal([...documents.matchAll(/data-library-document="/g)].length,3);
 assert.ok(documents.includes('data-pdf-open="separatsiya-01-mini-technical"'));
 assert.equal([...page.matchAll(/id="pdf-viewer"/g)].length,1);
 const equipment=page.slice(page.indexOf('id="equipment"'));
 assert.equal([...equipment.matchAll(/data-catalogue-image="/g)].length,4);
 for(const slug of ['predvaritelnyy-izmelchitel','ballisticheskiy-separator','rotornyy-raspushitel','rama-napolnitel'])assert.ok(equipment.includes(equipmentCardImages[slug].file));
 assert.ok(!page.includes('402,67'));assert.ok(!page.includes('dimensions-a0.pdf'));assert.ok(!page.includes('5 раздельных потоков'));
 const catalogue=render('/catalog/lines');assert.ok(!catalogue.includes(miniAssets.hero.file));
 assert.ok(!render('/media').includes(miniAssets.hero.file));
});

test('Titanium Gallery использует полное изображение карточки 02 и сохраняет исходные активы',async()=>{
 const page=render('/catalog/lines/separatsiya-02');
 const full=lines.find(line=>line.slug==='separatsiya-02');
 assert.ok(page.includes('data-hero-finish="titanium-gallery"')&&page.includes('data-line-catalog-cover'));
 assert.ok(page.includes(`src="${basePath}/assets/${full.cardFile}"`));
 assert.ok(page.includes(`srcset="${basePath}/assets/${full.cardSmallFile} 768w, ${basePath}/assets/${full.cardFile} 1536w"`));
 assert.ok(page.includes(`data-image="${basePath}/assets/${full.cardFile}"`));
 assert.equal(assets.hero.width,assets.hero.source.width);assert.equal(assets.hero.height,assets.hero.source.height);
 assert.equal(assets.hero.source.sha256,'314b9a2161c6d9d00101c1097bd193a857283ad0d81f375a72d88622bb6e5399');
 for(const asset of [assets.hero,assets.hero.small,assets.hero.background,assets.hero.source,assets.diagram,assets.diagram.source]){
  const bytes=await readFile('dist/assets/'+asset.file);assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 }
 const catalogue=render('/catalog/lines');assert.ok(catalogue.includes(`src="${basePath}/assets/lines/separatsiya-01/catalog-cover.webp"`));assert.ok(!catalogue.includes(assets.hero.file));
 for(const path of ['/catalog/equipment',...nodes.map(n=>n.path)])assert.ok(!render(path).includes('data-hero-finish="titanium-gallery"'),path);
});

test('Полная схема использует прозрачную модель, 28 полных выносок и отдельные подсказки погрузчиков',async()=>{
 const manifest=JSON.parse(await readFile('content/era-separatsiya-02-markers.json','utf8'));
 const page=render('/catalog/lines/separatsiya-02'),diagram=page.slice(page.indexOf('id="line02-construction"'),page.indexOf('id="process"'));
 assert.ok(diagram.includes('data-construction-finish="light-engineering"'));assert.ok(diagram.includes('Линия изнутри. В деталях.'));
 assert.ok(diagram.includes(`href="${basePath}/assets/lines/separatsiya-02/${manifest.asset.file}"`));
 assert.ok(!diagram.includes('layout-interactive.webp'));assert.ok(!diagram.includes('data-leader-join'));assert.ok(!fullLineDiagram.annotationJoins);
 assert.equal((diagram.match(/class="diagram-pin"/g)||[]).length,28);assert.equal((diagram.match(/data-line-leader="/g)||[]).length,28);
 assert.equal((diagram.match(/class="guide-hit"/g)||[]).length,28);assert.equal((diagram.match(/class="guide-end"/g)||[]).length,28);
 assert.equal((diagram.match(/role="tooltip"/g)||[]).length,1);assert.ok(diagram.includes('data-tip-description'));assert.ok(!diagram.includes('line-diagram-pin-masks'));
 assert.equal(fullLineDiagram.width,4000);assert.equal(fullLineDiagram.height,2820);assert.ok(diagram.includes('viewBox="0 0 1000 705"'));
 const bytes=await readFile('dist/assets/lines/separatsiya-02/'+manifest.asset.file);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.asset.sha256);
 assert.equal(mask.imageSha256,manifest.asset.sha256);
 assert.equal(Buffer.from(mask.occupiedTilesBase64,'base64').length,Math.ceil(mask.columns*mask.rows/8));
 assert.ok(diagram.includes(`data-callout-mask="${mask.columns},${mask.rows},${mask.occupiedTilesBase64}"`));
 assert.match(diagram,/<div class="line-details-copy">.*?role="tooltip"/s);
 assert.equal(manifest.asset.sha256,'a1adfaac6f64e0b43113543ed1816f2ab63090753717bf792e1a3da646daed66');
 assert.equal(bytes.subarray(12,16).toString(),'VP8L');const bits=bytes.readUInt32LE(21);
 assert.equal((bits&0x3fff)+1,4000);assert.equal(((bits>>>14)&0x3fff)+1,2820);assert.ok(bits&0x10000000,'source has real alpha');
 assert.equal(manifest.positions.length,27);
 for(const position of manifest.positions){
  const part=fullLineDiagram.parts.find(p=>p.number===position.number);assert.equal(part.callouts.length,position.callouts.length);
  assert.ok(diagram.includes(`<span>${String(part.number).padStart(2,'0')}</span>`));
  for(let i=0;i<part.callouts.length;i++){
   const c=part.callouts[i],raw=position.callouts[i],path='M '+[c.badge,...c.pdfLeader].map(p=>p.join(' ')).join(' L ');
   assert.deepEqual(c.badge,raw.badge.map(v=>v/4));assert.deepEqual(c.target,raw.target.map(v=>v/4));
   assert.deepEqual(c.pdfLeader,raw.pdfLeader.map(p=>p.map(v=>v/4)));assert.deepEqual(c.pdfLeader.at(-1),c.target);
   assert.ok(diagram.includes(`data-line-leader="${c.id}" d="${path}"`));assert.ok(diagram.includes(`data-callout-hit="${c.id}" d="${path}"`));
   assert.ok(diagram.includes(`data-callout="${c.id}"`));assert.equal(c.tooltipDescription,raw.tooltipDescription??position.tooltipDescription);
  }
 }
 const trucks=fullLineDiagram.parts.find(p=>p.number===27);assert.deepEqual(trucks.callouts.map(c=>c.id),['27-loading','27-unloading']);
 assert.notEqual(trucks.callouts[0].tooltipDescription,trucks.callouts[1].tooltipDescription);
 for(const [n,count] of [[20,5],[25,4],[27,2]])assert.equal(fullLineDiagram.parts.find(p=>p.number===n).regions.length,count);
 const version=assetBaseVersion;
 assert.match(page,/\/line-monitor\.js\?v=[a-f0-9-]+/);assert.ok(page.includes(`/line-monitor.css?v=${version}-callouts-3`));
 assert.ok((await readFile('dist/line-monitor.js','utf8')).includes(`./line-callout-layout.mjs?v=${version}-callouts-3`));
});

test('Шесть компактных карточек сохраняют данные и ссылки, используя точные изображения каталога',()=>{
 const page=render('/catalog/lines/separatsiya-02');
 const start=page.indexOf('id="equipment"');const section=page.slice(start,page.indexOf('</section>',start));
 const cards=[...section.matchAll(/<article class="line-unit-card[^>]*>([\s\S]*?)<\/article>/g)];assert.equal(cards.length,lineUnits.length);
 lineUnits.forEach(([position,title,text,value,slug,key],i)=>{
  const card=cards[i][0];for(const expected of [`Поз. ${position}`,title,text,value])assert.ok(card.includes(expected),expected);
  if(slug){const image=equipmentCardImages[slug],n=nodes.find(n=>n.slug===slug);assert.ok(card.includes(`src="${basePath}/assets/${image.file}"`));assert.ok(card.includes(`href="${basePath}${n.path}"`));assert.ok(card.includes(image.smallFile));}
  else{assert.ok(card.includes(`src="${basePath}/assets/${filmSeparationMedia[key].file}"`));assert.ok(card.includes('В составе представленной линии'));assert.ok(!card.includes('<a '));}
  assert.ok(!card.includes('node-card-specs'));assert.ok(!card.includes('node-card-features'));
 });
 assert.equal(lines.find(l=>l.slug==='separatsiya-02').cardFile,'lines/separatsiya-01/catalog-cover.webp');
});


test('BASE: always-visible native process map preserves equipment routes and other pages',()=>{
 const page=render('/catalog/lines/separatsiya-01');
 const block=page.slice(page.indexOf('id="process"'),page.indexOf('id="quality"'));
 assert.ok(block.includes('Как линия разделяет плёнку, примеси и пыль'));
 assert.ok(block.includes('Наглядная карта движения основного продукта и отходящих потоков.'));
 assert.deepEqual([...block.matchAll(/data-base-flow-step="([^"]+)"/g)].map(m=>m[1]),['01–02','03','05','06','Выход']);
 assert.deepEqual([...block.matchAll(/data-base-flow-from="([^"]+)"/g)].map(m=>m[1]),['03','05','06']);
 assert.ok(block.includes('data-base-flow-dust="06"'));
 assert.equal((block.match(/data-base-flow-branch="/g)||[]).length,2);
 assert.equal((block.match(/data-base-flow-outcome="/g)||[]).length,3);
 assert.equal((block.match(/<li><span class="line-index"/g)||[]).length,6);
 assert.ok(block.includes('<span class="line-index">04</span><h3>Интенсивная очистка</h3>'));
 assert.equal((block.match(/class="base-product-film"/g)||[]).length,1);
 assert.ok(!block.includes('<details')&&!block.includes('flow.webp')&&!block.includes('<img'));
 assert.ok(block.includes('конвейерами 07–10')&&block.includes('Рама-наполнитель 11')&&block.includes('позиция 12'));
 assert.ok(page.includes('/base-process.css?v='));
 for(const slug of ['separatsiya-02','separatsiya-03','moyka-plenki']){
  const other=render('/catalog/lines/'+slug);
  assert.ok(!other.includes('data-base-process-map')&&!other.includes('/base-process.css?v='));
 }
});

test('PRO native flow preserves the single press, both useful routes and separate waste routes',()=>{
 const page=render('/catalog/lines/separatsiya-02'),p=page.slice(page.indexOf('id="process"'),page.indexOf('id="quality"'));
 assert.ok(p.includes('Как линия разделяет основной микс и выбранные фракции'));
 assert.ok(p.includes('<span class="line-index">03</span><h3>Закрытый сортировочный бокс</h3>'));
 assert.ok(p.includes('Вакуумные высосы направляют')&&p.includes('С вакуумными высосами')&&p.includes('Вакуумный высос из бокса'));
 assert.doesNotMatch(p,/отсос/i);
 assert.ok(p.includes('Интенсивная очистка')&&p.includes('повторно подать в линию отдельной партией'));
 assert.equal((p.match(/<li><span class="line-index"/g)||[]).length,6);
 assert.equal((p.match(/data-pro-flow-node="/g)||[]).length,12);
 assert.equal((p.match(/data-pro-flow-node="press"/g)||[]).length,1);
 assert.equal((p.match(/data-pro-flow-outcome="/g)||[]).length,3);
 for(const route of ['sorting-fractions','fractions-four','four-press','fifth-press','press-mix','press-sorted','rotor-solids','rotor-dust','four-dust','fifth-dust'])assert.ok(p.includes('data-pro-route="'+route+'"'),route);
 assert.ok(!p.includes('<details')&&!p.includes('<img')&&!p.includes('line-process-views'));
 assert.ok(page.includes('/pro-process.css?v='));
 for(const slug of ['separatsiya-01','separatsiya-03','moyka-plenki']){const other=render('/catalog/lines/'+slug);assert.ok(!other.includes('data-pro-process-map')&&!other.includes('/pro-process.css?v='));}
});

test('BASE, PRO and PREMIUM share exactly the same four full-source dry product photographs',()=>{
 const photos=['lines/separatsiya-01-mini/before.webp','lines/separatsiya-01-mini/after.webp','lines/separatsiya-03/product-before.webp','lines/separatsiya-03/product-after.webp'];
 let common;
 for(const slug of ['separatsiya-01','separatsiya-02','separatsiya-03']){
  const page=render('/catalog/lines/'+slug),part=page.slice(page.indexOf('id="quality"'),page.indexOf('id="kair"'));
  const block=part.slice(part.indexOf('<div class="dry-product-showcase"'),part.indexOf(slug==='separatsiya-01'?'<div class="dry-product-routes base-product-routes"':'<div class="dry-product-routes"')).trim();
  assert.ok(block.includes('data-dry-product-showcase'),slug);
  assert.equal((block.match(/data-dry-product-pair="/g)||[]).length,2);
  assert.deepEqual([...block.matchAll(/<img src="([^"]+)" /g)].map(m=>m[1]),photos.map(p=>basePath+'/assets/'+p));
  assert.equal((block.match(/data-dry-product-state="before"/g)||[]).length,2);
  assert.equal((block.match(/data-dry-product-state="after"/g)||[]).length,2);
  assert.equal((block.match(/data-media-group="dry-product-results"/g)||[]).length,4);
  assert.ok(!block.includes('-thumb.webp'));
  assert.doesNotMatch(part,/line-quality-table|line-evidence|mini-quality-results|dry-product-model-note|dry-product-photo-note/);
  assert.ok(block.includes('Что вы получаете на выходе'));
  const benefits=["Отделение основной массы посторонних включений","Очищенная плёночная фракция","Возможность реализации очищенного сырья (плёночной фракции)","Подготовка материала к дальнейшей мойке и переработке"];
  const offsets=benefits.map(label=>block.indexOf('<span>'+label+'</span>'));
  assert.ok(offsets.every((offset,i)=>offset>=0&&(!i||offset>offsets[i-1])),slug);
  assert.doesNotMatch(block,/Что получает клиент|Визуально более чистая/);
  assert.ok(part.includes(slug==='separatsiya-01'?'data-base-product-routes':'data-dry-product-routes'));
  if(slug==='separatsiya-01')assert.ok(part.includes('id="options"'));
  if(common)assert.equal(block,common);else common=block;
 }
 assert.ok(!render('/catalog/lines/moyka-plenki').includes('data-dry-product-showcase'));
});

test('PRO and PREMIUM share two alternative downstream product routes, with the same two product-type photos in both deployment targets',()=>{
 let common;
 for(const slug of ['separatsiya-02','separatsiya-03']){
  const html=render('/catalog/lines/'+slug),start=html.indexOf('<div class="dry-product-routes"'),end=html.indexOf('</section>',start),block=html.slice(start,end).trim();
  assert.ok(start>0);assert.ok(block.includes('Готовая продукция и дальнейший путь материала'));
  assert.deepEqual([...block.matchAll(/data-dry-route-lane="([^"]+)"/g)].map(m=>m[1]),['sale','cycle']);
  assert.deepEqual([...block.matchAll(/data-dry-route-stage="([^"]+)"/g)].map(m=>m[1]),['bale','wash','pellets']);
  assert.ok(block.includes('href="'+basePath+'/catalog/lines/moyka-plenki"'));
  assert.doesNotMatch(block,/sd-product-shipping|line-next-process/);
  assert.deepEqual([...block.matchAll(/data-dry-route-reference="([^"]+)"/g)].map(m=>m[1]),['clear','sorted']);
  assert.ok(block.includes('https://images.squarespace-cdn.com/content/v1/649219dee5586d7b971d3292/c908249b-87d0-4972-86f6-ba26867ea00f/Plastic%2Bfilm%2Bwebsite.jpg')&&block.includes('https://d15gpb5pyl94gl.cloudfront.net/media/_bestand/16398/DSC_0612.jpg'));
  assert.doesNotMatch(block,/dry-route-source-note|Фото:|для согласования|сторонних компаний|data-dry-route-gallery="original"/);
  assert.ok(block.includes('Примеры товарных фракций'));
  if(common)assert.equal(block,common);else common=block;
 }
 for(const slug of ['separatsiya-01','moyka-plenki'])assert.ok(!render('/catalog/lines/'+slug).includes('data-dry-product-routes'));
});

test('BASE uses both full original trial photos, three discharge formats and native PRO / PREMIUM links',()=>{
 const html=render('/catalog/lines/separatsiya-01'),start=html.indexOf('<div class="dry-product-routes base-product-routes"'),end=html.indexOf('</section>',start),block=html.slice(start,end);
 assert.ok(start>0&&block.includes('Готовая продукция и дальнейший путь материала'));
 assert.deepEqual([...block.matchAll(/data-base-product-photo="([^"]+)"/g)].map(m=>m[1]),['after','after-close']);
 for(const file of ['after.webp','after-close.webp'])assert.ok(block.includes('src="'+basePath+'/assets/lines/separatsiya-01-mini/'+file+'"'));
 assert.deepEqual([...block.matchAll(/data-base-delivery="([^"]+)"/g)].map(m=>m[1]),['loose','bag','cage']);
 assert.deepEqual([...block.matchAll(/data-dry-route-lane="([^"]+)"/g)].map(m=>m[1]),['sale','cycle']);
 assert.deepEqual([...block.matchAll(/data-dry-route-stage="([^"]+)"/g)].map(m=>m[1]),['sale','wash','pellets']);
 for(const [slug,name] of [['separatsiya-02','PRO'],['separatsiya-03','PREMIUM']]){
  const l=lines.find(x=>x.slug===slug);assert.ok(block.includes('data-base-expansion="'+name+'" href="'+basePath+l.path+'"'));assert.ok(block.includes('src="'+basePath+'/assets/'+l.cardFile+'"'));
 }
 assert.ok(block.includes('Сортировка по видам и автоматизированный пресс в базовой комплектации не предусмотрены'));
 assert.ok(block.includes('href="'+basePath+'/catalog/lines/moyka-plenki"'));
 assert.doesNotMatch(block,/line-next-process|mini-line-options|https?:\/\//);
 for(const slug of ['separatsiya-02','separatsiya-03','moyka-plenki'])assert.ok(!render('/catalog/lines/'+slug).includes('data-base-product-routes'));
});

test('All three dry separation pages share the approved KAIR chip, slogan, six cards and native link',()=>{
 let common;
 for(const slug of ['separatsiya-01','separatsiya-02','separatsiya-03']){
  const page=render('/catalog/lines/'+slug),start=page.indexOf('id="kair"'),end=page.indexOf('</section>',start),block=page.slice(start,end);
  assert.ok(start>0&&block.includes('data-dry-kair'));
  assert.ok(block.includes('class="dry-kair-chip"')&&block.includes('class="dry-kair-wordmark">КАИР')&&block.includes('>SIEMENS</span>'));
  assert.ok(block.includes('ИНТЕЛЛЕКТУАЛЬНАЯ СИСТЕМА УПРАВЛЕНИЯ'));
  assert.ok(block.includes('Всё производство.<br><span>Под вашим контролем.</span>'));
  assert.deepEqual([...block.matchAll(/data-dry-kair-feature="([^"]+)"/g)].map(m=>m[1]),['automation','memory','diagnostics','protection','monitoring','history']);
  assert.ok(block.includes('href="'+basePath+'/automation"')&&block.includes('Подробнее о КАИР'));
  assert.doesNotMatch(block,/<details|line-control|line-section-heading|Обслуживание и доступ|kair-screen|kair-overview/);
  if(common)assert.equal(block,common);else common=block;
 }
 assert.ok(!render('/catalog/lines/moyka-plenki').includes('data-dry-kair'));
});

test('BASE production passport: one closed combined technical and power specification',()=>{
 const page=render('/catalog/lines/separatsiya-01'),a=page.indexOf('id="specs"'),b=page.indexOf('</section>',a),block=page.slice(a,b);
 assert.ok(block.includes('data-base-specs')&&block.includes('Производственные характеристики'));
 assert.ok(block.includes('<h3>Потребляемая мощность</h3><p>70% установленной мощности</p>'));
 assert.ok(block.includes('>Установленная мощность, кВт</th>')&&block.includes('>Потребляемая мощность, кВт</th>'));
 assert.doesNotMatch(block,/Расчётная потребляемая мощность|Уст\., кВт|Потр\., кВт/);
 assert.deepEqual([...block.matchAll(/data-base-spec-kpi="([^"]+)"/g)].map(m=>m[1]),['input','output','power','gauge']);
 for(const text of ['1 500 <small>кг/ч</small>','750 <small>кг/ч</small>','225 <small>кВт</small>','157,5 <small>кВт</small>','105 <small>кВт·ч/т</small>','210 <small>кВт·ч/т</small>','3–5%','Потери полезной плёнки на испытаниях','380 <small>В</small>','Допуск +10% / −15%','50 ± 1 <small>Гц</small>','1 · Оператор','2 · Производственных рабочих','управление погрузчиками','До 80%','До 30%'])assert.ok(block.includes(text),text);
 assert.equal((block.match(/<details\b/g)||[]).length,1);
 assert.ok(block.includes('<details class="line-more line-power-details" data-keep-open>'));
 assert.deepEqual([...block.matchAll(/data-power-position="([^"]+)"/g)].map(m=>Number(m[1])),Array.from({length:13},(_,i)=>i+1));
 assert.ok(block.includes('Итого по линии</th><td>225</td><td>157,5</td>'));
 assert.doesNotMatch(block,/Расчёт выпуска по периодам|Полная спецификация базовой комплектации|line-production-table|line-specs-layout/);
 assert.doesNotMatch(page,/600–700 кг\/ч/);
 for(const slug of ['separatsiya-02','separatsiya-03','moyka-plenki'])assert.ok(!render('/catalog/lines/'+slug).includes('data-base-specs'));
});

test('PRO production passport uses updated 30-position specification and consistent 70% power calculation',()=>{
 const page=render('/catalog/lines/separatsiya-02'),a=page.indexOf('id="specs"'),b=page.indexOf('</section>',a),block=page.slice(a,b);
 assert.ok(block.includes('data-pro-specs')&&block.includes('Производственные характеристики'));
 assert.deepEqual([...block.matchAll(/data-base-spec-kpi="([^"]+)"/g)].map(m=>m[1]),['input','output','power','gauge']);
 assert.deepEqual([...block.matchAll(/data-pro-spec-position="([^"]+)"/g)].map(m=>Number(m[1])),Array.from({length:30},(_,i)=>i+1));
 assert.equal((block.match(/<details\b/g)||[]).length,1);
 for(const value of ['405,2 <small>кВт</small>','283,64 <small>кВт</small>','189,09 <small>кВт·ч/т</small>','378,19 <small>кВт·ч/т</small>','26 × 5 = 130','18,2 × 5 = 91','5–13 человек','2–10 · Сортировщиков','36 единиц','3–5%','61,4 м²','283,6 кВт','Установленная мощность, кВт','Потребляемая мощность, кВт'])assert.ok(block.includes(value),value);
 assert.ok(block.includes('Итого по линии</th><td>36</td><td>405,2</td><td>283,64</td>'));
 assert.doesNotMatch(block,/line-production-table|line-specs-layout|402,67|281,87/);
 for(const slug of ['separatsiya-01','separatsiya-03','moyka-plenki'])assert.ok(!render('/catalog/lines/'+slug).includes('data-pro-specs'));
});

test('PREMIUM production passport uses the latest 38-position specification and retains original diagram',()=>{
 const page=render('/catalog/lines/separatsiya-03'),a=page.indexOf('id="specs"'),b=page.indexOf('</section>',a),block=page.slice(a,b);
 assert.ok(block.includes('data-premium-specs')&&block.includes('Производственные характеристики'));
 assert.deepEqual([...block.matchAll(/data-base-spec-kpi="([^"]+)"/g)].map(m=>m[1]),['input','output','power','gauge']);
 assert.deepEqual([...block.matchAll(/data-premium-spec-position="([^"]+)"/g)].map(m=>Number(m[1])),Array.from({length:38},(_,i)=>i+1));
 assert.equal((block.match(/<details\b/g)||[]).length,1);
 for(const value of ['642,4 <small>кВт</small>','449,68 <small>кВт</small>','299,79 <small>кВт·ч/т</small>','599,57 <small>кВт·ч/т</small>','26 × 5 = 130','18,2 × 5 = 91','25 × 2 = 50','17,5 × 2 = 35','5–13 человек','2–10 · Сортировщиков','57 единиц','До 5%','166,82 м²','449,7 кВт','Установленная мощность, кВт','Потребляемая мощность, кВт','АСИИ «КАИР»'])assert.ok(block.includes(value),value);
 assert.ok(block.includes('Итого по линии</th><td>57</td><td>642,4</td><td>449,68</td>'));
 assert.match(block,/data-premium-spec-position="36"[\s\S]*?<th scope="row">Шкаф управления<\/th><td>На базе Siemens<\/td><td>3<\/td>/);
 assert.doesNotMatch(block,/line-production-table|line-specs-layout|639,77|447,84/);
 for(const slug of ['separatsiya-01','separatsiya-02','moyka-plenki'])assert.ok(!render('/catalog/lines/'+slug).includes('data-premium-specs'));
});
