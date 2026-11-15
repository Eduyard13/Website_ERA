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

test('Страницы используют подтверждённые каналы и не выдумывают участников или адрес',async()=>{
 assert.equal(aboutUsContent.team.length,3);
 for(const member of aboutUsContent.team){assert.equal(member.name,null);assert.equal(member.photo,null);assert.equal(member.roleApproved,false);}
 assert.equal(contactChannels.youtube,'https://www.youtube.com/@RASVET-LLC');
 assert.equal(contactChannels.telegram,'https://t.me/Eduyard13');
 assert.equal(contactChannels.max,'https://max.ru/u/f9LHodD0cOLJG4FZs3gHL3lpPmwQ0qEBZoRlKgEs72lHGd9FC0S8W-9NfpA');
 assert.equal(contactChannels.whatsapp,'https://wa.me/79032813535');
 assert.equal(contactChannels.vkVideo,null);
 assert.equal(productionSite.country,'Китай');
 for(const key of ['city','address','lat','lon','mapUrl','mapEmbedUrl'])assert.equal(productionSite[key],null);
 const html=aboutUsPage();assert.equal((html.match(/Фотография будет добавлена/g)||[]).length,3);
 assert.equal((html.match(/<section\b/g)||[]).length,6);assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.ok(html.includes('Опыт участников команды'));assert.ok(!html.includes('ООО'));
 for(const image of [aboutUsContent.hero,...aboutUsContent.engineering.map(stage=>stage.image),productionSite.image])await stat('public/assets/'+image.file);
 for(const brand of ['telegram','max','whatsapp'])await stat('public/assets/brands/'+brand+'.svg');
});
test('Участник заполняется через данные и не превращает текст в разметку',()=>{
 const data=structuredClone(aboutUsContent);Object.assign(data.team[0],{name:'Иван <script> & "ЭРА"',photo:'photos/predvaritelnyy-izmelchitel/02.webp',alt:'Портрет "имя"',roleApproved:true});
 const html=aboutUsPage(data);assert.ok(html.includes('Иван &lt;script&gt; &amp; &quot;ЭРА&quot;'));assert.ok(!html.includes('Иван <script>'));
 assert.equal((html.match(/Фотография будет добавлена/g)||[]).length,2);assert.equal((html.match(/Предварительное название роли/g)||[]).length,2);
});
test('Оба видеоканала видны без подставных URL; заполненный URL активирует только свой канал',()=>{
 const pending=videoChannels({channels:{}});assert.ok(pending.includes('YouTube')&&pending.includes('VK Видео'));assert.ok(!pending.includes('<a '));
 assert.equal((pending.match(/aria-disabled="true"/g)||[]).length,2);assert.ok(!messengerChannels({channels:{}}).includes('<a '));
 const ready=videoChannels({channels:{youtube:'https://www.youtube.com/@owner-supplied'}});
 assert.equal((ready.match(/<a /g)||[]).length,1);assert.ok(ready.includes('rel="noopener noreferrer"'));
 for(const value of [null,'','javascript:alert(1)','http://insecure.invalid','https://name:secret@example.org'])assert.equal(confirmedChannelUrl(value),null);
});
test('Навигация сохраняет пять разделов, документацию и добавляет О нас без реквизитов',()=>{
 assert.deepEqual(primaryLinks.map(link=>link.label),['О проекте','Технология','Система управления','Экономика','Каталог']);
 const links=navigationGroups.flatMap(group=>group.links);
 for(const path of ['/about-us','/contacts','/documents','/media','/news','/blog'])assert.ok(links.some(link=>link.href===path),path);
 assert.ok(!links.some(link=>link.href==='/company-details'||link.label==='Реквизиты'));
 const contacts=navigationGroups.find(group=>group.links.some(link=>link.href==='/contacts'));
 assert.deepEqual(contacts.links.map(link=>link.href),['/about-us','/contacts']);
 assert.ok(!navigationGroups[0].links.some(link=>link.href==='/about-us'));
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
