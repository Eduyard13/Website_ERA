import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {routes,product,basePath} from '../scripts/build.mjs';
test('Учебный баланс сохраняет массу, нулевые значения и отдельный смысл полимера до потерь',async()=>{
 const {calculateMaterialBalance,materialBalancePoints}=await import('../public/material-balance-model.js');
 assert.deepEqual(calculateMaterialBalance(0),{input:1500,contamination:0,polymer:1500,inclusions:0});
 assert.deepEqual(calculateMaterialBalance(50),{input:1500,contamination:50,polymer:750,inclusions:750});
 assert.equal(calculateMaterialBalance(20).polymer,1200);
 assert.equal(calculateMaterialBalance(35).inclusions,525);
 for(const point of materialBalancePoints){assert.equal(point.polymer+point.inclusions,1500);assert.ok(point.polymer>=750&&point.polymer<=1500);}
 const html=await readFile('dist/technology/index.html','utf8');
 assert.equal([...html.matchAll(/id="material-balance"/g)].length,1);
 assert.ok(html.includes('Полимерная составляющая до технологических потерь, кг/ч'));
 assert.match(html,/id="material-contamination" min="0" max="50" step="5" value="50"/);
 assert.ok(html.includes('Вода и технологические потери здесь не моделируются.'));
 assert.ok(html.includes('Расчёт при входе 1 500 кг/ч'));
 assert.ok(html.includes(`${basePath}/presentation-web.js?v=`));
 assert.ok(!(await readFile('dist/index.html','utf8')).includes('/presentation-web.js'));
});
test('Презентация дополняет коммерческий путь и технические схемы, сохраняя фотографии и финансовые блоки',async()=>{
 const home=await readFile('dist/index.html','utf8'),tech=await readFile('dist/technology/index.html','utf8');
 const {manufacturePhotos,deliverySteps,serviceDirections,productApplications}=await import('../content/presentation-web.mjs');
 for(const title of ['Линии для подготовки плёнки','Сырьевая база начинается с вашего региона','Где может применяться вторичная ПЭ-гранула','Как выглядит оборудование','Как реализуется проект с ЭРА'])assert.ok(home.includes(title),title);
 assert.ok(home.indexOf('id="solution"')<home.indexOf('id="manufacturing"'));
 assert.ok(home.indexOf('id="manufacturing"')<home.indexOf('id="market"'));
 assert.ok(home.indexOf('id="market"')<home.indexOf('id="economics"'));
 assert.ok(home.indexOf('id="economics"')<home.indexOf('id="about-era"'));
 for(const photo of manufacturePhotos){assert.ok(home.includes(`data-image="${basePath}/assets/${photo.file}"`));assert.ok((await stat('public/assets/'+photo.file)).size>0);}
 for(const step of deliverySteps)for(const text of [step.title,step.text,step.result])assert.ok(home.includes(text));
 for(const [title] of serviceDirections)assert.ok(home.includes(title));
 for(const app of productApplications)assert.ok(home.includes(app.text));
 assert.equal([...home.matchAll(/data-widget-switch="/g)].length,4);
 assert.ok(!home.includes('quality-sequence.svg'));assert.ok(tech.includes('quality-sequence.svg'));
 assert.ok(home.includes(`href="${basePath}/technology#granule-quality"`));
 assert.ok(tech.includes('Почему не вытряхивать каждый пакет вручную?'));assert.ok(tech.includes('≈ 4,36 кг/ч'));
 assert.ok(tech.includes('260 ÷ 4 = 65 ₽/кг'));assert.ok(tech.includes('Механизация раскрытия и очистки пакетов не исключает сортировку'));
 assert.ok(tech.includes('Рабочая жидкость → очистка → возврат в процесс'));
 assert.ok(tech.includes('↓ Прессование'));assert.ok(tech.includes('Точные связи узлов определяет схема выбранной линии.'));
 assert.ok(tech.includes('Сравнить варианты запуска'));
 const doors=tech.split('class="detail-doors"')[1].split('</section>')[0];
 assert.ok(!doors.includes(`href="${basePath}/technology"`));
 for(const [route] of [['/catalog'],['/automation'],['/media']])assert.ok(!(await readFile('dist'+route+'/index.html','utf8')).includes('presentation-web.css'));
});
test('Все внутренние ссылки, изображения и якоря ведут к существующим ресурсам',async()=>{
 for(const route of new Set(routes)){
  const file=resolve('dist','.'+route,'index.html');const html=await readFile(file,'utf8');
  for(const [,link] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(mailto:|tel:|https?:)/.test(link))continue;
   const parsed=new URL(link,'https://test.invalid'+route);let pathname=link.startsWith('#')?'':parsed.pathname;const hash=parsed.hash.slice(1);
   if(pathname && basePath){assert.ok(pathname.startsWith(basePath+'/'),`Missing base path: ${link}`);pathname=pathname.slice(basePath.length);}
   const target=pathname?resolve('dist','.'+pathname):file;
   const info=await stat(target);const destination=info.isDirectory()?target+'/index.html':target;
   assert.ok((await stat(destination)).isFile(),`${route}: ${link}`);
   if(hash)assert.ok((await readFile(destination,'utf8')).includes(`id="${hash}"`),`${route}: ${link}`);
  }
 }
});
test('Данные карточки различают сырьё и расчётные характеристики',async()=>{
 const html=await readFile('dist'+product+'/index.html','utf8');
 assert.match(html,/Плёнки, пакеты и биг-бэги<\/th><td>1 500–3 000 кг\/ч/);
 assert.match(html,/Другие полимерные отходы<\/th><td>3 000–7 000 кг\/ч/);
 assert.match(html,/Расчётная потребляемая мощность/);
 assert.match(html,/70% от установленной/);
 assert.match(html,/Ширина указана при открытой боковой щеке/);
});
test('Реестр содержит 12 уникальных узлов, линии расширяются через данные, медиа имеют реальные файлы',async()=>{
 const {nodes,lines,media}=await import('../content/catalog.mjs');
 assert.equal(nodes.length,12);assert.equal(new Set(nodes.map(n=>n.path)).size,12);
 assert.equal(lines.filter(l=>l.enabled).length,2);
 assert.equal(lines.filter(l=>l.group==='Сепарация').length,3);
 assert.equal(lines.filter(l=>l.group==='Мойка').length,1);
 assert.equal(nodes.filter(n=>n.status==='source-checked').length,12);
 for(const m of media){assert.ok(routes.includes(m.product.split('#')[0]));await stat('dist/assets/'+m.file);if(m.type==='video')await stat('dist/assets/'+m.poster);}
 const html=await readFile('dist/media/index.html','utf8');
 assert.ok(html.includes(`data-image="${basePath}/assets/photos/predvaritelnyy-izmelchitel/02.webp"`));
 assert.ok(html.includes(`data-product="${basePath}${product}"`));
});
test('В каталоге четыре линии по порядку; открываются готовые Сепарация 01 и 02',async()=>{
 const {lines}=await import('../content/catalog.mjs');
 const {filmSeparationMedia}=await import('../content/film-separation.mjs');
 const html=await readFile('dist/catalog/lines/index.html','utf8');
 const cards=[...html.matchAll(/<(a|article)\b([^>]*\bdata-line\b[^>]*)>([\s\S]*?)<\/\1>/g)];
 assert.deepEqual(cards.map(([,tag])=>tag),['a','a','article','article']);
 assert.deepEqual(cards.map(([,tag,attrs])=>/data-line-id="([^"]+)"/.exec(attrs)[1]),['separatsiya-01','separatsiya-02','separatsiya-03','moyka-plenki']);
 assert.ok(!html.includes('name="optional"'));
 assert.ok(!html.includes('data-optional='));
 assert.match(cards[1][2],new RegExp(`href="${basePath}/catalog/lines/separatsiya-02"`));
 assert.match(cards[1][3],/СЕПАРАЦИЯ 02 \/ ГОТОВАЯ ЛИНИЯ/);
 assert.equal([...cards[1][3].matchAll(/<dt>/g)].length,6);
 assert.ok(cards[2][3].includes('Линия сепарации и сушки плёнок и пакетов'));
 assert.ok(cards[2][3].includes('С сортировкой плёнок по видам'));
 assert.ok(cards[3][3].includes('Линия горячей мойки плёнок и пакетов'));
 for(const card of [cards[2],cards[3]]){
  assert.ok(!/\b(?:href|tabindex|role)=/.test(card[2]));
  assert.ok(!/<(?:a|button|input|select)\b/.test(card[3]));
  assert.ok(card[3].includes('В разработке'));
 }
 const ready=lines.find(l=>l.slug==='separatsiya-02');
 assert.equal(ready.slug,'separatsiya-02');assert.equal(ready.status,'source-checked');
 const page=await readFile('dist'+ready.path+'/index.html','utf8');
 assert.match(page,/<title>Сепарация 02 — ЭРА<\/title>/);
 assert.ok(page.includes('СЕПАРАЦИЯ 02 / ГОТОВАЯ ЛИНИЯ ЭРА'));
 assert.ok(page.includes(`href="${basePath}/documents/${ready.documents[0].file}"`));
 assert.ok(page.includes(`data-product="${basePath}${ready.path}"`));
 for(const m of Object.values(filmSeparationMedia)){
  assert.equal(m.product,ready.path);assert.equal(m.productTitle,ready.title);
  await stat('dist/assets/'+m.file);
 }
 for(const line of lines.filter(l=>!l.enabled)){
  assert.ok(!routes.includes(line.path));
  await assert.rejects(stat('dist'+line.path+'/index.html'),{code:'ENOENT'});
 }
});
test('Мини-линия 01 использует своё ТО, показатели базовой комплектации и раздельные выходные потоки',async()=>{
 const {lines}=await import('../content/catalog.mjs');
 const {miniFilmSeparationMedia,miniSpecification}=await import('../content/mini-film-separation.mjs');
 const {createHash}=await import('node:crypto');
 const line=lines.find(l=>l.slug==='separatsiya-01'),page=await readFile('dist'+line.path+'/index.html','utf8');
 assert.equal(line.status,'source-checked');assert.ok(line.enabled);assert.ok(routes.includes(line.path));
 assert.equal(miniSpecification.length,13);
 const parse=value=>value==='—'?0:Number(value.replace(',','.'));
 assert.ok(Math.abs(miniSpecification.reduce((sum,row)=>sum+parse(row[3]),0)-225)<1e-9);
 assert.ok(Math.abs(miniSpecification.reduce((sum,row)=>sum+parse(row[4]),0)-157.5)<1e-9);
 assert.ok(page.includes('СЕПАРАЦИЯ 01 / МИНИ-КОМПЛЕКТАЦИЯ ЛС-1500'));
 for(const text of ['157,5 кВт','225 кВт','17,75 × 11,75 м','600–700 кг/ч','70% установленной мощности','3–5%','80% → ≤10%','Конвейеры 07–10','3 человека в смену','Отдельные протоколы испытаний'])assert.ok(page.includes(text),text);
 assert.ok(page.includes('отдельная сортировка плёнок по видам в базовую поставку не входит'));
 assert.ok(page.includes('Сортировочный бокс, мойка и пресс не входят'));
 assert.ok(page.includes('Рама на позиции 11 предназначена для мешка с этими включениями'));
 assert.ok(!page.includes('402,67'));assert.ok(!page.includes('281,87'));
 const card=(await readFile('dist/catalog/lines/index.html','utf8')).match(/<a[^>]+data-line-id="separatsiya-01"[\s\S]*?<\/a>/)[0];
 assert.ok(card.includes(`href="${basePath}${line.path}"`));assert.equal([...card.matchAll(/<dt>/g)].length,6);
 assert.ok(card.includes('Мини-комплектация'));assert.ok(card.includes('Расчёт при засоре около 50%'));
 for(const m of Object.values(miniFilmSeparationMedia)){
  assert.equal(m.product,line.path);await stat('dist/assets/'+m.file);await stat('dist/assets/'+m.thumbnail);
 }
 const doc=line.documents[0],pdf=await readFile('dist/documents/'+doc.file);
 assert.equal(pdf.length,doc.bytes);assert.equal(createHash('sha256').update(pdf).digest('hex'),doc.sha256);
 assert.equal(doc.pages,14);assert.ok(page.includes(`href="${basePath}/documents/${doc.file}"`));
 const full=lines.find(l=>l.slug==='separatsiya-02');assert.notEqual(line.cardFile,full.cardFile);assert.notEqual(doc.file,full.documents[0].file);
});
test('Схемы линий сохраняют номера ТО, описания объектов и отдельные подсветки, включая оба погрузчика',async()=>{
 const {lineDiagrams,miniLineDiagram,fullLineDiagram,fullLinePlacementDiagram}=await import('../content/line-diagrams.mjs');
 const {linePositions}=await import('../content/film-separation.mjs');
 const {miniSpecification}=await import('../content/mini-film-separation.mjs');
 assert.deepEqual(fullLineDiagram.parts.map(p=>[p.number,p.label]),linePositions);
 assert.deepEqual(miniLineDiagram.parts.map(p=>[p.number,p.label]),miniSpecification.slice(0,11).map(([n,title])=>[Number(n),title]));
 assert.deepEqual(fullLinePlacementDiagram.parts.map(p=>p.number),[28,29]);
 const trucks=fullLineDiagram.parts.find(p=>p.number===27);assert.equal(trucks.pins.length,2);assert.equal(trucks.regions.length,2);
 assert.equal(fullLineDiagram.parts.find(p=>p.number===20).regions.length,5);
 for(const d of lineDiagrams){
  const page=await readFile(`dist/catalog/lines/${d.slug}/index.html`,'utf8');await stat('dist/assets/'+d.file);
  for(const id of [d.id,d.id+'-tooltip',d.id+'-details'])assert.equal([...page.matchAll(new RegExp(`id="${id}"`,'g'))].length,1,id);
  assert.ok(page.includes(`data-line-diagram="${d.slug}"`));assert.ok(page.includes(`href="${basePath}/assets/${d.file}"`));
  for(const part of d.parts){
   assert.ok(part.description.length>50,`${d.slug} ${part.number}`);
   assert.ok(part.regions.length>0);assert.ok(part.targets.length>0);
   for(const [x,y] of [...part.pins,...part.targets,...part.regions.flat()])assert.ok(x>=0&&x<=1000&&y>=0&&y<=d.height/d.width*1000,`${d.slug} ${part.number}: ${x}, ${y}`);
   assert.ok(page.includes(`data-part-guide="${part.number}"`));assert.ok(page.includes(`data-description="${part.description}"`));
  }
 }
 const html=await readFile('dist/catalog/lines/index.html','utf8');
 const card=html.match(/<a[^>]+data-line-id="separatsiya-01"[\s\S]*?<\/a>/)[0];
 for(const text of ['Цветной плёночный микс','Сортировка по видам','Доп. опция','По согласованию'])assert.ok(card.includes(text));
 assert.ok(!card.includes('13 позиций'));assert.ok(!card.includes('Базовая комплектация'));
 assert.match(card,/catalog-cover-navy/);
});
test('Фото распределены по 11 узлам, а каталог использует готовые иллюстрации владельца',async()=>{
 const {nodes,media}=await import('../content/catalog.mjs');
 const {customerPhotos}=await import('../content/customer-photos.mjs');
 const {equipmentCardImages}=await import('../content/equipment-card-images.mjs');
 assert.equal(customerPhotos.length,65);
 assert.equal(new Set(customerPhotos.map(m=>m.slug)).size,11);
 assert.equal(new Set(customerPhotos.map(m=>m.id)).size,65);
 const catalogue=await readFile('dist/catalog/equipment/index.html','utf8');
 for(const n of nodes){
  assert.ok(catalogue.includes(`${basePath}/assets/${equipmentCardImages[n.slug].file}`),n.slug);
  assert.ok(!n.cardImage.startsWith('photos/'),n.slug);
  const pictures=media.filter(m=>m.product===n.path&&m.type==='photo');
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  if(n.slug==='ochistka-stokov'){
   assert.equal(pictures.length,0);
   assert.ok(!html.includes('id="photos"'));assert.ok(html.includes('data-diagram data-view='));
  }else{
   assert.equal(pictures.filter(m=>m.primary).length,1,n.slug);
   assert.ok(pictures.every(m=>m.processed&&m.slug===n.slug),n.slug);
   const primary=pictures.find(m=>m.primary);
   assert.ok(html.includes(`<img src="${basePath}/assets/${primary.file}"`),n.slug);
  }
 }
 for(const m of customerPhotos){
  assert.equal(m.processed,true);assert.match(m.sourceSha256,/^[a-f0-9]{64}$/);
  assert.ok(m.width<=1920&&m.height<=1920);
  assert.ok((await stat('dist/assets/'+m.thumbnail)).size>0);
 }
 const gallery=await readFile('dist/media/index.html','utf8');
 assert.ok(gallery.includes('data-default-type="photo"'));
 assert.equal([...gallery.matchAll(/data-album data-product=/g)].length,11);
 assert.ok(gallery.includes(`src="${basePath}/assets/photos/predvaritelnyy-izmelchitel/02-thumb.webp"`));
});
test('Краткие параметры содержат мощность, а схемы имеют свои легенды',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 const missing=nodes.filter(n=>n.quickSpecs.some(s=>s.missing)).map(n=>n.slug).sort();
 assert.deepEqual(missing,[]);
 for(const n of nodes){
  assert.equal(n.quickSpecs.length,6,n.slug);
  assert.ok(n.quickSpecs.some(s=>s.power&&!s.missing),n.slug);
  for(const s of n.quickSpecs.filter(s=>!s.missing))assert.ok(n.specs.some(([label,value])=>label===s.label&&value===s.value),n.slug);
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  assert.ok(html.includes('class="quick-spec-panel"'),n.slug);
  assert.ok(html.includes(n.diagram?'data-diagram data-view=':'class="scheme-reading"'),n.slug);
  assert.ok(n.reading.parts.length>=3,n.slug);
  assert.equal(new Set(n.reading.parts.map(p=>p[0])).size,n.reading.parts.length,n.slug);
  assert.equal(html.includes('href="#photos"'),n.slug!=='ochistka-stokov');
  if(n.slug!=='ochistka-stokov')assert.ok(html.includes(`data-photo-gallery data-product="${basePath}${n.path}"`));
 }
 const rotor=nodes.find(n=>n.slug==='rotornyy-raspushitel');
 assert.equal(rotor.reading.functional,true);
 assert.equal(rotor.scheme,'equipment/rotornyy-raspushitel/working-principle.svg');
 const svg=await readFile('dist/assets/'+rotor.scheme,'utf8');
 assert.match(svg,/>1<\/text>/);assert.match(svg,/>2<\/text>/);assert.match(svg,/>3<\/text>/);
});
test('Новые карточки используют все 12 иллюстраций и сохраняют единицы подачи',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 const {equipmentCardData}=await import('../content/equipment-cards.mjs');
 const {createHash}=await import('node:crypto');
 const manifest=JSON.parse(await readFile('docs/equipment-card-assets.json','utf8'));
 assert.equal(manifest.images.length,12);
 assert.deepEqual(new Set(manifest.images.map(i=>i.slug)),new Set(nodes.map(n=>n.slug)));
 for(const node of nodes){
  const card=equipmentCardData(node),asset=manifest.images.find(i=>i.slug===node.slug);
  assert.equal(card.metrics.length,4,node.slug);
  assert.equal(card.image.file,asset.image.file,node.slug);
  assert.equal(card.image.width/card.image.height,4/3);
  for(const image of [asset.image,asset.small])assert.equal(createHash('sha256').update(await readFile('dist/assets/'+image.file)).digest('hex'),image.sha256);
  assert.equal(card.metrics[2].value,node.power.installed,node.slug);
  assert.equal(card.metrics[3].value,node.power.value,node.slug);
 }
 const get=slug=>equipmentCardData(nodes.find(n=>n.slug===slug));
 assert.equal(get('ballisticheskiy-separator').metrics[0].value,'до 60 м³/ч');
 assert.equal(get('bunker-nakopitel').metrics[0].label,'Ёмкость накопления');
 assert.equal(get('bunker-nakopitel').metrics[0].value,'4,7 м³');
 assert.equal(get('ochistka-stokov').metrics[0].value,'25 м³/ч');
 assert.equal(get('rama-napolnitel').metrics[0].value,'до 20 мешков/ч');
});
test('Адаптивные изображения и презентационные переходы учитывают путь публикации',async()=>{
 const html=await readFile('dist/index.html','utf8');
 const technology=await readFile('dist/technology/index.html','utf8');
 for(const [,candidates] of html.matchAll(/srcset="([^"]+)"/g)){
  for(const candidate of candidates.split(',')){
   const url=candidate.trim().split(/\s+/)[0];
   assert.ok(url.startsWith(basePath+'/assets/'),`Missing base in srcset: ${url}`);
   await stat('dist'+url.slice(basePath.length));
  }
 }
 assert.match(technology,/Полный цикл переработки плёнки:/);
 assert.match(technology,/очистить, переработать, использовать снова/);
 assert.ok(html.includes(`href="${basePath}/technology#solution"`));
 assert.ok(html.includes(`href="${basePath}/contacts#project-form"`));
 assert.ok(html.includes('mailto:edkom.office@mail.ru'));
 assert.ok(!html.includes('eduard@ros-um.ru'));
 assert.ok(!html.includes('data-node'));
 assert.ok(!html.includes('Материалы готовятся'));
});
test('Все 12 карточек содержат свои параметры и действительные исходные PDF',async()=>{
 const {nodes}=await import('../content/catalog.mjs');const {createHash}=await import('node:crypto');
 for(const n of nodes){
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  assert.ok(!html.includes('КАРТОЧКА В ПОДГОТОВКЕ'),n.slug);
  assert.ok(n.specs.length>=10,n.slug);assert.ok(n.highlights.length>=2,n.slug);
  assert.equal(n.documents.length,2);
  for(const d of n.documents){
  assert.ok(html.includes(`${basePath}/documents/${d.file}`));
  const pdf=await readFile('dist/documents/'+d.file);
  assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.equal(pdf.length,d.bytes);
  assert.equal(createHash('sha256').update(pdf).digest('hex'),d.sha256);
  }
  await stat('dist/assets/'+n.cardFile);await stat('dist/assets/'+n.scheme);
 }
});
test('Единицы, мощность и условия разных узлов не смешиваются',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 const get=slug=>nodes.find(n=>n.slug===slug);
 const value=(slug,label)=>get(slug).specs.find(([k])=>k===label)?.[1];
 assert.equal(value('ballisticheskiy-separator','Производительность по объёму подачи'),'до 60 м³/ч');
 assert.equal(value('bunker-nakopitel','Ёмкость бункера'),'4,7 м³');
 assert.equal(value('rotornaya-tsentrifuga','Производительность по плёнке'),'1 000 кг/ч');
 assert.equal(value('rotornaya-tsentrifuga','Производительность по жёсткому пластику'),'3 000 кг/ч');
 assert.equal(value('vintovoy-press','Установленная мощность основного привода'),'75 кВт');
 assert.equal(value('kapsulyator','Установленная мощность'),'190 кВт');
 assert.ok(get('kapsulyator').description.includes('отжимной пресс'));
 assert.ok(get('rotornaya-tsentrifuga').notes.some(n=>n.includes('37,62 кВт')));
 assert.ok(get('vertikalno-rotornyy-izmelchitel').notes.some(n=>n.includes('Не включает внешний нагрев')));
 assert.equal(value('predvaritelnyy-raspushitel','Расчётная потребляемая мощность'),'25,9 кВт');
 assert.equal(get('rama-napolnitel').documents[0].type,'Паспорт и техническое описание');
});
test('Навигация различает точную страницу, раздел и полное меню',async()=>{
 const {navigation,navigationState,siteHeader,siteMenu,normalizeNavigationPath}=await import('../scripts/navigation.mjs');
 assert.match(navigation('/'),/href="\/"[^>]*aria-current="page"[^>]*data-current-section="true"/);
 for(const path of [product,'/catalog/equipment','/catalog/lines/separatsiya-02','/catalog/lines']){
  const state=navigationState(path);assert.equal(state.section,'equipment');
  assert.match(navigation(path),/href="\/catalog"[^>]*data-current-section="true"/);
  assert.ok(!navigation(path).includes('aria-current="location"'));
 }
 assert.equal(navigationState('/technology/#hot-washing').section,'technology');
 for(const [path,section] of [['/automation','control'],['/media','gallery']]){
  assert.equal(navigationState(path).section,section);
  assert.match(navigation(path),new RegExp('href="'+path+'"[^>]*aria-current="page"[^>]*data-current-section="true"'));
  assert.ok(!siteHeader(path).includes('aria-controls="site-menu" data-current-section="true"'));
 }
 for(const path of ['/documents','/news','/blog','/contacts','/company-details']){
  assert.equal(navigationState(path).section,'all');
  assert.match(siteHeader(path),/aria-controls="site-menu" data-current-section="true"/);
  assert.match(siteMenu(path),new RegExp('href="'+path+'" aria-current="page"'));
 }
 assert.match(siteMenu(product),/href="\/catalog\/equipment" data-current-branch="true"/);
 assert.match(siteMenu('/catalog/lines/separatsiya-02'),/href="\/catalog\/lines" data-current-branch="true"/);
 assert.equal(normalizeNavigationPath('/Website_ERA/catalog/equipment/?q=x#specs','/Website_ERA/'),'/catalog/equipment');
 assert.equal(navigationState('/Website_ERA/?q=x#discuss',{basePath:'/Website_ERA'}).section,'project');
 assert.equal(navigationState('/Website_ERA/catalog/equipment/?q=x#specs',{basePath:'/Website_ERA'}).section,'equipment');
 for(const path of ['/catalogue','/404','/unknown','/technology-else'])assert.equal(navigationState(path).section,null);
 assert.ok(!siteHeader('/404').includes('data-current-section="true"'));
});
test('Видеоблок появляется у своего узла, а ролик загружается после выбора пользователя',async()=>{
 const {media,nodes}=await import('../content/catalog.mjs');
 const {equipmentVideos}=await import('../content/equipment-videos.mjs');
 const {render}=await import('../scripts/build.mjs');
 const {equipmentCinema}=await import('../scripts/video.mjs');
 assert.equal(equipmentCinema([]),'');
 for(const pending of equipmentVideos.filter(v=>!v.ready))assert.ok(!media.some(m=>m.id===pending.id));
 const node=nodes.find(n=>n.slug==='predvaritelnyy-izmelchitel');
 const fixture={...equipmentVideos[0],id:'player-test',title:'Проверка: "видео" & ERA',file:'videos/__player-test.mp4',product:node.path,productTitle:node.title,ready:true};
 media.push(fixture);
 try{
  const html=render(node.path);
  assert.match(html,/id="video"/);
  assert.ok(html.includes(`data-video="${basePath}/assets/videos/__player-test.mp4"`));
  assert.ok(html.includes(`data-poster="${basePath}/assets/${fixture.poster}"`));
  assert.ok(html.includes('href="#video"'));
  assert.ok(html.indexOf('id="video"')<html.indexOf('id="purpose"'));
  assert.ok(!/<video[^>]*\s(?:src|autoplay)=?/.test(html));
  assert.ok(html.includes('playsinline preload="none"'));
  assert.ok(html.includes('data-title="Проверка: &quot;видео&quot; &amp; ERA"'));
  const other=render(nodes.find(n=>n.slug==='vintovoy-press').path);
  assert.ok(!other.includes('href="#video"'));assert.ok(!other.includes('id="video"'));
  const gallery=render('/media');
  assert.ok(gallery.includes(`data-video="${basePath}/assets/videos/__player-test.mp4"`));
  assert.ok(!gallery.includes(`src="${basePath}/assets/videos/__player-test.mp4"`));
 }finally{media.pop();}
});
test('Полные ролики проверены по контрольным суммам и готовы к последовательному воспроизведению',async()=>{
 const {equipmentVideos}=await import('../content/equipment-videos.mjs');
 const {createHash}=await import('node:crypto');
 const films=equipmentVideos.filter(v=>v.ready);
 assert.ok(films.some(v=>v.slug==='predvaritelnyy-izmelchitel'));
 for(const film of films){
  const data=await readFile('dist/assets/'+film.file);
  assert.equal(data.length,film.bytes);
  assert.equal(createHash('sha256').update(data).digest('hex'),film.sha256);
  if(film.webOptimized){
   assert.match(film.sourceSha256,/^[a-f0-9]{64}$/);
   assert.ok(film.sourceBytes>film.bytes);
   assert.equal(film.frames,film.sourceFrames);
   assert.ok(Math.abs(film.durationSeconds-film.sourceDurationSeconds)<0.05);
  }else assert.equal(film.sha256,film.sourceSha256);
  assert.equal(data.toString('ascii',4,8),'ftyp');
  const atoms=[];
  for(let offset=0;offset+8<=data.length;){
   let size=data.readUInt32BE(offset);const type=data.toString('ascii',offset+4,offset+8);
   if(size===1)size=Number(data.readBigUInt64BE(offset+8));
   else if(size===0)size=data.length-offset;
   assert.ok(size>=8&&offset+size<=data.length);
   atoms.push(type);offset+=size;
  }
  assert.ok(atoms.includes('moov')&&atoms.includes('mdat'));
  assert.ok(atoms.indexOf('moov')<atoms.indexOf('mdat'),'MP4 metadata must precede video data');
  assert.ok(film.durationSeconds>0&&film.width>0&&film.height>0);
  await stat('dist/assets/'+film.poster);await stat('dist/assets/'+film.thumbnail);
  const html=await readFile('dist/catalog/equipment/'+film.slug+'/index.html','utf8');
  assert.ok(html.includes(`data-video="${basePath}/assets/${film.file}"`));
  assert.ok(html.includes(`data-poster="${basePath}/assets/${film.poster}"`));
 }
});

test('Панель ЦБ РФ доступна на всех страницах и не содержит выдуманных курсов',async()=>{
 const {version}=JSON.parse(await readFile('package.json','utf8'));
 for(const route of new Set(routes)){
  if(['/about','/ai'].includes(route))continue; // Legacy redirects render the destination header.
  const html=await readFile(resolve('dist','.'+route,'index.html'),'utf8');
  assert.equal([...html.matchAll(/data-fx-bar /g)].length,1,route);
  assert.ok(html.includes('https://www.cbr.ru/currency_base/daily/'));
  assert.ok(html.includes('refs/heads/data/cbr-rates/cbr.json'));
  for(const code of ['USD','EUR','CNY'])assert.ok(html.includes(`data-fx-value="${code}">—</dd>`));
  assert.ok(html.includes(`src="${basePath}/fx.js?v=${version}"`));
 }
});

test('Все узлы рассчитывают 70% мощности с десятичным округлением до одного знака',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 const {calculatedPower}=await import('../content/power.mjs');
 const expected=['33,0','25,9','17,4','86,7','17,9','54,3','135,1','26,3','52,5','133,0','8,2','0,3'];
 for(const [i,n] of nodes.entries()){
  const rows=n.specs.filter(([k])=>k==='Расчётная потребляемая мощность');
  assert.equal(rows.length,1,n.slug);assert.equal(rows[0][1],expected[i]+' кВт',n.slug);
  assert.ok(n.quickSpecs.some(s=>s.label===rows[0][0]&&s.value===rows[0][1]),n.slug);
  assert.equal(n.power.factor,0.7);
 }
 // Exact decimal half-up rounding, including the 17.85 and 54.25 boundaries.
 assert.equal(calculatedPower('25,5 кВт'),'17,9 кВт');
 assert.equal(calculatedPower('77,5 кВт'),'54,3 кВт');
 assert.equal(calculatedPower('0,37 кВт'),'0,3 кВт');
 assert.equal(calculatedPower('1 000 кВт'),'700,0 кВт');
});

test('Интерактивная схема сохраняет 12 обозначений КП и два прозрачных вида',async()=>{
 const {equipmentDiagrams}=await import('../content/equipment-diagrams.mjs');
 const {schemeReading}=await import('../content/equipment-reading.mjs');
 const d=equipmentDiagrams['predvaritelnyy-izmelchitel'];
 assert.equal(d.views.length,2);assert.equal(d.parts.length,12);
 assert.deepEqual(d.parts.map(p=>[p.number,p.label]),schemeReading['predvaritelnyy-izmelchitel'].parts);
 for(const p of d.parts){
  assert.ok(d.views.some(v=>v.id===p.view));assert.ok(p.description);
  for(const [x,y] of [p.pin,...p.targets])assert.ok(x>0&&x<1000&&y>0&&y<1000);
 }
 for(const v of d.views){
  const bytes=await readFile('dist/assets/'+v.file);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.includes(Buffer.from('VP8L')),'Transparent image must retain its lossless export');
 }
 const html=await readFile('dist'+product+'/index.html','utf8');
 assert.equal([...html.matchAll(/class="diagram-pin" /g)].length,12);
 assert.ok(html.includes('href="#construction"'));
 assert.ok(!html.includes('class="equipment-scheme"'));
 for(const v of d.views)assert.ok(html.includes(`href="${basePath}/assets/${v.file}"`));
});

test('Все 12 интерактивных схем сохраняют исходные обозначения и правильные файлы видов',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 let count=0;
 for(const n of nodes){
  const d=n.diagram;assert.ok(d,n.slug);count+=d.parts.length;
  assert.deepEqual(d.parts.map(p=>[p.number,p.label]),n.reading.parts,n.slug);
  assert.ok(d.views.some(v=>v.id===d.parts.find(p=>p.number===d.defaultPart)?.view),n.slug);
  for(const v of d.views){
   await stat('dist/assets/'+v.file);assert.ok(d.parts.some(p=>p.view===v.id),n.slug+' '+v.id);
   const h=v.canvasHeight||1000;
   for(const p of d.parts.filter(p=>p.view===v.id)){
    assert.ok(p.description,n.slug+' '+p.number);
    for(const [x,y] of [p.pin,...p.targets])assert.ok(x>0&&x<1000&&y>0&&y<h,`${n.slug} ${p.number}: ${x},${y}`);
   }
  }
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  assert.equal([...html.matchAll(/class="diagram-pin" /g)].length,d.parts.length);
  assert.ok(!html.includes('class="equipment-scheme"'));
  const c=n.catalogueIllustration;
  assert.equal(c.type,'technical-illustration');assert.equal(c.sourceDocumentId,n.slug+'-technical');
  assert.ok(c.width>300&&c.height>250);await stat('dist/assets/'+c.file);
 }
 assert.equal(count,130);
});

test('24 документа переименованы, разложены по двум папкам и имеют согласованные ссылки',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 const {documentManifest,documentCategories}=await import('../content/document-manifest.mjs');
 assert.equal(documentManifest.length,24);assert.equal(documentCategories.length,2);
 assert.equal(new Set(documentManifest.map(d=>d.id)).size,24);
 assert.equal(new Set(documentManifest.map(d=>d.file)).size,24);
 const library=await readFile('dist/documents/index.html','utf8');
 for(const category of documentCategories){
  assert.equal(documentManifest.filter(d=>d.category===category.id).length,12);
  assert.ok(library.includes(`data-document-folder="${category.id}"`));
 }
 for(const n of nodes){
  assert.equal(n.documents.filter(d=>d.category==='brochures').length,1);
  assert.equal(n.documents.filter(d=>d.category==='technical').length,1);
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  assert.ok(n.marketing.slogan&&n.marketing.lead&&n.marketing.benefits.length===3);
  assert.ok(html.includes(n.marketing.slogan));assert.ok(html.includes('class="equipment-benefits"'));
  for(const d of n.documents){
   assert.ok(d.file.startsWith(d.category==='brochures'?'brochures/':'technical/'));
   assert.ok(!d.downloadName.includes('Визитка')&&!d.downloadName.includes('КП_'));
   assert.ok(d.downloadName.endsWith('.pdf'));
   for(const page of [html,library]){
    assert.ok(page.includes(`href="${basePath}/documents/${d.file}"`));
    assert.ok(page.includes(`download="${d.downloadName}"`));
    if(d.legacyFile)assert.ok(!page.includes(`href="${basePath}/documents/${d.legacyFile}"`));
   }
  }
 }
});

test('Общий каталог предлагает две ветки, а старое О проекте перенесено на главную',async()=>{
 const {nodes,lines}=await import('../content/catalog.mjs');
 const hub=await readFile('dist/catalog/index.html','utf8');
 assert.equal([...hub.matchAll(/class="catalog-door catalog-exhibit /g)].length,2);
 assert.ok(hub.indexOf('id="catalog-lines-title"')<hub.indexOf('id="catalog-nodes-title"'));
 assert.equal([...hub.matchAll(/class="catalog-exhibit-scene"/g)].length,2);
 assert.ok(!hub.includes('catalog-door-stats'));
 assert.ok(!hub.includes('id="catalog-filters"'));
 const equipment=await readFile('dist/catalog/equipment/index.html','utf8');
 assert.ok(equipment.includes('id="catalog-filters"'));
 assert.equal([...equipment.matchAll(/data-node data-title=/g)].length,nodes.length);
 assert.equal(lines.filter(l=>l.enabled&&l.group==='Сепарация').length,2);
 assert.equal(lines.filter(l=>l.enabled&&l.group==='Мойка').length,0);
 const home=await readFile('dist/index.html','utf8');
 assert.ok(home.includes('id="about-era"'));assert.ok(home.includes('Начинаем с вашего сырья и нужного результата'));
 assert.ok(home.includes('ЭРА — проект по возвращению вторичных полимерных материалов'));
 const about=await readFile('dist/about/index.html','utf8');
 assert.ok(about.includes(`content="0; url=${basePath}/"`));
 assert.ok(about.includes(`rel="canonical" href="${basePath}/"`));
 for(const route of routes.filter(r=>r!=='/about')){
  const html=await readFile(resolve('dist','.'+route,'index.html'),'utf8');
  assert.ok(!html.includes(`href="${basePath}/about"`));
 }
});

test('Счётчики различают типы и не дублируют файлы, миниатюры и ссылки на PDF',async()=>{
 const {countMedia,mediaCountLabels}=await import('../public/media-counts.js');
 const counts=countMedia([
  {type:'photo',file:'photo.webp',thumbnail:'photo-small.webp'},
  {type:'photo',file:'photo.webp?v=2'},
  {type:'video',file:'film.mp4'},{type:'video',file:'film.mp4#t=10'},
  {type:'scheme',file:'drawing.svg'},{type:'visualization',file:'view.webp'},
  {type:'frame',file:'frame.webp'},
 ],[{file:'description.pdf'},{file:'description.pdf#page=2'}]);
 assert.deepEqual(counts,{photos:1,videos:1,schemes:2,visualizations:true,frames:1,documents:1});
 assert.equal(mediaCountLabels(counts).find(c=>c.key==='schemes').label,'Схемы и визуализации');
 assert.deepEqual(mediaCountLabels(countMedia([],[])),[]);
});
test('Клиентский режим: единый кириллический бренд, групповой подвал и один валютный блок',async()=>{
 const {navigationGroups}=await import('../content/navigation.mjs');
 for(const route of new Set(routes.filter(r=>!['/about','/ai'].includes(r)))){
  const html=await readFile(resolve('dist','.'+route,'index.html'),'utf8');
  const header=html.match(/<header[\s\S]*?<\/header>/)[0];
  const footer=html.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.ok(!header.includes('data-fx-bar'),route);
  assert.equal([...html.matchAll(/data-fx-bar /g)].length,1,route);
  assert.ok(footer.includes('data-fx-bar'),route);
  for(const group of navigationGroups){assert.ok(footer.includes(group.label));for(const link of group.links)assert.ok(footer.includes(`href="${basePath}${link.href}"`));}
  const visible=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ');
  const labels=[...html.matchAll(/(?:aria-label|alt|title|data-source|data-title|content)="([^"]*)"/g)].map(m=>m[1]).join(' ');
  // The owner explicitly requests this source citation for the single manual experiment.
  const copy=(visible+' '+labels).replaceAll('Опыт, приведённый в презентации ЭРА.','');
  assert.doesNotMatch(copy,/\bERA\b|прототип|для согласования|из презентации|в презентации|предоставленному КП|источник:|слайд №|сайт объединяет/iu,route);
  assert.match(html,/noindex,nofollow/,route);
 }
 const notFound=await readFile('dist/404.html','utf8');assert.equal([...notFound.matchAll(/data-fx-bar /g)].length,1);
});
test('Контакты сохранены, КАИР перенесён в технологию с реальными фотографиями и автосменой',async()=>{
 const {kairSlides,kairPresentation}=await import('../content/kair.mjs');
 const {kairMonitor}=await import('../scripts/kair.mjs');
 assert.equal(kairSlides.length,23);assert.equal(kairPresentation.autoplay,true);
 assert.ok(kairPresentation.intervalMs>=6000&&kairPresentation.intervalMs<=12000);
 const component=kairMonitor();assert.ok(component.includes('data-kair-next'));assert.ok(component.includes('data-kair-pause'));assert.ok(component.includes('1 из 23'));
 assert.ok(component.includes('data-kair-viewer'));assert.ok(component.includes('Настоящие экраны. Реальное управление.'));
 const home=await readFile('dist/index.html','utf8');
 assert.ok(home.includes('id="discuss"'));assert.ok(!home.includes('data-kair-inspect'));
 const html=await readFile('dist/technology/index.html','utf8');
 assert.match(html,/<section class="story-section discuss-story" id="discuss"/);
 assert.ok(html.includes('data-kair-inspect'));assert.ok(html.includes('Возможности КАИР'));
 assert.ok(html.includes(`data-image="${basePath}/assets/${kairSlides[0].original}"`));
 assert.ok(!kairMonitor([]));
 const single=kairMonitor([kairSlides[0]],{...kairPresentation,autoplay:false});
 assert.ok(!single.includes('data-kair-next'));assert.ok(!single.includes('data-kair-pause'));
});
test('Главная отделяет цены модели от предложений продавцов и содержит четыре локальных сценария',async()=>{
 const {economicsConfig,marketOffers}=await import('../public/economics-config.js');
 const {calculateEconomics}=await import('../public/economics-model.js');
 const {millions}=await import('../public/economics-view.js');
 const html=await readFile('dist/index.html','utf8'),result=calculateEconomics();
 assert.ok(html.includes('Из загрязнённой плёнки —'));assert.ok(!html.includes('class="pitch-stage-nav'));
 assert.ok(!html.includes('class="raw-story"'));assert.ok(!html.includes('data-kair-inspect'));
 for(const id of ['raw-material','solution','market','economics','about-era','discuss'])assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1,id);
 assert.ok(html.includes(economicsConfig.disclosure));assert.ok(html.includes(economicsConfig.taxDisclosure));
 assert.equal([...html.matchAll(/data-widget-switch="/g)].length,4);
 assert.equal([...html.matchAll(/data-econ-widget="/g)].length,3);
 assert.ok(html.includes('На 1 тонну готовой продукции'));
 assert.ok(html.includes('Выручка без НДС'));
 assert.ok(html.includes('Примеры сторонних предложений'));
 assert.ok(!html.includes('Демонстрационный расчёт'));
 assert.ok(!html.includes('Условный налог'));
 for(const value of [result.revenue,result.net])assert.ok(html.includes(millions(value)));
 for(const marker of ['data-econ-month','data-econ-bridge','data-econ-curve','data-econ-range','data-econ-number','data-econ-lines="3"'])assert.ok(html.includes(marker),marker);
 assert.ok(html.includes(`src="${basePath}/commercial.js?v=`));
 assert.ok(html.includes('Все ТКО, образованные в России за 2025 год'));
 assert.ok(html.includes('Показатель 46,4 млн т охватывает все ТКО'));
 for(const offer of marketOffers){assert.ok(html.includes(`href="${offer.href}"`));assert.ok(offer.minimum);assert.ok(offer.vat);assert.ok(offer.delivery);}
 const deployed=await readFile('dist/economics-controller.js','utf8');assert.match(deployed,/from '\.\/economics-model\.js\?v=/);
});
test('Технология сохраняет прежние материалы, стадии, результаты, КАИР и путь запуска',async()=>{
 const {feedstockTypes}=await import('../content/feedstock.mjs');
 const {presentationStages}=await import('../content/presentation.mjs');
 const {contaminationMatrix,technicalInputs}=await import('../content/presentation-web.mjs');
 const html=await readFile('dist/technology/index.html','utf8');
 for(const id of ['raw-material','raw-title','raw-cleaning-title','solution','solution-title','dry-separation','hot-washing','granulation','granule-quality','control-title','output-title','about-era','launch-title','detail-title','discuss','discuss-title'])assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1,id);
 for(const text of [...feedstockTypes,...contaminationMatrix.flatMap(row=>[row.title,row.examples,row.operation,row.note]),...presentationStages.flatMap(stage=>[stage.summary,stage.description,...stage.details]),...technicalInputs])assert.ok(html.includes(text),text);
 assert.ok(html.includes('Отмытый и обезвоженный материал для дальнейшей подготовки и грануляции.'));
 assert.ok(html.includes('Уплотнённый и обезвоженный промежуточный материал'));
 assert.ok(html.includes('Товарный продукт после стадии грануляции.'));
 assert.ok(html.includes('Как проходит поставка и сопровождение'));
 assert.ok(html.includes(`href="${basePath}/#about-era"`));
 assert.equal([...html.matchAll(/data-kair-slide(?=[\s>])/g)].length,23);
 assert.ok(html.includes('Продукция и направления применения'));assert.ok(html.includes(`href="${basePath}/#solution"`));
 assert.ok(html.includes(`href="${basePath}/catalog/equipment"`));assert.ok(html.includes(`href="${basePath}/automation"`));
 assert.ok(html.includes('Схематическая иллюстрация'));assert.ok(html.includes('ПТР при заданной температуре и нагрузке'));
});
test('Все фотографии КАИР из архива имеют действительные оригиналы и адаптивные копии',async()=>{
 const {createHash}=await import('node:crypto');
 const {kairSlides}=await import('../content/kair.mjs');
 const manifest=JSON.parse(await readFile('docs/kair-slides-assets.json','utf8'));
 assert.equal(manifest.images.length,23);
 assert.deepEqual(new Set(kairSlides.map(s=>s.original)),new Set(manifest.images.map(s=>s.sourceFile)));
 for(const slide of kairSlides){
  const source=manifest.images.find(s=>s.sourceFile===slide.original);
  for(const [file,sha] of [[slide.original,source.sourceSha256],[slide.file,source.image.sha256],[slide.smallFile,source.small.sha256]]){
   const bytes=await readFile('dist/assets/'+file);
   assert.equal(createHash('sha256').update(bytes).digest('hex'),sha,file);
  }
 }
});
test('Страница КАИР охватывает реестр владельца, различая назначение и исполнение функций',async()=>{
 const {kairGroups,kairFunctions,kairLogicModes,kairHardware}=await import('../content/kair-system.mjs');
 const source=JSON.parse(await readFile('docs/kair-function-source-index.json','utf8'));
 const reference=new Set(source.functions.map(f=>f.code));
 assert.equal(reference.size,50);
 assert.deepEqual(new Set(kairFunctions.flatMap(f=>f.codes)),reference);
 assert.equal(kairGroups.length,6);assert.equal(new Set(kairFunctions.map(f=>f.id)).size,kairFunctions.length);
 for(const f of kairFunctions){assert.ok(kairGroups.some(g=>g.id===f.group));assert.ok(f.text&&f.title&&f.detail);}
 const fn=id=>kairFunctions.find(f=>f.id===id);
 for(const id of ['recipes','events','bunkers','reverse'])assert.equal(fn(id).scope,'separation');
 for(const id of ['powder','alkali','makeup','rinse','water-treatment'])assert.equal(fn(id).scope,'washing');
 for(const id of ['temperature','service','contamination'])assert.equal(fn(id).level,'project');
 for(const id of ['packaging','friction','granulator']){assert.equal(fn(id).level,'local');assert.equal(fn(id).scope,'equipment');}
 assert.ok(fn('remote').detail.includes('права пользователей'));assert.ok(fn('recipes').detail.includes('персонал'));
 assert.ok(fn('cabinet').detail.includes('относится к шкафу управления'));
 assert.ok(fn('water-treatment').text.includes('основную мойку'));assert.ok(fn('rinse').text.includes('Чистая вода'));
 assert.ok(fn('makeup').detail.includes('разные величины'));assert.ok(fn('rinse').detail.includes('потери'));
 assert.equal(kairLogicModes.length,4);assert.equal(kairHardware.length,8);
});
test('Сценарии КАИР представлены как типовые задачи с раскрытием действий и условий',async()=>{
 const {kairScenarios}=await import('../content/kair-scenarios.mjs');
 assert.deepEqual(kairScenarios.map(s=>s.number),Array.from({length:24},(_,i)=>i+1));
 assert.equal(kairScenarios.filter(s=>s.featured).length,8);
 for(const s of kairScenarios)assert.ok(s.title&&s.situation&&s.action&&s.benefit);
 assert.ok(kairScenarios.find(s=>s.number===1).note.includes('на площадке остаётся персонал'));
 assert.ok(kairScenarios.find(s=>s.number===13).note.includes('порядок переключения'));
 const html=await readFile('dist/automation/index.html','utf8');
 assert.equal([...html.matchAll(/data-kair-scenario="\d+"/g)].length,24);
 assert.ok(html.includes('Типовые сценарии'));assert.ok(html.includes('Ещё 16 практических ситуаций'));
 assert.ok(!html.includes('КАИР рассчитывает прибыль'));
});
test('КАИР имеет связные схемы, независимые вкладки, поиск и прежние 23 фотографии',async()=>{
 const html=await readFile('dist/automation/index.html','utf8');
 assert.equal([...html.matchAll(/<h1[\s>]/g)].length,1);
 assert.equal([...html.matchAll(/data-kair-slide(?=[\s>])/g)].length,23);
 assert.equal([...html.matchAll(/data-kair-function(?=[\s>])/g)].length,29);
 assert.equal([...html.matchAll(/data-kair-tabs(?=[\s>])/g)].length,2);
 for(const id of ['value','screens','logic','functions','process','scenarios','hardware','project'])assert.equal([...html.matchAll(new RegExp(`id="kair-${id}"`,'g'))].length,1,id);
 for(const [,id] of html.matchAll(/aria-controls="(ka-(?:logic|process)-[^"]+)"/g))assert.ok(html.includes(`id="${id}"`),id);
 for(const slot of ['kair-overview','kair-logic-protection','kair-logic-memory','kair-process-separation','kair-process-washing','kair-water-circuits'])assert.ok(html.includes(`data-artwork-slot="${slot}"`));
 assert.ok(html.includes('Стоки → очистка → бак возврата'));assert.ok(html.includes('Чистая вода из резервуара'));
 assert.ok(html.includes('data-kair-function-search'));assert.ok(html.includes('data-kair-scope="washing"'));
 assert.ok(html.includes(`${basePath}/kair-system.js?v=`));assert.ok(html.includes(`${basePath}/kair-system.css?v=`));
 assert.ok(!(await readFile('dist/technology/index.html','utf8')).includes('/kair-system.css'));
});
test('Отдельная страница ИИ удалена из меню и разделов, старые ссылки направляют к КАИР',async()=>{
 const {sections}=await import('../content/site.mjs');
 assert.ok(!sections.some(([path])=>path==='/ai'));
 for(const route of new Set(routes)){
  const html=await readFile(resolve('dist','.'+route,'index.html'),'utf8');
  assert.ok(!html.includes(`href="${basePath}/ai"`),route);
  assert.ok(!html.includes('Искусственный интеллект'),route);
 }
 const legacy=await readFile('dist/ai/index.html','utf8');
 assert.ok(legacy.includes(`http-equiv="refresh" content="0; url=${basePath}/automation"`));
 assert.ok(legacy.includes(`rel="canonical" href="${basePath}/automation"`));
 assert.ok(legacy.includes(`${basePath}/automation-redirect.js?v=`));
 assert.ok(!legacy.includes('site-header'));
});
test('Пять основных направлений ведут к прежним страницам и сохраняют активный раздел',async()=>{
 const {primaryLinks}=await import('../content/navigation.mjs');
 assert.deepEqual(primaryLinks.map(link=>[link.label,link.href]),[['О проекте','/'],['Технология','/technology'],['Система управления','/automation'],['Каталог оборудования','/catalog'],['Галерея','/media']]);
 const {navigationState}=await import('../scripts/navigation.mjs');
 assert.equal(navigationState('/automation/?v=latest').section,'control');
 assert.equal(navigationState('/media/?type=video').section,'gallery');
 assert.equal(navigationState('/catalog/equipment/plenochnyy-flotator').section,'equipment');
 assert.equal(navigationState('/contacts/sent').panelPath,'/contacts');
});
test('Заявка имеет настоящий multipart POST, адрес получателя, вложения и страницу возврата',async()=>{
 const {projectRequest,siteContacts}=await import('../content/contact.mjs');
 assert.equal(siteContacts.email,'edkom.office@mail.ru');
 assert.equal(projectRequest.endpoint,'https://formsubmit.co/edkom.office@mail.ru');
 const html=await readFile('dist/contacts/index.html','utf8');
 assert.equal([...html.matchAll(/data-request-form(?=[\s>])/g)].length,1);
 assert.ok(html.includes('method="post" enctype="multipart/form-data"'));
 for(const field of ['Имя','email','Телефон','Компания','Интересует','Задача','Ссылки','Страница обращения','Вложения','attachment','_honey','_subject','_next','_template'])assert.ok(html.includes(`name="${field}"`),field);
 assert.ok(html.includes('type="file"'));assert.ok(html.includes('data-request-files'));
 assert.ok(html.includes(`value="https://eduyard13.github.io${basePath}/contacts/sent/"`));
 assert.ok(!html.includes('name="_captcha"'));assert.ok(!html.includes('mailto:edkom.office@mail.ru?subject='));
 const thankYou=await readFile('dist/contacts/sent/index.html','utf8');assert.ok(thankYou.includes('Спасибо за обращение.'));
 for(const route of new Set(routes.filter(path=>!['/about','/ai'].includes(path)))){
  const page=await readFile(resolve('dist','.'+route,'index.html'),'utf8');
  assert.equal([...page.matchAll(/data-request-form(?=[\s>])/g)].length,1,route);
  assert.ok(page.includes(`href="${basePath}/contacts#project-form"`),route);
  assert.ok(!page.includes('mailto:edkom.office@mail.ru?subject='),route);
  assert.ok(!page.includes('откроет почтовую программу'),route);
 }
});
test('Контекст запросов переносится в форму без потери текста и без внедрения разметки',async()=>{
 const {enhanceProjectRequests}=await import('../scripts/contact.mjs');
 const topic='Линия № 02: "плёнка" & <сырьё> + детали';
 const source=`<a class="button" href="mailto:edkom.office@mail.ru?subject=${encodeURIComponent(topic)}">Обсудить</a><a href="mailto:edkom.office@mail.ru">Почта</a>`;
 const html=enhanceProjectRequests(source);
 const link=new URL(html.match(/href="([^"]+)"/)[1],'https://site.test');
 assert.equal(link.searchParams.get('topic'),topic);assert.equal(link.hash,'#project-form');
 assert.ok(html.includes('data-project-request'));assert.ok(!html.includes('<сырьё>'));
 assert.ok(html.includes('href="mailto:edkom.office@mail.ru"'));
 assert.ok(enhanceProjectRequests('<a href="#discuss">Обсудить</a>').includes('/contacts#project-form'));
});
test('Карточка сухой сепарации связана с полной линией 02 и сохраняет исходную визитку',async()=>{
 const {drySeparationOverview:overview}=await import('../content/technology-lines.mjs');
 const {lines}=await import('../content/catalog.mjs');
 const {createHash}=await import('node:crypto');
 const target=lines.find(line=>line.path===overview.linePath);
 assert.equal(target.slug,'separatsiya-02');assert.ok(target.enabled);assert.equal(overview.document.pages,3);
 const pdf=await readFile('dist/documents/'+overview.document.file);
 assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.equal(pdf.length,4022808);
 assert.equal(createHash('sha256').update(pdf).digest('hex'),'80876c22af16480aafa298b7a0630b26c2a88a9341d577867300a49e7b58a068');
 const manifest=JSON.parse(await readFile('docs/technology-line-card-assets.json','utf8'));
 assert.equal(manifest.sourceSha256,overview.document.sha256);assert.equal(manifest.linePath,overview.linePath);
 for(const item of manifest.images){const bytes=await readFile('dist/assets/'+item.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256,item.file);}
 const html=await readFile('dist/technology/index.html','utf8');
 assert.ok(html.includes(`href="${basePath}/catalog/lines/separatsiya-02" data-technology-line="separatsiya-02"`));
 assert.equal([...html.matchAll(/data-technology-line="/g)].length,1);
 assert.ok(html.includes('При среднем засоре 50%'));assert.ok(html.includes('70% от установленной'));
 assert.ok(html.includes('Четыре фракции и основной микс'));assert.ok(html.includes('810 м² · высота помещения 9 м'));
 assert.ok(html.includes('До сепарации'));assert.ok(html.includes('После сухой очистки'));
 assert.ok(html.includes(`href="${basePath}/documents/${overview.document.file}" download=`));
});
test('Гранулирование остаётся третьей стадией, а гранулятор входит в моечную комплектацию',async()=>{
 const {washingConfigurations}=await import('../content/technology-lines.mjs');
 const {lines}=await import('../content/catalog.mjs');
 const html=await readFile('dist/technology/index.html','utf8');
 const dry=html.indexOf('id="dry-separation"'),wash=html.indexOf('id="hot-washing"'),granulation=html.indexOf('id="granulation"');
 assert.ok(dry>=0&&wash>dry&&granulation>wash);
 assert.equal(washingConfigurations.length,2);
 for(const option of washingConfigurations){assert.ok(html.includes(`data-washing-configuration="${option.id}"`));assert.ok(html.includes(option.text));}
 assert.ok(html.includes('Гранулятор входит в комплектацию линии горячей мойки'));
 assert.ok(html.includes('линию мойки изготовим без гранулятора'));
 assert.ok(html.includes('Завершающий этап в составе линии мойки'));
 assert.ok(!lines.some(line=>/гранул/iu.test(line.title)));
 assert.ok(!/href="[^"]*\/catalog\/lines\/[^\"]*granul/.test(html));
 assert.ok(!html.includes(`href="${basePath}/catalog/lines/moyka-plenki"`));
 const home=await readFile('dist/index.html','utf8');assert.ok(!home.includes('technology-lines.css'));assert.ok(!home.includes('data-technology-line'));
});
