import {renderDryPhotoAlbum} from './dry-photo-album.mjs';
import {renderBaseSpecs} from './base-specs.mjs';
import {renderDryKair} from './dry-kair.mjs';
import {renderDryProductRoutes} from './dry-product-routes.mjs';
import {renderDryProductCollage} from './dry-product-collage.mjs';
import {siteContacts} from '../content/contact.mjs';
import {nodes} from '../content/catalog.mjs';
import {filmSeparationMedia as pictures,lineMetrics,lineRawMaterials,lineStages,lineUnits,linePositions} from '../content/film-separation.mjs';
import {mediaAttributes} from './media.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments,lineDocumentCards} from './line-page-media.mjs';
import {renderDrySeparationHero} from './dry-separation-hero.mjs';
import {renderDrySeparationPurpose} from './dry-separation-purpose.mjs';
import {renderDrySeparationRaw} from './dry-separation-raw.mjs';
import {renderProEngineeringCenter} from './pro-engineering-center.mjs';
import {interactiveLineDiagram} from './line-diagram.mjs';
import {renderDryArchitectureHeading} from './dry-line-architecture.mjs';
import {renderProProcess} from './pro-process.mjs';
import {fullLineDiagram} from '../content/line-diagrams.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {imageSize} from './image-size.mjs';

const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}<span aria-hidden="true">↗</span></a>`;
function picture(key,{label,caption,full=false}={}){
 const m=pictures[key];
 const file=full?m.file:m.thumbnail;
 const {width,height}=imageSize(new URL('../public/assets/'+file,import.meta.url));
 return `<figure class="line-image line-image--${m.type}" ${mediaAttributes(m)}><a class="media-open" href="/assets/${m.file}" aria-label="Увеличить: ${escape(m.title)}"><img src="/assets/${file}" width="${width}" height="${height}" alt="${escape(m.title)}" loading="lazy" decoding="async">${label?`<span class="line-image-label">${label}</span>`:''}<span class="line-image-zoom" aria-hidden="true">⤢</span></a><figcaption>${caption||m.title}</figcaption></figure>`;
}
const rows=items=>items.map(([label,value])=>`<tr><th scope="row">${escape(label)}</th><td>${escape(value)}</td></tr>`).join('');
function unitCard([position,title,text,value,slug,key]){
 const n=nodes.find(n=>n.slug===slug),image=n?equipmentCardImages[n.slug]:null;
 const graphic=image?`<img src="/assets/${image.file}" srcset="/assets/${image.smallFile} 768w, /assets/${image.file} ${image.width}w" sizes="(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)" width="${image.width}" height="${image.height}" alt="${escape(title)}" loading="lazy" decoding="async">`:`<img src="/assets/${pictures[key].file}" alt="${escape(title)}" loading="lazy" decoding="async">`;
 return `<article class="line-unit-card${image?' line-unit-card--catalogue':' line-unit-card--technical'}"${image?` data-catalogue-image="${n.slug}" style="--unit-stone-top:${image.stoneColors[0]};--unit-stone-left:${image.stoneColors[1]};--unit-stone-right:${image.stoneColors[4]}"`:''}><div class="line-unit-visual">${graphic}<span>Поз. ${position}</span></div><div class="line-unit-copy"><h3>${title}</h3><p>${text}</p><strong>${value}</strong>${n?`<a class="text-link" href="${n.path}">Подробнее об узле ↗</a>`:'<span class="line-note">В составе представленной линии</span>'}</div></article>`;
}

export function renderFilmSeparation(line){
 const email=`mailto:${siteContacts.email}?subject=`+encodeURIComponent(`Запрос ЭРА: ${line.title}`);
 const documents=lineDocuments(line);
 return `<div class="film-line film-line--full">

 ${renderDrySeparationHero({line,email,metrics:[
   {value:lineMetrics[0][0],unit:lineMetrics[0][1],label:'Входное сырьё',detail:'С учётом загрязнений'},
   {value:lineMetrics[1][0],unit:lineMetrics[1][1],label:'Очищенная плёнка',detail:'При засорённости около 50%'},
   {value:lineMetrics[2][0].split(' × ')[0],unit:'потоков',label:'Раздельное накопление',detail:lineMetrics[2][0]+' '+lineMetrics[2][1]+' · пять бункеров'},
   {value:lineMetrics[3][0],unit:lineMetrics[3][1],label:'Масса тюка',detail:'Ориентир по проектной схеме'}
  ],metricNote:'750 кг/ч — рабочий ориентир при засоре около 50%. Выпуск зависит от состава сырья, влажности и режима.',documentHref:'#documents',documentText:'Техническое описание · PDF, 32 страницы'})}
 <nav class="anchor-nav line-anchor-nav" aria-label="Разделы линии"><a href="#purpose">Назначение</a><a href="#raw-materials">Сырьё</a><a href="#composition">Схема линии</a><a href="#process">Процесс</a><a href="#quality">Продукт</a><a href="#kair">КАИР</a><a href="#specs">Характеристики</a><a href="#placement">Габариты</a><a href="#photos">Фото</a><a href="#documents">Документы</a><a href="#request">Обратная связь</a><a href="#equipment">Состав узлов</a></nav>

 ${renderDrySeparationPurpose(line.slug)}

 ${renderDrySeparationRaw(line.slug)}

 <section class="section line-soft" id="composition">${renderDryArchitectureHeading(line.slug)}
  ${interactiveLineDiagram(fullLineDiagram,{fit:true,architecture:true})}

 </section>

 <section class="section" id="process">${renderProProcess(lineStages)}</section>

 <section class="section line-soft" id="quality">${renderDryProductCollage()}
  ${renderDryProductRoutes()}
 </section>

 <section class="section line-kair-section" data-page-progress-label="КАИР" id="kair">${renderDryKair()}</section>

 <section class="section" id="specs">${renderBaseSpecs(line)}</section>

 <section class="section" id="placement">
  ${renderProEngineeringCenter()}
  <div class="line-placement-notes pec-placement-notes"><div><h3>Условия размещения</h3><p>Предусматривают электроснабжение и заземление, вентиляцию, пневмотранспорт и пылеудаление, доступ для обслуживания, склады сырья и тюков. В комплектации — два вилочных погрузчика; маршруты увязывают с рабочими местами и выдачей продукции.</p><p>45 × 18 м и 810 м² относятся к показанному прямоугольному контуру. Складские запасы, проезды, безопасные зоны и коммуникации учитывают при проектной привязке.</p></div><div><h3>Сортировочный бокс и помещение</h3><p>Закрытый сортировочный бокс (поз. 28) объединяет рабочие места ручной сортировки, вентиляцию и освещение. Помещение цеха (поз. 29) предусматривает подключение линии, проезды и обслуживание.</p><p class="line-note">На исходном A0 сохранены собственные обозначения и размерные цепочки; локальные размеры не являются нормативами для помещения.</p></div></div>
 </section>

 ${renderDryPhotoAlbum()}

 <section class="section line-documents" id="documents"><div class="line-section-heading"><div><p class="eyebrow">ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ</p><h2>От состава линии<br>до габаритов в цехе.</h2></div><p>Брошюра комплекса, техническое описание от 2 ноября 2026 года и исходный габаритный лист A0 с проекциями и размерами.</p></div>${lineDocumentCards(documents)}<a class="text-link" href="/documents/?objectType=line&amp;product=separatsiya-02">Все документы линии в библиотеке ↗</a></section>

 <section class="section contact line-request" id="request"><div><p class="eyebrow">ПОД ВАШЕ СЫРЬЁ И ПЛОЩАДКУ</p><h2>Обсудим вашу<br>линию сепарации.</h2><p>Для подбора нужны фото или видео сырья, состав и загрязнённость, влажность, требуемая подача и продукт, план цеха и доступная мощность.</p></div><div>${button('Отправить запрос по линии',email)}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a><small>Заполните форму и приложите фотографии, видео или документы к заявке.</small></div></section>

 <section class="section line-soft" id="equipment"><div class="line-section-heading"><div><p class="eyebrow">ОБОРУДОВАНИЕ В СОСТАВЕ ЛИНИИ</p><h2>Изучите каждый узел.</h2></div><p>Назначение, рабочие показатели и прямые переходы на страницы машин представленной комплектации.</p></div>
  <div class="line-unit-grid">${lineUnits.map(unitCard).join('')}</div>
  <aside class="line-option"><div><p class="eyebrow">ДОПОЛНИТЕЛЬНЫЙ МОДУЛЬ</p><h3>Предварительный распушитель</h3><p>Устанавливается между измельчителем и баллистикой. Разрыхляет комки и разделяет слои, улучшая освобождение включений и сохранение полезной плёнки.</p></div><div><strong>37 кВт</strong><p>Учитываются дополнительно к 405,2 кВт представленной комплектации.</p><a class="text-link" href="/catalog/equipment/predvaritelnyy-raspushitel">Подробнее об узле ↗</a></div></aside>
 </section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}
 </div>`;
}
