import {siteContacts,projectRequest} from '../content/contact.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<span aria-hidden="true">↗</span>';
export const projectRequestHref=(topic='')=>'/contacts'+(topic?'?topic='+encodeURIComponent(topic):'')+'#project-form';

// Migrate the existing subject-bearing request links in one place, keeping plain
// email addresses as direct mail links. Every enhanced link retains a real page.
export function enhanceProjectRequests(html){
 const recipient=siteContacts.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 html=html.replace(new RegExp(`href="mailto:${recipient}\\?subject=([^"]*)"`,'g'),(_,encoded)=>{
  let topic;try{topic=decodeURIComponent(encoded);}catch{topic=encoded;}
  return `href="${escape(projectRequestHref(topic))}"`;
 });
 html=html.replaceAll('href="#discuss"',`href="${projectRequestHref()}"`);
 return html.replace(/<a\b([^>]*\bhref="\/contacts(?:\?topic=[^"]*)?#project-form"[^>]*)>/g,(tag,attributes)=>
  attributes.includes('data-project-request')?tag:`<a${attributes} data-project-request>`);
}

export function requestForm({prefix='request',basePath=''}={}){
 const next=projectRequest.publicOrigin+basePath+'/contacts/sent/';
 return `<form class="project-request-form" id="${prefix}-form" data-request-form data-max-bytes="${projectRequest.maxAttachmentBytes}" action="${projectRequest.endpoint}" method="post" enctype="multipart/form-data" accept-charset="UTF-8">
 <input type="hidden" name="_subject" value="${projectRequest.subject}"><input type="hidden" name="_template" value="table"><input type="hidden" name="_next" value="${next}"><input type="hidden" name="Страница обращения" data-request-source><input type="hidden" name="Вложения" data-request-manifest>
 <div class="request-honeypot" aria-hidden="true"><label for="${prefix}-honey">Оставьте это поле пустым<input id="${prefix}-honey" name="_honey" type="text" tabindex="-1" autocomplete="off"></label></div>
 <div class="request-fields"><label for="${prefix}-name">Ваше имя <span aria-hidden="true">*</span><input id="${prefix}-name" name="Имя" autocomplete="name" maxlength="100" required placeholder="Как к вам обращаться"></label><label for="${prefix}-company">Компания <small>необязательно</small><input id="${prefix}-company" name="Компания" autocomplete="organization" maxlength="160" placeholder="Название компании"></label><label for="${prefix}-email">Электронная почта <span aria-hidden="true">*</span><input id="${prefix}-email" type="email" name="email" autocomplete="email" inputmode="email" maxlength="254" required placeholder="name@company.ru"></label><label for="${prefix}-phone">Телефон <small>необязательно</small><input id="${prefix}-phone" type="tel" name="Телефон" autocomplete="tel" inputmode="tel" maxlength="40" placeholder="+7 …"></label></div>
 <label class="request-topic" for="${prefix}-topic">Что вас интересует <small>необязательно</small><input id="${prefix}-topic" name="Интересует" maxlength="200" data-request-topic placeholder="Линия, отдельный узел или проект целиком"></label>
 <label for="${prefix}-message">Опишите задачу <span aria-hidden="true">*</span><textarea id="${prefix}-message" name="Задача" rows="4" maxlength="6000" required placeholder="Какое сырьё хотите перерабатывать, в каком объёме и какой результат получить? Расскажите, что уже есть и что нужно подобрать."></textarea></label>
 <label for="${prefix}-links">Ссылки на сайт и материалы <small>необязательно</small><textarea id="${prefix}-links" name="Ссылки" rows="2" maxlength="4000" placeholder="Сайт вашей компании, видео, фотографии в облаке или другие полезные источники — по одной ссылке в строке."></textarea></label>
 <div class="request-upload" data-request-drop><div class="request-upload-copy"><span class="request-upload-icon" aria-hidden="true">＋</span><div><label for="${prefix}-files">Фото, видео и документы</label><p id="${prefix}-files-help">Выберите файлы или перетащите сюда. До 5 МБ суммарно; большие видео можно передать ссылкой выше.</p></div></div><input id="${prefix}-files" class="request-file-input" type="file" name="attachment" accept="image/*,video/*,application/pdf" data-request-files aria-describedby="${prefix}-files-help ${prefix}-file-status"><button type="button" class="request-select-files" data-request-pick hidden>Выбрать файлы</button><ul class="request-file-list" data-request-file-list aria-label="Выбранные файлы"></ul><p class="request-file-status" id="${prefix}-file-status" data-request-file-status role="status" aria-live="polite"></p></div>
 <p class="request-error" data-request-error role="alert" tabindex="-1" hidden></p><div class="request-submit-row"><button class="button request-submit" type="submit" data-request-submit>Отправить заявку ${arrow}</button><p>Ответим по указанным контактам.<br>Заявка адресована <a href="mailto:${siteContacts.email}">${siteContacts.email}</a>.</p></div><p class="request-data-note">Отправляя форму, вы передаёте ЭРА свои контакты и материалы для ответа и обсуждения проекта.</p>
 <noscript><p class="request-data-note">Размер вложения — до 5 МБ. Для подборки файлов включите JavaScript или передайте их ссылкой. После отправки сервис может предложить подтверждение защиты от спама.</p></noscript></form>`;
}

export function requestDialog({basePath=''}={}){
 return `<dialog id="project-request" class="request-dialog" aria-labelledby="request-title"><div class="request-dialog-shell"><div class="request-dialog-head"><div><p class="eyebrow">ОБСУДИМ ВАШ ПРОЕКТ</p><h2 id="request-title">От задачи — <br>к решению.</h2><p>Расскажите, что вам нужно. Приложите материалы, которые помогут разобраться в задаче.</p></div><button type="button" class="request-close" data-request-close aria-label="Закрыть форму">Закрыть <span aria-hidden="true">×</span></button></div><div class="request-dialog-content">${requestForm({basePath})}</div></div></dialog>`;
}

export function contactPage({basePath=''}={}){
 return `<section class="section request-page-intro"><p class="eyebrow">СВЯЗЬ С ЭРА</p><h1>Расскажите о вашем проекте.</h1><p class="lead">Опишите задачу, оставьте контакты и добавьте фото, видео или ссылки. Заявка придёт нам на рабочую почту.</p></section><section class="section request-page-layout" id="project-form"><aside class="request-page-contacts"><p class="eyebrow">ОБСУДИМ ВАШУ ЗАДАЧУ</p><h2>Начнём<br>с разговора.</h2><p>Поможем связать сырьё, оборудование и нужный вам результат в один проект.</p><a class="request-contact-phone" href="${siteContacts.phoneHref}">${siteContacts.phone}</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a><div class="request-materials-note"><h3>Что полезно приложить</h3><ul><li>Фото или видео сырья и примесей</li><li>Задачи по объёму и готовому продукту</li><li>План помещения и имеющееся оборудование</li><li>Ссылки на сайт и дополнительные материалы</li></ul></div></aside><div class="request-page-card">${requestForm({prefix:'contact',basePath})}</div></section>`;
}

export function requestSentPage(){
 return `<section class="section request-sent"><p class="eyebrow">СВЯЗЬ С ЭРА</p><span class="request-sent-mark" aria-hidden="true">✓</span><h1>Спасибо за обращение.</h1><p class="lead">Заявка передана в сервис отправки. Мы свяжемся с вами по указанным контактам, чтобы обсудить задачу.</p><p>Если хотите дополнить материалы, напишите на <a href="mailto:${siteContacts.email}">${siteContacts.email}</a>.</p><div class="actions"><a class="button" href="/">Вернуться к проекту ${arrow}</a><a class="button secondary" href="/catalog">Каталог оборудования ${arrow}</a></div></section>`;
}
