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

test('Светлая схема имеет один живой числовой слой и короткие стыки к исходным выноскам',()=>{
 const page=render('/catalog/lines/separatsiya-02'),diagram=page.slice(page.indexOf('id="line02-construction"'),page.indexOf('id="quality"'));
 assert.ok(diagram.includes('data-construction-finish="light-engineering"'));assert.ok(diagram.includes('Линия изнутри. В деталях.'));
 assert.ok(diagram.includes(`href="${basePath}/assets/${assets.diagram.file}"`));assert.ok(!diagram.includes(`href="${basePath}/assets/${assets.diagram.source.file}"`));
 assert.equal((diagram.match(/class="diagram-pin"/g)||[]).length,28);
 assert.equal((diagram.match(/data-leader-join="/g)||[]).length,assets.diagram.joins.length);
 assert.equal(assets.diagram.joins.filter(j=>j.number===20).length,1);assert.equal(assets.diagram.joins.filter(j=>j.number===25).length,1);assert.equal(assets.diagram.joins.filter(j=>j.number===27).length,2);
 assert.ok(!diagram.includes('line-diagram-pin-masks'));assert.ok(!diagram.includes('guide-end'));
 for(const part of fullLineDiagram.parts){
  assert.ok(diagram.includes(`<span>${String(part.number).padStart(2,'0')}</span>`));
  const joins=assets.diagram.joins.filter(j=>j.number===part.number);assert.equal(joins.length,part.pins.length);
  joins.forEach((j,i)=>{
   assert.ok(Math.abs(Math.hypot(j.endPx[0]-j.centerPx[0],j.endPx[1]-j.centerPx[1])-48)<.01);
   part.pins[i].forEach((v,k)=>assert.ok(Math.abs(v/1000*fullLineDiagram.width-j.centerPx[k])<.005));
  });
 }
 assert.equal(fullLineDiagram.parts.find(p=>p.number===20).regions.length,5);
 assert.equal(fullLineDiagram.parts.find(p=>p.number===27).regions.length,2);
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
