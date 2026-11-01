import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {routes,product,basePath} from '../scripts/build.mjs';
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
 assert.equal(lines.filter(l=>l.enabled).length,3);
 assert.equal(lines.filter(l=>l.group==='Сепарация').length,3);
 assert.equal(lines.filter(l=>l.group==='Мойка').length,1);
 assert.equal(nodes.filter(n=>n.status==='source-checked').length,12);
 for(const m of media){assert.ok(routes.includes(m.product.split('#')[0]));await stat('dist/assets/'+m.file);if(m.type==='video')await stat('dist/assets/'+m.poster);}
 const html=await readFile('dist/media/index.html','utf8');
 assert.ok(html.includes(`data-image="${basePath}/assets/photos/predvaritelnyy-izmelchitel/02.webp"`));
 assert.ok(html.includes(`data-product="${basePath}${product}"`));
});
test('Фото распределены по 11 узлам, а каталог использует схемы из технических описаний',async()=>{
 const {nodes,media}=await import('../content/catalog.mjs');
 const {customerPhotos}=await import('../content/customer-photos.mjs');
 assert.equal(customerPhotos.length,65);
 assert.equal(new Set(customerPhotos.map(m=>m.slug)).size,11);
 assert.equal(new Set(customerPhotos.map(m=>m.id)).size,65);
 const catalogue=await readFile('dist/catalog/equipment/index.html','utf8');
 for(const n of nodes){
  assert.ok(catalogue.includes(`${basePath}/assets/${n.cardFile}`),n.slug);
  assert.ok(!n.cardImage.startsWith('photos/'),n.slug);
  const pictures=media.filter(m=>m.product===n.path&&m.type==='photo');
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  if(n.slug==='ochistka-stokov'){
   assert.equal(pictures.length,0);
   assert.ok(html.includes('Фотографии этого узла пока не опубликованы'));
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
  assert.ok(html.includes('href="#photos"'));
  if(n.slug!=='ochistka-stokov')assert.ok(html.includes(`data-photo-gallery data-product="${basePath}${n.path}"`));
 }
 const rotor=nodes.find(n=>n.slug==='rotornyy-raspushitel');
 assert.equal(rotor.reading.functional,true);
 assert.equal(rotor.scheme,'equipment/rotornyy-raspushitel/working-principle.svg');
 const svg=await readFile('dist/assets/'+rotor.scheme,'utf8');
 assert.match(svg,/>1<\/text>/);assert.match(svg,/>2<\/text>/);assert.match(svg,/>3<\/text>/);
});
test('Адаптивные изображения и презентационные переходы учитывают путь публикации',async()=>{
 const html=await readFile('dist/index.html','utf8');
 for(const [,candidates] of html.matchAll(/srcset="([^"]+)"/g)){
  for(const candidate of candidates.split(',')){
   const url=candidate.trim().split(/\s+/)[0];
   assert.ok(url.startsWith(basePath+'/assets/'),`Missing base in srcset: ${url}`);
   await stat('dist'+url.slice(basePath.length));
  }
 }
 assert.match(html,/Полный цикл переработки плёнки:/);
 assert.match(html,/очистить, переработать, использовать снова/);
 assert.match(html,/href="#solution"/);
 assert.match(html,/href="#discuss"/);
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
test('Навигация различает главную, текущую страницу и родительский раздел',async()=>{
 const {navigation}=await import('../scripts/navigation.mjs');
 assert.match(navigation('/'),/href="\/" aria-current="page"/);
 assert.match(navigation(product),/href="\/catalog" aria-current="location"/);
 const line=navigation('/catalog/lines/separatsiya-01');
 assert.match(line,/href="\/catalog\/lines" aria-current="location"/);
 assert.ok(!line.includes('href="/catalog" aria-current='));
 assert.match(navigation('/documents'),/class="nav-section nav-entry" data-active-section="true"/);
 assert.match(navigation('/documents'),/href="\/documents" aria-current="page"/);
 assert.ok(navigation('/technology').includes('Знакомство с ERA'));
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
