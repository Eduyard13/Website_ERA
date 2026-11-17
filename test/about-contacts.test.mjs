import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {aboutUsContent} from '../content/about-us.mjs';
import {siteContacts,projectRequest,contactChannels,productionSite} from '../content/contact.mjs';
import {aboutUsPage} from '../scripts/about-us.mjs';
import {contactPage,requestForm} from '../scripts/contact.mjs';
import {videoChannels,messengerChannels,confirmedChannelUrl} from '../scripts/contact-channels.mjs';
import {primaryLinks,navigationGroups} from '../content/navigation.mjs';
import {render,routes,basePath,previewMode} from '../scripts/build.mjs';

test('О нас разделяет опыт команды, производственную базу и подтверждённые проекты',async()=>{
 assert.equal(aboutUsContent.team.length,3);
 assert.deepEqual(aboutUsContent.team.map(member=>member.id),['engineering','development','coordination']);
 for(const member of aboutUsContent.team){assert.equal(member.name,null);assert.equal(member.photo,null);assert.equal(member.roleApproved,false);}
 const html=aboutUsPage();
 assert.equal((html.match(/<section\b/g)||[]).length,8);assert.equal((html.match(/<h1>/g)||[]).length,1);
 const ids=[...html.matchAll(/<section[^>]*id="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(ids,['about-us-intro','experience','production-base','projects','engineering','team','working-together','about-us-contact']);
 const hero=html.slice(0,html.indexOf('id="experience"'));
 for(const fact of ['20+ лет','2019','2021'])assert.ok(hero.includes(fact));
 assert.doesNotMatch(hero,/BEIER|1998|150\+|500\+|55 000|Познакомиться с командой/);
 assert.ok(hero.includes('href="#projects"'));assert.ok(hero.includes('href="/contacts#project-form"'));
 assert.doesNotMatch(html,/Фотография будет добавлена|Имя и фамилия|Предварительное название роли|data-team-member/);
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
 for(const key of ['city','address','lat','lon','mapUrl','mapEmbedUrl'])assert.equal(productionSite[key],null);
});
test('Персональная сетка открывается только после согласования всех трёх профилей; данные экранируются',()=>{
 const data=structuredClone(aboutUsContent);
 Object.assign(data.team[0],{name:'Иван <script> & "ЭРА"',photo:'photos/predvaritelnyy-izmelchitel/02.webp',alt:'Портрет "имя"',roleApproved:true});
 assert.ok(!aboutUsPage(data).includes('data-team-member'));
 for(const member of data.team){member.name||='Тестовый сотрудник';member.photo||='photos/predvaritelnyy-izmelchitel/02.webp';member.roleApproved=true;}
 let html=aboutUsPage(data);assert.equal((html.match(/data-team-member=/g)||[]).length,3);
 assert.ok(html.includes('Иван &lt;script&gt; &amp; &quot;ЭРА&quot;'));assert.ok(!html.includes('Иван <script>'));
 data.team[1].roleApproved=false;assert.ok(!aboutUsPage(data).includes('data-team-member'));
 data.team[1].roleApproved=true;data.showTeam=false;assert.ok(!aboutUsPage(data).includes('data-team-member'));
 data.showTeam=true;data.team[0].photo='../private.png';assert.ok(!aboutUsPage(data).includes('data-team-member'));
 data.productionBase.tourUrl='javascript:alert(1)';data.hero.title='<script>alert("x")</script>';
 html=aboutUsPage(data);assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('<script>alert'));
 assert.ok(html.includes('&lt;script&gt;'));
});
test('Официальные источники и происхождение всех фото опубликованной страницы сохранены',async()=>{
 const {createHash}=await import('node:crypto');
 const registry=JSON.parse(await readFile('docs/about-us-assets.json','utf8'));
 const all=[aboutUsContent.hero,...aboutUsContent.productionBase.gallery,...aboutUsContent.projects.cases.flatMap(project=>project.gallery),...aboutUsContent.engineering.map(stage=>stage.image)];
 assert.deepEqual(new Set(registry.images.map(image=>image.file)),new Set(all.map(image=>image.file)));
 for(const image of registry.images){
  assert.ok(image.source&&image.permission&&image.caption&&image.alt);
  assert.equal(createHash('sha256').update(await readFile('public/assets/'+image.file)).digest('hex'),image.sha256);
 }
 const photo=registry.images.find(image=>image.file.includes('chelyabinsk-2021'));
 assert.ok(photo.locationConfirmedByOwner);assert.ok(photo.processing.includes('освещения'));
 assert.equal(registry.externalPhotosPublished,false);
 const html=aboutUsPage();
 for(const url of ['https://en.beierpm.com/about/','https://en.beierpm.com/contact/','https://en.beierpm.com/vr/']){
  assert.ok(html.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
 }
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
 assert.ok(html.includes(requestForm({prefix:'contact',basePath})));
 assert.ok(html.includes(siteContacts.phoneHref)&&html.includes(siteContacts.email));
 assert.ok(html.includes(projectRequest.endpoint));assert.ok(!html.includes('<iframe'));
 assert.match(html,/<button[^>]*class="cp-map-button"[^>]*disabled>/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);assert.equal((html.match(/class="cp-video-channel/g)||[]).length,3); // grid plus both channels
});
test('Новые маршруты, безопасные старые URL и стили учитывают BASE_PATH',()=>{
 for(const path of ['/about-us','/contacts','/company-details'])assert.ok(routes.includes(path));
 for(const [path,target] of [['/company-details','/contacts'],['/about','/']]){
  const html=render(path);assert.ok(html.includes(`content="0; url=${basePath}${target}"`));assert.ok(html.includes(`rel="canonical" href="${basePath}${target}"`));assert.ok(html.includes(`href="${basePath}${target}"`));
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
  assert.ok(!panel.includes('href="#"'));assert.equal(html.includes('/preview-only.js?v='),previewMode);
 }
 const preview=await readFile('public/preview-only.js','utf8');assert.ok(preview.includes('Предпросмотр: заявка не отправлена'));
});
