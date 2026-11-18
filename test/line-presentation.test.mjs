import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {render,basePath} from '../scripts/build.mjs';
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
 const ids=['purpose','raw-materials','specs','process','composition','quality','placement','kair','photos','documents','equipment'];
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
 const composition=page.slice(page.indexOf('id="composition"'),page.indexOf('id="quality"'));
 for(const attribute of ['data-line-leader','data-callout-hit'])assert.equal([...composition.matchAll(new RegExp(attribute+'="','g'))].length,11);
 assert.equal([...composition.matchAll(/class="guide-end"/g)].length,11);
 assert.ok(!composition.includes('pin-masks'));assert.ok(composition.includes('layout-native.webp'));
 assert.ok(!composition.includes('line-unit-grid'));
 assert.ok(page.indexOf('id="options"')>page.indexOf('id="quality"')&&page.indexOf('id="options"')<page.indexOf('id="placement"'));
 const documents=page.slice(page.indexOf('id="documents"'),page.indexOf('id="equipment"'));
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
 const page=render('/catalog/lines/separatsiya-02'),diagram=page.slice(page.indexOf('id="line02-construction"'),page.indexOf('id="quality"'));
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
 const {version}=JSON.parse(await readFile('package.json','utf8'));
 assert.ok(page.includes(`/line-monitor.js?v=${version}-callouts-3`));assert.ok(page.includes(`/line-monitor.css?v=${version}-callouts-3`));
 assert.ok((await readFile('dist/line-monitor.js','utf8')).includes(`./line-callout-layout.mjs?v=${version}-callouts-3`));
});

test('Шесть компактных карточек сохраняют данные и ссылки, используя точные изображения каталога',()=>{
 const page=render('/catalog/lines/separatsiya-02');
 const section=page.slice(page.indexOf('id="equipment"'),page.indexOf('class="section contact line-request"'));
 const cards=[...section.matchAll(/<article class="line-unit-card[^>]*>([\s\S]*?)<\/article>/g)];assert.equal(cards.length,lineUnits.length);
 lineUnits.forEach(([position,title,text,value,slug,key],i)=>{
  const card=cards[i][0];for(const expected of [`Поз. ${position}`,title,text,value])assert.ok(card.includes(expected),expected);
  if(slug){const image=equipmentCardImages[slug],n=nodes.find(n=>n.slug===slug);assert.ok(card.includes(`src="${basePath}/assets/${image.file}"`));assert.ok(card.includes(`href="${basePath}${n.path}"`));assert.ok(card.includes(image.smallFile));}
  else{assert.ok(card.includes(`src="${basePath}/assets/${filmSeparationMedia[key].file}"`));assert.ok(card.includes('В составе представленной линии'));assert.ok(!card.includes('<a '));}
  assert.ok(!card.includes('node-card-specs'));assert.ok(!card.includes('node-card-features'));
 });
 assert.equal(lines.find(l=>l.slug==='separatsiya-02').cardFile,'lines/separatsiya-01/catalog-cover.webp');
});
