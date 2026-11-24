import {contextNavigation,contextNavigationData} from './context-navigation.mjs';
import {documentCategories} from '../content/document-library.mjs';
import {validateDocumentLibrary} from './validate-document-library.mjs';
import {siteHeader,siteMenu} from './navigation.mjs';
import {siteFooter} from './footer.mjs';
import {presentationHome} from './home.mjs';
import {economicsPage} from './economics-page.mjs';
import {showroomDialog} from './gallery.mjs';
import {aboutUsPage} from './about-us.mjs';
import {quickContact} from './quick-contact.mjs';
import {nodes,lines} from '../content/catalog.mjs';
import {revisedPage,extraRoutes,galleryDialog} from './views.mjs';
import {mkdir,rm,cp,writeFile,readFile,readdir} from 'node:fs/promises';
import {basename} from 'node:path';
import {createHash} from 'node:crypto';
import {sections} from '../content/site.mjs';
import {contactPage,requestDialog,requestSentPage,enhanceProjectRequests} from './contact.mjs';
import {cookieBanner,cookieDialog,legalPage,legalPages} from './legal.mjs';
import {basePath,canonicalOrigin,previewMode,siteUrl} from './deploy-target.mjs';
import assetBaseline from '../content/asset-cache-baseline.json' with {type:'json'};
import {validateRates} from '../public/fx-core.js';
export {basePath,previewMode,siteUrl};
const excludedRoutes=new Set(['/about','/ai','/company-details','/contacts/sent','/news','/blog','/privacy','/privacy/consent','/privacy/cookies']);

// Legacy cache keys stay stable when a release changes copy or unrelated files.
export const assetBaseVersion='0.47.0';
const version=assetBaseVersion;
const moduleAssets=['fx','interactions','context-navigation','document-library','commercial','economics-controller','economics-model','economics-payback','economics-market','economics-view','economics-page-controller','economics-page-state','economics-page-view','gallery-showroom','gallery-viewer','gallery-model','presentation-web','technology-final'];
const publicRoot=new URL('../public/',import.meta.url);
const publicEntries=await readdir(publicRoot,{withFileTypes:true});
const trackedAssets=new Set([...Object.keys(assetBaseline),...publicEntries.filter(dir=>dir.isFile()&&/\.(?:css|m?js)$/.test(dir.name)).map(dir=>dir.name)]);
const digest=value=>createHash('sha256').update(value).digest('hex');
const sources=new Map(await Promise.all([...trackedAssets].map(async file=>{
 try{return [file,await readFile(new URL(file,publicRoot))];}
 catch(error){if(error.code==='ENOENT')return [file,null];throw error;}
})));
const checksums=new Map([...sources].filter(([,bytes])=>bytes).map(([file,bytes])=>[file,digest(bytes)]));
const importPattern=/(?:from|import) '(\.\/[^']+\.js)'/g;
const dependentFiles=file=>file==='line-monitor.js'?['line-callout-layout.mjs']:
 moduleAssets.includes(file.replace(/\.js$/,''))&&sources.get(file)?[...sources.get(file).toString().matchAll(importPattern)].map(match=>match[1].slice(2)):[];
function assetRevision(file,fallback=version){
 if(!checksums.has(file))return fallback;
 const closure=new Set([file]);
 for(const resource of closure)for(const dependency of dependentFiles(resource))closure.add(dependency);
 if([...closure].every(name=>checksums.get(name)===assetBaseline[name]))return fallback;
 return digest([...closure].sort().map(name=>name+':'+checksums.get(name)).join('\n')).slice(0,12);
}
// Preserve the published 0.48.1 legal HTML byte for byte.
const legalShellRevisions = {'legal.css':'35839ab08f58', 'cookie-consent.js':'be334a6d6754'};
// The shared monitor retains its existing behavior on these reference pages.
const referenceLineRoutes=new Set(['/catalog/lines/separatsiya-01','/catalog/lines/separatsiya-02']);
const revisionedMarkup=(html,path)=>html.replace(/((?:src|href)="\/([^"?]+)\?v=)([^"&]+)/g,(_,prefix,file,key)=>{
 if(file==='line-monitor.js'&&referenceLineRoutes.has(path))return prefix+'2b2b6fa70bfa';
 return prefix+((legalPages[path] ? legalShellRevisions[file] : undefined) ?? assetRevision(file,key));
});
const lineDiagramVersion=version+'-callouts-3';
const linePresentationPage=path=>['/catalog/lines/separatsiya-01','/catalog/lines/separatsiya-02','/catalog/lines/separatsiya-03','/catalog/lines/moyka-plenki'].includes(path);
const withBase=(html,path)=>revisionedMarkup(html,path).replace(/(href|src|poster|data-product|data-image|data-video|data-poster|data-gallery-base|value)="\/(?!\/)/g,`$1="${basePath}/`).replace(/srcset="([^"]+)"/g,(_,sources)=>`srcset="${sources.replace(/(^|,)(\s*)\/(?!\/)/g,`$1$2${basePath}/`)}"`);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export const product='/catalog/equipment/predvaritelnyy-izmelchitel';
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}<span aria-hidden="true">↗</span></a>`;
const simplePages={
 '/news':{title:'Новости',heading:'События проекта ЭРА.',lead:'Оборудование, технология переработки и развитие проекта.',text:'Хотите узнать об оборудовании или обсудить свой проект? Свяжитесь с ЭРА.',action:'Связаться с ЭРА'},
 '/blog':{title:'Блог',heading:'О технологии<br>и выборе оборудования.',lead:'Подготовка сырья, очистка и дальнейшая переработка плёнки.',text:'Чтобы выбрать последовательность операций, начните с материала на входе и требований к результату. Расскажите о вашей задаче — обсудим подходящую технологию.',action:'Обсудить сырьё'},
};
function page(path){
 if(path==='/')return presentationHome();
 if(path==='/about-us')return aboutUsPage();
 if(path==='/economics')return economicsPage();
 const revised=revisedPage(path);if(revised!==null)return revised;
 if(path==='/contacts')return contactPage({basePath});
 if(path==='/contacts/sent')return requestSentPage();
 if(legalPages[path])return legalPage(path);
 const entry=simplePages[path];if(!entry)throw new Error('Missing page: '+path);
 return `<section class="section page-intro"><p class="eyebrow">ЭРА / ${entry.title.toUpperCase()}</p><h1>${entry.heading}</h1><p class="lead">${entry.lead}</p></section><section class="section"><p>${entry.text}</p>${button(entry.action,entry.href||'/contacts')}</section>`;
}
const styles=path=>['style','equipment','documents','fx',...(contextNavigationData(path)?['context-navigation']:[]),...(path?.startsWith('/documents')||linePresentationPage(path)?['document-library','pdf-viewer']:[]),...(['/','/technology','/automation','/economics'].includes(path)?['presentation']:[]),'navigation','diagram','footer','legal','kair','surfaces',...(['/economics','/technology'].includes(path)?['quality']:[]),...(path==='/economics'?['commercial']:[]),...(path==='/automation'?['kair-system']:[]),...(path==='/technology'?['technology-lines','technology-final']:[]),...(path==='/catalog'?['catalog']:[]),...(['/catalog/lines','/catalog/equipment'].includes(path)?['catalog-branches']:[]),...(path==='/catalog/equipment'?['node-cards']:[]),...(path==='/catalog/lines'||lines.some(l=>l.enabled&&l.path===path)?['lines']:[]),...(['/economics','/technology'].includes(path)?['presentation-web']:[]),...(path==='/media'?['gallery-showroom']:[]),...(path==='/economics'?['economics-page']:[]),...(path==='/'?['project-home']:[]),'request',...(path==='/about-us'?['about-us']:[]),...(path==='/contacts'?['contact-premium']:[]),'quick-contact','video-channels','page-progress',...(linePresentationPage(path)?['line-monitor']:[]),...(path==='/catalog/lines/moyka-plenki'?['hot-film-washing']:[]),...(path==='/catalog/lines/separatsiya-03'?['separation-drying']:[]),...(linePresentationPage(path)?['line-engineering']:[]),...(['separatsiya-01','separatsiya-02','separatsiya-03','moyka-plenki'].some(slug=>path==='/catalog/lines/'+slug)?['dry-architecture']:[]),...(path==='/catalog/lines/separatsiya-01'?['base-process']:[]),...(path==='/catalog/lines/separatsiya-02'?['pro-process']:[])].map(file=>`<link rel="stylesheet" href="/${file}.css?v=${file==='line-monitor'?lineDiagramVersion:version}">`).join('');
const scripts=path=>`${path==='/catalog/lines/separatsiya-03'?`<script type="module" src="/separation-drying.js?v=${version}"></script>`:''}${path==='/catalog/lines/moyka-plenki'?`<script type="module" src="/hot-film-washing.js?v=${version}"></script>`:''}${['/catalog/lines','/catalog/equipment'].includes(path)?`<script type="module" src="/catalog-branches.js?v=${version}"></script>`:''}${linePresentationPage(path)?`<script type="module" src="/line-monitor.js?v=${lineDiagramVersion}"></script><script type="module" src="/line-documents.js?v=${lineDiagramVersion}"></script>`:''}${contextNavigationData(path)?`<script type="module" src="/context-navigation.js?v=${version}"></script>`:''}${path?.startsWith('/documents')?`<script type="module" src="/document-library.js?v=${version}"></script>`:''}<script src="/request.js?v=${version}" defer></script><script src="/cookie-consent.js?v=${version}" defer></script>${path==='/contacts'?`<script src="/contact-maps.js?v=${version}" defer></script>`:''}<script src="/navigation.js?v=${version}" defer></script><script src="/app.js?v=${version}" defer></script><script type="module" src="/interactions.js?v=${version}"></script><script src="/media-viewer.js?v=${version}" defer></script><script type="module" src="/fx.js?v=${version}"></script><script src="/diagram.js?v=${version}" defer></script><script type="module" src="/kair.js?v=${version}"></script>${path==='/media'?`<script type="module" src="/gallery-showroom.js?v=${version}"></script>`:''}${path==='/economics'?`<script type="module" src="/commercial.js?v=${version}"></script>`:''}${path==='/'?`<script src="/project-home.js?v=${version}" defer></script>`:''}${path==='/automation'?`<script type="module" src="/kair-system.js?v=${version}"></script>`:''}${path==='/technology'?`<script type="module" src="/presentation-web.js?v=${version}"></script><script type="module" src="/technology-final.js?v=${version}"></script>`:''}<script src="/quick-contact.js?v=${version}" defer></script><script src="/page-progress.js?v=${version}" defer></script>`;
const icons=()=>`<link rel="icon" href="/assets/favicon.ico?v=${version}" sizes="16x16 32x32 48x48"><link rel="icon" href="/assets/favicon.svg?v=${version}" type="image/svg+xml" sizes="any"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=${version}" sizes="180x180">`;
const arrows=html=>html.replaceAll('↗','<svg class="arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10" stroke="currentColor" stroke-width="1.4"/></svg>');
const sectionMeta={
 '/catalog':{title:'Каталог оборудования',description:'Линии переработки плёночного сырья и отдельные узлы ЭРА. Выбор по составу оборудования и технологическим задачам.'},
 '/catalog/lines':{title:'Технологические линии и комплексы',description:'Сухая сепарация в комплектациях BASE, PRO и PREMIUM, линия горячей мойки и сравнение характеристик.'},
 '/catalog/equipment':{title:'Отдельные узлы переработки плёнок',description:'Каталог узлов ЭРА для измельчения, сепарации, мойки, обезвоживания, очистки стоков и фасовки.'},
 '/economics':{description:'Экономика переработки плёнок. Расчёт выпуска, затрат, выручки и окупаемости при выбранных параметрах производства.'},
 '/media':{description:'Фотографии, видео, компоновки линий и альбомы оборудования ЭРА для переработки плёнок и пакетов.'},
};
const canonicalUrl=path=>canonicalOrigin+path.replace(/\/$/,'')+'/';
const canonicalLink=path=>`<link rel="canonical" href="${escape(canonicalUrl(path))}">`;
export function render(path){
 if(path==='/about')return renderLegacyAbout();
 if(path==='/ai')return renderLegacyAutomation();
 if(path==='/company-details')return renderLegacyCompanyDetails();
 const documentCategory=path.startsWith('/documents/')?documentCategories.find(c=>path==='/documents/'+c.id):null;
 const title=documentCategory?documentCategory.title:path==='/documents'?'Инженерная библиотека ЭРА':legalPages[path]?.title||(path==='/contacts/sent'?'Статус заявки':path==='/'?'Промышленная переработка загрязнённых плёнок':sectionMeta[path]?.title||[...nodes,...lines].find(n=>n.path===path)?.title||sections.find(s=>s[0]===path)?.[1]||'Каталог оборудования');
 const description=documentCategory?documentCategory.detail:path==='/documents'?'Брошюры, технические описания, схемы, чертежи и материалы для оценки производственных решений ЭРА. Документы узлов и производственных линий.':path==='/about-us'?'ЭРА: более 20 лет отраслевого опыта команды, инженерная разработка, производственная база BEIER и внедрение оборудования в Нидерландах и Челябинске.':path==='/contacts'?'Контакты ЭРА: прямая связь, форма проекта и производственная база BEIER Machinery в Чжанцзягане, Китай. Отправьте задачу, фотографии, видео и документы.':path==='/'?'ЭРА — технологические решения для переработки загрязнённых полиэтиленовых плёнок. Сухая сепарация и полный цикл до вторичной ПЭ-гранулы. Испытания при засорённости до 80%.':path==='/technology'?'Технология ЭРА: сырьё и загрязнения, сухая сепарация, горячая мойка, гранулирование, качество вторичного полиэтилена и направления применения.':path==='/automation'?'Система управления КАИР: согласование оборудования, защита, память режимов, экраны Siemens, мойка и водные контуры. Реальные фотографии и практические сценарии.':sectionMeta[path]?.description||[...nodes,...lines].find(n=>n.path===path)?.description||'ЭРА — оборудование, технологии и автоматизация переработки вторичных плёночных материалов.';
 return withBase(enhanceProjectRequests(arrows(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${previewMode||excludedRoutes.has(path)?'<meta name="robots" content="noindex,nofollow">':''}${excludedRoutes.has(path)?'':canonicalLink(path)}<title>${escape(title)} — ЭРА</title><meta name="description" content="${escape(description)}">${icons()}${styles(path)}${scripts(path)}</head><body><a class="skip" href="#main">К содержанию</a>${siteHeader(path)}${cookieBanner()}${contextNavigation(path)}<main id="main">${page(path)}</main>${siteFooter()}${siteMenu(path)}${path==='/media'?showroomDialog():galleryDialog()}${path==='/contacts'?'':requestDialog({basePath})}${quickContact()}${cookieDialog()}</body></html>`),path),path);
}
function renderLegacyAbout(){return withBase(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>О проекте — ЭРА</title>${icons()}<meta http-equiv="refresh" content="0; url=${basePath}/">${canonicalLink('/')}<link rel="stylesheet" href="/style.css?v=${version}"><script src="/about-redirect.js?v=${version}" defer></script></head><body><main class="section" id="main"><h1>О проекте ЭРА</h1><p>Информация о проекте находится на главной странице.</p><a class="text-link" href="/">Перейти на главную →</a></main></body></html>`);}
function renderLegacyAutomation(){return withBase(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Система управления КАИР — ЭРА</title>${icons()}<meta http-equiv="refresh" content="0; url=${basePath}/automation">${canonicalLink('/automation')}<link rel="stylesheet" href="/style.css?v=${version}"><script src="/automation-redirect.js?v=${version}" defer></script></head><body><main class="section" id="main"><h1>Система управления КАИР</h1><p>Материалы об управлении оборудованием объединены на странице системы КАИР.</p><a class="text-link" href="/automation">Перейти к системе управления →</a></main></body></html>`);}
function renderLegacyCompanyDetails(){return withBase(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Контакты — ЭРА</title>${icons()}<meta http-equiv="refresh" content="0; url=${basePath}/contacts">${canonicalLink('/contacts')}<link rel="stylesheet" href="/style.css?v=${version}"><script src="/company-details-redirect.js?v=${version}" defer></script></head><body><main class="section" id="main"><h1>Связаться с ЭРА</h1><p>Актуальные способы связи находятся на странице контактов.</p><a class="text-link" href="/contacts">Перейти к контактам →</a></main></body></html>`);}
function renderNotFound(){return withBase(arrows(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Страница не найдена — ЭРА</title>${icons()}${styles('/404')}${scripts()}</head><body><a class="skip" href="#main">К содержанию</a>${siteHeader('/404')}${cookieBanner()}<main class="section" id="main"><h1>404</h1><p>Страница не найдена.</p><a href="/">На главную →</a></main>${siteFooter()}${siteMenu('/404')}${cookieDialog()}</body></html>`));}
export const routes=['/','/about','/ai','/company-details','/contacts/sent','/privacy','/privacy/consent','/privacy/cookies',product,'/catalog/equipment','/catalog/lines',...sections.map(s=>s[0]),...extraRoutes];
await validateDocumentLibrary();
const ratesSeed=!previewMode&&process.env.CBR_SEED_FILE?validateRates(JSON.parse(await readFile(process.env.CBR_SEED_FILE,'utf8'))):{status:'unavailable'};
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true,filter:source=>basename(source)!=='.gitkeep'});
if(!previewMode){
 await cp('server/regru/public','dist',{recursive:true});
 await mkdir('dist/data',{recursive:true});
 await writeFile('dist/data/cbr.json',JSON.stringify(ratesSeed,null,2)+'\n');
}
await mkdir('dist/vendor/pdfjs',{recursive:true});
for(const resource of ['build/pdf.mjs','build/pdf.worker.mjs','cmaps','standard_fonts','wasm','LICENSE'])await cp('node_modules/pdfjs-dist/'+resource,'dist/vendor/pdfjs/'+resource.replace(/^build\//,''),{recursive:true});
await cp('node_modules/fflate/esm/browser.js','dist/vendor/fflate.js');
await cp('node_modules/fflate/LICENSE','dist/vendor/fflate-LICENSE.txt');
// Keep each browser module graph on the same release.
for(const name of moduleAssets){
 const file=`dist/${name}.js`,source=await readFile(file,'utf8');
 await writeFile(file,source.replace(/(from|import) '(\.\/[^']+\.js)'/g,(_,statement,path)=>`${statement} '${path}?v=${assetRevision(path.slice(2))}'`));
}
const lineController=await readFile('dist/line-monitor.js','utf8');
await writeFile('dist/line-monitor.js',lineController.replace("from './line-callout-layout.mjs'",`from './line-callout-layout.mjs?v=${assetRevision('line-callout-layout.mjs',lineDiagramVersion)}'`));
for(const path of new Set(routes)){const dir='dist'+(path==='/'?'':path);await mkdir(dir,{recursive:true});await writeFile(dir+'/index.html',render(path));}
await writeFile('dist/robots.txt','User-agent: *\nAllow: /\n'+(!previewMode?`Sitemap: ${siteUrl}/sitemap.xml\n`:''));
if(!previewMode){
 const entries=[...new Set(routes)].filter(path=>!excludedRoutes.has(path))
  .map(path=>`  <url><loc>${escape(canonicalUrl(path))}</loc></url>`);
 await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
}
await writeFile('dist/404.html',renderNotFound());console.log(`Built ${new Set(routes).size} pages`);
