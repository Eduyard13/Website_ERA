import {test} from 'node:test';
import assert from 'node:assert/strict';
import {render} from '../scripts/build.mjs';
import {renderDrySeparationPurpose} from '../scripts/dry-separation-purpose.mjs';

const lines=[
 ['separatsiya-01','BASE','Гибкий выход готового материала'],
 ['separatsiya-02','PRO','Выделение ценных видов плёнки'],
 ['separatsiya-03','PREMIUM','Двойная баллистика и роторная сушка']
];

test('Все три назначения имеют общую структуру с разными техническими преимуществами',()=>{
 for(const [slug,tier,feature] of lines){
  const html=render('/catalog/lines/'+slug);
  const start=html.indexOf('<section class="section line-purpose-section" id="purpose"');
  assert.ok(start>=0,slug+' purpose');
  const purpose=html.slice(start,html.indexOf('</section>',start)+10);
  assert.ok(purpose.includes('data-dry-purpose="'+slug+'"'),slug);
  assert.ok(purpose.includes('НАЗНАЧЕНИЕ'),slug);
  assert.ok(purpose.includes('/ '+tier),slug);
  assert.ok(purpose.includes(feature),slug);
  assert.equal((purpose.match(/class="line-purpose-card"/g)||[]).length,3,slug);
  assert.equal((purpose.match(/class="line-purpose-card-icon"/g)||[]).length,3,slug);
  assert.equal((purpose.match(/class="line-purpose-intro"/g)||[]).length,1,slug);
  assert.equal((purpose.match(/data-purpose-step=/g)||[]).length,3,slug);
  assert.equal((purpose.match(/<svg /g)||[]).length,3,slug);
  assert.ok(html.indexOf('id="raw-materials"')>start,slug+' next section preserved');
  assert.equal(renderDrySeparationPurpose(slug),purpose,slug+' shared renderer');
 }
});

test('BASE без встроенных сортировочного бокса и пресса, с выходом насыпью / биг-беги',()=>{
 const html=renderDrySeparationPurpose('separatsiya-01');
 assert.ok(html.includes('одного вида плёнки'));
 assert.ok(html.includes('насыпью или в биг-бегах'));
 assert.ok(html.includes('дополнить линию автоматизированным прессом'));
 assert.ok(!html.includes('Пять накопителей')&&!html.includes('поступает на автоматический пресс'));
});

test('PRO отделяет основную массу включений, сортирует и прессует',()=>{
 const html=renderDrySeparationPurpose('separatsiya-02');
 for(const text of ['высвобождает и удаляет','закрытом боксе сортировки','ценные виды плёнки','автоматический пресс','формирует и обвязывает тюки'])
  assert.ok(html.includes(text),text);
 assert.ok(!html.includes('роторную сушку'));
});

test('PREMIUM сохраняет сушку, повторную баллистику, распушение и тюкование',()=>{
 const html=renderDrySeparationPurpose('separatsiya-03');
 for(const text of ['многослойных фрагментов','роторную сушку','не более 5%','второй баллистической ступени','распушитель','ценные виды плёнки','общий автоматический пресс'])
  assert.ok(html.includes(text),text);
 assert.ok(html.includes('на выходе из роторной сушилки'));
 assert.ok(!renderDrySeparationPurpose('separatsiya-02').includes('не более 5%'));
});
