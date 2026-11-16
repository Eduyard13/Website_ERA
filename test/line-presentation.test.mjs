import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {render,basePath} from '../scripts/build.mjs';
import {nodes,lines} from '../content/catalog.mjs';
import {lineUnits,filmSeparationMedia} from '../content/film-separation.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {fullLineDiagram} from '../content/line-diagrams.mjs';
import assets from '../content/separatsiya-02-presentation-assets.json' with {type:'json'};

test('Titanium Gallery использует отдельный экспорт исходной линии только на её странице',async()=>{
 const page=render('/catalog/lines/separatsiya-02');
 assert.ok(page.includes('data-hero-finish="titanium-gallery"'));
 assert.ok(page.includes(`src="${basePath}/assets/${assets.hero.file}"`));
 assert.ok(page.includes(`srcset="${basePath}/assets/${assets.hero.smallFile} 768w, ${basePath}/assets/${assets.hero.file} 2056w"`));
 assert.ok(page.includes(`data-image="${basePath}/assets/${assets.hero.file}"`));
 assert.equal(assets.hero.width,assets.hero.source.width);assert.equal(assets.hero.height,assets.hero.source.height);
 assert.equal(assets.hero.source.sha256,'314b9a2161c6d9d00101c1097bd193a857283ad0d81f375a72d88622bb6e5399');
 for(const asset of [assets.hero,assets.hero.small,assets.hero.background,assets.hero.source,assets.diagram,assets.diagram.source]){
  const bytes=await readFile('dist/assets/'+asset.file);assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 }
 const catalogue=render('/catalog/lines');assert.ok(catalogue.includes(`src="${basePath}/assets/lines/separatsiya-01/catalog-cover.webp"`));assert.ok(!catalogue.includes(assets.hero.file));
 for(const path of ['/catalog/lines/separatsiya-01','/catalog/equipment',...nodes.map(n=>n.path)])assert.ok(!render(path).includes('data-hero-finish="titanium-gallery"'),path);
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
 assert.ok(page.includes(`/line-monitor.js?v=${version}-callouts-1`));assert.ok(page.includes(`/line-monitor.css?v=${version}-callouts-1`));
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
