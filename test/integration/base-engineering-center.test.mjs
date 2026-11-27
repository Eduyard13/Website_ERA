import {browserAssetPath} from '../../scripts/build/browser-assets.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import registry from '../../content/lines/base/base-engineering-views.json' with {type:'json'};
import drawings from '../../content/lines/shared/line-dimensions-assets.json' with {type:'json'};
import {imageSize} from '../../scripts/media/image-size.mjs';
import {render,basePath,routes} from '../../scripts/build/build.mjs';

const route='/catalog/lines/separatsiya-01';
const html=render(route);
const placement=html.match(/<section class="section" id="placement">([\s\S]*?)<\/section>/)[1];
const documents=html.match(/<section[^>]* id="documents">([\s\S]*?)<\/section>/)[1];
const prefix='lines/separatsiya-01/engineering-center/';
const assets=drawings['separatsiya-01'];
const ids=['overall','central-module','left-area','feed-area','sorting-deck','left-unit','lower-conveyors','discharge','support-frame','top','side'];

test('BASE shares the three engineering tabs with nine source views and two dimensioned projections',()=>{
 assert.match(placement,/data-base-engineering-center data-engineering-group="overview" data-engineering-view="overall"/);
 assert.deepEqual([...placement.matchAll(/data-engineering-tab="([^"]+)">([^<]+)/g)].map(match=>match.slice(1)),[['overview','Обзор линии'],['detail','Детализация'],['drawings','Чертежи']]);
 assert.deepEqual([...placement.matchAll(/data-engineering-frame="([^"]+)"/g)].map(match=>match[1]),ids);
 assert.equal((placement.match(/<template data-engineering-thumb>/g)||[]).length,7);
 assert.equal((placement.match(/data-engineering-viewer>/g)||[]).length,1);
 assert.match(placement,/<span data-engineering-count>01 \/ 04<\/span>/);
 for(const number of ['17,75','11,75','208,56'])assert.ok(placement.includes(`<dd>${number} <small>`));
 assert.match(placement,/<dd>4,662 м<\/dd>/);
 assert.match(placement,/механической части в плане/);
 assert.doesNotMatch(placement,/<a\b|\s(?:href|target|download|data-pdf-open)=|class="line-dimensions\b|PDF ·/);
 assert.match(documents,/data-pdf-open="separatsiya-01-dimensions"/);
 assert.match(documents,/era-separatsiya-01-dimensions\.pdf" download=/);
});

test('BASE projections and crops match the reviewed PDF source and published asset dimensions',async()=>{
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash(await readFile('public/'+registry.source.file)),registry.source.sha256);
 assert.deepEqual(registry.source.drawings,{page:11,xref:65,width:1659,height:1896});
 const variants=registry.views.flatMap(view=>['thumb','display','full'].map(key=>({...view[key],file:prefix+view[key].file})));
 for(const asset of new Map([...variants,...assets,...registry.drawingThumbnails].map(v=>[v.file,v])).values()){
  const file='public/assets/'+asset.file,bytes=await readFile(file);
  assert.equal(bytes.length,asset.bytes,file);
  assert.equal(hash(bytes),asset.sha256,file);
  assert.deepEqual(imageSize(file),{width:asset.width,height:asset.height},file);
 }
 for(const asset of assets){
  assert.ok(asset.width>=1600);
  assert.ok(placement.includes(`data-engineering-src="${basePath}/assets/${asset.file}"`));
 }
 const [premium,base]=await Promise.all(['premium','base'].map(scope=>readFile("public/"+browserAssetPath(scope+'-engineering-center.css'),'utf8')));
 assert.equal(base,premium.replaceAll('premium-engineering-center','base-engineering-center').replace('minmax(0,1.6fr)','minmax(0,1.25fr)'));
 for(const other of new Set(routes)){
  if(other!==route)assert.doesNotMatch(render(other),/data-base-engineering-center|base-engineering-center\.(?:css|js)/,other);
  assert.equal((render(other).match(/assets\/js\/equipment\/shared\/engineering-center\.js\?v=/g)||[]).length,
   /^\/catalog\/lines\/(separatsiya-0[123]|moyka-plenki)$/.test(other)?1:0,other);
  if(!/^\/catalog\/lines\/(separatsiya-0[123]|moyka-plenki)$/.test(other))assert.doesNotMatch(render(other),/data-line-section-nav|line-section-nav\.(?:css|js)/,other);
 }
});
