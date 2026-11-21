import {siteContacts,projectRequest,productionSite} from '../content/contact.mjs';
import {productionMap} from './contact-maps.mjs';
import {videoChannels,messengerChannels,contactIcon} from './contact-channels.mjs';
import {previewMode,productionOrigin} from './deploy-target.mjs';
import attachmentTypes from '../server/regru/private/attachment-types.json' with {type:'json'};
import {requestConsent} from './legal.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<span aria-hidden="true">↗</span>';
export const projectRequestHref=(topic='')=>'/contacts'+(topic?'?topic='+encodeURIComponent(topic):'')+'#project-form';

// Migrate the existing subject-bearing request links in one place, keeping plain
// email addresses as direct mail links. Every enhanced link retains a real page.
export function enhanceProjectRequests(html,sourcePath){
 const recipient=siteContacts.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 html=html.replace(new RegExp(`href="mailto:${recipient}\\?subject=([^"]*)"`,'g'),(_,encoded)=>{
  let topic;try{topic=decodeURIComponent(encoded);}catch{topic=encoded;}
  return `href="${escape(projectRequestHref(topic))}"`;
 });
 html=html.replaceAll('href="#discuss"',`href="${projectRequestHref()}"`);
 return html.replace(/<a\b([^>]*\bhref="\/contacts(?:\?topic=[^"]*)?#project-form"[^>]*)>/g,(_,attributes)=>{
  if(sourcePath&&attributes.includes('/contacts?topic=')){
   attributes=attributes.replace('#project-form"',`&amp;source=${encodeURIComponent(sourcePath)}#project-form"`);
  }
  return `<a${attributes}${attributes.includes('data-project-request')?'':' data-project-request'}>`;
 });
}

const attachmentAccept=Object.keys(attachmentTypes).map(extension=>'.'+extension).join(',');
export function requestForm({prefix='request',compactOptional=false}={}){
 const topic=`<label class="request-topic" for="${prefix}-topic">Что вас интересует <small>необязательно</small><input id="${prefix}-topic" name="Интересует" maxlength="200" data-request-topic placeholder="Линия, отдельный узел или проект целиком"></label>`;
 const links=`<label for="${prefix}-links">Ссылки на сайт и материалы <small>необязательно</small><textarea id="${prefix}-links" name="Ссылки" rows="2" maxlength="4000" placeholder="Сайт вашей компании, видео, фотографии в облаке или другие полезные источники — по одной ссылке в строке."></textarea></label>`;
 return `<form class="project-request-form" id="${prefix}-form" data-request-form data-max-bytes="${projectRequest.maxAttachmentBytes}" data-max-files="${projectRequest.maxFiles}" ${previewMode?'data-request-preview':`action="${projectRequest.endpoint}"`} method="post" enctype="multipart/form-data" accept-charset="UTF-8">
 <input type="hidden" name="Страница обращения" data-request-source>
 <div class="request-honeypot" aria-hidden="true"><label for="${prefix}-honey">Оставьте это поле пустым<input id="${prefix}-honey" name="_honey" type="text" tabindex="-1" autocomplete="off"></label></div>
 <div class="request-fields"><label for="${prefix}-name">Ваше имя <span aria-hidden="true">*</span><input id="${prefix}-name" name="Имя" autocomplete="name" maxlength="100" required placeholder="Как к вам обращаться"></label><label for="${prefix}-company">Компания <small>необязательно</small><input id="${prefix}-company" name="Компания" autocomplete="organization" maxlength="160" placeholder="Название компании"></label><label for="${prefix}-email">Электронная почта <span aria-hidden="true">*</span><input id="${prefix}-email" type="email" name="email" autocomplete="email" inputmode="email" maxlength="254" required placeholder="name@company.ru"></label><label for="${prefix}-phone">Телефон <small>необязательно</small><input id="${prefix}-phone" type="tel" name="Телефон" autocomplete="tel" inputmode="tel" maxlength="40" placeholder="+7 …"></label></div>
 ${compactOptional?'':topic}
 <label for="${prefix}-message">Опишите задачу <span aria-hidden="true">*</span><textarea id="${prefix}-message" name="Задача" rows="4" maxlength="6000" required placeholder="Какое сырьё хотите перерабатывать, в каком объёме и какой результат получить? Расскажите, что уже есть и что нужно подобрать."></textarea></label>
 ${compactOptional?`<details class="cp-optional" data-contact-optional><summary>Дополнительная информация</summary><div><label class="request-topic" for="${prefix}-topic">Что вас интересует <small>необязательно</small><input id="${prefix}-topic" name="Интересует" maxlength="200" data-request-topic placeholder="Линия, отдельный узел или проект целиком"></label><label for="${prefix}-links">Ссылки на сайт и материалы <small>необязательно</small><textarea id="${prefix}-links" name="Ссылки" rows="2" maxlength="4000" placeholder="Сайт вашей компании, видео, фотографии в облаке или другие полезные источники — по одной ссылке в строке."></textarea></label></div></details>`:links}
 <div class="request-upload" data-request-drop><div class="request-upload-copy"><span class="request-upload-icon" aria-hidden="true">＋</span><div><label for="${prefix}-files">Фото, видео и документы</label><p id="${prefix}-files-help">Выберите файлы или перетащите сюда. До 5 МБ суммарно; большие видео можно передать ссылкой выше.</p></div></div><input id="${prefix}-files" class="request-file-input" type="file" name="attachment[]" accept="${attachmentAccept}" multiple data-request-files aria-describedby="${prefix}-files-help ${prefix}-file-status"><button type="button" class="request-select-files" data-request-pick hidden>Выбрать файлы</button><ul class="request-file-list" data-request-file-list aria-label="Выбранные файлы"></ul><p class="request-file-status" id="${prefix}-file-status" data-request-file-status role="status" aria-live="polite"></p></div>
 ${requestConsent(prefix)}${previewMode?`<p class="request-data-note" data-preview-notice>Предпросмотр сайта. Контакты ЭРА доступны на <a href="${productionOrigin}/contacts/">era-cycle.ru</a>.</p>`:''}
 <p class="request-error" data-request-error role="alert" tabindex="-1" hidden></p><div class="request-submit-row"><button class="button request-submit" type="submit" data-request-submit${previewMode?' disabled':''}>Отправить заявку ${arrow}</button><p>Ответим по указанным контактам.<br>Заявка адресована <a href="mailto:${siteContacts.email}">${siteContacts.email}</a>.</p></div></form>`;
}

export function requestDialog({basePath=''}={}){
 return `<dialog id="project-request" class="request-dialog" aria-labelledby="request-title"><div class="request-dialog-shell"><div class="request-dialog-head"><div><p class="eyebrow">ОБСУДИМ ВАШ ПРОЕКТ</p><h2 id="request-title">От задачи — <br>к решению.</h2><p>Расскажите, что вам нужно. Приложите материалы, которые помогут разобраться в задаче.</p></div><button type="button" class="request-close" data-request-close aria-label="Закрыть форму">Закрыть <span aria-hidden="true">×</span></button></div><div class="request-dialog-content">${requestForm({basePath})}</div></div></dialog>`;
}

export function contactPage({basePath=''}={}){
 // Cover needs the panorama's vertical resolution in the desktop column.
 const photo=productionSite.image;
 return `<div class="contact-premium-page">
 <section class="cp-intro" id="contacts-intro" data-page-progress-label="Связь с ЭРА"><div class="cp-container"><p class="eyebrow">ЭРА / КОНТАКТЫ</p><h1>От вашей задачи — к нашему решению.</h1><p class="cp-lead">Инженерные консультации, подбор оборудования и реализация производственных проектов.</p><nav class="cp-anchors" aria-label="Разделы контактов"><a href="#direct-contact">Написать <span aria-hidden="true">↓</span></a><a href="#project-form">Отправить задачу <span aria-hidden="true">↓</span></a><a href="#production-site">Производственная площадка <span aria-hidden="true">↓</span></a></nav></div></section>
 <section class="cp-contact-section" id="contact-task" data-page-progress-label="Контакты и заявка"><div class="cp-container cp-contact-grid"><aside class="cp-direct" id="direct-contact"><p class="eyebrow">ПРЯМАЯ СВЯЗЬ</p><div class="cp-contact-item"><span class="cp-contact-symbol">${contactIcon('phone')}</span><div><h2>Телефон</h2><a class="cp-phone" href="${siteContacts.phoneHref}">${siteContacts.phone}</a></div></div><div class="cp-contact-item"><span class="cp-contact-symbol">${contactIcon('email')}</span><div><h2>Электронная почта</h2><a class="cp-email" href="mailto:${siteContacts.email}">${siteContacts.email}</a></div></div><div class="cp-messengers"><h2>Быстрая связь</h2>${messengerChannels({placeholders:true})}</div><div class="cp-materials"><h2>Что полезно прислать</h2><ul><li>Фото или видео сырья, вид загрязнений</li><li>Предполагаемый объём и требуемый продукт</li><li>План помещения, если есть</li><li>Техническое задание и полезные ссылки</li></ul></div></aside><div class="cp-form-card" id="project-form"><div class="cp-form-heading"><p class="eyebrow">ИНДИВИДУАЛЬНЫЙ ПОДБОР ОБОРУДОВАНИЯ</p><h2>Расскажите о вашем проекте.</h2><p>Можно приложить фотографии, видео и документы.</p></div>${requestForm({prefix:'contact',basePath,compactOptional:true})}</div></div></section>
 <section class="cp-production" id="production-site" data-page-progress-label="Производственная база"><div class="cp-container"><div class="cp-section-heading"><p class="eyebrow">ПРОИЗВОДСТВЕННАЯ БАЗА ЭРА</p><h2>BEIER Machinery · Китай</h2><p>Изготовление, сборку и испытания нашего оборудования мы осуществляем на производственных мощностях Jiangsu BEIER Machinery в Китае.</p></div><div class="cp-production-grid">${photo?`<figure class="cp-production-image"><div class="cp-production-frame"><img src="/assets/${escape(photo.file)}"${photo.smallFile?` srcset="/assets/${escape(photo.smallFile)} ${photo.smallWidth}w, /assets/${escape(photo.file)} ${photo.width}w"`:''} sizes="(max-width: 767px) calc((100vw - 34px) * 1.513), 1400px" width="${photo.width}" height="${photo.height}" alt="${escape(photo.alt)}" loading="lazy" decoding="async"></div><figcaption><span>${escape(photo.caption)}</span></figcaption></figure>`:''}<div class="cp-production-address"><p class="cp-address-company">${escape(productionSite.manufacturer)}</p><address>${escape(productionSite.address)}<span lang="en">${escape(productionSite.addressEn)}</span><span lang="zh-Hans">${escape(productionSite.addressZh)}</span></address><div class="cp-address-actions"><button type="button" data-copy-address hidden>Скопировать адрес</button></div><p class="cp-copy-status" data-copy-status role="status" aria-live="polite"></p></div>${productionMap(productionSite)}</div><a class="cp-gallery-link" href="/about-us#production-base">О производственной базе подробнее ${arrow}</a></div></section>
 <section class="cp-videos" id="official-videos" data-page-progress-label="YouTube и VK Видео"><div class="cp-container"><div class="cp-section-heading"><p class="eyebrow">СМОТРИТЕ НАШИ ВИДЕО</p><h2>Оборудование лучше всего<br>видно в работе.</h2><p>Видеопрезентации узлов, технологические процессы и результаты испытаний — в наших видеоканалах и медиатеке.</p></div>${videoChannels({premium:true})}<a class="cp-gallery-link" href="/media">Смотреть видеоматериалы на сайте ${arrow}</a></div></section>
 <section class="cp-final" id="contacts-next" data-page-progress-label="Отправить материалы"><div class="cp-container cp-final-inner"><div><h2>Есть техническое задание или образцы сырья?</h2><p>Отправьте материалы через форму — начнём с оценки задачи.</p></div><a class="button" href="#project-form">Отправить материалы <span aria-hidden="true">↑</span></a></div></section>
 </div>`;
}

export function requestSentPage(){
 const status=previewMode?`<h1>Предпросмотр заявки.</h1><p class="lead">Контакты ЭРА доступны на <a href="${productionOrigin}/contacts/">era-cycle.ru</a>.</p>`:'<h1>Спасибо за обращение.</h1><p class="lead">Почтовый сервер принял заявку к отправке. Мы свяжемся с вами по указанным контактам, чтобы обсудить задачу.</p>';
 return `<section class="section request-sent"><p class="eyebrow">СВЯЗЬ С ЭРА</p>${status}<p>Если хотите дополнить материалы, напишите на <a href="mailto:${siteContacts.email}">${siteContacts.email}</a>.</p><div class="actions"><a class="button" href="/">Вернуться к проекту ${arrow}</a><a class="button secondary" href="/catalog">Каталог оборудования ${arrow}</a></div></section>`;
}
