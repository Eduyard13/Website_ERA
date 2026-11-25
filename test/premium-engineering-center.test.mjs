import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {basePath,render,routes} from '../scripts/build.mjs';
import {imageSize} from '../scripts/image-size.mjs';
import registry from '../content/premium-engineering-views.json' with {type:'json'};
import {linePlacement} from '../content/line-placement.mjs';

const route='/catalog/lines/separatsiya-03';
const root='lines/separatsiya-03/engineering-center/';
const page=render(route);
const section=(html,id)=>html.match(new RegExp(`<section[^>]* id="${id}">([\\s\\S]*?)<\\/section>`))[1];
const placement=section(page,'placement');
const frames=[...placement.matchAll(/<li><button class="pec-thumb"[\s\S]*?data-engineering-frame="([^"]+)"[\s\S]*?<\/li>/g)];
const drawings=linePlacement['separatsiya-03'].views;
const drawingId='separatsiya-03-dimensions';
const pdf='drawings/era-separatsiya-03-dimensions-a0.pdf';
const originalHash='d19c0e028f486765df3ab18b2a1070fc5fe01e3d208f2caabfc1e3b2138a59f6';

test('Центр PREMIUM сохраняет три вкладки, утверждённый порядок всех 25 видов и фактические габариты',()=>{
 const overview=['v01','v01a','v02','v02a','v03','v03a','v04','v04a','v05','v06','v07','v08','v09'];
 const detail=['v10','v11','v12','v13','v14','v15','v16','v17','v18'];
 assert.deepEqual(registry.views.filter(v=>v.group==='overview').map(v=>v.id),overview);
 assert.deepEqual(registry.views.filter(v=>v.group==='detail').map(v=>v.id),detail);
 assert.equal(new Set(registry.views.map(v=>v.id)).size,22);
 assert.deepEqual(frames.map(([,id])=>id),[...overview,...detail,'top','side','opposite-and-sections']);
 const tabs=[...placement.matchAll(/data-engineering-tab="([^"]+)">([^<]+)/g)];
 assert.deepEqual(tabs.map(([,id,label])=>[id,label]),[['overview','Обзор линии'],['detail','Детализация'],['drawings','Чертежи']]);
 for(const [index,[,id]] of tabs.entries()){
  assert.ok(placement.includes(`id="premium-engineering-tab-${id}" aria-controls="premium-engineering-panel-${id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}"`));
  assert.ok(placement.includes(`id="premium-engineering-panel-${id}" aria-labelledby="premium-engineering-tab-${id}"`));
 }
 const ids=[...page.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.match(placement,/data-premium-engineering-center data-engineering-group="overview" data-engineering-view="v01"/);
 assert.equal((placement.match(/<h2>/g)||[]).length,1);
 assert.match(placement,/<h2>Интерактивный инженерный центр<\/h2>/);
 assert.match(placement,/ЭРА \/ ИНЖЕНЕРНЫЙ ОБЗОР · PREMIUM/);
 assert.equal((placement.match(/data-engineering-viewer>/g)||[]).length,1);
 assert.equal((placement.match(/data-engineering-image\s/g)||[]).length,1);
 assert.equal((placement.match(/<template data-engineering-thumb>/g)||[]).length,12);
 assert.match(placement,/v01-display\.webp" width="2200" height="1325" alt="Общий ракурс 1"/);
 assert.match(placement,/<span data-engineering-count>01 \/ 13<\/span>/);
 assert.match(placement,/56,2 <small>м<\/small>/);
 assert.match(placement,/43,4 <small>м<\/small>/);
 assert.match(placement,/2 439,08 <small>м²<\/small>/);
 assert.match(placement,/Высотная отметка воздуховода на боковой проекции<\/dt><dd>7,0 м<\/dd>/);
 assert.match(placement,/Высоту помещения, монтажные отметки и проезды уточняют для конкретного цеха/);
 assert.doesNotMatch(placement,/<dd>(?:45|18|810|9|≈6,5) (?:<small>|м<\/dd>)/);
 for(const label of ['Подача и выдача','Обслуживание и сети','Изолированная сортировка','двух погрузчиков','Площадка 13 в ангаре 35'])assert.ok(placement.includes(label),label);
});

test('66 ракурсов и три новых миниатюры совпадают с реестром, чертежи используют исходные WebP',async()=>{
 const asset=variant=>basePath+'/assets/'+variant.file;
 async function verify(variant,{lossless=false}={}){
  const file='public/assets/'+variant.file,bytes=await readFile(file);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',file);
  if(lossless)assert.ok(bytes.includes('VP8L'),file);
  assert.equal(bytes.length,variant.bytes,file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),variant.sha256,file);
  assert.deepEqual(imageSize(file),{width:variant.width,height:variant.height},file);
 }
 for(const view of registry.views){
  const [markup]=frames.find(([,id])=>id===view.id);
  assert.ok(markup.includes(`aria-controls="premium-engineering-stage" aria-label="${view.title}"`),view.id);
  assert.ok(markup.includes(`<span>${view.shortLabel}</span>`),view.id);
  for(const [kind,attribute] of [['thumb','src'],['display','data-engineering-src'],['full','data-engineering-full']]){
   const variant={...view[kind],file:root+view[kind].file};
   await verify(variant,{lossless:true});
   assert.ok(markup.includes(`${attribute}="${asset(variant)}"`),variant.file);
   if(kind==='thumb')assert.ok(markup.includes(`width="${variant.width}" height="${variant.height}" alt="" loading="lazy" decoding="async"`));
  }
 }
 assert.equal(registry.drawingThumbnails.length,3);
 for(const view of drawings){
  const [markup]=frames.find(([,id])=>id===view.id);
  const thumb=registry.drawingThumbnails.find(item=>item.id===view.id);
  await verify(view);await verify(thumb,{lossless:true});
  assert.ok(thumb.width<=360&&thumb.height===Math.round(view.height*thumb.width/view.width));
  assert.ok(markup.includes(`id="sd-dimension-tab-${view.id}" data-dimension-tab="${view.id}"`));
  assert.ok(markup.includes(`data-engineering-src="${asset(view)}" data-engineering-full="${asset(view)}"`));
  assert.ok(markup.includes(`src="${asset(thumb)}" width="${thumb.width}" height="${thumb.height}"`));
  assert.ok(markup.includes(`<span>${thumb.shortLabel}</span>`));
 }
});

test('Действия с оригинальным А0 находятся в документации и библиотеке',async()=>{
 assert.doesNotMatch(placement,/<a\b|\s(?:href|target|download|data-pdf-open)=|pec-document|PDF ·|Готовая компоновка|source-pdf/i);
 for(const markup of [section(page,'documents'),render('/documents/drawings')]){
  assert.ok(markup.includes(`data-pdf-open="${drawingId}"`));
  assert.ok(markup.includes(`${pdf}" download="`));
 }
 const bytes=await readFile('public/documents/'+pdf);
 assert.equal(bytes.length,4016723);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),originalHash);
});

test('PREMIUM использует точный контроллер PRO и общий фон, ресурсы подключены на своём маршруте',async()=>{
 const [css,js,proJs,hall]=await Promise.all(['premium-engineering-center.css','premium-engineering-center.js','pro-engineering-center.js','assets/lines/separatsiya-02/engineering-center/industrial-hall.webp'].map(path=>readFile('public/'+path)));
 assert.equal(js.toString(),proJs.toString().replace('[data-pro-engineering-center]','[data-premium-engineering-center]'));
 assert.equal(createHash('sha256').update(hall).digest('hex'),'ec6c3f15b61ac8306584421bad36de3db84b04f55a93dd939df0daf1f23de7c3');
 assert.match(css.toString(),/url\("assets\/lines\/separatsiya-02\/engineering-center\/industrial-hall\.webp"\)/);
 assert.doesNotMatch(css.toString(),/industrial-light\.svg|pec-document/);
 assert.match(css.toString(),/\.pec-stage\{[^}]*isolation:isolate/);
 assert.match(css.toString(),/\.pec-image\{[^}]*mix-blend-mode:multiply/);
 assert.match(css.toString(),/\.pec-dialog \.pec-image\{mix-blend-mode:normal\}/);
 assert.match(page,/premium-engineering-center\.css\?v=[0-9a-f]+/);
 assert.match(page,/premium-engineering-center\.js\?v=[0-9a-f]+/);
 for(const other of new Set(routes)){
  if(other===route)continue;
  assert.doesNotMatch(render(other),/data-premium-engineering-center|premium-engineering-center\.(css|js)/,other);
 }
});
