import {renderDryDocumentEditions} from './dry-document-editions.mjs';
import {renderDryPhotoAlbum} from './dry-photo-album.mjs';
import {renderBaseSpecs} from './base-specs.mjs';
import {renderDryKair} from './dry-kair.mjs';
import {renderDryProductRoutes} from './dry-product-routes.mjs';
import {renderDryProductCollage} from './dry-product-collage.mjs';
import {siteContacts} from '../content/contact.mjs';
import {separation03Media as media,separation03Specification as specification,separation03Stages,separation03Units} from '../content/separation-03.mjs';
import {separation03Diagram} from '../content/separation-03-diagram.mjs';
import {interactiveLineDiagram} from './line-diagram.mjs';
import {renderDryArchitectureHeading} from './dry-line-architecture.mjs';
import {mediaAttributes} from './media.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments} from './line-page-media.mjs';
import {renderDrySeparationHero} from './dry-separation-hero.mjs';
import {renderDrySeparationPurpose} from './dry-separation-purpose.mjs';
import {renderDrySeparationRaw} from './dry-separation-raw.mjs';
import {nodes} from '../content/catalog.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {renderPremiumEngineeringCenter} from './premium-engineering-center.mjs';
import {renderPremiumProcess} from './premium-process.mjs';

const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const button=(label,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${label}<span aria-hidden="true">↗</span></a>`;
const heading=(index,title,lead='')=>`<div class="line-section-heading"><div><p class="eyebrow">${index}</p><h2>${title}</h2></div>${lead?`<p>${lead}</p>`:''}</div>`;
const more=(summary,body)=>`<details class="line-more" data-keep-open><summary>${summary}</summary><div>${body}</div></details>`;
const rows=items=>items.map(([label,value])=>`<tr><th scope="row">${escape(label)}</th><td>${escape(value)}</td></tr>`).join('');
function picture(key,{caption,label}={}){
 const m=media[key];
 const source=m.page?(m.type==='photo'?'Фотография':m.type==='scheme'?'Схема':'Проектная визуализация'):'Проектная визуализация линии · расширенная комплектация';
 return `<figure class="line-image line-image--${m.type}" ${mediaAttributes(m)}><a class="media-open" href="/assets/${m.file}" aria-label="Увеличить: ${escape(m.title)}"><img src="/assets/${m.file}" srcset="/assets/${m.smallFile} ${m.smallWidth}w${m.smallWidth<m.width?`, /assets/${m.file} ${m.width}w`:''}" sizes="(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)" width="${m.width}" height="${m.height}" alt="${escape(m.title)}" loading="lazy" decoding="async">${label?`<span class="line-image-label">${escape(label)}</span>`:''}<span class="line-image-zoom" aria-hidden="true">⤢</span></a><figcaption>${escape(caption||m.title)}<span>${source}</span></figcaption></figure>`;
}
function specificationTables(){
 return more('Спецификация линии: все 37 позиций',`<p class="line-note">Номер соответствует исходной компоновке. Одна позиция может включать несколько агрегатов. Выберите номер, чтобы открыть его описание на схеме. Размеры транспортёров — длина × ширина, площадь — на одну единицу.</p>${[[1,19],[20,37]].map(([from,to])=>`<div class="table-wrap"><table class="sd-specification"><caption>Позиции ${from}–${to}</caption><thead><tr><th scope="col">№</th><th scope="col">Оборудование</th><th scope="col">Количество</th><th scope="col">Параметр и назначение</th></tr></thead><tbody>${specification.filter(s=>s.position>=from&&s.position<=to).map(s=>`<tr data-separation03-position="${s.position}"><td><button type="button" data-separation03-select="${s.position}" aria-label="Показать на схеме: ${s.position}. ${escape(s.name)}">${String(s.position).padStart(2,'0')} ↑</button></td><th scope="row">${escape(s.name)}</th><td>${s.quantity} ${s.unit}</td><td>${escape(s.parameter)}<br><span class="line-note">${escape(s.purpose)}</span></td></tr>`).join('')}</tbody></table></div>`).join('')}<p class="line-note">По позициям 6, 7, 8, 25 и 26 — по две единицы; 17 — пять бункеров, 18 — четыре пневмоотбора, 29 — пять секций общего тракта, 37 — два погрузчика. Количество и состав поставки закрепляются спецификацией.</p>`);
}
function unitCard(item){
 const node=nodes.find(n=>n.slug===item.catalogSlug),image=equipmentCardImages[node.slug];
 return `<article class="line-unit-card line-unit-card--catalogue" data-catalogue-image="${node.slug}" style="--unit-stone-top:${image.stoneColors[0]};--unit-stone-left:${image.stoneColors[1]};--unit-stone-right:${image.stoneColors[4]}"><div class="line-unit-visual"><img src="/assets/${image.file}" srcset="/assets/${image.smallFile} 768w, /assets/${image.file} ${image.width}w" sizes="(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)" width="${image.width}" height="${image.height}" alt="${escape(item.name)}" loading="lazy" decoding="async"><span>Поз. ${item.position}</span></div><div class="line-unit-copy"><h3>${escape(item.name)}</h3><p>${escape(item.purpose)}</p><strong>${escape(item.parameter)}</strong><a class="text-link" href="${node.path}">Подробнее об узле ↗</a></div></article>`;
}

export function renderSeparationDrying(line){
 const documents=lineDocuments(line);
 const doc=documents.find(document=>document.id==='separatsiya-03-technical');
 const email=`mailto:${siteContacts.email}?subject=`+encodeURIComponent('Запрос ЭРА: '+line.cardTitle);
 return `<div class="film-line film-line--full film-line--drying" data-separation03-line>
 ${renderDrySeparationHero({line,email,metrics:[
   {value:line.cardMetrics[0].value,unit:line.cardMetrics[0].unit,label:'Входное сырьё',detail:'С учётом загрязнений'},
   {value:line.cardMetrics[1].value,unit:line.cardMetrics[1].unit,label:'Очищенная плёнка',detail:'При засорённости около 50%'},
   {value:line.cardMetrics[2].value,unit:line.cardMetrics[2].unit,label:'Влажность после сушилки',detail:'Не норма влажности отгружаемых тюков'},
   {value:line.cardMetrics[5].value,unit:'потоков',label:'Раздельное накопление',detail:'Пять бункеров по 4,7 м³'}
  ],metricNote:'750 кг/ч — расчёт при засорённости около 50%. До 5% — влажность после сушилки; влажность готового тюка проверяют по пробе. Фактический выпуск зависит от сырья и режима.',documentHref:'/documents/'+doc.file,documentText:'Техническое описание · PDF, 28 страниц',documentAttributes:'data-pdf-open="'+doc.id+'"'})}
 <nav class="anchor-nav line-anchor-nav" aria-label="Разделы линии">${[['purpose','Назначение'],['raw-materials','Сырьё'],['composition','Схема линии'],['process','Процесс'],['quality','Продукт'],['kair','КАИР'],['specs','Характеристики'],['placement','Размещение'],['photos','Фото'],['documents','Документы'],['request','Обратная связь'],['equipment','Состав узлов']].map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</nav>

 ${renderDrySeparationPurpose(line.slug)}

 ${renderDrySeparationRaw(line.slug)}

 <section class="section line-soft" id="composition">${renderDryArchitectureHeading(line.slug)}
  ${interactiveLineDiagram(separation03Diagram,{fit:true,architecture:true})}
 </section>

 <section class="section" id="process">${renderPremiumProcess(separation03Stages)}</section>

 <section class="section line-soft" id="quality">${renderDryProductCollage()}
  ${renderDryProductRoutes()}
 </section>

 <section class="section line-kair-section" data-page-progress-label="КАИР" id="kair">${renderDryKair()}</section>

 <section class="section" id="specs">${renderBaseSpecs(line)}</section>

 <section class="section" id="placement">
  ${renderPremiumEngineeringCenter()}
  <div class="line-placement-notes"><div><h3>Подача и выдача</h3><p>Свободные проезды двух погрузчиков, склады сырья и продукции, места смены тары и снятия тюков.</p></div><div><h3>Обслуживание и сети</h3><p>Доступ к приводам, люкам, подвижной щеке, сушилке и бункерам. Электропитание, заземление, воздуховоды, нагрев и отвод конденсата.</p></div><div><h3>Изолированная сортировка</h3><p>Площадка 13 в ангаре 35: рабочие места вдоль ленты, освещение, вентиляция и доступ к шахтам сброса. Монтажные отметки, нагрузки и точки подключения уточняются под конкретный цех.</p></div></div></section>

 ${renderDryPhotoAlbum()}

 ${renderDryDocumentEditions(line,documents)}

 <section class="section contact line-request" id="request"><div><p class="eyebrow">ПОД ВАШЕ СЫРЬЁ И ПЛОЩАДКУ</p><h2>Подберём режим<br>и расстановку линии.</h2><p>Учитываем фактический состав и влажность сырья, засорённость, формат подачи и требования к готовой плёночной фракции. Пробная партия помогает оценить выход, влажность после сушилки и целесообразность ручного отбора.</p>${more('Что подготовить для подбора',`<p>Фото и видео партии, известные полимеры, размеры и масса тюков, длина фрагментов, толщина плёнки, анализ или представительная проба, планируемая подача и сменность. Для площадки — план и высота цеха, доступная мощность, источник нагрева, отвод конденсата и склады.</p><p>При дальнейшем расширении учитываем выдачу на горячую мойку и последующую грануляцию.</p>`)}</div><div>${button('Оценить моё сырьё',email)}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a><small>Приложите фотографии, видео или документы к заявке.</small></div></section>

 <section class="section line-soft" id="equipment">${heading('ОБОРУДОВАНИЕ В СОСТАВЕ','Изучите каждый узел.','Прямые переходы к существующим страницам оборудования. Исполнение и количество единиц определяются спецификацией линии.')}<div class="line-unit-grid">${specification.filter(s=>s.catalogSlug).map(unitCard).join('')}</div><p class="line-note">Роторная сушильная установка 10, воздушный контур 34, пресс 23 и рольганг 24 описаны в техническом описании и в блоке устройства ключевых узлов.</p></section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}</div>`;
}
