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
 assert.match(html,/это не замер/);
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
test('Фото распределены по 11 узлам, а каталог сохраняет прежние иллюстрации',async()=>{
 const {nodes,media}=await import('../content/catalog.mjs');
 const {customerPhotos}=await import('../content/customer-photos.mjs');
 assert.equal(customerPhotos.length,65);
 assert.equal(new Set(customerPhotos.map(m=>m.slug)).size,11);
 assert.equal(new Set(customerPhotos.map(m=>m.id)).size,65);
 const catalogue=await readFile('dist/catalog/equipment/index.html','utf8');
 for(const n of nodes){
  assert.ok(catalogue.includes(`${basePath}/assets/${n.cardImage}.webp`),n.slug);
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
test('Краткие параметры содержат мощность по КП, а схемы имеют свои легенды',async()=>{
 const {nodes}=await import('../content/catalog.mjs');
 const missing=nodes.filter(n=>n.quickSpecs.some(s=>s.missing)).map(n=>n.slug).sort();
 assert.deepEqual(missing,['ballisticheskiy-separator','predvaritelnyy-raspushitel','rama-napolnitel']);
 for(const n of nodes){
  assert.equal(n.quickSpecs.length,6,n.slug);
  assert.ok(n.quickSpecs.some(s=>s.power&&!s.missing),n.slug);
  for(const s of n.quickSpecs.filter(s=>!s.missing))assert.ok(n.specs.some(([label,value])=>label===s.label&&value===s.value),n.slug);
  const html=await readFile('dist'+n.path+'/index.html','utf8');
  assert.ok(html.includes('class="quick-spec-panel"'),n.slug);
  assert.ok(html.includes('class="scheme-reading"'),n.slug);
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
  assert.equal(n.documents.length,1);const d=n.documents[0];
  assert.ok(html.includes(`${basePath}/documents/${d.file}`));
  const pdf=await readFile('dist/documents/'+d.file);
  assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.equal(pdf.length,d.bytes);
  assert.equal(createHash('sha256').update(pdf).digest('hex'),d.sha256);
  await stat('dist/assets/'+n.cardImage+'.webp');await stat('dist/assets/'+n.scheme);
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
 assert.ok(!get('predvaritelnyy-raspushitel').specs.some(([k])=>k.includes('Расчётная потребляемая')));
 assert.equal(get('rama-napolnitel').documents[0].type,'Паспорт и коммерческое описание');
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
test('Опубликованный ролик сохранён полностью и готов к последовательному воспроизведению',async()=>{
 const {equipmentVideos}=await import('../content/equipment-videos.mjs');
 const {createHash}=await import('node:crypto');
 const films=equipmentVideos.filter(v=>v.ready);
 assert.ok(films.some(v=>v.slug==='predvaritelnyy-izmelchitel'));
 for(const film of films){
  const data=await readFile('dist/assets/'+film.file);
  assert.equal(data.length,film.bytes);
  assert.equal(createHash('sha256').update(data).digest('hex'),film.sourceSha256);
  assert.equal(film.sha256,film.sourceSha256);
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
