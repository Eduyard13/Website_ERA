import {test} from 'node:test';
import assert from 'node:assert/strict';
import {render} from '../../scripts/build/build.mjs';
import {miniLineDiagram,fullLineDiagram} from '../../content/lines/shared/line-diagrams.mjs';
import {separation03Diagram} from '../../content/lines/premium/separation-03-diagram.mjs';

const expected=[
 ['separatsiya-01','BASE',11,13],
 ['separatsiya-02','PRO',27,27],
 ['separatsiya-03','PREMIUM',37,37],
];
const diagrams=[miniLineDiagram,fullLineDiagram,separation03Diagram];
test('Утверждённый архитектурный блок BASE PRO PREMIUM сохраняет схемы, номера и навигацию',()=>{
 for(let i=0;i<expected.length;i++){
  const [slug,tier,pinPositions,projectPositions]=expected[i];
  const html=render('/catalog/lines/'+slug);
  const start=html.indexOf('id="composition"'),end=html.indexOf('id="process"',start);
  assert.ok(start>0&&end>start,slug+' approved position');
  const section=html.slice(start,end);
  assert.ok(section.includes('Каждый узел на своём месте.'),slug);
  assert.ok(section.includes('Каждая функция — на результат.'),slug);
  assert.ok(section.includes('Выберите узел на схеме или в списке справа.'),slug);
  assert.ok(section.includes('Каждая позиция на схеме — часть единого технологического маршрута.'),slug);
  assert.ok(section.includes('data-architecture-list'),slug);
  assert.ok(section.includes('dry-architecture-layout'),slug);
  assert.ok(section.includes('data-diagram-mode="fit"'),slug);
  assert.equal((section.match(/data-architecture-part="/g)||[]).length,pinPositions,slug+' navigable positions');
  assert.ok(section.includes(projectPositions+' проектных позиций'),slug+' project position count');
  assert.ok(!section.includes('Документация ↓'),slug+' removed redundant link');
  assert.ok(!section.includes('Все позиции на схеме'),slug+' removed old accordion');
  assert.ok(section.includes(diagrams[i].file),slug+' source image preserved');
  assert.ok(section.includes('data-line-callouts="vector-1"'),slug+' original vector leaders');
  assert.ok(html.includes('/assets/css/equipment/shared/dry-architecture.css?v='),slug+' scoped style included');
  assert.ok(!html.includes('два выходных потока'),slug+' no misleading label');
 }
});
test('BASE не рекламирует готовые тюки, а PRO и PREMIUM их показывают',()=>{
 const block=slug=>{const x=render('/catalog/lines/'+slug);return x.slice(x.indexOf('id="composition"'),x.indexOf('id="process"'));};
 assert.ok(!block('separatsiya-01').includes('готовых тюков'));
 for(const slug of ['separatsiya-02','separatsiya-03'])assert.ok(block(slug).includes('готовых тюков очищенной плёнки'),slug);
 assert.ok(block('separatsiya-01').includes('Позиция без выноски'));
 assert.equal((block('separatsiya-01').match(/class="dry-architecture-item dry-architecture-item--reference"/g)||[]).length,2);
});
test('Горячая мойка использует единый дизайн, сохраняя собственные узлы, продукты и техдокументы',()=>{
 const html=render('/catalog/lines/moyka-plenki');
 const section=html.slice(html.indexOf('id="composition"'),html.indexOf('id="process"'));
 assert.ok(section.includes('dry-architecture-layout'));
 assert.ok(section.includes('data-architecture-list'));
 assert.ok(html.includes('/assets/css/equipment/shared/dry-architecture.css?v='));
 assert.ok(section.includes('id="hotwash-construction"'));
 assert.equal((section.match(/data-architecture-part="/g)||[]).length,36);
 assert.ok(section.includes('href="#placement"'));
 assert.ok(section.includes('lines/moyka-plenki/layout-native-v2.webp'));
 assert.ok(html.includes('id="water-circulation"'));
 assert.ok(html.includes('moyka-plenki-technical'));
});
