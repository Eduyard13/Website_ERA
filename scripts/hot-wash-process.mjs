import flow from '../content/hot-wash-flow.json' with {type:'json'};
import {escapeHtml} from './hot-wash-media.mjs';
import {renderHotWashOperations} from './hot-wash-panels.mjs';

const iconPaths={
 prep:'<path d="M7 5h18l-7 9v5h-4v-5L7 5ZM9 22h14a3 3 0 0 1 0 6H9a3 3 0 1 1 0-6Z"/><path d="M9 25h.1m7 0h.1m7 0h.1"/>',
 buffer:'<path d="M7 7c0-4 18-4 18 0v13l-5 5h-8l-5-5V7Zm0 0c0 4 18 4 18 0M7 14h18m-11 11v4m4-4v4"/>',
 mill:'<path d="m12 3-1 4-4-1-2 4 3 3-2 4-4 1 1 5 5 1 2 4 4-1 2-3 5 1 4-3-1-4 4-2v-5l-4-1-1-5-5-1-2 3-4-4Z"/><path d="M16 9c-2 4-5 6-5 10a5 5 0 0 0 10 0c0-4-3-6-5-10Z"/>',
 first:'<rect x="3" y="6" width="26" height="12" rx="3"/><path d="M3 15h26M9 11l3-2 4 4 4-4 3 2m-9 10c-1 2-3 4-3 6a3 3 0 0 0 6 0c0-2-2-4-3-6Z"/>',
 hot:'<path d="M3 13h26l-4 14H7l-4-14ZM5 19c2 2 4 2 6 0s4-2 6 0 4 2 6 0 4-2 5-1M10 8c-3-2 3-3 0-5m6 5c-3-2 3-3 0-5m6 5c-3-2 3-3 0-5"/>',
 rinse:'<path d="M16 3v5m-4 0h8l7 6H5l7-6ZM8 19l-2 3m10-3v4m8-4 2 3M10 25l-2 3m8-2v3m6-4 2 3"/>',
 choice:'<path d="M4 16h11m0 0V6h12m-12 10h12m-12 0v10h12m-3-23 3 3-3 3m0 4 3 3-3 3m0 4 3 3-3 3"/>',
 reagent:'<path d="M12 4h8m-7 0v9l-7 12c-.8 1.5.3 3 2 3h16c1.7 0 2.8-1.5 2-3l-7-12V4M10 20h12m-7-3h2m-1 7h2"/>',
 waste:'<path d="M11 4h10l-3 6 8 11c2 3 0 6-4 6H10c-4 0-6-3-4-6l8-11-3-6Zm2 6h6"/><path d="M16 15v5m0 3h.1"/>',
 bales:'<path d="m4 9 12-5 12 5v14l-12 5-12-5V9Zm0 0 12 5 12-5M16 14v14M9.5 6.7l12 5v14"/>',
 capsulate:'<path d="m12 6 5-2 5 4v5l-6 2-5-3Zm-7 9 5-2 4 4-1 6-5 2-4-4Zm13 3 6-3 5 4-1 6-6 3-5-4Z"/>',
 granule:'<circle cx="16" cy="7" r="4"/><circle cx="11" cy="15" r="4"/><circle cx="21" cy="15" r="4"/><circle cx="6" cy="23" r="4"/><circle cx="16" cy="23" r="4"/><circle cx="26" cy="23" r="4"/>',
 water:'<path d="M16 3C11 10 7 14 7 20a9 9 0 0 0 18 0c0-6-4-10-9-17Zm-5 17a5 5 0 0 0 5 5"/>'
};
const stageIcons={middle:'first',final:'first',clean:'buffer'};
const icon=key=>`<svg class="hw-flow-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[key]}</svg>`;
const arrow=(kind,orientation='right',className='')=>`<svg class="hw-flow-arrow hw-flow-arrow--${kind} hw-flow-arrow--${orientation} ${className}" viewBox="0 0 28 16" fill="none" aria-hidden="true"><path class="hw-arrow-shaft" d="M1 8h24"/><path d="m20 3 6 5-6 5"/></svg>`;
const rail=(kind,path,height)=>`<svg class="hw-flow-rail hw-flow-rail--${kind}" viewBox="0 0 1000 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" vector-effect="non-scaling-stroke"/></svg>`;
const legend=[
 ['film','Плёнка и готовая продукция'],['working','Рабочая жидкость и возврат'],
 ['fresh','Чистая вода и подпитка'],['waste','Стоки и включения']
];
const productNotes={
 bales:'Автоматический пресс и рольганг. Готовые тюки забирает погрузчик 36.',
 capsulate:'Термомеханическое уплотнение плёнки. Капсулят поступает в свой биг-бэг.',
 granule:'Двухстадийная экструзия и фильтрация расплава. Гранула поступает в свой биг-бэг.'
};

function stageSideFlow(key){
 if(key==='prep'){
  const [route,description]=flow.waste[0];
  return `<aside class="hw-stage-side hw-stage-side--waste" data-hotwash-waste="solids" data-hotwash-flow="${route}">
   ${arrow('waste','down')}<div>${icon('waste')}<p><strong>${route}</strong><span>${description}</span></p></div>
  </aside>`;
 }
 if(key==='buffer'||key==='first'){
  const [route,description]=flow.reagents[key==='buffer'?0:1];
  return `<aside class="hw-stage-side hw-stage-side--reagent" data-hotwash-reagent="${key==='buffer'?'32А':'32Б'}" data-hotwash-flow="${route}">
   ${arrow('reagent','up')}<div>${icon('reagent')}<p><strong>${route}</strong><span>${description}</span></p></div>
  </aside>`;
 }
 return '';
}

function stageRow(stages,start){
 return `<ol class="hw-flow-stages" start="${start}" aria-label="${start===1?'Этапы от подготовки до горячей мойки':'Этапы от межступенчатого отжима до выдачи'}">
 ${stages.map(([key,route,title,description],i)=>{
  const workRoute=key==='mill'?route.replace(' / ',' или '):route;
  const sharedRowNext=i<stages.length-1;
  const sideFlow=stageSideFlow(key);
  return `<li class="hw-stage-item">
   <article class="hw-stage-card${key==='hot'?' hw-stage-card--hot':''}" data-hotwash-stage="${key}" data-hotwash-flow="${route}">
    <div class="hw-stage-top"><span>${workRoute}</span>${icon(stageIcons[key]??key)}</div>
    <h3>${title}</h3><p>${description}</p>
    ${sharedRowNext?arrow('film','right','hw-stage-next-desktop'):''}
   </article>
   ${sideFlow?`<div class="hw-stage-extras">${sideFlow}<div class="hw-mobile-film-rail">${rail('film','M500 0V12',12)}</div></div>`:''}
   ${key==='hot'?`<div class="hw-stage-extension">${rail('film','M500 0V10',10)}</div>`:''}
   ${sharedRowNext?arrow('film','down','hw-stage-next-mobile'):''}
  </li>`;
 }).join('')}
 </ol>`;
}

function productRoutes(){
 return `<div class="hw-flow-outputs">
  <div class="hw-flow-output-join">${rail('film','M910 0V14H500V28',28)}${arrow('film','down')}</div>
  <div class="hw-flow-output-label"><h3>22 · Один из трёх маршрутов</h3><p>Реверсивный транспортёр 23 направляет плёнку на капсуляцию или грануляцию.</p></div>
  <div class="hw-output-fan">${rail('film','M500 0V15H164V35 M500 15V35 M500 15H836V35',35)}</div>
  <ul class="hw-flow-branch-grid">
   ${flow.products.map(([key,route,title])=>`<li>
    ${arrow('film','down','hw-branch-down')}${arrow('film','right','hw-branch-side')}
    <article class="hw-flow-product${key==='granule'?' hw-flow-product--primary':''}" data-hotwash-product="${key}" data-hotwash-flow="${route}">
     ${icon(key)}<div><span class="hw-position">${route}</span><h4>${title}</h4><p>${productNotes[key]}</p></div>
    </article>
   </li>`).join('')}
  </ul>
 </div>`;
}

const waterZones=[
 {key:'mill',title:'Измельчение и первый отжим',kind:'working',nodes:['13/15/16А · Мокрая резка и первый отжим','31 · Отстойник и гидроциклон','13 · Возврат к измельчителю']},
 {key:'hot',title:'Горячая мойка',kind:'working',nodes:['18А · Первый флотатор','Предварительный отжим и местная циркуляция','18А · Возврат во флотатор']},
 {key:'rinse',title:'Ополаскивание',kind:'waste',nodes:['18Б · Второй флотатор','19Б/16В · Транспортировка и отжим','Отвод ополаскивающей воды']}
];
const treatment=[
 ['Штробы и общий сбор','Стоки трёх участков'],
 ['33 · Комплекс очистки','25 м³/ч · ёмкость 4 м³'],
 ['34 · Бак очищенных стоков','20 м³ · доотделение плавающих частиц'],
 ['18А · Горячая мойка','Возврат очищенной воды']
];

function waterCircuit(){
 const [freshRoute]=flow.water[0], feeds=freshRoute.split('; ');
 const [dirtyRoute]=flow.water[4];
 return `<div class="hw-water-map" id="water-circulation">
  <div class="hw-water-title">${icon('water')}<div><h3>Водооборот с локальной циркуляцией, очисткой и подпиткой</h3><p>Отдельная подача чистой воды и общий сбор стоков трёх участков.</p></div></div>
  <div class="hw-water-tank" data-hotwash-water="fresh" data-hotwash-flow="${escapeHtml(freshRoute)}"><strong>30 · Резервуар чистой воды</strong><p>20 м³ · подпитка и поддержание уровня</p></div>
  <div class="hw-water-fan">${rail('fresh','M500 0V15H164V34 M500 15V34 M500 15H836V34',34)}</div>
  <div class="hw-water-zones">
   ${waterZones.map(({key,title,kind,nodes},i)=>`<div class="hw-water-zone">
    <p class="hw-water-feed">${arrow('fresh','down')}<span>${feeds[i]} · ${key==='rinse'?'чистая вода':'подпитка'}</span></p>
    <article data-hotwash-water="${key}" data-hotwash-flow="${escapeHtml(flow.water[i+1][0])}">
     <h4>${title}</h4>
     <ol class="hw-water-local" aria-label="${escapeHtml(flow.water[i+1][1])}">
      ${nodes.map((node,n)=>`<li>${n?arrow(kind,'down'):''}<span>${node}</span></li>`).join('')}
     </ol>
    </article>
    <p class="hw-water-drain">${arrow('waste','down')}<span>Загрязнённые стоки в общий сбор</span></p>
   </div>`).join('')}
  </div>
  <div class="hw-water-confluence">${rail('waste','M164 0V18H115V36 M500 0V18H164 M836 0V18H500',36)}${arrow('waste','down')}</div>
  <ol class="hw-water-treatment" aria-label="Общий сбор и возврат" data-hotwash-water="treatment" data-hotwash-flow="${escapeHtml(dirtyRoute)}">
   ${treatment.map(([title,note],i)=>`<li>
    ${i?arrow(i===1?'waste':'working','right','hw-treatment-arrow'):''}
    <div class="hw-water-node"><strong>${title}</strong><p>${note}</p></div>
    ${i===1?`<div class="hw-treatment-extras"><aside class="hw-water-waste" data-hotwash-waste="sludge" data-hotwash-flow="${flow.waste[1][0]}">${arrow('waste','down')}<p>Отделённые включения → сбор и вывоз</p></aside><div class="hw-mobile-water-rail">${rail('working','M500 0V12',12)}</div></div>`:''}
   </li>`).join('')}
  </ol>
  <p class="hw-water-note">Подпитка компенсирует испарение, вынос воды с плёнкой и осадком, технологические сливы. Объёмы подпитки, продувки и отвода стоков определяют по водному балансу и составу сырья.</p>
 </div>`;
}

export function renderHotWashProcess(){
 return `<section class="section hw-process" id="process">
  ${renderHotWashOperations()}
  <div class="line-section-heading hw-process-heading"><div><p class="eyebrow">МАРШРУТ МАТЕРИАЛА · HOT-WASH</p><h2>Как линия отмывает подготовленную плёнку и выпускает тюки, капсулят или гранулу</h2></div><p>Наглядная карта движения плёнки, рабочих жидкостей, чистой воды и трёх маршрутов готовой продукции.</p></div>
  <div class="hw-flow-map">
   <ul class="hw-flow-legend" aria-label="Обозначения на схеме">${legend.map(([kind,label])=>`<li>${arrow(kind)}<span>${label}</span></li>`).join('')}</ul>
   ${stageRow(flow.material.slice(0,5),1)}
   <div class="hw-flow-turn">${rail('film','M910 0V24H90V48',48)}${arrow('film','down')}<span>Из горячей мойки в межступенчатый отжим</span></div>
   ${stageRow(flow.material.slice(5),6)}
   ${productRoutes()}
   ${waterCircuit()}
   <div class="hw-flow-notes">
    <p><strong>Две ветки измельчения работают поочерёдно.</strong> Три центрифуги 16А, 16Б и 16В отжимают плёнку последовательно после мокрой резки, горячей мойки и ополаскивания.</p>
    <p><strong>Один поток плёнки направляют по выбранному маршруту.</strong> Три отдельные рамы позиции 9 предназначены для включений, капсулята и гранулы.</p>
   </div>
  </div>
 </section>`;
}
