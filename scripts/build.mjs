import {siteHeader,siteMenu} from './navigation.mjs';
import {siteFooter} from './footer.mjs';
import {presentationHome} from './home.mjs';
import {nodes,lines} from '../content/catalog.mjs';
import {revisedPage,extraRoutes,galleryDialog} from './views.mjs';
import {mkdir,rm,cp,writeFile,readFile} from 'node:fs/promises';
import {sections} from '../content/site.mjs';
export const basePath=(process.env.BASE_PATH||'').replace(/\/$/,'');
if(basePath&&!/^\/[A-Za-z0-9_/-]+$/.test(basePath))throw new Error('Invalid BASE_PATH');
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
const withBase=html=>html.replace(/(href|src|poster|data-product|data-image|data-video|data-poster|value)="\/(?!\/)/g,`$1="${basePath}/`).replace(/srcset="([^"]+)"/g,(_,sources)=>`srcset="${sources.replace(/(^|,)(\s*)\/(?!\/)/g,`$1$2${basePath}/`)}"`);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const product='/catalog/equipment/predvaritelnyy-izmelchitel';
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}<span aria-hidden="true">↗</span></a>`;
const contact=()=>`<section class="contact section"><div><p class="eyebrow">НАЧНЁМ С ВАШЕГО СЫРЬЯ</p><h2>У каждой задачи —<br>своя комплектация.</h2><p>Расскажите, что вы перерабатываете и какой результат хотите получить. В письмо можно приложить фотографии сырья.</p></div><div>${button('Написать о задаче','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Запрос по оборудованию ЭРА'))}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:edkom.office@mail.ru">edkom.office@mail.ru</a><small>Укажите вид сырья, объём подачи и нужный результат.</small></div></section>`;
const simplePages={
 '/ai':{title:'Искусственный интеллект',heading:'Цифровые решения<br>под задачи производства.',lead:'Искусственный интеллект — направление развития цифровых решений ЭРА.',text:'Обсудим задачи анализа данных и поддержки технологического процесса для вашего оборудования.',action:'Обсудить задачу'},
 '/news':{title:'Новости',heading:'События проекта ЭРА.',lead:'Оборудование, технология переработки и развитие проекта.',text:'Хотите узнать об оборудовании или обсудить свой проект? Свяжитесь с ЭРА.',action:'Связаться с ЭРА'},
 '/blog':{title:'Блог',heading:'О технологии<br>и выборе оборудования.',lead:'Подготовка сырья, очистка и дальнейшая переработка плёнки.',text:'Чтобы выбрать последовательность операций, начните с материала на входе и требований к результату. Расскажите о вашей задаче — обсудим подходящую технологию.',action:'Обсудить сырьё'},
 '/company-details':{title:'Реквизиты',heading:'Сведения для работы<br>по вашему проекту.',lead:'Карточка предприятия и платёжные реквизиты ЭРА.',text:'Запросите актуальную карточку предприятия по почте.',action:'Запросить реквизиты',href:'mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Реквизиты предприятия ЭРА')},
};
function page(path){
 if(path==='/')return presentationHome();
 const revised=revisedPage(path);if(revised!==null)return revised;
 if(path==='/contacts')return `<section class="section page-intro"><p class="eyebrow">СВЯЗЬ С ЭРА</p><h1>Расскажите о вашем сырье.</h1><p class="lead">Для начала достаточно описать материал и оставить способ связи.</p></section>`+contact();
 const entry=simplePages[path];if(!entry)throw new Error('Missing page: '+path);
 return `<section class="section page-intro"><p class="eyebrow">ЭРА / ${entry.title.toUpperCase()}</p><h1>${entry.heading}</h1><p class="lead">${entry.lead}</p></section><section class="section"><p>${entry.text}</p>${button(entry.action,entry.href||'/contacts')}</section>`;
}
const styles=path=>['style','equipment','documents','fx',...(['/','/technology','/automation'].includes(path)?['presentation']:[]),'navigation','diagram','footer','kair','surfaces',...(path==='/catalog'?['catalog']:[])].map(file=>`<link rel="stylesheet" href="/${file}.css?v=${version}">`).join('');
const scripts=()=>`<script src="/navigation.js?v=${version}" defer></script><script src="/app.js?v=${version}" defer></script><script type="module" src="/interactions.js?v=${version}"></script><script src="/media-viewer.js?v=${version}" defer></script><script type="module" src="/fx.js?v=${version}"></script><script src="/diagram.js?v=${version}" defer></script><script type="module" src="/kair.js?v=${version}"></script>`;
const arrows=html=>html.replaceAll('↗','<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" stroke-width="1.4"/></svg>');
export function render(path){
 if(path==='/about')return renderLegacyAbout();
 const title=path==='/'?'Переработка загрязнённых пакетов и плёнок':[...nodes,...lines].find(n=>n.path===path)?.title||sections.find(s=>s[0]===path)?.[1]||'Каталог оборудования';
 const description=nodes.find(n=>n.path===path)?.description||'ЭРА — оборудование, технологии и автоматизация переработки вторичных плёночных материалов.';
 return withBase(arrows(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} — ЭРА</title><meta name="description" content="${escape(description)}"><link rel="icon" href="/assets/logo.png">${styles(path)}${scripts()}</head><body><a class="skip" href="#main">К содержанию</a>${siteHeader(path)}<main id="main">${page(path)}</main>${siteFooter()}${siteMenu(path)}${galleryDialog()}</body></html>`));
}
function renderLegacyAbout(){return withBase(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>О проекте — ЭРА</title><meta http-equiv="refresh" content="0; url=${basePath}/"><link rel="canonical" href="/"><link rel="stylesheet" href="/style.css?v=${version}"><script src="/about-redirect.js?v=${version}" defer></script></head><body><main class="section" id="main"><h1>О проекте ЭРА</h1><p>Информация о проекте находится на главной странице.</p><a class="text-link" href="/">Перейти на главную →</a></main></body></html>`);}
function renderNotFound(){return withBase(arrows(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Страница не найдена — ЭРА</title>${styles('/404')}${scripts()}</head><body><a class="skip" href="#main">К содержанию</a>${siteHeader('/404')}<main class="section" id="main"><h1>404</h1><p>Страница не найдена.</p><a href="/">На главную →</a></main>${siteFooter()}${siteMenu('/404')}</body></html>`));}
export const routes=['/','/about',product,'/catalog/equipment','/catalog/lines',...sections.map(s=>s[0]),...extraRoutes];
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
for(const path of new Set(routes)){const dir='dist'+(path==='/'?'':path);await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',render(path));}
await writeFile('dist/robots.txt','User-agent: *\nDisallow: /\n');await writeFile('dist/404.html',renderNotFound());console.log(`Built ${new Set(routes).size} pages`);
