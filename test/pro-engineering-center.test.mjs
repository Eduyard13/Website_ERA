import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {render,basePath,routes} from '../scripts/build.mjs';
import {imageSize} from '../scripts/image-size.mjs';
import manifest from '../content/pro-engineering-views.json' with {type:'json'};
import drawingAssets from '../content/separatsiya-02-dimensions-assets.json' with {type:'json'};

const path='/catalog/lines/separatsiya-02';
const prefix='lines/separatsiya-02/engineering-center/';
const page=render(path);
const section=page.match(/<section class="section" id="placement">([\s\S]*?)<\/section>/)[1];
const tabs=[...section.matchAll(/data-engineering-tab="([^"]+)"/g)].map(match=>match[1]);
const allFrames=[...section.matchAll(/<button[^>]+data-engineering-frame="([^"]+)"[^>]*>[\s\S]*?<\/button>/g)];
const cleanVariant=(variant,attr)=>attr+'="'+basePath+'/assets/'+prefix+variant.file+'"';

test('Инженерный центр PRO включает три вкладки, двадцать видов и пять исходных размеров',()=>{
 assert.deepEqual(tabs,['overview','detail','drawings']);
 assert.deepEqual(allFrames.map(([,id])=>id),[
  'v01','v02','v03','v04','v14','v05','v06','v07','v08','v09',
  'v10','v11','v12','v13','v15','v16','top','side-1','side-2','sheet'
 ]);
 assert.match(section,/data-engineering-group="overview" data-engineering-view="v01"/);
 assert.equal((section.match(/data-engineering-viewer>/g)||[]).length,1);
 assert.equal((section.match(/data-engineering-image\s/g)||[]).length,1);
 assert.equal((section.match(/<template data-engineering-thumb>/g)||[]).length,10);
 assert.match(section,/v01-display\.webp" width="2200" height="1549" alt="Размещение линии в цехе"/);
 assert.match(section,/01 \/ 10/);
 for(const label of ['Длина зоны на чертеже','Ширина зоны на чертеже','Площадь прямоугольного контура','Высота помещения по ТО','Высота оборудования по ТО'])assert.ok(section.includes(label),label);
 for(const metric of ['45 <small>м','18 <small>м','810 <small>м²','9 м','≈6,5 м'])assert.ok(section.includes('<dd>'+metric),metric);
 assert.ok(section.includes('Складские запасы, проезды, безопасные зоны и коммуникации учитывают при проектной привязке.'));
 const ids=[...page.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const [index,id] of tabs.entries()){
  const panel='pro-engineering-panel-'+id;
  assert.match(section,new RegExp(`id="pro-engineering-tab-${id}" aria-controls="${panel}" aria-selected="${index===0}" tabindex="${index===0?0:-1}"`));
  assert.ok(section.includes(`role="tabpanel" id="${panel}" aria-labelledby="pro-engineering-tab-${id}"`));
 }
 for(const other of new Set(routes)){
  if(other===path)continue;
  assert.doesNotMatch(render(other),/data-pro-engineering-center|pro-engineering-center\.(css|js)/,other);
 }
});

test('Все варианты ракурсов и четыре чертежа используют прежние WebP',async()=>{
 assert.equal(manifest.views.filter(view=>view.group==='overview').length,10);
 assert.equal(manifest.views.filter(view=>view.group==='detail').length,6);
 for(const [markup,id] of allFrames.slice(0,16)){
  const view=manifest.views.find(item=>item.id===id);
  assert.ok(markup.includes('aria-label="'+view.title+'"'),id);
  assert.ok(markup.includes('>'+view.shortLabel+'</span>'),id);
  for(const [kind,attr] of [['display','data-engineering-src'],['full','data-engineering-full'],['thumb','src']]){
   const variant=view[kind],file='public/assets/'+prefix+variant.file;
   const bytes=await readFile(file);
   assert.equal(bytes.length,variant.bytes,file);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),variant.sha256,file);
   assert.deepEqual(imageSize(file),{width:variant.width,height:variant.height},file);
   assert.ok(markup.includes(cleanVariant(variant,attr)),file);
   if(kind==='thumb')assert.ok(markup.includes(`width="${variant.width}" height="${variant.height}" alt="" loading="lazy"`),id);
  }
 }
 for(const view of drawingAssets.views){
  const [markup]=allFrames.find(([,id])=>id===view.id);
  assert.ok(markup.includes(`data-dimension-tab="${view.id}"`));
  assert.ok(markup.includes(`data-engineering-src="${basePath}/assets/${view.file}"`));
  assert.ok(markup.includes(`data-engineering-full="${basePath}/assets/${view.file}"`));
 }
 assert.doesNotMatch(section,/source-pdf|v[0-9]{2}\.pdf/);
});

test('Инженерный центр содержит только просмотр, оригинальный A0 остаётся в документации и библиотеке',()=>{
 assert.doesNotMatch(section,/<a\b|\s(?:href|target|download|data-pdf-open)\s*=|pec-documents|pec-document-actions|pec-no-script|PDF ·/i);
 const documents=page.match(/<section[^>]* id="documents">([\s\S]*?)<\/section>/)[1];
 const library=render('/documents/drawings');
 for(const markup of [documents,library]){
  assert.match(markup,/data-pdf-open="separatsiya-02-dimensions-a0"/);
  assert.match(markup,/era-separatsiya-02-dimensions-a0\.pdf" download=/);
  assert.match(markup,/PDF · A0 · 1 лист · 2,2 МБ/);
 }
});

test('Фон цеха локальный и неизменный, оформление изолировано в инженерном центре',async()=>{
 const file='public/assets/'+prefix+'industrial-hall.webp';
 const hall=await readFile(file);
 assert.equal(createHash('sha256').update(hall).digest('hex'),'ec6c3f15b61ac8306584421bad36de3db84b04f55a93dd939df0daf1f23de7c3');
 assert.deepEqual(imageSize(file),{width:1672,height:941});
 const css=await readFile('public/pro-engineering-center.css','utf8');
 assert.ok(css.includes('url("assets/'+prefix+'industrial-hall.webp")'));
 assert.doesNotMatch(css,/industrial-light\.svg|pec-documents|pec-document-actions|pec-no-script/);
 assert.match(css,/\.pro-engineering-center \.pec-image\{[^}]*mix-blend-mode:multiply/);
 assert.match(css,/\.pro-engineering-center \.pec-dialog \.pec-image\{mix-blend-mode:normal\}/);
});
