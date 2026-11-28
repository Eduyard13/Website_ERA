import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {nodes,lines,categories} from '../../content/equipment/catalog.mjs';
import {revisedPage} from '../../scripts/build/views.mjs';
import {nodeCard} from '../../scripts/render/equipment/equipment-card.mjs';
import {catalogBranchNav,lineComparison} from '../../scripts/render/equipment/catalog-branches.mjs';
import {readFilterState,filterUrl} from '../../public/assets/js/catalog/catalog-filter-model.js';
import {basePath,render} from '../../scripts/build/build.mjs';
import covers from '../../content/equipment/line-catalogue-covers.json' with {type:'json'};
import {imageSize} from '../../scripts/media/image-size.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
test('Каталог сохраняет реестр, все 12 полных карточек, готовые карточки и страницы всех узлов',async()=>{
 const original=JSON.parse(await readFile(new URL('../fixtures/catalog-preserved.json',import.meta.url)));
 const {originalDraft}=JSON.parse(await readFile(new URL('../fixtures/hot-wash-preserved.json',import.meta.url)));
 const {originalDraft:separationDraft}=JSON.parse(await readFile(new URL('../fixtures/separation-03-preserved.json',import.meta.url)));
 const legacyLines=lines.map(line=>line.slug==='moyka-plenki'?originalDraft:line.slug==='separatsiya-03'?separationDraft:line);
 assert.equal(digest(JSON.stringify({nodes,lines:legacyLines})),original.registry);
 assert.deepEqual(nodes.map(node=>({slug:node.slug,sha256:digest(nodeCard(node))})),original.nodeCards);
 const ready=revisedPage('/catalog/lines').match(/<a class="line-card[\s\S]*?<\/a>/g);
 assert.deepEqual(ready.map(html=>({
  slug:html.match(/data-line-id="([^"]+)"/)[1],
  sha256:digest(html.replace(/<span class="line-card-cover"[^>]*><img [^>]+><\/span>/,'')),
 })),original.lineCardsWithoutCovers);
 for(const [index,html] of ready.entries()){
  const {slug,cardImageAlt,title}=lines[index];
  const cover=covers[slug];
  const url=(file,sha)=>`/assets/${file}?v=${sha.slice(0,12)}`;
  assert.ok(html.includes(`src="${url(cover.file,cover.sha256)}"`),slug);
  assert.ok(html.includes(`srcset="${url(cover.smallFile,cover.smallSha256)} ${cover.smallWidth}w, ${url(cover.file,cover.sha256)} ${cover.width}w"`),slug);
  assert.ok(html.includes(`width="${cover.width}" height="${cover.height}" alt="${cardImageAlt||title}"`),slug);
  assert.match(html,index===0?/fetchpriority="high"/:/loading="lazy"/,slug);
  for(const [file,width,height,sha] of [[cover.file,cover.width,cover.height,cover.sha256],[cover.smallFile,cover.smallWidth,cover.smallHeight,cover.smallSha256]]){
   const path='public/assets/'+file;
   assert.equal(digest(await readFile(path)),sha,file);
   assert.deepEqual(imageSize(path),{width,height},file);
  }
 }
 for(const [path,sha] of Object.entries(original.details).filter(([path])=>path.startsWith('/catalog/equipment/')))assert.equal(digest(revisedPage(path)),sha,path);
 for(const [path,sha] of Object.entries(original.assets))assert.equal(digest(await readFile('public/'+path)),sha,path);
 const interactions=await readFile('public/assets/js/core/interactions.js','utf8');
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
  assert.equal((html.match(/aria-label="Навигация каталога"/g)||[]).length,1);
  assert.ok(html.includes(`href="${basePath}/catalog/"`));
  assert.ok(html.includes(`href="${basePath}/catalog/${active==='lines'?'equipment':'lines'}/"`));
  assert.ok(!html.includes('data-context-navigation '));
  assert.ok(html.includes(`src="${basePath}/assets/js/catalog/catalog-branches.js?v=`));
  assert.ok(html.includes(`href="${basePath}/assets/css/pages/catalog/catalog-branches.css?v=`));
  assert.ok(!html.includes('/assets/css/pages/catalog/catalog.css?'));
 }
 for(const path of ['/','/about-us','/contacts','/technology','/economics','/media','/documents',...nodes.map(n=>n.path),...lines.filter(l=>l.enabled).map(l=>l.path)]){
  const html=render(path);assert.ok(!html.includes('/assets/js/catalog/catalog-branches.js?')&&!html.includes('/assets/css/pages/catalog/catalog-branches.css?'),path);
 }
 for(const line of lines.filter(l=>l.enabled))assert.ok(render(line.path).includes('data-context-navigation '));
});
test('Кнопки фильтров в закреплённом меню сохраняют технические ключи и утверждённые подписи',()=>{
 const equipment=catalogBranchNav('equipment'),linesNav=catalogBranchNav('lines'),html=revisedPage('/catalog/lines');
 const buttons=(nav)=>[...nav.matchAll(/data-filter-value="([^"]*)" aria-pressed="(?:true|false)" disabled>([^<]+)<\/button>/g)].map(([,value,label])=>[value,label]);
 assert.deepEqual(buttons(equipment),[['','Все узлы'],...categories.map((category,index)=>[category,['Подготовка и подача','Сухая сепарация','Измельчение и мойка','Обезвоживание','Очистка стоков','Фасовка'][index]])]);
 assert.deepEqual(buttons(linesNav),[['','Все линии'],['Сепарация','Сухая сепарация'],['Мойка','Горячая мойка']]);
 for(const nav of [equipment,linesNav])assert.doesNotMatch(nav,/<(?:form|input|select)\b|Сбросить/);
 assert.deepEqual([...html.matchAll(/data-line-id="([^"]+)"/g)].map(m=>m[1]),lines.map(l=>l.slug));
 assert.equal((html.match(/<article class="line-card/g)||[]).length,0);
 for(const line of lines.filter(l=>!l.enabled))assert.ok(!html.includes(`href="${line.path}"`));
});
test('Карточки используют утверждённые названия, описания и плашки, параметры остальных линий сохранены',()=>{
 const cards=revisedPage('/catalog/lines').match(/<a class="line-card[\s\S]*?<\/a>/g);
 const expected=[
  ['Линия сухой сепарации плёнок — базовая комплектация','Сухая очистка плёнок без мойки',['Один плёночный поток']],
  ['Линия сухой сепарации плёнок с сортировкой и затюковкой','С сортировкой плёнок по видам',['Закрытый сортировочный бокс','Автоматизированный пресс']],
  ['Линия сухой сепарации и сушки плёнок с сортировкой по видам','Расширенная комплектация с роторной сушильной установкой',['Роторная сушка плёнки','Закрытый сортировочный бокс']],
  ['Линия горячей мойки и грануляции плёнок и пакетов','Глубокая очистка после сухой сепарации',['Три вида готовой продукции','Грануляция включена']],
 ];
 const metrics=[['Входной поток','1 500','кг/ч','С включениями'],['Выход очищенной плёнки','750','кг/ч','При засоре около 50%'],
  ['Установленная мощность','642,4','кВт','По актуальной спецификации'],['Потребляемая мощность','449,68','кВт','Расчётная, 70% от установленной'],
  ['Рабочий персонал','3','чел./смена',undefined],['Остаточная влажность после сушки','до 5','%','На выходе из сушилки']];
 for(const [index,card] of cards.entries()){
  const parts=[card.match(/<h3[^>]*>([^<]+)/)[1],card.match(/<p class="line-card-subtitle">([^<]+)/)[1],[...card.matchAll(/<span class="line-card-feature">([^<]+)/g)].map(m=>m[1])];
  assert.deepEqual(parts,expected[index]);
  const values=[...card.matchAll(/<dt>([^<]+)<\/dt><dd>([^<]+)<small>([^<]*)<\/small><\/dd>(?:<p>([^<]+)<\/p>)?/g)].map(m=>m.slice(1));
  assert.deepEqual(values,index===2?metrics:lines[index].cardMetrics.map(m=>[m.label,String(m.value),m.unit,m.note]),lines[index].slug);
  assert.ok(card.includes(`href="${lines[index].path}"`));
 }
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
test('URL сохраняет глубокие ссылки, посторонние параметры и hash, а старые фильтры убирает',()=>{
 const url=new URL('https://example.test/Website_ERA/catalog/equipment/?q=%20%20&category=invalid&material=invalid&campaign=test#main');
 const allowed=['',...categories];
 assert.equal(readFilterState(url,'category',allowed),'');
 const normalized=filterUrl(url,'category','');
 assert.equal(normalized.search,'?campaign=test');assert.equal(normalized.hash,'#main');
 const selected=filterUrl(normalized,'category','Сухая сепарация и очистка');
 assert.equal(readFilterState(selected,'category',allowed),'Сухая сепарация и очистка');
 assert.equal(selected.searchParams.get('campaign'),'test');
 const wash=new URL('https://example.test/catalog/lines/?optional=old&campaign=test&group=Мойка');
 assert.equal(readFilterState(wash,'group',['','Сепарация','Мойка']),'Мойка');
 assert.equal(filterUrl(wash,'group','').search,'?campaign=test');
});
