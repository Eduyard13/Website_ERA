import {hotWashProducts} from '../content/hot-film-washing.mjs';
import {renderDryKair} from './dry-kair.mjs';
import {hotWashPicture,hotWashRawMedia} from './hot-wash-media.mjs';
import {renderHotWashCycle,renderHotWashQuality,renderHotWashScaling} from './hot-wash-panels.mjs';

const rawMaterials=[
 ['raw-household','Крупные твёрдые и свободные включения','Этикетки, клей, жиры, масла, органика'],
 ['raw-agricultural','Свободные минеральные и растительные включения','Остаточная земля, песок, растительные частицы в складках'],
 ['raw-stretch','Крупные и свободные посторонние включения','Клей, бумажные этикетки, ленты, остатки продукта']
];
const rawFieldLabels=['Что отделяется на сухой стадии','Что остаётся для мойки'];
const contaminants=[
 ['Клей и этикетки','Налипшие бумага, клеевые следы и ленты.','<path d="M3 4h10l8 8-9 9-9-9V4Z"/><circle cx="8.5" cy="8.5" r="1.5"/>'],
 ['Масла и жиры','Плёнка удерживает жировые загрязнения на поверхности.','<path d="M12 2c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13Zm-4 13a4 4 0 0 0 4 4"/>'],
 ['Органические остатки','Частицы продукта и растений в складках.','<path d="M5 19c0-8 6-13 15-15 0 9-5 15-13 15m-3 2 10-10"/>'],
 ['Минеральная мелочь','Земля и песок, удерживаемые в складках плёнки.','<path d="M2 19l5-6 3 3 5-9 7 12H2Z"/><circle cx="6" cy="6" r="1.5"/>']
];

export function renderHotWashRaw(){
 return `<section class="section line-soft dry-raw-section" id="raw-materials">
  <div class="dry-raw-heading">
   <div><p class="eyebrow">СЫРЬЁ <span class="dry-raw-tier">/ HOT-WASH</span></p><h2>Подготовленная плёнка разного происхождения.<br>Настройки под вашу партию.</h2></div>
   <p class="dry-raw-lead">На мойку поступает материал после сухой сепарации. В проектной компоновке — в тюках. На этой стадии удаляются загрязнения, удерживаемые поверхностью и складками плёнки.</p>
  </div>
  <div class="dry-raw-photos hw-raw-photos">${['raw-prepared-01','raw-prepared-02'].map(key=>hotWashPicture(key,{className:'dry-raw-photo',group:'hot-wash-raw',sizes:'(min-width:1400px) 624px, (min-width:761px) 46vw, calc(100vw - 40px)'})).join('')}</div>
  <div class="hw-raw-origins">
   ${rawMaterials.map(([key,...fields])=>`<article class="hw-raw-origin">
    ${hotWashPicture(key,{caption:'',className:'dry-raw-photo',group:'hot-wash-raw',sizes:'(min-width:1400px) 407px, (min-width:1101px) 31vw, (min-width:761px) 46vw, calc(100vw - 40px)'})}
    <div class="hw-raw-origin-copy"><h3>${hotWashRawMedia[key].title}</h3><dl>
     ${fields.map((value,index)=>`<div><dt>${rawFieldLabels[index]}</dt><dd>${value}</dd></div>`).join('')}
    </dl></div>
   </article>`).join('')}
  </div>
  ${renderHotWashCycle()}
  <div class="dry-raw-categories-head"><h3>Что удаляет мойка</h3></div>
  <div class="dry-raw-categories hw-raw-contaminants">
   ${contaminants.map(([name,description,icon])=>`<article class="dry-raw-contaminant"><span class="dry-raw-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span><h4>${name}</h4><p>${description}</p></article>`).join('')}
  </div>
 </section>`;
}

export function renderHotWashProducts(){
 return `<section class="section" id="quality">
  <div class="line-section-heading"><div><p class="eyebrow">ГОТОВЫЙ ПРОДУКТ</p><h2>Три формы готовой продукции.<br>Полиэтиленовая гранула — ключевой продукт полного цикла.</h2></div><p>Очищенная плёнка направляется по одному из трёх маршрутов — под задачи предприятия и требования покупателя.</p></div>
  <div class="hw-product-grid">${hotWashProducts.map(([key,title,text,route])=>`<article class="hw-product${key==='product-granule'?' hw-product--primary era-indigo-surface':''}" data-hotwash-output="${key}">
   ${hotWashPicture(key,{title,caption:'',group:'hot-wash-products'})}
   <div class="hw-product-copy">${key==='product-granule'?'<p class="eyebrow">Основной продукт</p>':''}<h3>${title}</h3><p class="hw-material-route">${route}</p><p>${text}</p></div>
  </article>`).join('')}</div>
  ${renderHotWashQuality()}
  ${renderHotWashScaling()}
 </section>`;
}

const washFeatures=[
 ['automation','Автоматизация','Согласованный пуск и остановка узлов, контроль уровней бункеров, порционная подача и выбор рабочей ветки.'],
 ['memory','Память режимов','Настройки подачи, температуры, дозирования и вывода осадка для разных партий.'],
 ['diagnostics','Диагностика','Нагрузка, вибрация и наработка по данным установленных приводов и датчиков.'],
 ['protection','Защита оборудования','Контроль отклонений и автоматическая остановка по алгоритму. Разрешения и межблокировки уточняют при наладке.'],
 ['monitoring','Мониторинг','Температура, уровень и pH рабочей жидкости. В проекте предусмотрены камеры 4K, компьютер и монитор 55″. Права удалённого доступа согласуют отдельно.'],
 ['history','История и контроль','Журнал событий и тренды показателей для оператора и обслуживания оборудования.']
];

export function renderHotWashKair(){
 return `<section class="section line-kair-section" id="kair">
  ${renderDryKair({description:'КАИР согласует работу транспортёров, мокрых узлов, водяных контуров и выбранной ветки выдачи. Комплектация на базе Siemens включает три шкафа управления (поз. 35).',lineFeatures:washFeatures})}
 </section>`;
}
