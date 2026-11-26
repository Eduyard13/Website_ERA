import {lines,nodes} from '../content/catalog.mjs';
import {technologyContent as content} from '../content/technology-final.mjs';
import {drySeparationOverview as overview,washingConfigurations} from '../content/technology-lines.mjs';
import {hotWashMedia} from '../content/hot-film-washing.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {kairSlides,kairPresentation} from '../content/kair.mjs';
import {projectRequestHref} from './contact.mjs';
import {escapeContact as escape} from './contact-channels.mjs';
import {imageSize} from './image-size.mjs';
import {lineCoverFiles} from './line-page-media.mjs';
import {calculateMaterialBalance} from '../public/material-balance-model.js';
import {kairIcon} from './kair-visuals.mjs';
import {kairMonitor} from './kair.mjs';
export {renderKairSystem as presentationAutomation} from './kair-system.mjs';

const arrow='<span aria-hidden="true">↗</span>';
const dryLines=lines.filter(line=>line.enabled&&line.group==='Сепарация');
const dryExample=dryLines.find(line=>line.slug==='separatsiya-02');
const washLine=lines.find(line=>line.slug==='moyka-plenki'&&line.enabled);
const findNode=slug=>nodes.find(node=>node.slug===slug);
const dimensions=file=>imageSize(new URL('../public/assets/'+file,import.meta.url));
const materialSizes='(max-width:599px) calc(100vw - 40px), (max-width:999px) 46vw, 416px';

const cardSizes='(max-width:599px) calc(100vw - 40px), (max-width:899px) 46vw, 416px';
const gallerySizes='(max-width:599px) calc(100vw - 40px), (max-width:899px) 46vw, 620px';

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

function rawMaterials(){
 return `<section class="tf-section" id="raw-material" data-page-progress-label="Сырьё">
  <div class="tf-container">
   ${heading('raw-title','Мы работаем с трудноочищаемым плёночным сырьём.',{lead:'Плёнки после использования удерживают загрязнения между слоями, в складках и на поверхности. Для переработки важны состав, форма материала, засорённость и влажность.'})}
   <div class="tf-feedstocks tf-grid-fill">
    ${content.feedstocks.map(item=>`<article class="tf-feedstock" data-feedstock-type="${item.id}">
     <figure>${photo(item.image,{sizes:gallerySizes})}</figure>
     <div class="tf-card-copy"><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></div>
    </article>`).join('')}
   </div>
   <div class="tf-trials tf-dark era-indigo-surface" data-tf-reveal>
    <div><p class="eyebrow">ПРОВЕРЕНО НА ПРАКТИКЕ</p><h3>Даже самые грязные плёнки — ценное сырьё</h3>
     <p>Мы превращаем отходы, предназначенные для захоронения, в ресурс для нового производства.</p>
     <p class="tf-caption">Эффективность технологии подтверждена испытаниями на сильно загрязнённом плёночном сырье.</p>
    </div>
    <dl>${[[80,'Засорённость испытанного сырья'],[30,'Влажность испытанного сырья']].map(([value,label])=>`<div><dt>${label}</dt><dd>до <strong>${value}%</strong><span aria-hidden="true" class="tf-meter" style="--level:${value}%"></span></dd></div>`).join('')}</dl>
   </div>
  </div>
 </section>`;
}

const scenarioNumber=new Intl.NumberFormat('ru-RU');

function technologyBalance(){
 const initial=calculateMaterialBalance(50);
 return `<div class="tf-balance" id="material-balance" data-technology-balance>
  <h3>Производительность считаем по реальному входному сырью</h3>
  <p>1 500 кг/ч — это производительность по исходной загрязнённой смеси, включающей полимер и посторонние включения.</p>
  <p>По нашему опыту чаще всего засорённость составляет 30–40%, а 50–55% встречаются редко. Для расчёта берём консервативный сценарий 50%.</p>
  <div class="tf-balance-input"><span>Входной поток</span><strong>${scenarioNumber.format(initial.input)} <small>кг/ч</small></strong></div>
  <div class="tf-balance-choices" id="material-contamination" role="group" aria-label="Засорённость входного сырья">
   ${[30,40,50].map(value=>`<button type="button" data-tf-scenario="${value}" aria-pressed="${value===50}" disabled>${value}%${value===50?' <small>расчётная</small>':''}</button>`).join('')}
  </div>
  <dl class="tf-balance-outputs" aria-live="polite" aria-atomic="true">
   <div><dt>Полезный полимер до потерь</dt><dd><strong data-tf-polymer>${scenarioNumber.format(initial.polymer)}</strong> кг/ч</dd></div>
   <div><dt>Посторонние включения</dt><dd><strong data-tf-inclusions>${scenarioNumber.format(initial.inclusions)}</strong> кг/ч</dd></div>
  </dl>
  <div class="tf-balance-bar" style="--polymer:${100-initial.contamination}%" aria-hidden="true"><span></span></div>
  <div class="tf-baseline tf-dark era-indigo-surface">
   <strong>750 <small>кг/ч</small></strong><h4>Базовый расчётный выход готовой продукции</h4>
   <p>В основу экономической модели заложена засорённость сырья 50%. При меньшей засорённости потенциальный выход полезного полимера увеличивается.</p>
   <p class="tf-baseline-message">Мы считаем с запасом, чтобы клиент получал результат не на бумаге, а в реальной работе</p>
  </div>
 </div>`;
}

function contaminants(){
 return `<section class="tf-section tf-soft" id="contaminants" data-page-progress-label="Типы загрязнений">
  <div class="tf-container">
   ${heading('raw-cleaning-title','Каждому загрязнению — своё инженерное решение',{lead:'Мы поэтапно удаляем различные типы включений: от слипшихся пакетов и минеральных примесей до влаги, пыли и стойких поверхностных остатков'})}
   <div class="tf-contaminants">
    ${content.cleaning.map(item=>`<article class="tf-contaminant" id="contaminant-${item.id}" data-contaminant-row="${item.id}">
     <figure>${photo(item.image,{sizes:cardSizes})}</figure>
     <div class="tf-card-copy"><h3>${escape(item.title)}</h3><p>${escape(item.examples)}</p>
      <div class="tf-card-result"><span>Решение</span><a class="text-link" href="#${item.target}">${escape(item.operation)} ${arrow}</a></div>
     </div>
    </article>`).join('')}
   </div>
   <div class="tf-evidence">
    <article class="tf-hand-test">
     <p class="eyebrow">ПОЧЕМУ МЫ СОЗДАЛИ ЭТУ ТЕХНОЛОГИЮ</p>
     <h3>Ручная очистка — экономический тупик.</h3>
     <p>Раскрыть каждый пакет, разделить слипшиеся слои и удалить скрытые загрязнения вручную в промышленных масштабах экономически нецелесообразно. Даже предварительное измельчение не решает эту проблему.</p>
     <div class="tf-hand-experiment">
      <p class="eyebrow">ПРАКТИЧЕСКИЙ ЭКСПЕРИМЕНТ</p>
      <dl class="tf-hand-facts"><div><dt>Пакетов</dt><dd>10</dd></div><div><dt>Ручная очистка</dt><dd>33 сек.</dd></div><div><dt>Материала</dt><dd>40 г</dd></div></dl>
      <dl class="tf-hand-outcomes"><div><dt>Производительность одного работника</dt><dd>4–5 кг/ч</dd></div><div><dt>Расчётные затраты только на ручной труд</dt><dd>65 000 ₽/т</dd></div></dl>
      <p class="tf-caption">При оплате труда 260 ₽/ч и производительности 4 кг/ч</p>
      <strong class="tf-hand-status">Экономически неэффективно</strong>
     </div>
     <div class="tf-hand-conclusion tf-dark era-indigo-surface">
      <h4>Не совершенствовать ручной труд. Заменить сам принцип очистки</h4>
      <p>Именно поэтому мы разработали технологию автоматизированной многоступенчатой очистки плёночных отходов.</p>
     </div>
    </article>
    ${technologyBalance()}
   </div>
  </div>
 </section>`;
}

function route(){
 return `<section class="tf-section tf-champagne" id="solution" data-page-progress-label="Три стадии переработки">
  <div class="tf-container">
   ${heading('solution-title','Три этапа. Один технологический цикл.',{lead:'От загрязнённых плёночных отходов до высококачественного полимерного сырья для нового производства'})}
   <ol class="tf-process-route">
    ${content.stages.map(stage=>`<li><a href="#${stage.id}">
     <figure>${photo(stage.image,{sizes:cardSizes})}</figure>
     <div class="tf-card-copy"><div class="tf-stage-label"><span class="tf-stage-number">${stage.number}</span><h3>${escape(stage.title)}</h3></div>
      <p>${escape(stage.text)}</p><div class="tf-card-result"><span>Результат</span><strong>${escape(stage.result)}</strong></div>
     </div>
    </a></li>`).join('')}
   </ol>
  </div>
 </section>`;
}

function lineRender(line,id){
 const {file,smallFile}=lineCoverFiles(line);
 return `<figure class="tf-line-render" id="${id}">
  ${photo({file,small:smallFile,alt:line.cardImageAlt||line.title},{sizes:'(max-width:899px) calc(100vw - 40px), 56vw'})}
 </figure>`;
}

function stageIntro(id,title,kicker,hook,steps){
 return `<div class="tf-stage-intro">
  ${heading(id,title,{kicker,lead:hook})}
  <ol class="tf-stage-steps">${steps.map(([name,detail],index)=>`<li>
   <span aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><strong>${escape(name)}</strong><p>${escape(detail)}</p></div>
  </li>`).join('')}</ol>
 </div>`;
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
     ${stageIntro('dry-separation-title','Сухая сепарация','01 / ПЕРВАЯ СТАДИЯ ОЧИСТКИ','Глубокая очистка от основной массы загрязнений.',[
      ['Раскрытие материала','Вскрываем пакеты, разделяем слипшиеся слои плёнки и высвобождаем скрытые включения.'],
      ['Интенсивная механическая очистка','Отделяем минеральные, органические и другие посторонние включения без использования воды.'],
      ['Подготовка к дальнейшей переработке','Получаем очищенный плёночный материал, подготовленный к следующему технологическому этапу.'],
     ])}
     ${lineRender(dryExample,'tech-line-02-title')}
    </div>
    <div class="tf-line-links">
     <p>Три комплектации одной технологии под разные производственные задачи.</p>
     <div>${dryLines.map(line=>`<a class="text-link" href="${line.path}" data-technology-line="${line.slug}"><span class="tf-tier">${line.tier}</span> ${escape(line.title)} ${arrow}</a>`).join('')}
      <a class="text-link" href="/documents/${overview.document.file}" download="${escape(overview.document.downloadName)}">Обзор комплектации PRO · PDF <span aria-hidden="true">↓</span></a></div>
    </div>
    ${operations(['Предварительное измельчение','Распушение и высвобождение включений','Баллистическая сепарация','Роторная очистка','Накопление и выдача'],'Операции сухой сепарации')}
    <p class="tf-caption">Порядок и дополнительные ступени зависят от комплектации. В BASE материал идёт общим потоком, в PRO предусмотрены отбор фракций и отдельный маршрут основного микса.</p>
    ${rotor}
    <div class="tf-stage-note tf-champagne">
     <h3>Эффективная мойка начинается с сухой сепарации.</h3>
     <p>Удаление основной массы загрязнений до контакта с водой снижает риск поломок и преждевременного износа режущих инструментов, продлевает срок службы оборудования и создаёт условия для глубокой и качественной отмывки плёнки на следующем этапе.</p>
     <ul class="tf-icon-row">${[['shield','Защита оборудования'],['cycle','Снижение износа'],['water','Повышение качества мойки']].map(([icon,label])=>`<li>${kairIcon(icon)}${label}</li>`).join('')}</ul>
    </div>
   </div>
  </div>
  <div class="tf-dry-results"><div class="tf-container tf-dry-results-grid">
   <div><h3>Результат сухой сепарации</h3><p>Из сильно загрязнённых плёночных отходов получаем очищенный полимерный материал, освобождённый от основной массы посторонних включений и подготовленный к следующему этапу переработки.</p><strong>Материал подготовлен к горячей мойке</strong></div>
   <figure>${photo({file:'lines/separatsiya-01-mini/before.webp',small:'lines/separatsiya-01-mini/before-thumb.webp',alt:'Исходное загрязнённое сырьё'})}<figcaption>Исходное загрязнённое сырьё</figcaption></figure>
   <figure>${photo({file:'lines/separatsiya-01-mini/after-close.webp',small:'lines/separatsiya-01-mini/after-close-thumb.webp',alt:'Очищенный плёночный материал'})}<figcaption>Очищенный плёночный материал</figcaption></figure>
  </div></div>
 </section>`;
}

function waterLoop(){
 const phases=[
  ['Мойка','Рабочая жидкость удаляет остатки загрязнений с плёнки.'],
  ['Сбор стоков','Использованная вода из рабочих узлов направляется на очистку.'],
  ['Очистка','Гидроциклон и отстойник отделяют примеси в местном контуре. Общий комплекс удаляет взвесь, а в баке дополнительно отделяются плавающие частицы.'],
  ['Возврат','Очищенная вода через бак возвращается в основную горячую мойку.'],
 ];
 return `<div class="tf-wash-support tf-champagne">
  <div class="tf-container">
   <div class="tf-water">
    <h3>Замкнутый водооборот — минимальный расход воды</h3>
    <p class="tf-water-hook">Глубокая мойка без лишнего расхода воды</p>
    <p>Линия горячей мойки работает по принципу замкнутого водооборота: вода собирается, очищается и возвращается в процесс. Это позволяет существенно снизить расход воды и поддерживать стабильную работу участка.</p>
    <div class="tf-wash-support-grid">
     <div>
      <ol class="tf-water-loop" aria-label="Замкнутый контур от мойки до возврата воды">${phases.map(([title,text],i)=>`<li><span aria-hidden="true">0${i+1}</span><h4>${title}</h4><p>${text}</p></li>`).join('')}</ol>
      <p class="tf-water-return"><span aria-hidden="true">↺</span> Возврат воды в мойку</p>
     </div>
     <div>
      <ul class="tf-water-benefits"><li>Снижение расхода свежей воды</li><li>Стабильная работа контура без накопления загрязнений</li><li>Контролируемое удаление осадка</li><li>Меньше твёрдых примесей в системе водоотведения</li></ul>
      <dl class="tf-water-branches"><div><dt>Свежая вода → подпитка контура</dt><dd>Компенсирует потери воды.</dd></div><div><dt>Чистая вода → ополаскивание</dt><dd>Подаётся отдельно.</dd></div><div><dt>Осадок и включения → удаление</dt><dd>Сбор, упаковка и вывоз.</dd></div></dl>
     </div>
    </div>
    <p class="tf-caption">Вода повторно используется в основном технологическом контуре. Удаление твёрдых примесей снижает риск засоров при водоотведении. При необходимости технологические сливы отводят с соблюдением требований к стокам.</p>
    <p class="tf-final-accent">Грязь удаляется из процесса, а вода возвращается в работу.</p>
   </div>
  </div>
 </div>`;
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
     ${stageIntro('hot-washing-title','Горячая мойка','02 / ВТОРАЯ СТАДИЯ ОЧИСТКИ','Глубокая отмывка от остаточных загрязнений.',[
      ['Интенсивная горячая отмывка','Удаляем стойкие поверхностные загрязнения, остатки клея, этикеток, жиров и масел, которые невозможно отделить методом сухой сепарации.'],
      ['Финишная очистка','Удаляем остаточные мелкодисперсные и посторонние включения методом фрикционной очистки и флотации.'],
      ['Обезвоживание материала','Удаляем избыточную влагу и подготавливаем чистый полимер к гранулированию.'],
     ])}
     <div>${lineRender(washLine,'tech-hot-wash-title')}<a class="text-link tf-wash-link" href="${washLine.path}" data-technology-line="${washLine.slug}">Изучить линию горячей мойки ${arrow}</a></div>
    </div>
    ${operations(['Подготовка плёнки и защита оборудования','Мокрое измельчение','Горячая фрикционная мойка и флотация','Межступенчатый отжим и ополаскивание','Механическое обезвоживание и накопление','Выдача готовой продукции'],'Операции горячей мойки')}
    <p class="tf-caption">Две ветки мокрого измельчения работают поочерёдно. Первый флотатор выполняет горячую мойку, второй — ополаскивание. Три центрифуги работают последовательно на маршруте обработки.</p>
    ${flotator}
   </div>
  </div>
  ${waterLoop()}
 </section>`;
}

function scale(){
 const ownGranulation=washingConfigurations.find(option=>option.id==='existing-granulator');
 return `<div class="tf-scale tf-champagne">
  <div class="tf-container">
   <h3>Модульная система. Масштабирование без смены технологии.</h3>
   <p>Производительность линии мойки составляет до 1,5 т/ч подготовленной плёнки. В базовой конфигурации гранулирование обеспечивает до 750 кг/ч готовой гранулы. Если объём очищённой плёнки позволяет, к линии может быть добавлен второй гранулятор. В такой конфигурации суммарный выпуск достигает до 1,5 т/ч гранулы.</p>
   <div class="tf-scale-grid">
    <article data-washing-configuration="with-granulator"><h4>Базовая конфигурация</h4><ul><li>1 линия сепарации</li><li>1 линия мойки до 1,5 т/ч</li><li>1 гранулятор</li></ul><strong>до 750 кг/ч</strong><p>готовой гранулы</p></article>
    <span class="tf-scale-arrow" aria-hidden="true">→</span>
    <article><h4>Расширенная конфигурация</h4><ul><li>Подготовленная плёнка, в том числе от 2 линий сепарации</li><li>1 линия мойки до 1,5 т/ч</li><li>2 гранулятора</li></ul><strong>до 1,5 т/ч</strong><p>готовой гранулы при достаточной подаче сырья</p></article>
   </div>
   <p class="tf-caption" data-washing-configuration="${ownGranulation.id}">${escape(ownGranulation.text)}</p>
   <p class="tf-final-accent">Рост производительности достигается не заменой линии, а её расширением.</p>
  </div>
 </div>`;
}

function granulation(){
 return `<section class="tf-stage" id="granulation" data-page-progress-label="Гранулирование">
  <div class="tf-section tf-dark era-indigo-surface">
   <div class="tf-container tf-stage-lead">
    ${stageIntro('granulation-title','Гранулирование','03 / ТРЕТЬЯ СТАДИЯ','Финальный этап: из очищённой плёнки — в готовую гранулу.',[
     ['Подача подготовленного материала','После сухой сепарации, горячей мойки и обезвоживания очищённая плёнка поступает на гранулирование.'],
     ['Экструзия, фильтрация и дегазация','Двухстадийная экструзия, фильтрация расплава и двузонная дегазация удаляют остаточные включения и летучие компоненты.'],
     ['Получение готовой гранулы','На выходе получаем полиэтиленовую гранулу для дальнейшего промышленного применения.'],
    ])}
    <figure class="tf-granulation-pair">${photo(content.granulationImage,{sizes:'(max-width:899px) 96vw, 48vw'})}<figcaption><span>Очищенная плёнка после мойки</span><span>Полиэтиленовая гранула</span></figcaption></figure>
   </div>
  </div>
  ${scale()}
 </section>`;
}

function products(){
 return `<section class="tf-section" id="products" data-page-progress-label="Готовая продукция">
  <div class="tf-container">
   ${heading('output-title','Одна технология. Три вида продукции. Больше возможностей для бизнеса.',{kicker:'ГОТОВАЯ ПРОДУКЦИЯ',lead:'В зависимости от комплектации оборудования и потребностей рынка технология позволяет выпускать три вида готовой продукции'})}
   <div class="tf-products">${content.outputs.map(item=>`<article data-technology-output="${item.id}">
    <figure>${photo(mediaImage(hotWashMedia[item.key]),{sizes:cardSizes})}</figure>
    <div class="tf-card-copy"><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p><div class="tf-card-result"><span>Целевые покупатели</span><strong>${escape(item.buyer)}</strong></div></div>
   </article>`).join('')}</div>
   <div class="tf-product-message"><h3>Больше видов продукции — шире рынок сбыта.</h3><p>Возможность выпуска трёх видов готовой продукции позволяет расширять клиентскую базу, адаптироваться к рыночному спросу и выбирать наиболее выгодное направление реализации.</p></div>
  </div>
 </section>`;
}

function quality(){
 const q=content.quality;
 const benefits=[
  ['flow','Выше стоимость реализации','Возможность продавать продукцию по более привлекательной цене.'],
  ['nodes','Повышенный спрос','Востребованность среди производителей полимерных изделий.'],
  ['shield','Возможность работы по предоплате','Предпосылки для долгосрочных контрактов и стабильного сбыта.'],
  ['cycle','Широкий спектр применения','Возможность изготовления более разнообразного ассортимента продукции.'],
 ];
 return `<section class="tf-section tf-dark era-indigo-surface" id="granule-quality" data-page-progress-label="Качество продукции" data-tf-reveal>
  <div class="tf-container">
   ${heading('granule-quality-title','Качество, которое определяет стоимость.',{kicker:'КАЧЕСТВО ГОТОВОЙ ПРОДУКЦИИ',lead:'Многоступенчатая технология очистки позволяет получать вторичное полимерное сырьё, приближенное по отдельным характеристикам к первичному'})}
   <dl class="tf-quality-metrics">
    <div><dt>Остаточные включения после сухой сепарации и горячей мойки</dt><dd><strong>${q.inclusions} <small>${q.inclusionsUnit}</small></strong><span>${q.mass} · ${q.percent}</span></dd></div>
    <div><dt>Показатель текучести расплава гранулы ПВД / ПНД</dt><dd><strong>${q.mfr} <small>${q.mfrUnit}</small></strong><span>${q.conditions}. Применимость уточняют по марке полимера.</span></dd></div>
    <div><dt>Допустимые потери плёнки за полный цикл</dt><dd><strong>${q.cycleLoss}</strong><span>От массы полезного полимера</span></dd></div>
   </dl>
   <h3 class="tf-benefits-title">Высокое качество — прямое конкурентное преимущество</h3>
   ${benefitGrid(benefits)}
   <p class="tf-final-accent">Чистота полимера — основа его коммерческой ценности.</p>
  </div>
 </section>`;
}

function applications(){
 return `<section class="tf-section tf-applications" id="applications" data-page-progress-label="Применение">
  <div class="tf-container">
   <header class="tf-heading"><p class="eyebrow">НОВАЯ ЖИЗНЬ ПОЛИМЕРОВ</p><h2 id="applications-title">Очистить. Переработать. <span>Использовать снова.</span></h2>
    <p class="tf-lead">Технология открывает широкий спектр направлений промышленного применения вторичных полимеров.</p></header>
   <div class="tf-applications-grid tf-grid-fill">${content.applications.map(item=>`<article data-technology-application="${item.id}">
    <figure>${photo({file:`technology/applications/${item.id}.webp`,small:`technology/applications/${item.id}-600.webp`,alt:item.alt},{sizes:gallerySizes})}</figure>
    <div class="tf-card-copy"><h3>${escape(item.title)}</h3><p>${escape(item.text)}</p></div>
   </article>`).join('')}</div>
  </div>
 </section>`;
}

function benefitGrid(items){
 return `<ul class="tf-benefits">${items.map(([icon,title,description])=>`<li>${kairIcon(icon)}<div><strong>${title}</strong><p>${description}</p></div></li>`).join('')}</ul>`;
}

function control(){
 const benefits=[
  ['flow','Автоматизация производства','Согласованное управление технологическими процессами и рабочими узлами.'],
  ['shield','Защита оборудования','Контроль нагрузок, вибрации, шума и реакция защитных алгоритмов на отклонения.'],
  ['cycle','Интеллектуальная память','Сохранение рабочих режимов для различных видов сырья.'],
  ['screen','Удалённый контроль','Мониторинг производственных процессов за пределами предприятия.'],
  ['nodes','Стабильность производства','Поддержание заданных технологических параметров.'],
  ['flow','Эффективность бизнеса','Снижение влияния человеческого фактора и рациональное использование ресурсов.'],
 ];
 return `<section class="tf-section tf-dark era-indigo-surface tf-control" id="control-story" data-page-progress-label="Управление КАИР">
  <div class="tf-container tf-control-grid">
   <div>
    <header class="tf-heading"><p class="eyebrow">КАИР / ИНТЕЛЛЕКТУАЛЬНАЯ СИСТЕМА УПРАВЛЕНИЯ</p>
     <h2 id="control-title">Пока вы развиваете бизнес, <span>КАИР управляет вашим производством.</span></h2>
     <p class="tf-lead">Не просто комплекс высокотехнологичного оборудования, а единая интеллектуальная производственная система на базе Siemens.</p>
    </header>
    ${benefitGrid(benefits)}
    <p class="tf-caption">Состав функций и удалённого доступа зависит от исполнения.</p>
    <p class="tf-final-accent">Ваше время — для развития. Ваше производство — под контролем.</p>
    <a class="text-link" href="/automation">Изучить возможности КАИР ${arrow}</a>
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
 return `<section class="tf-next" id="technology-next" data-page-progress-label="От технологии к проекту">
  <div class="tf-section"><div class="tf-container">${standaloneEquipment()}</div></div>
  <div class="tf-next-panel tf-dark era-indigo-surface" id="detail-title">
   <div class="tf-container tf-next-grid" id="discuss">
    <div class="tf-next-copy" id="about-era">
     <h2 id="discuss-title">Пока рынок формируется — <span>занимайте место в одной из самых перспективных сфер переработки.</span></h2>
     <p id="launch-title">Переработка плёночных отходов — направление с высоким потенциалом роста. Сегодня вы можете занять сильную позицию в сфере, где много сырья и ограниченная конкуренция.</p>
     <p class="tf-investment-note">Это не просто покупка оборудования, а инвестиция в производство с долгосрочным потенциалом высокой прибыли.</p>
     <a class="button tf-gold-button" href="${projectRequestHref(topic)}">Подобрать решение под ваше сырьё ${arrow}</a>
    </div>
    <div class="tf-next-art">${photo(content.investmentImage,{sizes:'(max-width:899px) 100vw, 52vw'})}</div>
    <nav class="tf-next-links" aria-label="Другие разделы проекта">
     <a href="/catalog/lines">Все линии и комплексы ${arrow}</a><a href="/catalog/equipment">Отдельные узлы ${arrow}</a><a href="/economics">Экономика проекта ${arrow}</a>
    </nav>
   </div>
  </div>
 </section>`;
}

export function presentationTechnology(){
 return `<div class="story technology-story tf-page" data-technology-final>
  ${hero()}${rawMaterials()}${contaminants()}${route()}${dryStage()}${washStage()}
  ${granulation()}${products()}${quality()}${applications()}${control()}${nextSteps()}
 </div>`;
}
