import geography from '../content/home-market-geography.json' with {type:'json'};
import {marketGroups,marketDistricts,marketRegions,marketModel,marketNational,marketNationalTonnes,marketNumber,marketMoney,marketLevel} from '../content/home-market.mjs';
import {escapeContact as esc} from './contact-channels.mjs';

const legend=['До 400 тыс.','400–700 тыс.','700 тыс. – 1 млн','От 1 млн'];
const scopes={districts:'Федеральные округа',regions:'Приоритетные регионы'};
const scopesByRecord={districts:'Федеральный округ',regions:'Приоритетный регион',national:'Национальный масштаб'};

function groupAttrs(record,group,center){
 return `data-market-feature="${record.id}" data-market-group="${group}" data-center="${center.join(',')}" tabindex="-1" role="button" aria-disabled="true" aria-pressed="false" aria-label="${esc(record.name)}"`;
}

function districtShape(record){
 const shape=geography.districts[record.id];
 const [x,y]=shape.label;
 return `<g class="market-district" ${groupAttrs(record,'districts',shape.label)} data-level="${marketLevel(record)}">
  <path class="market-district-area" d="${shape.path}" />
  <text x="${x}" y="${y}" aria-hidden="true">${shape.short}</text>
 </g>`;
}

function regionShape(record){
 const shape=geography.regions[record.id];
 return `<path class="market-priority-area" d="${shape.path}" data-market-zone="${record.id}" />`;
}

function regionMarker(record){
 const {anchor,marker}=geography.regions[record.id];
 const [x,y]=marker,[a,b]=anchor;
 return `<g class="market-pin" ${groupAttrs(record,'regions',marker)}>
  <path class="market-pin-leader" d="M${a},${b}L${x},${y}" />
  <circle class="market-pin-hit" cx="${x}" cy="${y}" r="13" />
  <circle class="market-pin-ring" cx="${x}" cy="${y}" r="8" />
  <circle class="market-pin-center" cx="${x}" cy="${y}" r="3.2" />
 </g>`;
}

function mapDrawing(){
 const [, ,width,height]=geography.viewBox;
 return `<div class="market-canvas" data-market-canvas>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="${geography.viewBox.join(' ')}" width="${width}" height="${height}" role="group" aria-labelledby="market-graphic-title">
   <title id="market-graphic-title">Карта федеральных округов России и приоритетных регионов</title>
   <defs>
    <linearGradient id="market-selected-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c6a66a"/><stop offset="1" stop-color="#8f7346"/></linearGradient>
   </defs>
   <path class="market-graticule" d="${geography.grid}" aria-hidden="true"/>
   <g data-market-districts>${marketDistricts.map(districtShape).join('')}</g>
   <g data-market-regions hidden>
    <g aria-hidden="true">${marketRegions.map(regionShape).join('')}</g>
    ${marketRegions.map(regionMarker).join('')}
   </g>
  </svg>
  <div class="market-tooltip" data-market-tooltip role="tooltip" hidden><strong></strong><span></span></div>
 </div>`;
}

function recordPanel(row,group){
 const national=group==='national';
 const [volume,unit]=national?[`≈ ${marketNationalTonnes}`,'млн т/год']:[marketNumber(row.tonnes),'т/год'];
 const source=national?'Бытовые отходы, упаковка, сельское хозяйство, промышленность':row.comment;
 return `<article class="market-record" data-market-record="${row.id}"${national?'':' hidden'}>
   <p class="market-record-scope">${scopesByRecord[group]}</p>
   <h3 data-market-name tabindex="-1">${esc(row.name)}</h3>
   <div class="market-figure market-figure-pair">
    <div><p>Сырьевая база в год</p><strong data-market-volume>${volume} <small>${unit}</small></strong></div>
    <div><p>Целевая чистая прибыль в год</p><strong data-market-annual>${marketMoney(row.annual,1)}</strong></div>
   </div>
   <dl class="market-record-grid">
    <div><dt>${national?'Расчётный масштаб сети':'Расчётное число комплексов'}</dt><dd data-market-complexes>${marketNumber(row.complexes)}${national?' <small>комплексов</small>':''}</dd></div>
    <div><dt>Население в модели · база ${marketModel.populationYear}</dt><dd>${national?`≈ ${marketNumber(row.population/1_000_000,0)} <small>млн чел.</small>`:marketNumber(row.population)}</dd></div>
    <div><dt>Целевая чистая прибыль в месяц</dt><dd data-market-monthly>${marketMoney(row.monthly)}</dd></div>
    <div class="market-source-sector"><dt>Основные источники сырья</dt><dd>${esc(source)}</dd></div>
   </dl>
   <p class="market-reason">${national?'Расчётный сценарий ЭРА. Фактические показатели зависят от сырья, загрузки, затрат и условий реализации проекта.':'Характерные отраслевые потоки по описанию территории в расчётной модели ЭРА.'}</p>
  </article>`;
}

function nativeSelect(group,rows){
 const active=group==='districts';
 return `<label class="market-select" data-market-picker="${group}"${active?'':' hidden'}>
  <span>${active?'На карте':'Выбрать регион'}</span>
  <select data-market-select="${group}" disabled aria-controls="russia-market-details"><option value="${marketNational.id}">${marketNational.name}</option>${rows.map(row=>`<option value="${row.id}">${esc(row.name)}</option>`).join('')}</select>
 </label>`;
}

function methodology(){
 return `<div class="market-method">
  <p>Расчётный сценарий ЭРА основан на доступных статистических ориентирах. Целевая чистая прибыль составляет ${marketMoney(marketModel.targetMonthlyProfit)} в месяц на комплекс после расходов, амортизации и налога на прибыль. Объём сырья и число комплексов рассчитаны по модели. Загрузка и доходность зависят от условий конкретного проекта.</p>
  
  <noscript><details class="market-method-details" data-keep-open>
   <summary>Оценки по всем округам и регионам</summary>
   <div class="market-table-wrap"><table><thead><tr><th scope="col">Территория</th><th scope="col">Население</th><th scope="col">Сырьё, т/год</th><th scope="col">Комплексы</th><th scope="col">Прибыль в месяц</th></tr></thead>
    <tbody>${[...marketDistricts,...marketRegions].map(row=>`<tr><th scope="row">${esc(row.name)}</th><td>${marketNumber(row.population)}</td><td>${marketNumber(row.tonnes)}</td><td>${row.complexes}</td><td>${marketMoney(row.monthly)}</td></tr>`).join('')}</tbody>
   </table></div>
  </details></noscript>
 </div>`;
}

export function homeMarketMap(){
 const entries=Object.entries(marketGroups);
 return `<section class="resource-section resource-market era-indigo-surface" id="russia-market" aria-labelledby="russia-market-title" data-home-block="market" data-page-progress-label="Карта России">
  <div class="resource-container">
   <header class="resource-heading">
    <p class="eyebrow">ГЕОГРАФИЯ РЫНКА</p>
    <h2 id="russia-market-title">Масштаб возможности по России</h2>
    <p>Где сосредоточено плёночное сырьё и сколько комплексов может поддержать региональная сырьевая база.</p>
   </header>
   <div class="market-dashboard" data-market-map data-mode="districts">
    <div class="market-toolbar">
     <div class="market-tools">
      <div class="market-switch" aria-label="Уровень карты" role="group">${entries.map(([id],index)=>`<button type="button" data-market-mode="${id}" aria-pressed="${index===0}" disabled>${scopes[id]}</button>`).join('')}</div>
      <button type="button" class="market-reset" data-market-reset aria-pressed="true" aria-controls="russia-market-details" disabled>${marketNational.name}</button>
     </div>
     ${entries.map(([id,rows])=>nativeSelect(id,rows)).join('')}
    </div>
    <div class="market-layout">
     <div class="market-map-panel">
      ${mapDrawing()}
      <div class="market-legend" aria-label="Легенда карты">
       <span>Сырьё по округам, т/год</span>
       <ul>${legend.map((label,level)=>`<li><i data-level="${level}" aria-hidden="true"></i>${label}</li>`).join('')}</ul>
      </div>
     </div>
     <div class="market-details-panel" id="russia-market-details" aria-live="polite" aria-atomic="true">
      ${recordPanel(marketNational,'national')}
      ${entries.map(([group,rows])=>rows.map(record=>recordPanel(record,group)).join('')).join('')}
     </div>
    </div>
   </div>
   ${methodology()}
  </div>
 </section>`;
}

export function marketDistrictContour(id){
 const {path}=geography.districts[id];
 const pairs=[...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([,x,y])=>[Number(x),Number(y)]);
 const xs=pairs.map(([x])=>x),ys=pairs.map(([,y])=>y);
 const left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
 return `<svg class="resource-district-contour" viewBox="${left-4} ${top-4} ${width+8} ${height+8}" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
}
