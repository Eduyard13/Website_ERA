import {renderDryDocumentEditions} from './dry-document-editions.mjs';
import {renderDryPhotoAlbum} from './dry-photo-album.mjs';
import {renderBaseSpecs} from './base-specs.mjs';
import {renderDryKair} from './dry-kair.mjs';
import {renderBaseProductRoutes} from './base-product-routes.mjs';
import {renderDryProductCollage} from './dry-product-collage.mjs';
import {siteContacts} from '../content/contact.mjs';
import {nodes} from '../content/catalog.mjs';
import {miniFilmSeparationMedia,miniLineMetrics,miniRawMaterials,miniInclusions,miniStages,miniUnits} from '../content/mini-film-separation.mjs';
import {mediaAttributes} from './media.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments} from './line-page-media.mjs';
import {renderDrySeparationHero} from './dry-separation-hero.mjs';
import {renderDrySeparationPurpose} from './dry-separation-purpose.mjs';
import {renderDrySeparationRaw} from './dry-separation-raw.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {interactiveLineDiagram} from './line-diagram.mjs';
import {renderDryArchitectureHeading} from './dry-line-architecture.mjs';
import {renderBaseProcess} from './base-process.mjs';
import {lineDimensions} from './line-dimensions.mjs';
import {miniLineDiagram} from '../content/line-diagrams.mjs';
import {imageSize} from './image-size.mjs';

const pictures=miniFilmSeparationMedia;
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}<span aria-hidden="true">↗</span></a>`;
function picture(key,{label,caption,full=false}={}){
 const m=pictures[key];
 const file=full?m.file:m.thumbnail;
 const {width,height}=imageSize(new URL('../public/assets/'+file,import.meta.url));
 return `<figure class="line-image line-image--${m.type}" ${mediaAttributes(m)}><a class="media-open" href="/assets/${m.file}" aria-label="Увеличить: ${escape(m.title)}"><img src="/assets/${file}" width="${width}" height="${height}" alt="${escape(m.title)}" loading="lazy" decoding="async">${label?`<span class="line-image-label">${label}</span>`:''}<span class="line-image-zoom" aria-hidden="true">⤢</span></a><figcaption>${caption||m.title}${m.page?'':'<span>Визуализация линии BASE</span>'}</figcaption></figure>`;
}
const rows=items=>items.map(([label,value])=>`<tr><th scope="row">${escape(label)}</th><td>${escape(value)}</td></tr>`).join('');

function unitCard([position,title,text,value,slug,key]){
 const n=nodes.find(n=>n.slug===slug),image=n?equipmentCardImages[n.slug]:null;
 const graphic=image?`<img src="/assets/${image.file}" srcset="/assets/${image.smallFile} 768w, /assets/${image.file} ${image.width}w" sizes="(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)" width="${image.width}" height="${image.height}" alt="${escape(title)}" loading="lazy" decoding="async">`:`<img src="/assets/${pictures[key].file}" alt="${escape(title)}" loading="lazy" decoding="async">`;
 return `<article class="line-unit-card${image?' line-unit-card--catalogue':' line-unit-card--technical'}"${image?` data-catalogue-image="${n.slug}" style="--unit-stone-top:${image.stoneColors[0]};--unit-stone-left:${image.stoneColors[1]};--unit-stone-right:${image.stoneColors[4]}"`:''}><div class="line-unit-visual">${graphic}<span>Поз. ${position}</span></div><div class="line-unit-copy"><h3>${title}</h3><p>${text}</p><strong>${value}</strong>${n?`<a class="text-link" href="${n.path}">Подробнее об узле ↗</a>`:'<span class="line-note">В составе представленной линии</span>'}</div></article>`;
}

export function renderMiniFilmSeparation(line){
 const email=`mailto:${siteContacts.email}?subject=`+encodeURIComponent(`Запрос ЭРА: ${line.title}`);
 const documents=lineDocuments(line);
 const drawing=documents.find(d=>d.id==='separatsiya-01-dimensions');
 return `<div class="film-line mini-line">

 ${renderDrySeparationHero({line,email,metrics:[
   {value:miniLineMetrics[0][0],unit:miniLineMetrics[0][1],label:'Входное сырьё',detail:'С учётом загрязнений'},
   {value:miniLineMetrics[1][0],unit:miniLineMetrics[1][1],label:'Очищенная плёнка',detail:'Расчёт при засорённости около 50%'},
   {value:miniLineMetrics[2][0],unit:miniLineMetrics[2][1],label:miniLineMetrics[2][2]},
   {value:miniLineMetrics[3][0],unit:'чел./смена',label:'Рабочий персонал'}
  ],metricNote:'750 кг/ч — расчёт при засоре около 50%. Выпуск подтверждаем на выбранном сырье и комплектации.',documentHref:'#documents',documentText:'Техническое описание · PDF, 14 страниц'})}
 <nav class="anchor-nav line-anchor-nav" aria-label="Разделы линии BASE"><a href="#purpose">Назначение</a><a href="#raw-materials">Сырьё</a><a href="#composition">Схема линии</a><a href="#process">Процесс</a><a href="#quality">Продукт</a><a href="#kair">КАИР</a><a href="#specs">Характеристики</a><a href="#placement">Габариты</a><a href="#photos">Фото</a><a href="#documents">Документы</a><a href="#request">Обратная связь</a><a href="#equipment">Состав узлов</a></nav>

 ${renderDrySeparationPurpose(line.slug)}

 ${renderDrySeparationRaw(line.slug)}

 <section class="section line-soft" id="composition">${renderDryArchitectureHeading(line.slug)}
  ${interactiveLineDiagram(miniLineDiagram,{fit:true,architecture:true})}
  <p class="line-note">Позиции 12 — пылеулавливание и 13 — шкаф управления входят в базовую спецификацию. На общей компоновке они не показаны: размещение уточняют при привязке линии к площадке.</p>
 </section>

 <section class="section" id="process">${renderBaseProcess(miniStages)}</section>

 <section class="section line-soft" id="quality">${renderDryProductCollage()}
  ${renderBaseProductRoutes()}
 </section>

 <section class="section line-kair-section" data-page-progress-label="КАИР" id="kair">${renderDryKair()}</section>

 <section class="section" id="specs">${renderBaseSpecs(line)}</section>

 <section class="section" id="placement"><div class="line-section-heading"><div><p class="eyebrow">ГАБАРИТЫ И РАЗМЕЩЕНИЕ</p><h2>Компактная расстановка.<br>Доступ к каждому узлу.</h2></div><p>17,75 × 11,75 м — габарит механической части в плане. Проходы, загрузку, выгрузку и смену биг-бэгов учитывают дополнительно при привязке к площадке.</p></div>
  ${lineDimensions(drawing)}
 </section>

 ${renderDryPhotoAlbum()}

 ${renderDryDocumentEditions(line,documents)}

 <section class="section contact line-request" id="request"><div><p class="eyebrow">ПОДБОР ЛИНИИ BASE</p><h2>Обсудим ваше сырьё<br>и будущую линию.</h2><p>Пришлите фото или видео материала, состав примесей, засорённость и влажность, требуемую подачу и форму продукта, план цеха и доступную мощность.</p></div><div>${button('Отправить запрос по линии BASE',email)}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a><small>Заполните форму и приложите фотографии, видео или документы к заявке.</small></div></section>

 <section class="section line-soft" id="equipment"><div class="line-section-heading"><div><p class="eyebrow">ОБОРУДОВАНИЕ В СОСТАВЕ ЛИНИИ</p><h2>Изучите каждый узел.</h2></div><p>Подготовка сырья, сухая очистка и сбор отделённых включений. Перейдите к паспортам оборудования в каталоге.</p></div><div class="line-unit-grid">${miniUnits.map(unitCard).join('')}</div></section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}
 </div>`;
}
