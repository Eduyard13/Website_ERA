import {lines,nodes} from '../content/catalog.mjs';
import {technologyContent as content} from '../content/technology-final.mjs';
import {drySeparationOverview as overview,washingConfigurations} from '../content/technology-lines.mjs';
import {hotWashMedia} from '../content/hot-film-washing.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {kairSlides,kairPresentation} from '../content/kair.mjs';
import {technicalInputs} from '../content/presentation-web.mjs';
import {projectRequestHref} from './contact.mjs';
import {escapeContact as escape} from './contact-channels.mjs';
import {imageSize} from './image-size.mjs';
import {lineCoverFiles} from './line-page-media.mjs';
import {materialBalance} from './presentation-web.mjs';
import {qualityVisual} from './quality.mjs';
import {kairMonitor} from './kair.mjs';
export {renderKairSystem as presentationAutomation} from './kair-system.mjs';

const arrow='<span aria-hidden="true">↗</span>';
const stageArrow='<span aria-hidden="true">→</span>';
const dryLines=lines.filter(line=>line.enabled&&line.group==='Сепарация');
const dryExample=dryLines.find(line=>line.slug==='separatsiya-02');
const washLine=lines.find(line=>line.slug==='moyka-plenki'&&line.enabled);
const findNode=slug=>nodes.find(node=>node.slug===slug);
const dimensions=file=>imageSize(new URL('../public/assets/'+file,import.meta.url));
const materialSizes='(max-width:599px) calc(100vw - 40px), (max-width:999px) 46vw, 416px';

function photo({file,small,alt},{sizes=materialSizes}={}){
 const {width,height}=dimensions(file);
 const smallWidth=small&&small!==file?dimensions(small).width:0;
 const srcset=smallWidth&&smallWidth<width?` srcset="/assets/${escape(small)} ${smallWidth}w, /assets/${escape(file)} ${width}w" sizes="${escape(sizes)}"`:'';
 return `<img src="/assets/${escape(file)}"${srcset} width="${width}" height="${height}" alt="${escape(alt)}" loading="lazy" decoding="async">`;
}

function mediaImage(media){
 return {file:media.file,small:media.smallFile,alt:media.title};
}

function equipmentImage(node){
 const image=equipmentCardImages[node.slug];
 return {file:image.file,small:image.smallFile,alt:`Каталожный рендер · ${node.title}`};
}

function heading(id,title,{lead='',kicker=''}={}){
 return `<header class="tf-heading">${kicker?`<p class="eyebrow">${escape(kicker)}</p>`:''}<h2 id="${id}">${escape(title)}</h2>${lead?`<p class="tf-lead">${escape(lead)}</p>`:''}</header>`;
}

function disclosure(title,body){
 return `<details class="tf-details" data-keep-open><summary>${escape(title)}</summary><div>${body}</div></details>`;
}

function hero(){
 const image='/assets/technology/hero/technology-hero-transformation';
 return `<section class="tf-hero tf-dark era-indigo-surface" id="technology-intro" aria-labelledby="technology-hero-heading" data-page-progress-label="Технология переработки">
  <div class="tf-container">
   <div class="tf-hero-copy">
    <p class="eyebrow">ЭРА / ТЕХНОЛОГИЯ ЗАМКНУТОГО ЦИКЛА</p>
    <h1 id="technology-hero-heading">Загрязнение не определяет будущее полимера.</h1>
    <p class="tf-hero-hook">Его будущее определяет технология.</p>
    <p class="tf-hero-lead">Последовательная сухая сепарация и глубокая горячая мойка позволяют преобразовывать невостребованные плёночные отходы в высококачественное полимерное сырьё, способное вновь использоваться в производстве плёнок и других изделий.</p>
    <a class="button tf-gold-button" href="#raw-material">Как работает технология <span aria-hidden="true">↓</span></a>
   </div>
  </div>
  <picture class="tf-hero-art">
   <source type="image/webp" srcset="${image}-800.webp 800w, ${image}.webp 1536w"
    sizes="(max-width:810px) 100vw, (max-width:1023px) 810px, (max-width:1800px) 60vw, 1080px">
   <img src="${image}.png" width="1536" height="1024"
    alt="Загрязнённые пакеты, очищенные фрагменты плёнки и светлая полимерная гранула"
    fetchpriority="high" decoding="async">
  </picture>
 </section>`;
}

function outline(){
 const sections=[['Сырьё','raw-material'],['Технология','solution'],['Продукция','products'],['Качество','granule-quality'],['Применение','applications']];
 return `<nav class="tf-outline" aria-label="Разделы технологии"><div class="tf-outline-track">${sections.map(([label,id])=>`<a href="#${id}">${label}</a>`).join('')}</div></nav>`;
}

function rawMaterials(){
 return `<section class="tf-section" id="raw-material" data-page-progress-label="Сырьё">
  <div class="tf-container">
   ${heading('raw-title','Мы работаем с трудноочищаемым плёночным сырьём.',{lead:'Плёнки после использования удерживают загрязнения между слоями, в складках и на поверхности. Для переработки важны состав, форма материала, засорённость и влажность.'})}
   <div class="tf-feedstocks">
    ${content.feedstocks.map(({id,title,text,image})=>`<article class="tf-material-card" data-feedstock-type="${id}">
     ${image?`<figure>${photo(image)}</figure>`:''}
     <div class="tf-material-copy"><h3>${escape(title)}</h3><p>${escape(text)}</p>${image?.note?`<p class="tf-image-note">${escape(image.note)}</p>`:''}</div>
    </article>`).join('')}
   </div>
   <p class="tf-caption">Биг-бэги часто изготовлены из ПП. Совместимость ПЭ, ПП, многослойных и других полимеров определяют отдельно.</p>
   <div class="tf-trials">
    <dl><div><dt>до 80%</dt><dd>засорённость испытанного сырья</dd></div><div><dt>до 30%</dt><dd>влажность испытанного сырья</dd></div></dl>
    <p>Предельные показатели испытаний оценивают раздельно. Производительность при совместном влиянии влаги и включений проверяют на конкретном сырье.</p>
   </div>
  </div>
 </section>`;
}

function contaminants(){
 return `<section class="tf-section tf-contaminants-section" id="contaminants" data-page-progress-label="Загрязнения и решения">
  <div class="tf-container">
   ${heading('raw-cleaning-title','Каждому загрязнению — своё инженерное решение.',{lead:'Сначала высвобождаем включения. Затем отделяем их по форме, размеру и характеру движения, а стойкие поверхностные остатки отмываем.'})}
   <div class="tf-contaminants">
    ${content.cleaning.map(({id,title,examples,operation,target,image,detail})=>`<article class="tf-contaminant${image?'':' tf-contaminant--text'}" id="contaminant-${id}" data-contaminant-row="${id}">
     ${image?`<figure>${photo(image)}</figure>`:''}
     <div class="tf-contaminant-copy">
      <h3>${escape(title)}</h3><p>${escape(examples)}</p>
      <p class="tf-contaminant-solution"><span>Решение</span><a href="#${target}">${escape(operation)}&nbsp;${stageArrow}</a></p>
      ${detail?disclosure('Условия отбора',`<p>${escape(detail)}</p>`):''}
     </div>
    </article>`).join('')}
   </div>
   <div class="tf-evidence">
    <article class="tf-hand-test">
     <h3>Ручное раскрытие трудно масштабировать</h3>
     <dl><div><dt>10</dt><dd>пакетов</dd></div><div><dt>33</dt><dd>секунды</dd></div><div><dt>40</dt><dd>г материала</dd></div></dl>
     <p>В единичном опыте раскрытия и вытряхивания пакетов это соответствует темпу 4,36 кг/ч. Механизация освобождает время для отбора полезных фракций и контроля.</p>
     ${disclosure('Арифметика опыта','<p>0,040 кг ÷ 33 с × 3 600 с ≈ 4,36 кг/ч. При условной ставке 260 ₽/ч это 59,6 ₽/кг. При округлённом темпе 4 кг/ч — 65 ₽/кг.</p><p>Расчёт иллюстрирует единичное раскрытие и вытряхивание пакетов. Для оценки себестоимости и сравнения с линией нужны отдельные данные.</p>')}
    </article>
    ${materialBalance()}
   </div>
  </div>
 </section>`;
}

function route(){
 return `<section class="tf-section tf-route-section" id="solution" data-page-progress-label="Карта технологии">
  <div class="tf-container">
   ${heading('solution-title','Не одна операция. Последовательная технология.',{lead:'Сначала отделяем основную массу включений без воды. Затем отмываем стойкие остатки, обезвоживаем материал и при необходимости гранулируем его.'})}
   <div class="tf-route-ends"><span>Загрязнённое сырьё</span>${stageArrow}<span>Новые полимерные изделия</span></div>
   <ol class="tf-process-route">
    ${content.stages.map(stage=>`<li>
     <a href="#${stage.id}"><span class="tf-stage-number">${stage.number}</span><h3>${escape(stage.title)}</h3>${stageArrow}</a>
     <p>${escape(stage.text)}</p><p class="tf-stage-result">${escape(stage.result)}</p>
    </li>`).join('')}
   </ol>
   <p class="tf-caption">При прямой подаче плёнку перед мойкой можно не прессовать. Маршрут гранулирования может обходить капсуляцию.</p>
  </div>
 </section>`;
}

function lineRender(line,caption,id){
 const {file,smallFile}=lineCoverFiles(line);
 return `<figure class="tf-line-render">
  ${photo({file,small:smallFile,alt:line.cardImageAlt||line.title},{sizes:'(max-width:899px) calc(100vw - 40px), 56vw'})}
  <figcaption id="${id}">${escape(caption)}</figcaption>
 </figure>`;
}

function operations(items,label){
 return `<ol class="tf-operations" aria-label="${label}">${items.map(item=>`<li>${escape(item)}</li>`).join('')}</ol>`;
}

function engineeringFeature({slug,label,title,lead,body,link}){
 const node=findNode(slug);
 return `<article class="tf-engineering-feature">
  <figure>${photo(equipmentImage(node),{sizes:'(max-width:899px) calc(100vw - 40px), 46vw'})}</figure>
  <div>
   <p class="eyebrow">${escape(label)}</p><h3>${escape(title)}</h3><p>${escape(lead)}</p>
   ${body}<a class="text-link" href="${node.path}">${escape(link)} ${arrow}</a>
  </div>
 </article>`;
}

function dryStage(){
 const rotor=engineeringFeature({
  slug:'rotornyy-raspushitel',label:'КЛЮЧЕВОЙ УЗЕЛ СУХОЙ ОЧИСТКИ',title:'Роторный распушитель',
  lead:'Раскрывает завязанные пакеты и слипшиеся слои, высвобождает включения и отделяет их в несколько ступеней.',
  body:'<dl class="tf-rotor-functions"><div><dt>Барабан и внутренний ротор</dt><dd>Раскрытие и просев</dd></div><div><dt>Дисковая ступень</dt><dd>Отделение прилипших частиц</dd></div><div><dt>Воздушный отбор</dt><dd>Выделение лёгкой плёночной фракции</dd></div></dl>',
  link:'Как устроен роторный распушитель',
 });
 return `<section class="tf-stage" id="dry-separation" data-page-progress-label="Сухая сепарация">
  <div class="tf-section tf-dark era-indigo-surface">
   <div class="tf-container">
    <div class="tf-stage-lead">
     ${heading('dry-separation-title','Максимум очистки. Без использования воды.',{kicker:'01 / СУХАЯ СЕПАРАЦИЯ',lead:'Плёнку сначала раскрывают. Так включения внутри пакетов и слипшихся слоёв становятся доступны для отделения. Сухая очистка убирает основную массу свободных минеральных, органических и объёмных включений до контакта с моющей средой.'})}
     ${lineRender(dryExample,'Пример комплектации с сортировкой и прессованием','tech-line-02-title')}
    </div>
    <div class="tf-line-links">
     <p>Три комплектации одной технологии под разные производственные задачи.</p>
     <div>${dryLines.map(line=>`<a class="text-link" href="${line.path}" data-technology-line="${line.slug}">Сепарация ${line.number} ${arrow}</a>`).join('')}
      <a class="text-link" href="/documents/${overview.document.file}" download="${escape(overview.document.downloadName)}">Визитка 02 · PDF <span aria-hidden="true">↓</span></a></div>
    </div>
    ${operations(['Предварительное измельчение','Распушение и высвобождение включений','Баллистическая сепарация','Роторная очистка','Накопление и выдача'],'Операции сухой сепарации')}
    <p class="tf-caption">Порядок и дополнительные ступени зависят от комплектации. В базовом исполнении материал идёт общим потоком, в Сепарации 02 предусмотрены отбор фракций и отдельный маршрут основного микса.</p>
    ${rotor}
    <p class="tf-stage-note">Отделение включений до мойки снижает нагрузку на ножевые узлы и водный контур. Для Сепарации 02 пример составляет 1 500 кг/ч входной смеси и ориентир 750 кг/ч при засоре около 50%. Паспортная подача базового распушителя — 600–700 кг/ч. Фактический выпуск подтверждают на сырье с учётом комплектации.</p>
   </div>
  </div>
  <div class="tf-dry-results"><div class="tf-container tf-dry-results-grid">
   <div><h3>Что меняется после сухой очистки</h3><p>Примеры материала до и после стадии. Фотографии показывают разные образцы.</p></div>
   <figure>${photo({file:'lines/separatsiya-01-mini/before.webp',small:'lines/separatsiya-01-mini/before-thumb.webp',alt:'Пример плёночных отходов до сухой сепарации'})}<figcaption>До сепарации</figcaption></figure>
   <figure>${photo({file:'lines/separatsiya-01-mini/after-close.webp',small:'lines/separatsiya-01-mini/after-close-thumb.webp',alt:'Образец очищенной плёнки после сухой сепарации'})}<figcaption>После сухой очистки</figcaption></figure>
  </div></div>
 </section>`;
}

function washStage(){
 const flotator=engineeringFeature({
  slug:'plenochnyy-flotator',label:'ПЛЁНОЧНЫЙ ФЛОТАТОР',title:'Тонкослойная флотация плёнки',
  lead:'Мойка, флотация и предварительный отжим объединены в одном узле. Линейный поток переносит всплывающую плёнку тонким слоем, а тонущие включения оседают в нижней спокойной зоне.',
  body:'<p>В зоне флотации поток идёт без лопаточных валов. Горячая среда и трение плёнки о плёнку помогают удалить прилипшие примеси.</p><dl class="tf-flotator-metrics"><div><dt>до +95 °C</dt><dd>паспортный режим</dd></div><div><dt>до 40 мм</dt><dd>слой плёнки</dd></div><div><dt>240–250 м³/ч</dt><dd>внутренний циркуляционный поток флотатора</dd></div></dl><p class="tf-caption">Режим подбирают на партии. Подачу свежей воды рассчитывают отдельно по водному балансу.</p>',
  link:'Как устроен плёночный флотатор',
 });
 return `<section class="tf-stage" id="hot-washing" data-page-progress-label="Горячая мойка">
  <div class="tf-section tf-dark era-indigo-surface">
   <div class="tf-container">
    <div class="tf-stage-lead">
     ${heading('hot-washing-title','Глубокая очистка начинается после сухой сепарации.',{kicker:'02 / ГОРЯЧАЯ МОЙКА',lead:'После сухой очистки остаются загрязнения на поверхности и в складках плёнки. Горячая моющая среда и механическое трение помогают отделить масла, жиры, клей и этикетки.'})}
     <div>${lineRender(washLine,'Проектная визуализация линии горячей мойки','tech-hot-wash-title')}<a class="text-link tf-wash-link" href="${washLine.path}" data-technology-line="${washLine.slug}">Изучить линию горячей мойки ${arrow}</a></div>
    </div>
    ${operations(['Подготовка плёнки и защита оборудования','Мокрое измельчение','Горячая фрикционная мойка и флотация','Межступенчатый отжим и ополаскивание','Механическое обезвоживание и накопление','Выбранный товарный выход'],'Операции горячей мойки')}
    <p class="tf-caption">Две ветки мокрого измельчения работают поочерёдно. Первый флотатор выполняет горячую мойку, второй — ополаскивание. Три центрифуги работают последовательно на маршруте обработки.</p>
    ${flotator}
   </div>
  </div>
  <div class="tf-wash-support">
   <div class="tf-container tf-wash-support-grid">
    <div class="tf-water">
     <h3>Водооборот</h3>
     <ol aria-label="Контур возврата рабочей жидкости"><li>Рабочая жидкость</li><li>Мойка</li><li>Сбор стоков</li><li>Очистка</li><li>Возврат жидкости</li></ol>
     <dl class="tf-water-branches"><div><dt>Подпитка → контур</dt><dd>Объём по водному балансу.</dd></div><div><dt>Чистая вода → ополаскивание</dt><dd>Отдельная подача.</dd></div><div><dt>Очистка → осадок и примеси</dt><dd>Вывод из контура.</dd></div></dl>
    </div>
    <div class="tf-scale">
     <h3>Масштабирование</h3>
     <p>На входе мойки — до <strong>1,5 т/ч</strong> подготовленной плёнки. Номинал одного гранулятора — <strong>750 кг/ч</strong>. В расширенной конфигурации с двумя линиями сепарации и одной мойкой два гранулятора дают суммарный номинал до <strong>1,5 т/ч гранулы</strong> при достаточной подаче.</p>
     <p class="tf-caption">Это проектные показатели отдельных стадий. Материальный баланс подтверждают на партии.</p>
     ${washingConfigurations.map(option=>`<p class="tf-washing-option" data-washing-configuration="${option.id}">${escape(option.text)}</p>`).join('')}
    </div>
   </div>
  </div>
 </section>`;
}

function granulation(){
 const granule={file:'presentation/granules.webp',alt:'Образец полиэтиленовой гранулы'};
 return `<section class="tf-section tf-granulation-section" id="granulation" data-page-progress-label="Гранулирование">
  <div class="tf-container tf-granulation">
   <div>
    ${heading('granulation-title','Качество полимера формируется до гранулятора.',{kicker:'03 / ГРАНУЛИРОВАНИЕ',lead:'Гранулятор превращает подготовленный полимер в товарную гранулу. Двухстадийная экструзия, фильтрация расплава и дегазация снижают количество остаточных включений и летучих компонентов. Основную очистку выполняют сухая сепарация и горячая мойка.'})}
    <p class="tf-caption">Для интеграции собственного гранулятора проверяют влажность, фракцию, состав и производительность.</p>
    <a class="text-link" href="${washLine.path}#quality">Гранулятор в составе линии мойки ${arrow}</a>
   </div>
   <figure class="tf-granulation-flow">
    <div>${photo(mediaImage(hotWashMedia['raw-film-01']),{sizes:'(max-width:899px) 43vw, 270px'})}<span>Очищенная плёночная фракция</span></div>
    ${stageArrow}
    <div>${photo(granule)}<span>Полиэтиленовая гранула</span></div>
    <figcaption>Подготовка плёнки → экструзия, фильтрация и дегазация → гранула</figcaption>
   </figure>
  </div>
 </section>`;
}

function products(){
 return `<section class="tf-section tf-products-section" id="products" data-page-progress-label="Товарная продукция">
  <div class="tf-container">
   ${heading('output-title','Один технологический цикл. Разные товарные продукты.',{lead:'Сухая стадия даёт очищенную плёнку. После глубокой очистки доступны отмытая плёнка, капсулят или гранула — в зависимости от выбранного маршрута.'})}
   <div class="tf-products">
    ${content.outputs.map(item=>`<article data-technology-output="${item.id}">
      <figure>${photo(mediaImage(hotWashMedia[item.key]))}</figure>
      <div><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></div>
    </article>`).join('')}
   </div>
   <p class="tf-caption">Примеры трёх товарных форм после горячей мойки. На фотографиях разные образцы материала.</p>
  </div>
 </section>`;
}

function quality(){
 const q=content.quality;
 return `<section class="tf-section tf-dark era-indigo-surface tf-quality" id="granule-quality" data-page-progress-label="Качество">
  <div class="tf-container">
   ${heading('granule-quality-title','Чистота, которая определяет возможности материала.',{lead:'Последовательная очистка позволяет приблизиться к характеристикам первичного сырья по отдельным контролируемым параметрам.'})}
   <dl class="tf-quality-metrics">
    <div><dt>${q.inclusions} <small>${q.inclusionsUnit}</small></dt><dd>Остаточные включения в плёнке после сухой сепарации и горячей мойки</dd><dd class="tf-caption">${q.mass} · ${q.percent}</dd></div>
    <div><dt>${q.mfr} <small>${q.mfrUnit}</small></dt><dd>Целевой ПТР гранулы ПВД для плёнок и пакетов</dd><dd class="tf-caption">${q.conditions}</dd></div>
    <div><dt>${q.washingLoss}</dt><dd>Ориентир потерь плёнки при мойке, от массы плёнки</dd></div>
   </dl>
   <p class="tf-caption tf-quality-note">${escape(q.note)}</p>
   ${qualityVisual()}
   ${disclosure('Почему появляются дефекты и как мы их предотвращаем',`
     <p>Микровключение в расплаве ПЭ может проявиться точкой или локальным дефектом новой плёнки. Сухая очистка, горячая мойка и фильтрация расплава уменьшают риск. Результат проверяют на конкретном сырье и при пробной переработке.</p>
     <p>PS и PVC несовместимы с рассматриваемыми потоками гибкого ПЭ. Вспененный полистирол может остаться отдельной фазой в расплаве. Характер дефекта зависит от примеси, концентрации, дисперсии и режима. Материал этикетки может содержать PVC. Моющуюся способность её клея оценивают отдельно.</p>
     <p>Для плёночного применения согласуют ПТР при заданной температуре и нагрузке, влажность, включения, цвет и запах. При необходимости проводят пробный выдув.</p>`)}
   ${disclosure('Методики и источники',`<ul class="tf-sources">${content.sources.map(source=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ${arrow}</a></li>`).join('')}</ul>`)}
  </div>
 </section>`;
}

function applications(){
 const grid=group=>`<div class="tf-applications-grid">
  ${content.applications.filter(item=>item.group===group).map(item=>`<article data-technology-application="${item.id}">
   <figure>${photo({file:`technology/applications/${item.id}.webp`,small:`technology/applications/${item.id}-600.webp`,alt:item.alt})}</figure>
   <div><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></div>
  </article>`).join('')}
 </div>`;
 return `<section class="tf-section tf-applications" id="applications" data-page-progress-label="Применение">
  <div class="tf-container">
   ${heading('applications-title','Из вторичного полимера — в новую продукцию.',{lead:'Изделие выбирают по марке, составу и свойствам партии. Рецептуру проверяют в условиях производства.'})}
   ${grid('polymer')}
   <p class="tf-caption">Иллюстрации возможных направлений применения.</p>
   <div class="tf-cycle">Очистить. Переработать. Использовать снова.</div>
   ${disclosure('Альтернативные направления для подходящих фракций',`${grid('alternative')}<p>Это самостоятельные маршруты на специализированных установках. Применение зависит от состава фракции и требований проекта.</p>`)}
  </div>
 </section>`;
}

function control(){
 return `<section class="tf-section tf-dark era-indigo-surface tf-control" id="control-story" data-page-progress-label="Управление КАИР">
  <div class="tf-container tf-control-grid">
   <div>
    ${heading('control-title','Оборудование связано. Процесс под контролем.',{kicker:'УПРАВЛЕНИЕ КАИР',lead:'Система КАИР связывает технологические узлы и показывает состояние линии, настройки и сигналы в одном интерфейсе.'})}
    <ul class="tf-control-functions">
     <li>Согласование подачи и работы узлов</li><li>Память режимов под разное сырьё</li>
     <li>Контроль состояния и защитные алгоритмы</li><li>Удалённый мониторинг в предусмотренном исполнении</li>
    </ul>
    <a class="text-link" href="/automation">Возможности КАИР ${arrow}</a>
   </div>
   ${kairMonitor(kairSlides,{...kairPresentation,autoplay:false})}
  </div>
 </section>`;
}

function standaloneEquipment(){
 return `<div class="tf-standalone" id="standalone-equipment" aria-labelledby="standalone-title">
  ${heading('standalone-title','Отдельные инженерные решения',{lead:'Узлы можно встроить в действующее производство или подобрать в составе новой линии.'})}
  <div class="tf-equipment-grid">${content.equipment.map(item=>{
   const node=findNode(item.slug);
   return `<a href="${node.path}"><figure>${photo(equipmentImage(node),{sizes:'(max-width:599px) 43vw, 286px'})}</figure><div><h3>${escape(node.title)} ${arrow}</h3><p>${escape(item.function)}</p></div></a>`;
  }).join('')}</div>
  <a class="text-link" href="/catalog/equipment">Перейти в каталог узлов ${arrow}</a>
 </div>`;
}

function nextSteps(){
 const topic='Технология переработки плёночного сырья';
 return `<section class="tf-section tf-next" id="technology-next" data-page-progress-label="От технологии к проекту">
  <div class="tf-container">
   ${standaloneEquipment()}
   <div class="tf-next-panel tf-dark era-indigo-surface" id="detail-title">
    <div id="discuss">
     ${heading('discuss-title','Покажите ваше сырьё — подберём технологическое решение.',{lead:'Расскажите, с каким материалом вы работаете, какой объём перерабатываете и какой продукт хотите получать. Подберём последовательность операций, оборудование и подходящую комплектацию.'})}
     <a class="button tf-gold-button" href="${projectRequestHref(topic)}">Обсудить технологию под ваше сырьё ${arrow}</a>
    </div>
    <details class="tf-details" id="about-era" data-keep-open><summary id="launch-title">Что понадобится для подбора</summary><div>
     <ul>${technicalInputs.map(item=>`<li>${escape(item)}</li>`).join('')}<li>Фотографии, видео или образец материала</li></ul>
     <a href="/#about-era">Как проходит поставка и сопровождение ${arrow}</a>
    </div></details>
    <nav class="tf-next-links" aria-label="Другие разделы проекта">
     <a href="/catalog/lines">Все линии и комплексы ${arrow}</a><a href="/catalog/equipment">Отдельные узлы ${arrow}</a><a href="/economics">Экономика проекта ${arrow}</a>
    </nav>
   </div>
  </div>
 </section>`;
}

export function presentationTechnology(){
 return `<div class="story technology-story tf-page" data-technology-final>
  ${hero()}${outline()}${rawMaterials()}${contaminants()}${route()}${dryStage()}${washStage()}
  ${granulation()}${products()}${quality()}${applications()}${control()}${nextSteps()}
 </div>`;
}
