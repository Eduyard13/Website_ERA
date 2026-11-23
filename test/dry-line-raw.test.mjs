import {test} from 'node:test';
import assert from 'node:assert/strict';
import {render} from '../scripts/build.mjs';
import {renderDrySeparationRaw} from '../scripts/dry-separation-raw.mjs';
import {filmSeparationMedia} from '../content/film-separation.mjs';
const slugs=['separatsiya-01','separatsiya-02','separatsiya-03'];
const photos=['raw-agricultural','raw-packaging','raw-bales'];
test('Все три страницы используют общие реальные фотографии и шесть групп сухих включений',()=>{
 for(const slug of slugs){
  const block=renderDrySeparationRaw(slug),page=render('/catalog/lines/'+slug);
  const sectionStart=page.indexOf('<section class="section line-soft dry-raw-section" id="raw-materials"');
  assert.ok(sectionStart>=0,slug+' section present');
  const published=page.slice(sectionStart,page.indexOf('</section>',sectionStart)+10);
  assert.ok(published.includes('data-dry-raw="'+slug+'"'),slug+' correct configuration');
  assert.equal((published.match(/data-raw-photo="/g)||[]).length,3,slug+' same photos in published HTML');
  assert.equal((published.match(/data-contaminant="/g)||[]).length,6,slug+' same categories in published HTML');
  for(const key of photos)assert.ok(published.includes('/assets/'+filmSeparationMedia[key].file),slug+' '+key);
  assert.equal((block.match(/data-raw-photo="/g)||[]).length,3);
  assert.equal((block.match(/data-contaminant="/g)||[]).length,6);
  for(const key of photos)assert.ok(block.includes('/assets/'+filmSeparationMedia[key].file),key);
  for(const word of ['50–55','до 80','Песок','Стекло','Бумага','солома','Пенопласт','Пыль'])assert.ok(block.includes(word),word);
  assert.ok(!/(жир|масл|кле|мойк)/i.test(block),slug+' dry contaminants only');
  assert.ok(page.indexOf('id="specs"')>page.indexOf('id="raw-materials"'));
 }
});
test('Входная влажность появляется только в PREMIUM',()=>{
 for(const slug of slugs.slice(0,2)){
  const block=renderDrySeparationRaw(slug);
  assert.ok(!/(влаг|влажност)/i.test(block),slug);
  assert.equal((block.match(/class="dry-raw-metric"/g)||[]).length,2);
 }
 const premium=renderDrySeparationRaw(slugs[2]);
 assert.ok(premium.includes('до 30'));
 assert.ok(premium.includes('Роторная сушилка'));
 assert.ok(premium.includes('Повторная баллистика'));
 assert.equal((premium.match(/class="dry-raw-metric"/g)||[]).length,3);
});
