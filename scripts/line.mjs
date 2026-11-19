import {nodes} from '../content/catalog.mjs';
import {filmSeparationMedia as pictures,lineMetrics,lineRawMaterials,lineStages,lineUnits,linePositions,lineSpecs,lineQuality} from '../content/film-separation.mjs';
import {mediaAttributes} from './media.mjs';
import {pdfViewerDialog} from './documents.mjs';
import {lineDocuments,lineDocumentCards,lineHeroImage} from './line-page-media.mjs';
import {linePower,dryLineProduction} from './line-power.mjs';
import {lineDimensions} from './line-dimensions.mjs';
import {interactiveLineDiagram} from './line-diagram.mjs';
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
 const email='mailto:edkom.office@mail.ru?subject='+encodeURIComponent(`Запрос ЭРА: ${line.title} — линия сухой сепарации плёнок`);
 const documents=lineDocuments(line);
 const staffing=line.cardMetrics.filter(m=>['Основной персонал','Сортировщики'].includes(m.label)).map(m=>[m.label,`${m.value} ${m.unit} · ${m.note}`]);
 const drawing=documents.find(d=>d.id==='separatsiya-02-dimensions-a0');
 return `<div class="film-line film-line--full">

 <section class="section line-hero">
  <div class="line-hero-copy"><p class="eyebrow">${escape(line.title.toLocaleUpperCase('ru'))} / ГОТОВАЯ ЛИНИЯ ЭРА</p><h1>Линия сухой сепарации плёнок и пакетов</h1><p class="line-slogan">Из загрязнённой плёнки —<br>в товарные партии.</p><p class="line-lead">Раскрытие пакетов, многоступенчатая очистка, ручной отбор и прессование. Подготовленная плёнка для продажи переработчикам или дальнейшей мойки.</p><div class="actions">${button('Обсудить линию',email)}${button('Схема и состав','#composition',true)}</div><a class="text-link line-document-shortcut" href="#documents">Техническое описание · PDF, 32 страницы ↓</a></div>
  <div class="line-hero-visual">${lineHeroImage(line)}<div class="line-hero-tags"><span>Сухая очистка</span><span>5 раздельных потоков</span><span>Автоматическая увязка</span></div></div>
  <div class="line-metrics"><dl>${lineMetrics.map(([value,unit,label])=>`<div><dt>${label}</dt><dd>${value}<small>${unit}</small></dd></div>`).join('')}</dl><p>750 кг/ч — рабочий ориентир при среднем засоре около 50%. Фактический выпуск зависит от состава сырья, влажности и режима.</p></div>
 </section>
 <nav class="anchor-nav line-anchor-nav" aria-label="Разделы линии"><a href="#purpose">Назначение</a><a href="#raw-materials">Сырьё</a><a href="#specs">Характеристики</a><a href="#process">Процесс</a><a href="#composition">Схема линии</a><a href="#quality">Продукт</a><a href="#placement">Габариты</a><a href="#kair">КАИР</a><a href="#photos">Фото</a><a href="#documents">Документы</a><a href="#equipment">Состав узлов</a></nav>

 <section class="section" id="purpose"><div class="line-section-heading"><div><p class="eyebrow">НАЗНАЧЕНИЕ</p><h2>Отделить лишнее.<br>Сохранить полезную плёнку.</h2></div><p>Линия удаляет основную массу крупных, твёрдых, мелких и микровключений. Раскрывает пакеты и слипшиеся слои, освобождает загрязнения и подготавливает материал к следующему переделу.</p></div>
  <div class="line-purpose-grid">${[['Меньше посторонней массы','Песок, земля, стекло, камни и другие отделяемые включения выводятся из потока до мойки и перевозки.'],['Выше ценность партии','Ручной отбор помогает разделять плёнку по цвету, известному полимерному составу и виду материала.'],['Удобнее хранить и перевозить','Пять накопителей и общий пресс формируют раздельные, автоматически увязанные тюки.']].map(([title,text])=>`<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>
 </section>

 <section class="section line-soft" id="raw-materials"><p class="eyebrow">С ЧЕМ РАБОТАЕМ</p><h2>Плёнка разного происхождения.<br>Настройки под вашу партию.</h2><div class="line-raw-grid">${lineRawMaterials.map(([key,title,text])=>`<article>${picture(key,{caption:title})}<h3>${title}</h3><p>${text}</p></article>`).join('')}</div>
  <div class="line-input-band"><div><strong>до 80<small>%</small></strong><span>Загрязнённость испытанного сырья</span></div><div><strong>до 30<small>%</small></strong><span>Влажность испытанного сырья</span></div><p>Засор и влажность определяют раздельно. По испытаниям и морфологическим анализам ЭРА типичный засор полигонной и сельскохозяйственной плёнки составлял 50–55%. Показатели входа не являются нормами качества готового продукта.</p></div>
  <details class="line-more"><summary>Какие включения отделяются и что остаётся для мойки</summary><div><div class="line-inclusions"><p><strong>Баллистика:</strong> объёмные предметы, часть песка, земли и просева.</p><p><strong>Ручной отбор:</strong> бумага, картон и другие отбираемые примеси.</p><p><strong>Ротор, диски и воздух:</strong> освобождённая мелочь, пенопласт и другие лёгкие микровключения.</p><p><strong>Пылеудаление:</strong> пыль и летучие частицы у роторного узла и во всех пяти бункерах.</p></div><p class="line-note">Этикетки, прилипшие жиры, масла и стойкие клеевые остатки удаляются на следующей стадии — горячей мойке.</p></div></details>
 </section>

 <section class="section" id="specs"><div class="line-section-heading"><div><p class="eyebrow">ПРОИЗВОДИТЕЛЬНОСТЬ И РЕСУРСЫ</p><h2>Параметры<br>представленной комплектации.</h2></div><p>Входной поток учитывает плёнку вместе с загрязнениями. Выпуск очищенного продукта и энергозатраты приведены для принятого в ТО рабочего режима.</p></div>
  <div class="line-specs-layout"><div class="table-wrap"><table class="line-spec-table"><caption>Основные показатели линии</caption><tbody>${rows([...lineSpecs,...staffing])}</tbody></table></div><aside class="line-output-panel era-indigo-surface"><p class="eyebrow">РАБОТА 24/7</p><h3>Выпуск очищенной плёнки</h3><dl><div><dt>За сутки / 24 часа</dt><dd>18 <small>т</small></dd></div><div><dt>За месяц / 30 суток</dt><dd>540 <small>т</small></dd></div><div><dt>За год / 365 суток</dt><dd>6 570 <small>т</small></dd></div></dl><p>Расчёт при 750 кг/ч и непрерывной работе, без вычета остановок. Фактический выпуск зависит от сырья, доступности оборудования и организации смен.</p></aside></div>
  ${linePower(line,{note:'Пневмотранспорт учтён один раз в мощности пяти бункеров: по 25,5 кВт на единицу. Пусковые режимы, вентиляцию и инфраструктуру учитывают в проекте электроснабжения.'})}
  ${dryLineProduction(line)}
 </section>

 <section class="section" id="process"><div class="line-section-heading"><div><p class="eyebrow">ДВИЖЕНИЕ МАТЕРИАЛА</p><h2>Шесть операций.<br>Связанная технология.</h2></div><p>Сначала плёнка освобождается от основной массы включений. Затем потоки разделяются, очищаются и накапливаются для поочерёдного прессования.</p></div>
  <ol class="line-stages">${lineStages.map(([title,text],i)=>`<li><span class="line-index">${String(i+1).padStart(2,'0')}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol>
  <div class="line-routing"><div class="line-routing-main"><span class="eyebrow">ОСНОВНОЙ ЦВЕТНОЙ МИКС</span><h3>Сортировка → ротор → пятый бункер</h3><p>Оставшийся на ленте материал проходит роторную, дисковую и воздушную очистку. Пневмотранспорт направляет плёнку в пятый накопитель.</p></div><div><span class="eyebrow">ЧЕТЫРЕ ВЫБРАННЫЕ ФРАКЦИИ</span><h3>Ручной отбор → четыре своих бункера</h3><p>На этом маршруте роторный узел ещё не пройден. Для дополнительной очистки накопленную по видам плёнку повторно подают в линию отдельной партией.</p></div><p class="line-routing-note">Все пять бункеров дополнительно отделяют пылевые включения. Перед сменой фракции очищают общие транспортёры; партии маркируют и хранят раздельно.</p></div>
  <div class="line-process-views">${picture('sorting')}${picture('bunkers')}</div>
  <details class="line-more"><summary>Открыть полную технологическую схему потоков</summary><div class="line-flow-diagram">${picture('flow',{full:true})}</div></details>
 </section>

 <section class="section line-soft" id="composition"><div class="line-section-heading"><div><p class="eyebrow">СОСТАВ ЛИНИИ</p><h2>От загрузки тюка<br>до двух выходных потоков.</h2></div><p>Плёнка выходит в тюках, отделённые включения — в биг-бэгах. Транспортёры, пневматические трассы, пылеудаление и управление связывают узлы в одну линию.</p></div>
  ${interactiveLineDiagram(fullLineDiagram,{fit:true})}

  <details class="line-more"><summary>Все позиции на схеме — 1–27</summary><div><ol class="line-position-list">${linePositions.map(([number,label])=>`<li><span>${number}</span>${label}</li>`).join('')}</ol><p class="line-note">Номера обозначают позиции схемы; одна позиция может включать несколько одинаковых агрегатов. Количество единиц поставки закрепляется в спецификации. Сортировочный бокс (28) и помещение цеха (29) описаны отдельно в разделе размещения.</p></div></details>

 </section>

 <section class="section line-soft" id="quality"><div class="line-section-heading"><div><p class="eyebrow">ПРОДУКТ И КАЧЕСТВО</p><h2>Очищенная плёнка.<br>Готовая к следующему шагу.</h2></div><p>Товарный продукт линии — подготовленная плёнка в раздельных тюках. Её можно продавать переработчикам или направлять на собственную линию мойки.</p></div>
  <div class="line-comparison">${picture('before',{label:'ДО СЕПАРАЦИИ',caption:'Плёнка с большой массой посторонних включений'})}${picture('after',{label:'ПОСЛЕ СЕПАРАЦИИ',caption:'Очищенный плёночный материал'})}</div>
  <div class="table-wrap"><table class="line-quality-table"><caption>Показатели готового продукта и критерии согласования партии</caption><thead><tr><th scope="col">Показатель</th><th scope="col">Что указано в техническом описании</th><th scope="col">Что оценивать для вашей партии</th></tr></thead><tbody>${lineQuality.map(([label,claim,check])=>`<tr><th scope="row">${label}</th><td data-label="По техническому описанию">${claim}</td><td data-label="Для вашей партии">${check}</td></tr>`).join('')}</tbody></table></div>
  <div class="line-evidence"><div><p class="eyebrow">ОСНОВАНИЕ ПОКАЗАТЕЛЕЙ</p><h3>Испытания, морфология и материалы работы</h3><p>Техническое описание содержит результаты испытаний на загрязнённом сырье, данные морфологических анализов ЭРА, сведения о потерях, расчёты выпуска, фотографии плёнки до и после очистки и снимки оборудования на площадках.</p></div><div><h3>Критерии качества под ваш материал</h3><p>Целевые значения остаточного засора, влажности и состава партии согласуются под требования покупателя или следующего передела. Основанием для приёмки служат согласованные показатели и результаты проверки конкретного сырья.</p><p class="line-note">В приложенном ТО нет отдельных протоколов испытаний и численных норм остаточного засора и выходной влажности. Фотографии показывают результат визуально.</p></div></div>
  <div class="line-next-process"><p class="eyebrow">ДАЛЬНЕЙШАЯ ПЕРЕРАБОТКА</p><ol><li><span>01</span><div><h3>Сухая сепарация</h3><p>Очищенная плёнка в раздельных тюках</p></div></li><li><span>02</span><div><h3>Горячая мойка и сушка</h3><p>Удаление остаточных этикеток, жиров, масел и клеёв; обезвоживание и уплотнение</p></div></li><li><span>03</span><div><h3>Грануляция</h3><p>Экструзия, дегазация и формование подготовленного полимера</p></div></li></ol></div>
 </section>

 <section class="section" id="placement"><div class="line-section-heading"><div><p class="eyebrow">ГАБАРИТЫ И РАЗМЕЩЕНИЕ</p><h2>Компоновка под цех.<br>Точность в каждом размере.</h2></div><p>Для площадки заказчика выполняется проектная привязка: расстановка узлов, подключения, проезды погрузчиков и доступ для обслуживания.</p></div>
 ${lineDimensions(drawing)}
 <div class="line-placement-notes"><dl class="line-placement-specs"><div><dt>Высота помещения по ТО</dt><dd>9 м</dd></div><div><dt>Высота оборудования по ТО</dt><dd>≈6,5 м</dd></div></dl><div><h3>Условия размещения</h3><p>Предусматривают электроснабжение и заземление, вентиляцию, пневмотранспорт и пылеудаление, доступ для обслуживания, склады сырья и тюков. В комплектации — два вилочных погрузчика; маршруты увязывают с рабочими местами и выдачей продукции.</p><p>45 × 18 м и 810 м² относятся к показанному прямоугольному контуру. Складские запасы, проезды, безопасные зоны и коммуникации учитывают при проектной привязке.</p></div><div><h3>Сортировочный бокс и помещение</h3><p>Закрытый сортировочный бокс (поз. 28) объединяет рабочие места ручной сортировки, вентиляцию и освещение. Помещение цеха (поз. 29) предусматривает подключение линии, проезды и обслуживание.</p><p class="line-note">На исходном A0 сохранены собственные обозначения и размерные цепочки; локальные размеры не являются нормативами для помещения.</p></div></div>
 </section>
 <section class="section line-kair-section" id="kair">  <div class="line-control era-indigo-surface"><div><p class="eyebrow">СИСТЕМА УПРАВЛЕНИЯ КАИР</p><h2>Видеть процесс.<br>Сохранять рабочие режимы.</h2><p>Согласование подачи, очистки и выгрузки накопителей. Удалённое наблюдение 24/7 и сохранённые настройки для повторяющегося сырья.</p><a class="text-link" href="/automation">Подробнее об управлении ↗</a></div><ul><li>Память режимов по поставщику и виду сырья</li><li>Контроль вибрации, шума и перегрузки</li><li>Журнал событий и действий оператора</li><li>Автоматическая последовательная защитная остановка</li><li>Видеоконтроль: камеры 4К и мониторы 55″</li><li>Управление на базе Siemens</li></ul></div></section>

 <section class="section line-soft" id="photos"><div class="line-section-heading"><div><p class="eyebrow">ОБОРУДОВАНИЕ В РАБОТЕ</p><h2>Реальные площадки.<br>Масштаб и детали.</h2></div><p>Материалы из технического описания: сборка и испытания в Китае, размещение и работа с плёночным сырьём в Нидерландах. Нажмите на изображение, чтобы увеличить.</p></div><div class="line-photo-grid">${['china-assembly','china-ballistic','china-air-separation','netherlands-line','netherlands-rotor','netherlands-feed'].map(key=>picture(key,{label:pictures[key].topic})).join('')}</div><p class="line-note">На производственной съёмке отсутствует сортировочная площадка, предусмотренная в полной комплектации.</p></section>

 <section class="section line-documents" id="documents"><div class="line-section-heading"><div><p class="eyebrow">ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ</p><h2>От состава линии<br>до габаритов в цехе.</h2></div><p>Брошюра комплекса, техническое описание от 2 ноября 2026 года и исходный габаритный лист A0 с проекциями и размерами.</p></div>${lineDocumentCards(documents)}<a class="text-link" href="/documents/?objectType=line&amp;product=separatsiya-02">Все документы линии в библиотеке ↗</a></section>
 <section class="section line-soft" id="equipment"><div class="line-section-heading"><div><p class="eyebrow">ОБОРУДОВАНИЕ В СОСТАВЕ ЛИНИИ</p><h2>Изучите каждый узел.</h2></div><p>Назначение, рабочие показатели и прямые переходы на страницы машин представленной комплектации.</p></div>
  <div class="line-unit-grid">${lineUnits.map(unitCard).join('')}</div>
  <aside class="line-option"><div><p class="eyebrow">ДОПОЛНИТЕЛЬНЫЙ МОДУЛЬ</p><h3>Предварительный распушитель</h3><p>Устанавливается между измельчителем и баллистикой. Разрыхляет комки и разделяет слои, улучшая освобождение включений и сохранение полезной плёнки.</p></div><div><strong>37 кВт</strong><p>Учитываются дополнительно к 402,67 кВт представленной комплектации.</p><a class="text-link" href="/catalog/equipment/predvaritelnyy-raspushitel">Подробнее об узле ↗</a></div></aside>
 </section>
 <section class="section contact line-request"><div><p class="eyebrow">ПОД ВАШЕ СЫРЬЁ И ПЛОЩАДКУ</p><h2>Обсудим вашу<br>линию сепарации.</h2><p>Для подбора нужны фото или видео сырья, состав и загрязнённость, влажность, требуемая подача и продукт, план цеха и доступная мощность.</p></div><div>${button('Отправить запрос по линии',email)}<a class="phone" href="tel:+79032813535">+7 903 281-35-35</a><a href="mailto:edkom.office@mail.ru">edkom.office@mail.ru</a><small>Заполните форму и приложите фотографии, видео или документы к заявке.</small></div></section>
 <script type="application/json" id="line-document-data">${JSON.stringify(documents).replaceAll('<','\\u003c')}</script>${pdfViewerDialog()}
 </div>`;
}
