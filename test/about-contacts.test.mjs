import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {aboutUsContent} from '../content/about-us.mjs';
import {siteContacts,projectRequest,contactChannels,productionSite} from '../content/contact.mjs';
import {aboutUsPage} from '../scripts/about-us.mjs';
import {contactPage,requestForm} from '../scripts/contact.mjs';
import {videoChannels,messengerChannels,confirmedChannelUrl} from '../scripts/contact-channels.mjs';
import {mapCapabilities,productionMap} from '../scripts/contact-maps.mjs';
import {primaryLinks,navigationGroups} from '../content/navigation.mjs';
import {render,routes,basePath,previewMode} from '../scripts/build.mjs';
import {canonicalOrigin} from '../scripts/deploy-target.mjs';

test('Компактная команда сохраняет три исходных портрета и весь HTML остальных разделов',async()=>{
 const original=JSON.parse(await readFile('test/fixtures/about-team-preserved.json','utf8'));
 const html=aboutUsPage(),team=html.match(/<section[^>]*id="team"[\s\S]*?<\/section>/)[0];
 const outside=html.replace(team,'<section id="team"></section>');
 assert.equal(createHash('sha256').update(outside).digest('hex'),original.aboutOutsideTeam);
 assert.deepEqual([...team.matchAll(/<img[^>]+>/g)].map(m=>m[0].replace(/ sizes="[^"]*"/,'')),original.portraits);
 const sizes='(max-width: 479px) 76px, (max-width: 767px) 100px, (max-width: 1199px) 128px, clamp(100px, 8.3vw, 128px)';
 assert.equal((team.match(new RegExp('sizes="'+sizes.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'"','g'))||[]).length,3);
});

test('О нас разделяет опыт команды, производственную базу и подтверждённые проекты',async()=>{
 assert.equal(aboutUsContent.team.length,3);
 assert.deepEqual(aboutUsContent.team.map(member=>member.id),['engineering','development','coordination']);
 for(const member of aboutUsContent.team){assert.equal(member.name,null);assert.ok(member.photo.startsWith('about/team/'));assert.equal(member.roleApproved,true);assert.equal(member.profileApproved,true);}
 assert.deepEqual(aboutUsContent.team.map(m=>m.publicLabel),['Инженерно-технологическое направление','Коммерческое развитие и партнерство','Производственная интеграция']);
 const html=aboutUsPage();
 assert.equal((html.match(/<section\b/g)||[]).length,8);assert.equal((html.match(/<h1>/g)||[]).length,1);
 const ids=[...html.matchAll(/<section[^>]*id="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(ids,['about-us-intro','experience','production-base','projects','engineering','team','working-together','about-us-contact']);
 const hero=html.slice(0,html.indexOf('id="experience"'));
 for(const fact of ['20+ лет','2019','2021'])assert.ok(hero.includes(fact));
 assert.doesNotMatch(hero,/BEIER|1998|150\+|500\+|55 000|Познакомиться с командой/);
 assert.ok(hero.includes('href="#projects"'));assert.ok(hero.includes('href="/contacts#project-form"'));
 assert.doesNotMatch(html,/Фотография будет добавлена|Имя и фамилия|Предварительное название роли/);
 assert.equal((html.match(/data-team-member=/g)||[]).length,3);
 assert.equal((html.match(/data-profile-state="ready"/g)||[]).length,3);
 for(const member of aboutUsContent.team)assert.ok(html.includes(`<h3>${member.publicLabel}</h3>`));
 assert.ok(!html.includes('class="au-team-role"'));
 const team=html.match(/<section[^>]*id="team"[\s\S]*?<\/section>/)[0];
 assert.ok(team.includes('Ключевые специалисты проекта'));assert.equal((team.match(/<img /g)||[]).length,3);
 assert.equal((html.match(/class="au-projects-grid"/g)||[]).length,1);
 for(const id of ['venray','chelyabinsk'])assert.equal((html.match(new RegExp(`id="project-${id}"`,'g'))||[]).length,1);
 assert.equal((html.match(/data-media-group="venray"/g)||[]).length,3);
 assert.equal((html.match(/data-media-group="chelyabinsk"/g)||[]).length,1);
 assert.ok(html.includes('class="au-gallery au-project-gallery au-project-venray"'));assert.ok(!html.includes('au-project-thumbnails'));
 const venray=html.match(/<article[^>]*id="project-venray"[\s\S]*?<\/article>/)[0];
 assert.ok(venray.lastIndexOf('data-media-group="venray"')<venray.indexOf('class="au-project-copy"'));
 assert.doesNotMatch(html,/au-project-layout|au-project-reverse/);
 assert.ok(html.includes('Евростек')&&html.includes('Германию'));
 assert.ok(html.includes('55 000 м²')&&html.includes('Начало 2020-х'));
 assert.doesNotMatch(html,/120.?000|160.?000|<iframe/);
 const cases=aboutUsContent.projects.cases;assert.equal(cases.length,2);
 assert.equal(cases[0].city,'Венрай (Venray)');assert.equal(cases[0].gallery.length,3);
 assert.equal(cases[1].city,'Челябинск');assert.equal(cases[1].gallery.length,1);
 assert.ok(cases[1].gallery[0].file.includes('chelyabinsk-2021'));
 assert.ok(cases[1].status.includes('ноябрь 2026'));
 assert.ok(!cases[1].gallery.some(image=>image.file.includes('netherlands')));
 assert.equal(aboutUsContent.engineering.length,4);assert.equal(aboutUsContent.steps.length,5);
 for(const image of [aboutUsContent.hero,...aboutUsContent.productionBase.gallery,...cases.flatMap(project=>project.gallery),...aboutUsContent.engineering.map(stage=>stage.image)]){
  await stat('public/assets/'+image.file);await stat('public/assets/'+image.smallFile);
 }
 for(const brand of ['telegram','max','whatsapp'])await stat('public/assets/brands/'+brand+'.svg');
 assert.equal(contactChannels.youtube,'https://www.youtube.com/@RASVET-LLC');
 assert.equal(contactChannels.telegram,'https://t.me/Eduyard13');
 assert.equal(contactChannels.max,'https://max.ru/u/f9LHodD0cOLJG4FZs3gHL3lpPmwQ0qEBZoRlKgEs72lHGd9FC0S8W-9NfpA');
 assert.equal(contactChannels.whatsapp,'https://wa.me/79032813535');assert.equal(contactChannels.vkVideo,null);
 assert.equal(productionSite.country,'Китай');
 assert.equal(productionSite.city,'Чжанцзяган');
 assert.equal(productionSite.address,aboutUsContent.productionBase.address);
 assert.equal(productionSite.manufacturer,aboutUsContent.productionBase.manufacturer);
 assert.equal(productionSite.location.coordinateSystem,'WGS-84');
 assert.ok(Number.isFinite(productionSite.location.lat)&&Number.isFinite(productionSite.location.lon));
 for(const map of productionSite.maps){assert.equal(map.siteId,productionSite.id);assert.equal(map.markerVerified,true);assert.equal(map.embedReproduced,true);}
});
test('Готовность портрета требует согласования и локального файла, но не имени',()=>{
 const data=structuredClone(aboutUsContent);
 const teamHtml=()=>aboutUsPage(data).match(/<section[^>]*id="team"[\s\S]*?<\/section>/)[0];
 const count=(html,state)=>(html.match(new RegExp(`data-profile-state="${state}"`,'g'))||[]).length;
 const first=data.team[0];let html=teamHtml();assert.equal(count(html,'ready'),3);
 first.name='Иван <script> & "ЭРА"';first.alt='Портрет "имя"';
 html=teamHtml();assert.ok(!html.includes('Иван'));assert.ok(html.includes('alt="Портрет &quot;имя&quot;"'));
 first.name='   ';html=teamHtml();assert.equal(count(html,'ready'),3);
 first.roleApproved=false;html=teamHtml();assert.equal(count(html,'ready'),2);assert.equal(count(html,'pending'),1);
 first.roleApproved=true;first.profileApproved=false;html=teamHtml();assert.equal(count(html,'ready'),2);assert.equal(count(html,'pending'),1);
 first.profileApproved=true;
 for(const value of [null,'../private.png','/../private.png','photos/not-a-provided-portrait.webp','https://example.org/portrait.png','about/team/x.webp" onerror="alert(1)']){
  first.photo=value;html=teamHtml();assert.equal(count(html,'ready'),2);assert.equal(count(html,'pending'),1);if(value)assert.ok(!html.includes(value));
 }
 first.photo=aboutUsContent.team[0].photo;first.publicLabel='   ';html=teamHtml();assert.equal(count(html,'ready'),2);
 first.publicLabel='<img src=x onerror=alert(1)>';html=teamHtml();assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img src=x'));
 data.team[1].roleApproved=false;data.team[2].photo=null;html=teamHtml();assert.equal(count(html,'ready'),1);assert.equal(count(html,'pending'),2);
 data.showTeam=false;html=teamHtml();assert.ok(!html.includes('data-team-member'));assert.ok(html.includes('командная работа.'));
 data.productionBase.tourUrl='javascript:alert(1)';data.hero.title='<script>alert("x")</script>';
 html=aboutUsPage(data);assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('&lt;script&gt;'));
});
test('Официальные источники и происхождение всех фото опубликованной страницы сохранены',async()=>{
 const {createHash}=await import('node:crypto');
 const registry=JSON.parse(await readFile('docs/about-us-assets.json','utf8'));
 const all=[aboutUsContent.hero,...aboutUsContent.productionBase.gallery,...aboutUsContent.projects.cases.flatMap(project=>project.gallery),...aboutUsContent.engineering.map(stage=>stage.image),...aboutUsContent.team.map(member=>({file:member.photo}))];
 assert.deepEqual(new Set(registry.images.map(image=>image.file)),new Set(all.map(image=>image.file)));
 for(const image of registry.images){
  assert.ok(image.source&&image.permission&&image.caption&&image.alt);
  assert.equal(createHash('sha256').update(await readFile('public/assets/'+image.file)).digest('hex'),image.sha256);
  if(image.small)assert.equal(createHash('sha256').update(await readFile('public/assets/'+image.small.file)).digest('hex'),image.small.sha256);
 }
 const photo=registry.images.find(image=>image.file.includes('chelyabinsk-2021'));
 assert.ok(photo.locationConfirmedByOwner);assert.ok(photo.processing.includes('освещения'));
 assert.equal(registry.externalPhotosPublished,false);
 const html=aboutUsPage();
 const production=html.match(/<section[^>]*id="production-base"[\s\S]*?<\/section>/)[0];
 const external=[...production.matchAll(/<a[^>]*href="(https:[^"]+)"[^>]*>/g)];
 assert.equal(external.length,1);assert.equal(external[0][1],'https://en.beierpm.com/vr/');
 assert.ok(production.includes('target="_blank" rel="noopener noreferrer"'));
 assert.ok(production.includes(aboutUsContent.productionBase.address));
 const manifest=JSON.parse(await readFile('docs/about-us-portrait-manifest.json','utf8'));
 for(const entry of manifest){
  const member=aboutUsContent.team.find(m=>m.id===entry.id);assert.equal(member.name,null);assert.equal(member.publicLabel,entry.label);
  assert.equal(member.photo,'about/team/'+entry.web[0].file.split('/').at(-1));assert.equal(member.photoWidth,entry.web[0].width);assert.equal(member.photoHeight,entry.web[0].height);
  for(const asset of entry.web){assert.equal(createHash('sha256').update(await readFile(asset.destination)).digest('hex'),asset.sha256);assert.ok(html.includes(asset.destination.replace('public','')));}
 }
 assert.equal(registry.images.filter(i=>i.category==='owner-provided-portrait').length,3);

});
test('Оба видеоканала видны без подставных URL; заполненный URL активирует только свой канал',()=>{
 const pending=videoChannels({channels:{}});assert.ok(pending.includes('YouTube')&&pending.includes('VK Видео'));assert.ok(!pending.includes('<a '));
 assert.equal((pending.match(/aria-disabled="true"/g)||[]).length,2);assert.ok(!messengerChannels({channels:{}}).includes('<a '));
 assert.equal((pending.match(/Канал подключается<\/span>/g)||[]).length,2);assert.ok(!pending.includes('Ссылка будет добавлена'));
 const both={youtube:contactChannels.youtube,vkVideo:'https://vkvideo.ru/@test-fixture'};
 for(const compact of [false,true]){const active=videoChannels({compact,channels:both});assert.equal((active.match(/<a /g)||[]).length,2);assert.ok(active.includes('href="https://vkvideo.ru/@test-fixture"'));assert.ok(!active.includes('is-pending')&&!active.includes('Канал подключается'));}
 for(const compact of [false,true]){const current=videoChannels({compact});assert.equal((current.match(/<a /g)||[]).length,1);assert.equal((current.match(/aria-disabled="true"/g)||[]).length,1);assert.ok(current.includes('Канал подключается'));assert.ok(!current.includes('href="#"')&&!current.includes('Ссылка будет добавлена'));}
 const ready=videoChannels({channels:{youtube:'https://www.youtube.com/@owner-supplied'}});
 assert.equal((ready.match(/<a /g)||[]).length,1);assert.ok(ready.includes('rel="noopener noreferrer"'));
 for(const value of [null,'','javascript:alert(1)','http://insecure.invalid','https://name:secret@example.org'])assert.equal(confirmedChannelUrl(value),null);
});
test('Навигация сохраняет пять разделов, документацию и добавляет О нас без реквизитов',()=>{
 assert.deepEqual(primaryLinks.map(link=>link.label),['О проекте','Технология','Оборудование','Экономика','КАИР']);
 const links=navigationGroups.flatMap(group=>group.links);
 for(const path of ['/about-us','/contacts','/documents','/media'])assert.ok(links.some(link=>link.href===path),path);
 assert.ok(!links.some(link=>link.href==='/company-details'||link.label==='Реквизиты'));
 const contacts=navigationGroups.find(group=>group.links.some(link=>link.href==='/contacts'));
 assert.deepEqual(contacts.links.map(link=>link.href),['/about-us','/contacts']);
 assert.ok(!navigationGroups[0].links.some(link=>link.href==='/about-us'));
 assert.deepEqual(navigationGroups.map(group=>group.label),['Проект','Технология','Оборудование','Материалы','Команда и контакты']);
 assert.deepEqual(navigationGroups.map(group=>group.links.map(link=>[link.label,link.href])),[[['О проекте','/'],['Экономика переработки','/economics']],[['Технология переработки','/technology'],['Управление КАИР','/automation']],[['Весь каталог','/catalog'],['Линии и комплексы','/catalog/lines'],['Отдельные узлы','/catalog/equipment']],[['Фото и видео','/media'],['Техническая документация','/documents']],[['О нас','/about-us'],['Контакты','/contacts']]]);
 for(const path of ['/news','/blog']){assert.ok(!links.some(link=>link.href===path));assert.ok(routes.includes(path));}
});
test('Контакты используют единственную прежнюю форму и реальные контакты',()=>{
 const html=contactPage({basePath});assert.equal((html.match(/data-request-form(?=[\s>])/g)||[]).length,1);
 assert.ok(html.includes(requestForm({prefix:'contact',basePath,compactOptional:true})));
 assert.ok(html.includes(siteContacts.phoneHref)&&html.includes(siteContacts.email));
 assert.equal(html.includes(projectRequest.endpoint),!previewMode);assert.equal((html.match(/<iframe\b/g)||[]).length,1);
 assert.ok(html.includes('Открыть в Яндекс Картах'));
 assert.ok(!html.includes('data-map-load')&&!html.includes('Показать карту'));
 for(const [,href] of html.matchAll(/<a[^>]*href="([^"]+)"/g))if(href.startsWith('https:'))assert.ok(!/(^|\.)(beierpm|beierrecycling|beiermachinery)\.com$/.test(new URL(href).hostname));
 assert.ok(html.includes('href="/about-us#production-base"'));
 const photo=html.match(/<img[^>]*src="[^"]*beier-zhangjiagang-factory.webp"[^>]*>/)[0];assert.equal((photo.match(/\bsizes=/g)||[]).length,1);
 assert.ok(html.includes('data-map-select="google"'));
 for(const id of ['contacts-intro','direct-contact','project-form','production-site','contact-task','official-videos','contacts-next'])assert.ok(html.includes(`id="${id}"`));
 assert.ok(html.includes('От вашей задачи — к нашему решению.'));
 assert.ok(html.includes('BEIER Machinery · Китай'));
 assert.equal((html.match(/<h1>/g)||[]).length,1);assert.equal((html.match(/class="cp-video-channel/g)||[]).length,3); // grid plus both channels
});
test('Новые маршруты, безопасные старые URL и стили учитывают BASE_PATH',()=>{
 for(const path of ['/about-us','/contacts','/company-details'])assert.ok(routes.includes(path));
 for(const [path,target] of [['/company-details','/contacts'],['/about','/']]){
  const html=render(path);assert.ok(html.includes(`content="0; url=${basePath}${target}"`));assert.ok(html.includes(`href="${basePath}${target}"`));
  assert.equal(html.match(/<link rel="canonical" href="([^"]+)">/)?.[1],canonicalOrigin+target.replace(/\/$/,'')+'/');
 }
 for(const [path,style] of [['/about-us','about-us.css'],['/contacts','contact-premium.css']]){
  const html=render(path);assert.ok(html.includes(`href="${basePath}/${style}?v=`));assert.match(html,/<meta name="description"/);assert.equal((html.match(/<h1>/g)||[]).length,1);
 }
 const documents=render('/documents');assert.ok(!documents.includes('/about-us.css?')&&!documents.includes('/contact-premium.css?'));
});
test('Быстрая связь одна на страницу, изолирована от галереи и использует общую заявку',async()=>{
 for(const path of new Set(routes.filter(route=>!['/about','/ai','/company-details'].includes(route)))){
  const html=render(path);assert.equal((html.match(/id="quick-contact"/g)||[]).length,1,path);
  assert.equal((html.match(/id="quick-contact-panel"/g)||[]).length,1,path);
  assert.ok(html.includes('aria-controls="quick-contact-panel"'));assert.ok(html.includes(`href="${basePath}/contacts#project-form" data-project-request`));
  const panel=html.match(/<aside class="quick-contact"[\s\S]*?<\/aside>/)[0];assert.ok(!panel.includes('YouTube')&&!panel.includes('VK Видео'));
  for(const key of ['telegram','max','whatsapp'])assert.ok(panel.includes(`data-channel="${key}"`));
  assert.ok(panel.includes('href="https://t.me/Eduyard13"'));
  assert.equal((panel.match(/class="contact-messenger is-pending"/g)||[]).length,0);
  assert.equal((panel.match(/class="contact-messenger is-available"/g)||[]).length,3);
  assert.ok(!panel.includes('href="#"'));assert.equal(html.includes('data-request-preview'),previewMode);
 }
});

test('Карты проверяют pin, HTTPS, hostname и src независимо от внешней ссылки',()=>{
 const fixture={provider:'google',url:'https://www.google.com/maps?cid=14308622914688450133',embedUrl:'https://www.google.com/maps/embed?pb=official-fixture',embedReproduced:true,markerVerified:false,lat:null,lon:null};
 let state=mapCapabilities(fixture,productionSite);
 assert.equal(state.hasVerifiedMarker,false);assert.equal(state.hasExternalLink,true);assert.equal(state.hasEmbed,true);
 state=mapCapabilities({...fixture,embedUrl:null},productionSite);assert.equal(state.hasEmbed,false);assert.equal(state.hasExternalLink,true);
 for(const bad of ['http://www.google.com/maps/embed','https://evil.invalid/maps/embed','https://www.google.com.evil.invalid/maps/embed','https://name:secret@www.google.com/maps/embed','https://www.google.com/maps/place/fake'])assert.equal(mapCapabilities({...fixture,embedUrl:bad},productionSite).hasEmbed,false,bad);
 assert.equal(mapCapabilities({...fixture,embedReproduced:false},productionSite).hasEmbed,false);
 assert.equal(mapCapabilities({...fixture,provider:'<script>'},productionSite).provider,null);
 for(const url of ['javascript:alert(1)','https://www.beierrecycling.com/contact-us/'])assert.equal(mapCapabilities({...fixture,url},productionSite).hasExternalLink,false);
 const yandex={provider:'yandex',url:'https://yandex.com/maps/?pt=120,32',embedUrl:'https://yandex.com/map-widget/v1/?pt=120,32',embedReproduced:true,markerVerified:false,lat:32,lon:120,coordinateSystem:'WGS-84'};
 state=mapCapabilities(yandex,productionSite);assert.equal(state.hasEmbed,false);assert.equal(state.hasVerifiedMarker,false);assert.equal(state.hasExternalLink,false);
 state=mapCapabilities({...yandex,markerVerified:true},productionSite);assert.equal(state.hasVerifiedMarker,true);assert.equal(state.hasEmbed,true);
 for(const bad of ['https://yandex.com/map-widget/v1/?text=fixture','https://yandex.com/map-widget/v1/?pt=121,33','https://evil.invalid/map-widget/v1/?pt=120,32','http://yandex.com/map-widget/v1/?pt=120,32','https://name:secret@yandex.com/map-widget/v1/?pt=120,32'])assert.equal(mapCapabilities({...yandex,markerVerified:true,embedUrl:bad},productionSite).hasEmbed,false,bad);
 assert.equal(mapCapabilities({...yandex,markerVerified:true,lat:200},productionSite).hasVerifiedMarker,false);
 const html=productionMap({...productionSite,maps:[{...fixture,label:'Google <script> " &'}]});
 assert.ok(html.includes('&lt;script&gt; &quot; &amp;'));assert.equal((html.match(/<iframe\b/g)||[]).length,1);
 assert.ok(html.includes('data-map-switch hidden'));assert.ok(!html.includes('data-map-load'));
});

test('Локальные фото BEIER и фирменный VK Видео имеют проверяемое происхождение',async()=>{
 const {createHash}=await import('node:crypto');
 const registry=JSON.parse(await readFile('docs/contacts-assets.json','utf8'));
 for(const asset of registry.assets){
  const bytes=await readFile('public/assets/'+asset.file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  assert.ok(asset.sourceUrl&&asset.sourcePage&&asset.checkedAt&&asset.processing);
 }
 assert.equal(registry.assets.find(asset=>asset.file===productionSite.image.file).ownerPermissionConfirmed,true);
 assert.equal(productionSite.image.width,1920);assert.equal(productionSite.image.height,714);
 const svg=await readFile('public/assets/brands/vk-video.svg','utf8');
 assert.ok(svg.includes('viewBox="0 0 72 72"')&&svg.includes('#0077FF')&&svg.includes('#FF2B42'));
 assert.doesNotMatch(svg,/<script|foreignObject|on\w+=|(?:href|src)=/i);
 for(const compact of [false,true])assert.ok(videoChannels({compact}).includes('/assets/brands/vk-video.svg'));
 const source=await readFile('scripts/contact-channels.mjs','utf8');assert.ok(!source.includes('vkChannelMark')&&!source.includes('Simple Icons'));
});

test('Раскрывающиеся поля включены только на Контактах; протокол и обязательность формы сохранены',()=>{
 const normal=requestForm({basePath}),compact=requestForm({basePath,compactOptional:true});
 assert.ok(!normal.includes('<details'));assert.ok(compact.includes('<details class="cp-optional"'));
 const inputs=html=>[...html.matchAll(/<(?:input|textarea)\b[^>]*>/g)].map(match=>match[0]).sort();
 assert.deepEqual(inputs(normal),inputs(compact));
 assert.ok(compact.includes('enctype="multipart/form-data"')&&compact.includes('method="post"')&&compact.includes('data-max-bytes="5000000"'));
 for(const name of ['Имя','email','Задача'])assert.match(compact,new RegExp('(?:input|textarea)[^>]*name="'+name+'"[^>]*required'));
 for(const path of ['/about-us','/technology','/economics','/catalog'])assert.ok(!render(path).includes('data-contact-optional')&&!render(path).includes('/contact-maps.js?'));
 assert.ok(render('/contacts').includes(`src="${basePath}/contact-maps.js?v=`));
 assert.ok(render('/contacts').includes(`srcset="${basePath}/assets/contacts/beier-zhangjiagang-factory-768.webp 768w, ${basePath}/assets/contacts/beier-zhangjiagang-factory.webp 1920w"`));
});
