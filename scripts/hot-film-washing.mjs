import {siteContacts} from '../content/contact.mjs';
import {hotWashSpecification} from '../content/hot-film-washing.mjs';
import {hotWashDiagram} from '../content/hot-wash-diagram.mjs';
import {interactiveLineDiagram} from './line-diagram.mjs';
import {renderDryArchitectureHeading} from './dry-line-architecture.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments} from './line-page-media.mjs';
import {renderDryDocumentEditions} from './dry-document-editions.mjs';
import {renderDryLineRequest} from './dry-line-request.mjs';
import {nodes} from '../content/catalog.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {renderHotWashEngineeringCenter} from './hot-wash-engineering-center.mjs';
import {renderDrySeparationHero} from './dry-separation-hero.mjs';
import {renderDrySeparationPurpose} from './dry-separation-purpose.mjs';
import {renderHotWashPhotoAlbum} from './dry-photo-album.mjs';
import {renderHotWashRaw,renderHotWashProducts,renderHotWashKair} from './hot-wash-presentation.mjs';
import {renderHotWashProcess} from './hot-wash-process.mjs';
import {renderHotWashSpecs} from './hot-wash-specs.mjs';
import {escapeHtml as escape} from './hot-wash-media.mjs';

const heading=(index,title,lead='')=>`<div class="line-section-heading"><div><p class="eyebrow">${index}</p><h2>${title}</h2></div>${lead?`<p>${lead}</p>`:''}</div>`;
const more=(summary,body)=>`<details class="line-more" data-keep-open><summary>${summary}</summary><div>${body}</div></details>`;
function unitCard(item){
 const node=nodes.find(n=>n.slug===item.catalogSlug),image=equipmentCardImages[node.slug];
 return `<article class="line-unit-card line-unit-card--catalogue" data-catalogue-image="${node.slug}" style="--unit-stone-top:${image.stoneColors[0]};--unit-stone-left:${image.stoneColors[1]};--unit-stone-right:${image.stoneColors[4]}"><div class="line-unit-visual"><img src="/assets/${image.file}" srcset="/assets/${image.smallFile} 768w, /assets/${image.file} ${image.width}w" sizes="(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)" width="${image.width}" height="${image.height}" alt="${escape(item.name)}" loading="lazy" decoding="async"><span>Поз. ${item.position}</span></div><div class="line-unit-copy"><h3>${escape(item.name)}</h3><p>${escape(item.purpose)}</p><strong>${escape(item.position===26?'Соответствующий тип узла':item.characteristic)}</strong>${item.position===26?'<p class="line-note">Параметры поставляемого исполнения закрепляются спецификацией.</p>':''}<a class="text-link" href="${node.path}">Подробнее об узле ↗</a></div></article>`;
}
export function renderHotFilmWashing(line){
 const email=`mailto:${siteContacts.email}?subject=`+encodeURIComponent('ЭРА — линия горячей мойки плёнок и пакетов');
 const documents=lineDocuments(line);
 const technical=documents.find(document=>document.id==='moyka-plenki-technical');
 const hero=renderDrySeparationHero({
  line:{...line,tier:'HOT-WASH'},email,
  metrics:[
   {value:'до 1 500',unit:'кг/ч',label:'Подготовленная плёнка',detail:'Проектная подача'},
   {value:'750',unit:'кг/ч',label:'Выпуск гранулы',detail:'Номинал одного гранулятора'},
   {value:'1 271,70',unit:'кВт',label:'Установленная мощность',detail:'Сводная ведомость'},
   {value:'3',unit:'чел./смена',label:'Персонал',detail:'Оператор и два водителя погрузчика'}
  ],
  metricNote:'До 1 500 кг/ч — проектная подача плёнки. Номинал одного гранулятора — 750 кг/ч. Фактический выпуск зависит от состава и влажности сырья, потерь и режима.',
  documentHref:'/documents/'+technical.file,
  documentText:'Техническое описание · PDF, 22 страницы',
  documentAttributes:'data-pdf-open="'+technical.id+'"'
 });
 return `<div class="film-line film-line--full film-line--hot-wash" data-hot-wash-line>
 ${hero}

 ${renderDrySeparationPurpose(line.slug)}

 ${renderHotWashRaw()}

 <section class="section line-soft" id="composition">${renderDryArchitectureHeading(hotWashDiagram.slug)} ${interactiveLineDiagram(hotWashDiagram,{fit:true,architecture:true})}</section>

 ${renderHotWashProcess()}

 ${renderHotWashProducts()}

 ${renderHotWashKair()}

 <section class="section line-soft" id="specs">
  ${renderHotWashSpecs(line)}
 ${more('Обслуживание и эксплуатация',`<div class="line-inclusions">${[['Резка и подача','Ножи, ленты и сетки; ножевые зазоры и герметичность мокрой камеры.'],['Мокрые узлы','Шнеки, сетки, лопатки и форсунки центрифуг; барабаны, затвор, насосы и осадок флотаторов.'],['Водооборот','Гидроциклон, очистка, уровни в баках и дозаторы.'],['Выдача продукта','Увязка, капсулятор, фильтры и дегазация гранулятора.']].map(([t,p])=>`<p><strong>${t}:</strong> ${p}</p>`).join('')}</div><p class="line-note">Плановое обслуживание — по паспортам поставляемых исполнений. Для указанной в ТО центрифуги: смазка цепей через 336 рабочих часов, масло через 4 300 ч, осмотр пластин каждые 100 т. Для флотатора: пополнение смазки подшипников раз в рабочую неделю, замена раз в 6 месяцев. Работы после остановки, отключения энергии и исключения пуска; реагенты — по эксплуатационной документации.</p>`)}
 </section>

 <section class="section" id="placement">
  ${renderHotWashEngineeringCenter()}
  <div class="hw-placement-grid">${[['Склад и проезды','Сырьё, партии готовой продукции и маршруты погрузчика.'],['Основания и мокрая зона','Фундаменты, штробы и сбор загрязнённых стоков.'],['Вода и нагрев','Подпитка, циркуляция, тепловая мощность и режим сбросов.'],['Электроснабжение','Подключения, автоматика и заземление.'],['Реагенты и вентиляция','Хранение, дозирование и требования эксплуатационной документации.'],['Сервисный доступ','Остановки и обслуживание выбранных исполнений.']].map(([t,p])=>`<article><h3>${t}</h3><p>${p}</p></article>`).join('')}</div></section>

 ${renderHotWashPhotoAlbum()}

 ${renderDryDocumentEditions(line,documents)}

 ${renderDryLineRequest(line)}

 <section class="section line-soft" id="equipment">${heading('ОБОРУДОВАНИЕ В СОСТАВЕ','Изучите каждый узел.','Прямые переходы к типам оборудования, указанным в спецификации. Параметры конкретного поставляемого исполнения согласуются для линии.')}<div class="line-unit-grid">${hotWashSpecification.filter(s=>s.catalogSlug).map(unitCard).join('')}</div></section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}</div>`;
}
