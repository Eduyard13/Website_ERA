import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {nodes,lines,categories} from '../content/catalog.mjs';
import {revisedPage} from '../scripts/views.mjs';
import {nodeCard} from '../scripts/equipment-card.mjs';
import {catalogBranchNav,equipmentFilters,lineFilters,lineComparison} from '../scripts/catalog-branches.mjs';
import {readFilterState,filterUrl,matchesEquipment} from '../public/catalog-filter-model.js';
import {basePath,render} from '../scripts/build.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
test('Каталог сохраняет реестр, все 12 полных карточек, готовые карточки и страницы всех узлов',async()=>{
 const original=JSON.parse(await readFile(new URL('./fixtures/catalog-preserved.json',import.meta.url)));
 const {originalDraft}=JSON.parse(await readFile(new URL('./fixtures/hot-wash-preserved.json',import.meta.url)));
 const {originalDraft:separationDraft}=JSON.parse(await readFile(new URL('./fixtures/separation-03-preserved.json',import.meta.url)));
 const legacyLines=lines.map(line=>line.slug==='moyka-plenki'?originalDraft:line.slug==='separatsiya-03'?separationDraft:line);
 assert.equal(digest(JSON.stringify({nodes,lines:legacyLines})),original.registry);
 assert.deepEqual(nodes.map(node=>({slug:node.slug,sha256:digest(nodeCard(node))})),original.nodeCards);
 const ready=revisedPage('/catalog/lines').match(/<a class="line-card[\s\S]*?<\/a>/g).filter(html=>!html.includes('data-line-id="moyka-plenki"')&&!html.includes('data-line-id="separatsiya-03"'));
 assert.deepEqual(ready.map(html=>({slug:html.match(/data-line-id="([^"]+)"/)[1],sha256:digest(html)})),original.readyCards);
 for(const [path,sha] of Object.entries(original.details).filter(([path])=>path.startsWith('/catalog/equipment/')))assert.equal(digest(revisedPage(path)),sha,path);
 for(const [path,sha] of Object.entries(original.assets))assert.equal(digest(await readFile('public/'+path)),sha,path);
 const interactions=await readFile('public/interactions.js','utf8');
 assert.ok(!interactions.includes('#catalog-filters')&&!interactions.includes('#line-filters'));
});
test('Входная витрина содержит только две целые ссылки, согласованные тексты и исходные сцены',()=>{
 const html=render('/catalog');
 assert.ok(html.includes('От отдельного узла до производственного комплекса.'));
 assert.ok(html.includes('Самостоятельные технологические решения и комплексные линии переработки.'));
 assert.equal((html.match(/class="catalog-door catalog-exhibit /g)||[]).length,2);
 for(const [branch,cover] of [['lines','catalog-lines-compact'],['equipment','catalog-nodes-close']]){
  assert.ok(html.includes(`href="${basePath}/catalog/${branch}"`));
  assert.ok(html.includes(`srcset="${basePath}/assets/covers/${cover}-768.webp 768w, ${basePath}/assets/covers/${cover}.webp 1536w"`));
 }
 for(const text of ['КОМПЛЕКСНЫЕ РЕШЕНИЯ','САМОСТОЯТЕЛЬНЫЕ РЕШЕНИЯ','Смотреть линии','Многофункциональное оборудование для конкретных производственных задач.'])assert.ok(html.includes(text));
 assert.ok(!html.includes('catalog-branches.js')&&!html.includes('<table'));
});
test('Обе ветки имеют одну нативную навигацию, корректный BASE_PATH и отдельные ресурсы',()=>{
 for(const active of ['lines','equipment']){
  const html=render('/catalog/'+active),nav=catalogBranchNav(active);
  assert.equal((nav.match(/aria-current="page"/g)||[]).length,1);
  assert.equal((html.match(/aria-label="Разделы каталога"/g)||[]).length,1);
  assert.ok(html.includes(`href="${basePath}/catalog/"`));
  assert.ok(html.includes(`href="${basePath}/catalog/${active==='lines'?'equipment':'lines'}/"`));
  assert.ok(!html.includes('data-context-navigation '));
  assert.ok(html.includes(`src="${basePath}/catalog-branches.js?v=`));
  assert.ok(html.includes(`href="${basePath}/catalog-branches.css?v=`));
  assert.ok(!html.includes('/catalog.css?'));
 }
 for(const path of ['/','/about-us','/contacts','/technology','/economics','/media','/documents',...nodes.map(n=>n.path),...lines.filter(l=>l.enabled).map(l=>l.path)]){
  const html=render(path);assert.ok(!html.includes('/catalog-branches.js?')&&!html.includes('/catalog-branches.css?'),path);
 }
 for(const line of lines.filter(l=>l.enabled))assert.ok(render(line.path).includes('data-context-navigation '));
});
test('Фильтры строятся из реестра, быстрые кнопки скрыты до инициализации, черновики не ссылки',()=>{
 const eq=equipmentFilters(),lf=lineFilters(),html=revisedPage('/catalog/lines');
 assert.equal((eq.match(/name="category"/g)||[]).length,1);
 assert.equal((eq.match(/data-filter-value=/g)||[]).length,categories.length+1);
 for(const value of categories)assert.ok(eq.includes(`data-filter-value="${value}"`));
 for(const material of new Set(nodes.flatMap(n=>n.materials)))assert.ok(eq.includes(`<option>${material}</option>`));
 assert.ok(eq.includes('Все виды сырья')&&eq.includes('data-quick-filter="category" hidden'));
 assert.ok(lf.includes('data-quick-filter="group" hidden'));
 assert.ok(eq.includes('name="q" placeholder="Название или назначение" disabled'));
 assert.deepEqual([...html.matchAll(/data-line-id="([^"]+)"/g)].map(m=>m[1]),lines.map(l=>l.slug));
 assert.equal((html.match(/<article class="line-card/g)||[]).length,0);
 for(const line of lines.filter(l=>!l.enabled))assert.ok(!html.includes(`href="${line.path}"`));
 assert.ok(html.includes('Технологические решения.'));
});
test('Сравнение закрыто и включает только три комплектации сухой сепарации',()=>{
 const html=lineComparison();
 assert.equal((html.match(/data-line-comparison/g)||[]).length,1);
 assert.ok(!html.slice(0,html.indexOf('<summary>')).includes(' open'));
 assert.ok(html.includes('data-keep-open')&&html.includes('<caption>')&&html.includes('scope="col"')&&html.includes('scope="row"'));
 for(const value of ['225 кВт','405,2 кВт','157,5 кВт','283,64 кВт','5 × 4,7 м³','Дополнительная опция, по согласованию','Не входят в базовую комплектацию','Не входит в базовую комплектацию'])assert.ok(html.includes(value),value);
 assert.equal((html.match(/5 × 4,7 м³/g)||[]).length,2);
 assert.deepEqual([...html.matchAll(/data-comparison-line="([^"]+)"/g)].map(match=>match[1]),['separatsiya-01','separatsiya-02','separatsiya-03']);
 assert.ok(!html.includes('moyka-plenki'));
 for(const value of ['642,4 кВт','449,68 кВт','17,75 × 11,75','45 × 18','56,2 × 43,4','До 5%','С сушкой','600–700 кг/ч'])assert.ok(html.includes(value),value);
 const shuffled=structuredClone(lines).reverse();
 for(const line of shuffled)line.cardMetrics?.reverse();
 assert.equal(lineComparison(shuffled),html);
 const metric=shuffled.find(l=>l.slug==='separatsiya-01').cardMetrics.find(m=>m.label==='Входной поток');
 metric.value='1 501';assert.ok(lineComparison(shuffled).includes('1 501'));
 metric.unit='т/ч';assert.throws(()=>lineComparison(shuffled),/line metric/);
});
test('URL нормализует только свои фильтры, сохраняет посторонние параметры и hash, условия пересекаются',()=>{
 const current=new URL('https://example.test/Website_ERA/catalog/equipment/?q=%20%20&category=invalid&material=invalid&campaign=test#main');
 const allowed={q:null,category:['',...categories],material:['',...new Set(nodes.flatMap(n=>n.materials))]};
 const state=readFilterState(current,allowed);
 assert.deepEqual(state,{q:'',category:'',material:''});
 const normalized=filterUrl(current,state);
 assert.equal(normalized.search,'?campaign=test');assert.equal(normalized.hash,'#main');
 const data={title:'плёночная центрифуга обезвоживание',category:'Обезвоживание',materials:'Плёнка|Пакеты'};
 assert.ok(matchesEquipment(data,{q:' Центрифуга ',category:'Обезвоживание',material:'Плёнка'}));
 assert.ok(!matchesEquipment(data,{q:'центрифуга',category:'Фасовка'}));
 assert.ok(!matchesEquipment(data,{material:'Рабочая моющая жидкость'}));
 assert.equal(filterUrl(new URL('https://example.test/catalog/lines/?optional=old&campaign=test'),{group:'',optional:''}).search,'?campaign=test');
});
