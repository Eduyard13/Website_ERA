import geography from '../content/home-market-geography.json' with {type:'json'};
import {marketGroups,marketDistricts,marketRegions,marketModel,marketNumber,marketMoney,marketLevel,filmKgPerCapita} from '../content/home-market.mjs';
import {escapeContact as esc} from './contact-channels.mjs';

const legend=['До 400 тыс.','400–700 тыс.','700 тыс. – 1 млн','От 1 млн'];
const scopes={districts:'Федеральные округа',regions:'Приоритетные регионы'};
const sourceLabel='Оценки носят ориентировочный характер и сформированы на основе совокупности открытых данных, отраслевых допущений и модели ЭРА по доле плёночной фракции в общем потоке отходов.';
const external=(label,href)=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

function groupAttrs(record,group,center,active){
 return `data-market-feature="${record.id}" data-market-group="${group}" data-center="${center.join(',')}" tabindex="-1" role="button" aria-pressed="${active}" aria-label="${esc(record.name)}"`;
}

function districtShape(record,index){
 const shape=geography.districts[record.id];
 const [x,y]=shape.label;
 return `<g class="market-district" ${groupAttrs(record,'districts',shape.label,index===0)} data-level="${marketLevel(record)}">
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
 return `<g class="market-pin" ${groupAttrs(record,'regions',marker,false)}>
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
    <linearGradient id="market-selected-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bbae84"/><stop offset="1" stop-color="#88774b"/></linearGradient>
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

function recordPanel(row,group,active){
 return `<article class="market-record" data-market-record="${row.id}"${active?'':' hidden'}>
  <p class="market-record-scope">${group==='districts'?'Федеральный округ':'Приоритетный регион'}</p>
  <h3 data-market-name>${esc(row.name)}</h3>
  <div class="market-figure"><p>Оценка сырьевой базы</p><strong data-market-volume>${marketNumber(row.tonnes)} <small>т/год</small></strong></div>
  <dl class="market-record-grid">
   <div><dt>Население в модели · ${marketModel.populationYear}</dt><dd>${marketNumber(row.population)}</dd></div>
   <div><dt>Расчётное число комплексов</dt><dd>${marketNumber(row.complexes)}</dd></div>
   <div><dt>Прибыль по сценарию в месяц</dt><dd>${marketMoney(row.monthly)}</dd></div>
   <div><dt>Прибыль по сценарию в год</dt><dd>${marketMoney(row.annual)}</dd></div>
  </dl>
  <p class="market-reason">${esc(row.comment)}</p>
 </article>`;
}

function nativeSelect(group,rows){
 const active=group==='districts';
 return `<label class="market-select" data-market-picker="${group}"${active?'':' hidden'}>
  <span>${active?'На карте':'Выбрать регион'}</span>
  <select data-market-select="${group}" disabled aria-controls="russia-market-details">${rows.map(row=>`<option value="${row.id}">${esc(row.name)}</option>`).join('')}</select>
 </label>`;
}

function methodology(){
 const whole=marketNumber(marketModel.kgWastePerCapita),share=marketNumber(marketModel.filmShare*100);
 return `<div class="market-method">
  <p>${sourceLabel}</p>
  <details class="market-method-details" data-keep-open>
   <summary>Как рассчитан потенциал</summary>
   <div>
    <p>База модели — ${whole} кг ТКО на человека в год. Доля плёночной фракции принята равной ${share}%, или ${marketNumber(filmKgPerCapita)} кг на человека в год. Объём по территории — население × ${marketNumber(filmKgPerCapita)} кг × местный коэффициент ÷ 1 000.</p>
    <p>Число комплексов округляется до целого по условной ёмкости ${marketNumber(marketModel.moduleTonnes)} т входящего сырья в год. Прибыль — сценарий ${marketMoney(marketModel.targetMonthlyProfit)} в месяц на условный комплекс. Годовая оценка использует 12 месяцев. Итог по России складывается из округов. Приоритетные регионы входят в их состав.</p>
    <p>Оценочная модель ЭРА использует данные о населении за ${marketModel.populationYear} год и расчётные региональные коэффициенты. Экономику конкретной площадки рассчитывают по её загрузке, затратам и цене реализации.</p>
    <div class="market-sources">
     ${external('Росстат · база населения', 'https://78.rosstat.gov.ru/news/document/233137?print=1')}
     ${external('Всемирный банк · обзор отходов', 'https://documents1.worldbank.org/curated/en/702251549554831489/pdf/Waste-in-Russia-Garbage-or-Valuable-Resource.pdf')}
     ${external('Natural Earth · геометрия', 'https://www.naturalearthdata.com/about/terms-of-use/')}
    </div>
   </div>
  </details>
  <noscript><details class="market-method-details">
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
     <div class="market-switch" aria-label="Уровень карты" role="group">${entries.map(([id],index)=>`<button type="button" data-market-mode="${id}" aria-pressed="${index===0}" disabled>${scopes[id]}</button>`).join('')}</div>
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
      ${entries.map(([group,rows])=>rows.map((record,i)=>recordPanel(record,group,group==='districts'&&i===0)).join('')).join('')}
     </div>
    </div>
   </div>
   ${methodology()}
  </div>
 </section>`;
}
