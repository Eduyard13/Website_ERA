import {renderDryProductRoutes} from './dry-product-routes.mjs';
import {renderDryProductCollage} from './dry-product-collage.mjs';
import {siteContacts} from '../content/contact.mjs';
import {separation03Media as media,separation03Specification as specification,separation03Staff,separation03Stages,separation03Units} from '../content/separation-03.mjs';
import {separation03Diagram} from '../content/separation-03-diagram.mjs';
import {interactiveLineDiagram} from './line-diagram.mjs';
import {renderDryArchitectureHeading} from './dry-line-architecture.mjs';
import {mediaAttributes} from './media.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments,lineDocumentCards} from './line-page-media.mjs';
import {renderDrySeparationHero} from './dry-separation-hero.mjs';
import {renderDrySeparationPurpose} from './dry-separation-purpose.mjs';
import {renderDrySeparationRaw} from './dry-separation-raw.mjs';
import {linePower,dryLineProduction} from './line-power.mjs';
import {nodes} from '../content/catalog.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {lineDimensions} from './line-dimensions.mjs';
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
 const drawing=documents.find(document=>document.id==='separatsiya-03-dimensions');
 const {primary,operators,forkliftDrivers,sorters,total}=separation03Staff;
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

 <section class="section line-kair-section" id="kair"><div class="line-control era-indigo-surface"><div><p class="eyebrow">УПРАВЛЕНИЕ КАИР</p><h2>Согласовать движение.<br>Сохранить рабочий режим.</h2><p>КАИР координирует пуск и остановку, регулирует подачу к измельчителю, распушителям, двум сепараторам, сушилке и накопителям. Оператор задаёт режим по сырью и следит за прохождением партии.</p><a class="text-link" href="/automation">Подробнее об управлении ↗</a></div><ul><li>Память режимов для повторяющихся партий</li><li>Согласование сушки и воздушного контура</li><li>Контроль вибрации, шума, перегрузки и температур</li><li>Защитная последовательная остановка</li><li>Журнал событий и удалённое наблюдение</li><li>Шкаф Siemens, камеры 4К, компьютер, мониторы 55″</li><li>Контроль температуры внутри силового шкафа</li></ul></div>${more('Настоящие экраны панели оператора из ТО',`<div class="line-comparison">${picture('kair-screen')}${picture('kair-overview')}</div><p class="line-note">Состав контролируемых сигналов и настройки нагрева задаются выбранной комплектацией.</p>`)}</section>

 <section class="section" id="specs">${heading('ПРОИЗВОДИТЕЛЬНОСТЬ И РЕСУРСЫ','Параметры<br>расширенной комплектации.','Входной поток включает загрязнения. Выпуск и энергозатраты приведены для принятого в техническом описании рабочего режима.')}<div class="line-specs-layout"><div class="table-wrap"><table class="line-spec-table"><caption>Основные показатели</caption><tbody>${rows([['Входное сырьё с включениями','1 500 кг/ч'],['Выход очищенной плёнки при засоре около 50%','750 кг/ч'],['Влажность входного сырья','До 30%'],['Влажность плёнки на выходе из сушилки','До 5%'],['Баллистические ступени','2'],['Раздельное накопление','5 бункеров по 4,7 м³'],['Масса тюка по проектной схеме','Около 700 кг'],['Основной персонал',`${primary} человека в смену: ${operators} оператор + ${forkliftDrivers} водителя погрузчика`],['Сортировщики',`${sorters} дополнительно, в зависимости от фракций и сырья`],['Всего в рабочей смене',`${total} человек с учётом сортировки`],['Установленная мощность','639,77 кВт'],['Расчётная потребляемая мощность','447,84 кВт — 70% от установленной'],['Ленточные транспортёры','28 шт.'],['Удельный расход на входное сырьё','298,56 кВт·ч/т'],['Удельный расход на очищенную плёнку','597,12 кВт·ч/т'],['Режим расчёта','24 часа в сутки; 30 суток в месяц']])}</tbody></table></div><aside class="line-output-panel era-indigo-surface"><p class="eyebrow">РАБОТА 24/7</p><h3>Выпуск очищенной плёнки</h3><dl>${[['18','За сутки / 24 часа'],['540','За месяц / 30 суток'],['6 570','За год / 365 суток']].map(([value,label])=>`<div><dt>${label}</dt><dd>${value} <small>т</small></dd></div>`).join('')}</dl><p>Расчёт при 750 кг/ч и непрерывной работе, без вычета остановок. Фактический выпуск зависит от свойств сырья, подачи и организации смен.</p></aside></div>
 ${linePower(line,{note:'Пневмотранспорт на позициях 18 и 19 учтён один раз в мощности бункеров.'})}
 ${dryLineProduction(line,{note:'Четыре сменные бригады работают по графику ротации. Для влажного сырья массу удалённой воды учитывают отдельно от посторонних включений.'})}
 </section>

 <section class="section" id="placement">${heading('РАЗМЕЩЕНИЕ ЛИНИИ','Готовая компоновка.<br>Привязка под ваш цех.','Зоны подачи тюков и насыпного сырья, проезды двух погрузчиков, выдача тюков и биг-бэгов, проходы обслуживания и инженерные сети.')} ${lineDimensions(drawing)}<div class="line-placement-notes"><div><h3>Подача и выдача</h3><p>Свободные проезды погрузчиков, склады сырья и продукции, места смены тары и снятия тюков.</p></div><div><h3>Обслуживание и сети</h3><p>Доступ к приводам, люкам, подвижной щеке, сушилке и бункерам. Электропитание, заземление, воздуховоды, нагрев и отвод конденсата.</p></div><div><h3>Изолированная сортировка</h3><p>Площадка 13 в ангаре 35: рабочие места вдоль ленты, освещение, вентиляция и доступ к шахтам сброса. Монтажные отметки, нагрузки и точки подключения уточняются под конкретный цех.</p></div></div></section>

 <section class="section line-soft" id="photos">${heading('ОБОРУДОВАНИЕ И ДЕТАЛИ','Фотографии из<br>технического описания.','Отдельные узлы и пример размещения сухой сепарации ЭРА на производственной площадке. Нажмите на изображение для увеличения.')}<div class="line-photo-grid">${['pre-opener-photo','rotor','rotor-disc','rotor-hood','bag-frame','installation'].map(key=>picture(key)).join('')}</div><p class="line-note">Фотографии отдельных узлов и пример площадки иллюстрируют оборудование. Проектные изображения компоновки и машин подписаны как визуализации.</p><a class="text-link" href="/media/" data-photo-gallery data-product="/catalog/lines/separatsiya-03">Материалы этой линии в медиатеке ↗</a></section>

 <section class="section line-documents" id="documents">${heading('ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ','От состава линии<br>до размещения и управления.','Брошюра линии, техническое описание на 28 страницах от 18 ноября 2026 года и исходный габаритный чертёж A0.')}${lineDocumentCards(documents)}<a class="text-link" href="/documents/technical/?objectType=line&amp;product=separatsiya-03">Техническое описание в инженерной библиотеке ↗</a></section>

 <section class="section contact line-request" id="request"><div><p class="eyebrow">ПОД ВАШЕ СЫРЬЁ И ПЛОЩАДКУ</p><h2>Подберём режим<br>и расстановку линии.</h2><p>Учитываем фактический состав и влажность сырья, засорённость, формат подачи и требования к готовой плёночной фракции. Пробная партия помогает оценить выход, влажность после сушилки и целесообразность ручного отбора.</p>${more('Что подготовить для подбора',`<p>Фото и видео партии, известные полимеры, размеры и масса тюков, длина фрагментов, толщина плёнки, анализ или представительная проба, планируемая подача и сменность. Для площадки — план и высота цеха, доступная мощность, источник нагрева, отвод конденсата и склады.</p><p>При дальнейшем расширении учитываем выдачу на горячую мойку и последующую грануляцию.</p>`)}</div><div>${button('Оценить моё сырьё',email)}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a><small>Приложите фотографии, видео или документы к заявке.</small></div></section>

 <section class="section line-soft" id="equipment">${heading('ОБОРУДОВАНИЕ В СОСТАВЕ','Изучите каждый узел.','Прямые переходы к существующим страницам оборудования. Исполнение и количество единиц определяются спецификацией линии.')}<div class="line-unit-grid">${specification.filter(s=>s.catalogSlug).map(unitCard).join('')}</div><p class="line-note">Роторная сушильная установка 10, воздушный контур 34, пресс 23 и рольганг 24 описаны в техническом описании и в блоке устройства ключевых узлов.</p></section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}</div>`;
}
