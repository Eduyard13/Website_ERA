import {siteContacts} from '../content/contact.mjs';
import {dryLineNames} from '../content/line-names.mjs';
import {projectRequestHref} from './contact.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const copy={
 'separatsiya-01':'Базовая комплектация для запуска сухой сепарации.',
 'separatsiya-02':'Сортировка плёнок по видам и автоматизированная затюковка.',
 'separatsiya-03':'Сухая сепарация, сортировка по видам и сушка плёнки.'
};
const icon=(path)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
const arrow=icon('<path d="M6 18 18 6M7 6h11v11"/>');
const steps=[
 ['Отправьте материал','Фото, видео и краткое описание сырья.',icon('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 4-4 5 5"/>')],
 ['Получите подбор','Комплектация и ориентиры по размещению.',icon('<path d="M4 4h16v16H4zM4 9h16M9 9v11M13 13h4v4h-4z"/>')],
 ['Обсудите запуск','Состав линии, сроки и формат поставки.',icon('<path d="M4 5h16v12H9l-5 4V5ZM8 9h8m-8 4h5"/>')]
];
export function renderDryLineRequest(line){
 const name=dryLineNames[line.slug];if(!name)throw Error('Unknown dry line '+line.slug);
 const tier=name.tier,topic='Сухая сепарация · '+tier+' — '+name.title;
 const phone=icon('<path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z"/>');
 const mail=icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>');
 return '<section class="section contact line-request" id="request"><div class="dry-request-copy" data-dry-request="'+tier+'"><p class="eyebrow">ПОД ВАШЕ СЫРЬЁ И ПЛОЩАДКУ</p><h2>Подберём конфигурацию линии <span>под вашу задачу.</span></h2><p class="dry-request-lead">Расскажите, какое сырьё планируете перерабатывать и какой продукт хотите получить. Учтём фактический состав, загрязнённость, влажность, производительность, параметры цеха и доступную мощность.</p><ol class="dry-request-steps" aria-label="Как начать работу">'+steps.map(([title,desc,graphic],i)=>'<li><div class="dry-request-step-top"><span class="dry-request-step-icon">'+graphic+'</span><span class="dry-request-number">0'+(i+1)+'</span></div><h3>'+title+'</h3><p>'+desc+'</p></li>').join('')+'</ol></div><div class="dry-request-panel"><div class="dry-request-tier"><span class="dry-request-tier-mark" aria-hidden="true"></span><span>Сухая сепарация · <strong>'+tier+'</strong></span></div><h3>Обсудим ваш проект.</h3><p class="dry-request-context">'+copy[line.slug]+'</p><a class="button dry-request-action" href="'+escape(projectRequestHref(topic))+'" data-project-request>Отправить запрос по линии '+arrow+'</a><p class="dry-request-note">Можно приложить фото, видео сырья и документы по площадке.</p><div class="dry-request-contacts"><a class="dry-request-phone" href="'+siteContacts.phoneHref+'">'+phone+'<span>'+siteContacts.phone+'</span></a><a class="dry-request-email" href="mailto:'+siteContacts.email+'">'+mail+'<span>'+siteContacts.email+'</span></a></div></div></section>';
}
