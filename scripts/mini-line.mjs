import {siteContacts} from '../content/contact.mjs';
import {nodes} from '../content/catalog.mjs';
import {miniFilmSeparationMedia,miniLineMetrics,miniRawMaterials,miniInclusions,miniStages,miniSpecification,miniUnits,miniSpecs,miniQuality,miniService} from '../content/mini-film-separation.mjs';
import {mediaAttributes} from './media.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments,lineDocumentCards} from './line-page-media.mjs';
import {renderDrySeparationHero} from './dry-separation-hero.mjs';
import {renderDrySeparationPurpose} from './dry-separation-purpose.mjs';
import {renderDrySeparationRaw} from './dry-separation-raw.mjs';
import {linePower,dryLineProduction} from './line-power.mjs';
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
  ],metricNote:'750 кг/ч — расчёт при засоре около 50%. Паспорт базового распушителя указывает 600–700 кг/ч. Выпуск подтверждаем на выбранном сырье и комплектации.',documentHref:'#documents',documentText:'Техническое описание · PDF, 14 страниц'})}
 <nav class="anchor-nav line-anchor-nav" aria-label="Разделы линии BASE"><a href="#purpose">Назначение</a><a href="#raw-materials">Сырьё</a><a href="#composition">Схема линии</a><a href="#process">Процесс</a><a href="#quality">Продукт</a><a href="#specs">Характеристики</a><a href="#equipment">Состав узлов</a><a href="#placement">Габариты</a><a href="#kair">КАИР</a><a href="#photos">Фото</a><a href="#documents">Документы</a></nav>

 ${renderDrySeparationPurpose(line.slug)}

 ${renderDrySeparationRaw(line.slug)}

 <section class="section line-soft" id="composition">${renderDryArchitectureHeading(line.slug)}
  ${interactiveLineDiagram(miniLineDiagram,{fit:true,architecture:true})}
  <p class="line-note">Позиции 12 — пылеулавливание и 13 — шкаф управления входят в базовую спецификацию. На общей компоновке они не показаны: размещение уточняют при привязке линии к площадке.</p>
 </section>

 <section class="section" id="process">${renderBaseProcess(miniStages)}</section>

 <section class="section line-soft" id="quality"><div class="line-section-heading"><div><p class="eyebrow">ПРОДУКТ И КАЧЕСТВО</p><h2>Очищенная плёнка.<br>Подготовленная к мойке.</h2></div><p>Продукт линии BASE — плёночная фракция после сухой очистки. Состав микса определяется исходной партией; параметры для продажи или дальнейшей переработки согласуют с покупателем и следующим участком.</p></div>
  <div class="line-comparison">${picture('before',{label:'ДО СЕПАРАЦИИ',caption:'Исходная плёнка с посторонними включениями'})}${picture('after',{label:'ПОСЛЕ СЕПАРАЦИИ',caption:'Очищенная плёночная фракция'})}</div>
  <div class="mini-quality-results"><div><strong>80% → ≤10%</strong><span>Засор до и после очистки на испытаниях</span></div><div><strong>3–5%</strong><span>Потери полезной плёнки на испытаниях</span></div><p>Для партии заказчика отдельно измеряют засор, выход продукции, влажность и потери полезной плёнки.</p></div>
  <div class="table-wrap"><table class="line-quality-table"><caption>Показатели продукта и контроль пробной партии</caption><thead><tr><th scope="col">Показатель</th><th scope="col">По техническому описанию</th><th scope="col">Как проверяют</th></tr></thead><tbody>${miniQuality.map(([label,claim,check])=>`<tr><th scope="row">${label}</th><td data-label="По техническому описанию">${claim}</td><td data-label="На пробной партии">${check}</td></tr>`).join('')}</tbody></table></div>
  <div class="line-evidence"><div><p class="eyebrow">ЧЕМ ПОДТВЕРЖДАЕТСЯ РЕЗУЛЬТАТ</p><h3>Техописание, фотографии и пробная партия</h3><p>В документе приведены результаты испытаний и фотографии исходного сырья, очищенной плёнки и отделённых включений. Перед поставкой проверяют конкретное сырьё заказчика и фиксируют условия работы.</p></div><div><h3>Показатели для вашего производства</h3><p>Приёмку связывают с согласованными значениями и замерами партии: остаточным засором, влажностью, выпуском, потерями и составом плёночного микса.</p><p class="line-note">Отдельные протоколы испытаний в приложенном ТО не опубликованы. Фотографии показывают результат визуально; численное значение выходной влажности согласуется отдельно.</p></div></div>
  <div class="line-next-process"><p class="eyebrow">ДАЛЬНЕЙШИЙ ПУТЬ МАТЕРИАЛА</p><ol><li><span>01</span><div><h3>Сухая сепарация</h3><p>Подготовленная плёнка одним общим потоком</p></div></li><li><span>02</span><div><h3>Горячая мойка</h3><p>Удаление стойких жиров, масел, клея и этикеток; обезвоживание перед грануляцией</p></div></li><li><span>03</span><div><h3>Грануляция</h3><p>Получение гранулы из подготовленного полимера; применение зависит от состава и характеристик партии</p></div></li></ol></div>

 <div class="mini-line-options" id="options"><div class="line-section-heading"><div><p class="eyebrow">ВАРИАНТЫ ПРИЁМА И РАСШИРЕНИЯ</p><h3>Под вашу задачу.<br>С возможностью расширения.</h3></div><p>Базовая линия выдаёт общий плёночный микс. Дополнительные участки подбирают под нужный продукт, логистику и дальнейшую переработку.</p></div>  <aside class="line-option"><div><p class="eyebrow">ВЫДАЧА ПРОДУКТА</p><h3>Приёмная секция под вашу площадку</h3><p>На площадках в Китае и Нидерландах очищенную плёнку принимали в ограждённую сетчатую секцию. Её размер, точку подачи и доступ для выгрузки подбирают под организацию смены.</p></div><div><strong>1 поток плёнки</strong><p>Далее — накопление, продажа переработчику или подача на собственную мойку. Форма выдачи согласуется при подборе линии.</p></div></aside>
<div class="line-purpose-grid"><article><h3>Сортировка по видам</h3><p>Дополнительный сортировочный бокс по согласованию позволяет выделять ценные виды плёнки, например прозрачную, в отдельные потоки.</p><a class="text-link" href="/catalog/lines/separatsiya-02">Посмотреть комплектацию PRO ↗</a></article><article><h3>Подача на мойку</h3><p>Конвейер передаёт очищенную плёнку на собственный участок мойки. Способ передачи согласуют при размещении.</p></article><article><h3>Прессование в тюки</h3><p>Дополнительный автоматизированный пресс формирует и увязывает тюки для хранения, продажи или перевозки.</p></article></div><p class="line-note">Сортировочный бокс, мойка и пресс не входят в приведённые 13 позиций и мощность 225 кВт базовой комплектации. Их состав и нагрузки учитывают дополнительно.</p></div>
 </section>

 <section class="section" id="specs"><div class="line-section-heading"><div><p class="eyebrow">ПОКАЗАТЕЛИ И РЕСУРСЫ</p><h2>Производительность.<br>Мощность. Персонал.</h2></div><p>Показатели линии BASE приведены по техническому описанию от 3 ноября 2026 года. Входной поток включает полезную плёнку и все примеси.</p></div>
  <div class="line-specs-layout"><div><div class="table-wrap"><table class="line-spec-table"><caption>Базовая комплектация</caption><tbody>${rows(miniSpecs)}</tbody></table></div><p class="line-note">750 кг/ч — расчётный ориентир, а не паспортная производительность отдельного распушителя. Для базового узла в ТО указаны 600–700 кг/ч; выпуск линии подтверждают на выбранном исполнении и пробной партии сырья.</p></div><aside class="line-output-panel era-indigo-surface"><p class="eyebrow">РАСЧЁТ ПРИ 750 КГ/Ч</p><h3>Выпуск очищенной плёнки</h3><dl><div><dt>За час работы</dt><dd>0,75 <small>т</small></dd></div><div><dt>За сутки / 24 часа</dt><dd>18 <small>т</small></dd></div><div><dt>За 30 суток</dt><dd>540 <small>т</small></dd></div><div><dt>За год / 365 суток</dt><dd>6 570 <small>т</small></dd></div></dl><p>При непрерывной работе, без вычета остановок. Фактический выпуск зависит от сырья, доступности оборудования и организации смен.</p></aside></div>
  ${linePower(line,{note:'Для позиций 4, 11 и 13 отдельных значений в ведомости нет. Пусковые нагрузки и электроснабжение учитывают при проектировании площадки.'})}
  ${dryLineProduction(line)}
  <details class="line-more" data-keep-open><summary>Полная спецификация базовой комплектации</summary><div><div class="table-wrap"><table class="mini-specification-table"><caption>По одной единице на позицию</caption><thead><tr><th scope="col">№</th><th scope="col">Оборудование</th><th scope="col">Основные параметры</th></tr></thead><tbody>${miniSpecification.map(([position,name,parameter])=>`<tr><td>${position}</td><th scope="row">${escape(name)}</th><td>${escape(parameter)}</td></tr>`).join('')}</tbody></table></div></div></details>
 </section>

 <section class="section line-soft" id="equipment"><div class="line-section-heading"><div><p class="eyebrow">ОБОРУДОВАНИЕ В СОСТАВЕ ЛИНИИ</p><h2>Изучите каждый узел.</h2></div><p>Подготовка сырья, сухая очистка и сбор отделённых включений. Перейдите к паспортам оборудования в каталоге.</p></div><div class="line-unit-grid">${miniUnits.map(unitCard).join('')}</div></section>
 <section class="section" id="placement"><div class="line-section-heading"><div><p class="eyebrow">ГАБАРИТЫ И РАЗМЕЩЕНИЕ</p><h2>Компактная расстановка.<br>Доступ к каждому узлу.</h2></div><p>17,75 × 11,75 м — габарит механической части в плане. Проходы, загрузку, выгрузку и смену биг-бэгов учитывают дополнительно при привязке к площадке.</p></div>
  ${lineDimensions(drawing)}
 </section>

 <section class="section line-kair-section" id="kair"><div class="line-section-heading"><div><p class="eyebrow">СИСТЕМА УПРАВЛЕНИЯ</p><h2>Одна линия.<br>Согласованная работа.</h2></div><p>КАИР на базе Siemens управляет последовательностью операций и сохраняет режимы под сырьё. Настройка подачи и отбора, контроль состояния и защитная остановка — в едином интерфейсе.</p></div>
  <div class="line-control era-indigo-surface"><div><p class="eyebrow">УПРАВЛЕНИЕ КАИР / SIEMENS</p><h3>Согласованная работа.<br>Понятный контроль.</h3><p>Система управляет движением материала, сохраняет настройки под сырьё и помогает контролировать состояние линии онлайн 24/7.</p><a class="text-link" href="/automation">Подробнее об управлении ↗</a></div><ul><li>Память режимов по поставщику и группе сырья</li><li>Последовательность пуска и останова, согласование подачи</li><li>Настройки наклона сепаратора и воздушного отбора</li><li>Журнал команд, предупреждений и защитных остановок</li><li>Контроль вибрации, шума и нагрузки механизмов</li><li>Видеоконтроль: камеры 4К и мониторы 55″, состав по согласованию</li></ul></div>
  <details class="line-more" data-keep-open><summary>Обслуживание и доступ к сменным деталям</summary><div class="line-inclusions">${miniService.map(([title,text])=>`<div><h3>${title}</h3><p>${text}</p></div>`).join('')}<p class="line-note">Карту обслуживания сверяют с паспортами поставляемого исполнения и режимом работы.</p></div></details>
 </section>

 <section class="section line-soft" id="photos"><div class="line-section-heading"><div><p class="eyebrow">ФОТОГРАФИИ ИЗ ТЕХОПИСАНИЯ</p><h2>Оборудование и результат.<br>В деталях.</h2></div><p>Оригинальные фотографии роторного узла на сборке, очищенной плёнки и отделённых примесей. Нажмите на изображение, чтобы рассмотреть его крупнее.</p></div><div class="line-photo-grid">${picture('rotor',{label:'СБОРКА УЗЛА'})}${picture('after-close',{label:'ОЧИЩЕННАЯ ПЛЁНКА'})}${picture('rejects',{label:'ОТДЕЛЁННЫЕ ПРИМЕСИ'})}</div></section>

 <section class="section line-documents" id="documents"><div class="line-section-heading"><div><p class="eyebrow">ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ</p><h2>Брошюра, техническое описание<br>и габаритная схема.</h2></div><p>Техническое описание линии BASE от 3 ноября 2026 года: 14 страниц о сырье, потоках, оборудовании, качестве продукта, спецификации, размещении, управлении и обслуживании.</p></div>${lineDocumentCards(documents)}<a class="text-link" href="/documents/?objectType=line&amp;product=separatsiya-01">Все документы линии BASE в библиотеке ↗</a></section>

 <section class="section contact line-request"><div><p class="eyebrow">ПОДБОР ЛИНИИ BASE</p><h2>Обсудим ваше сырьё<br>и будущую линию.</h2><p>Пришлите фото или видео материала, состав примесей, засорённость и влажность, требуемую подачу и форму продукта, план цеха и доступную мощность.</p></div><div>${button('Отправить запрос по линии BASE',email)}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a><small>Заполните форму и приложите фотографии, видео или документы к заявке.</small></div></section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}
 </div>`;
}
