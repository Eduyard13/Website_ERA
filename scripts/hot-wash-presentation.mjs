import {hotWashProducts} from '../content/hot-film-washing.mjs';
import {renderDryKair} from './dry-kair.mjs';
import {hotWashPicture} from './hot-wash-media.mjs';

const rawMaterials=[
 ['Бытовые пакеты и плёночная упаковка','Этикетки, клей, жиры, масла, органика','Полимерный состав, скотч, многослойные и посторонние полимеры'],
 ['Сельскохозяйственные плёнки','Земля, песок, растительные частицы в складках','Толщина, длина фрагментов, влажность, абразив'],
 ['Стретч и упаковочная плёнка','Клей, бумажные этикетки, ленты, остатки продукта','Слипание, совместимость, характер клея']
];
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
  <div class="dry-raw-photos hw-raw-photos">${['raw-film-01','raw-film-02'].map(key=>hotWashPicture(key,{className:'dry-raw-photo',group:'hot-wash-raw',sizes:'(min-width:801px) 44vw, calc(100vw - 40px)'})).join('')}</div>
  <div class="dry-raw-categories hw-raw-origins">
   ${rawMaterials.map(([name,residues,checks])=>`<article class="dry-raw-contaminant"><h3>${name}</h3><p>${residues}.</p><p><strong>Что проверяем.</strong> ${checks}.</p></article>`).join('')}
  </div>
  <div class="dry-raw-evidence">
   <h3>Сухая сепарация → горячая мойка → грануляция</h3>
   <p>Сухая стадия раскрывает тюки и удаляет основную массу включений. В проекте на мойку поступает до 1 500 кг/ч подготовленной плёнки. Подачу уточняют по составу партии и выбранному исполнению линии.</p>
   <a class="text-link" href="/catalog/lines/separatsiya-02">Первый этап — сухая сепарация ↗</a>
  </div>
  <div class="dry-raw-categories-head"><h3>Что удаляет мойка</h3></div>
  <div class="dry-raw-categories hw-raw-contaminants">
   ${contaminants.map(([name,description,icon])=>`<article class="dry-raw-contaminant"><span class="dry-raw-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span><h4>${name}</h4><p>${description}</p></article>`).join('')}
  </div>
  <details class="line-more dry-raw-details" data-keep-open>
   <summary>Сырьё и контроль партии</summary>
   <div><div class="table-wrap hw-table-scroll" role="region" aria-label="Таблица контроля партии" tabindex="0">
    <table class="hw-raw-table"><caption>Сырьё и контроль партии</caption><thead><tr><th scope="col">Сырьё</th><th scope="col">Остатки после сухой стадии</th><th scope="col">Что проверяем</th></tr></thead>
    <tbody>${rawMaterials.map(([name,residues,checks])=>`<tr><th scope="row">${name}</th><td>${residues}</td><td>${checks}</td></tr>`).join('')}</tbody></table>
   </div><p class="line-note">Массу, влажность и остаточные включения контролируют раздельно. Камни, металл, стекло и жёсткие предметы удаляют на сухой стадии. Баллистический сепаратор мойки защищает мокрую резку от случайных включений. Для переработки полимеров близкой плотности проверяют совместимость партии: флотация может их не разделить.</p></div>
  </details>
 </section>`;
}

const qualityMetrics=[
 ['30–70','ppm','Остаточные включения в плёнке после сухой сепарации и горячей мойки','30–70 г/т, или 0,003–0,007% по массе'],
 ['1–2','%','Потери плёнки при мойке','От исходной массы плёнки'],
 ['0,8–1,2','г/10 мин','ПТР гранулы ПВД по ТО','190 °C / 2,16 кг']
];

export function renderHotWashProducts(){
 return `<section class="section" id="quality">
  <div class="line-section-heading"><div><p class="eyebrow">ГОТОВЫЙ ПРОДУКТ</p><h2>Три формы готовой продукции.<br>Полиэтиленовая гранула — ключевой продукт полного цикла.</h2></div><p>Очищенная плёнка направляется по одному из трёх маршрутов — под задачи предприятия и требования покупателя.</p></div>
  <div class="hw-product-grid">${hotWashProducts.map(([key,title,text,route])=>`<article class="hw-product${key==='product-granule'?' hw-product--primary era-indigo-surface':''}" data-hotwash-output="${key}">
   ${hotWashPicture(key,{title,caption:'',group:'hot-wash-products'})}
   <div class="hw-product-copy">${key==='product-granule'?'<p class="eyebrow">Основной продукт</p>':''}<h3>${title}</h3><p class="hw-material-route">${route}</p><p>${text}</p></div>
  </article>`).join('')}</div>
  <div class="line-metrics hw-quality-metrics"><dl>${qualityMetrics.map(([value,unit,label,detail])=>`<div><dt>${label}</dt><dd>${value}<small>${unit}</small></dd><span class="line-metric-detail">${detail}</span></div>`).join('')}</dl>
   <p>Показатели из технического описания. Состав партии и параметры выбранного продукта подтверждают контролем качества и согласованными испытаниями.</p>
  </div>
  <p class="line-note">Границы поставки определяет спецификация. Возможна комплектация под гранулятор заказчика. Влажность, состав, текучесть и фильтрацию согласуют под выбранное оборудование.</p>
  <details class="line-more" data-keep-open><summary>Исходная схема трёх маршрутов</summary><div>${hotWashPicture('product-flow',{sizes:'(min-width:1101px) 65vw, 88vw'})}</div></details>
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
  <div class="line-process-views hw-kair-previews">${['kair-overview','kair-parameters'].map(key=>hotWashPicture(key,{group:'hot-wash-kair',sizes:'(min-width:801px) 44vw, calc(100vw - 40px)'})).join('')}</div>
  <p class="line-note">Экраны из технического описания показывают интерфейс оператора. Состав отображаемых параметров зависит от комплектации и наладки.</p>
 </section>`;
}
