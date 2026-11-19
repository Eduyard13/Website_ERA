import {filmKgPerCapita,marketDistricts,marketFeedstocks,marketModel,marketNationalTonnes,marketNumber,marketTotals} from '../content/home-market.mjs';
import {escapeContact as esc} from './contact-channels.mjs';

const external=(label,url)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span><span class="sr-only">, внешняя ссылка</span></a>`;
const volume=row=>{
 const rounded=Math.round(row.tonnes/250_000)*250_000;
 return rounded>=1_000_000?`≈ ${marketNumber(rounded/1_000_000)}\u00a0млн\u00a0т/год`:`≈ ${marketNumber(rounded/1000)}\u00a0тыс.\u00a0т/год`;
};

function ring(){
 const radius=126,center=160;
 const point=angle=>[center+radius*Math.cos(angle),center+radius*Math.sin(angle)].map(n=>n.toFixed(2)).join(',');
 let angle=-Math.PI/2;
 const sectors=marketFeedstocks.map(row=>{
  const sweep=row.share/100*2*Math.PI;
  const start=point(angle+Math.PI/120),end=point(angle+sweep-Math.PI/120);
  angle+=sweep;
  return `<path d="M${start}A${radius},${radius} 0 0,1 ${end}" stroke="${row.color}" data-feedstock-sector="${row.id}" role="button" tabindex="-1" aria-disabled="true" aria-pressed="false" aria-label="${esc(`${row.name}, ${row.share}%, ${volume(row)}`)}" aria-controls="feedstock-details"/>`;
 });
 return `<div class="feedstock-ring">
  <svg viewBox="0 0 320 320" width="320" height="320" role="group" aria-labelledby="feedstock-ring-title">
   <title id="feedstock-ring-title">Структура сырьевой базы России</title>
   ${sectors.join('')}
  </svg>
  <div class="feedstock-ring-text" aria-hidden="true">
   <div data-feedstock-center="all"><strong>≈ ${marketNationalTonnes} млн</strong><span>тонн в год</span><small>Россия · оценка ЭРА</small></div>
   ${marketFeedstocks.map(row=>`<div data-feedstock-center="${row.id}" hidden><strong>${row.share}%</strong><span>${volume(row)}</span><small>Доля в модели ЭРА</small></div>`).join('')}
  </div>
 </div>`;
}

function category(row){
 return `<button type="button" data-feedstock-choice="${row.id}" aria-pressed="false" aria-controls="feedstock-details" disabled>
  <span class="feedstock-swatch" style="--feedstock-color:${row.color}" aria-hidden="true"></span>
  <span class="feedstock-choice-name">${esc(row.name)}</span>
  <strong>${row.share}%</strong><span class="feedstock-choice-volume">${volume(row)}</span>
 </button>`;
}

function detail(row){
 return `<article data-feedstock-detail="${row.id}" aria-hidden="true">
  <h4>${esc(row.name)}</h4>
  <p class="feedstock-detail-metrics">${row.share}% · ${volume(row)}</p>
  <dl><div><dt>Что входит</dt><dd>${esc(row.materials)}</dd></div><div><dt>Где образуется</dt><dd>${esc(row.origin)}</dd></div></dl>
 </article>`;
}

function methodology(){
 const kg=marketNumber(marketModel.kgWastePerCapita), share=marketNumber(marketModel.filmShare*100);
 const municipal2025=46_400_000;
 const sensitivity=marketNumber(municipal2025*marketModel.filmShare/1_000_000);
 const factors=marketDistricts.map(row=>row.coefficient);
 return `<div class="feedstock-sources">
  <p>На основе открытых данных · расчётная модель ЭРА</p>
  <details class="feedstock-method" id="feedstock-methodology" data-keep-open>
   <summary>Источники данных и методология</summary>
   <div class="feedstock-method-content">
    <ul class="feedstock-source-grid">
     <li><h4>IFC / Группа Всемирного банка</h4><p>Исторический ориентир из введения к докладу, стр. 8. Общий поток коммунальных отходов оценивался в 55–60 млн т в год и до ${kg} кг на жителя в год.</p>
      ${external('Waste in Russia · доклад','https://documents1.worldbank.org/curated/en/702251549554831489/pdf/Waste-in-Russia-Garbage-or-Valuable-Resource.pdf#page=8')}</li>
     <li><h4>Росстат</h4><p>Демографический ориентир на 1 января ${marketModel.populationYear} года составляет 146,15 млн человек. Охват публикации исключает Донецкую, Луганскую, Запорожскую и Херсонскую территории, которые Россия объявила присоединёнными в 2022 году.</p>
      ${external('Оценка численности населения','https://rosstat.gov.ru/storage/mediabank/Rossia_2025.pdf')}</li>
     <li><h4>Росприроднадзор</h4><p>По форме 2-ТП (отходы) общий объём ТКО составил 47,5 млн т в 2024 году и ${marketNumber(municipal2025/1_000_000)} млн т в 2025 году.</p>
      ${external('Данные за 2024 год','https://rpn.gov.ru/press/news/podvedeny_itogi_po_forme_2_tp_otkhody_za_2024_god/')}
      ${external('Данные за 2025 год','https://rpn.gov.ru/press/news/rosprirodnadzor_sformiroval_ofitsialnuyu_statistiku_ob_obrashchenii_s_otkhodami_v_2025_godu/')}</li>
     <li><h4>СИБУР · Ruplastica-2026</h4><p>По оценкам, приведённым в RUPEC, упаковочная отрасль в 2025 году потребила 3,7 млн т полимеров, в том числе около 1,9 млн т в гибкой упаковке. Публикация описывает потребление материала.</p>
      ${external('Отраслевая публикация RUPEC','https://rupec.ru/news/56522/')}</li>
    </ul>
    <h4>Как рассчитан объём</h4>
    <p>ЭРА применяет условную долю плёночной фракции ${share}% к историческому ориентиру ${kg} кг ТКО на человека в год. База модели составляет ${marketNumber(filmKgPerCapita)} кг на человека в год. Для каждой территории население в модели умножают на эту базу и экспертный региональный коэффициент. После перевода в тонны результат округляют до целого. Коэффициенты округов составляют ${marketNumber(Math.min(...factors))}–${marketNumber(Math.max(...factors))} и учитывают различия отраслевых потоков.</p>
    <p>Модельная численность восьми округов составляет ${marketNumber(marketTotals.population)} человек, а итог сырьевой базы — ${marketNumber(marketTotals.tonnes)} т/год. Приоритетные регионы входят в итоги своих округов. Условное число комплексов получают делением объёма территории на ${marketNumber(marketModel.moduleTonnes)} т/год с округлением до целого. Для проекта производительность проверяют по выбранной комплектации и характеристикам сырья.</p>
    <h4>Как читать оценки</h4>
    <p>Доли ${marketFeedstocks.map(row=>row.share).join('/')}% распределяют уже рассчитанный общероссийский объём между пятью взаимоисключающими группами. Мягкая тара выделена отдельно. Упаковку учитывают один раз по её источнику образования. Объёмы на диаграмме округлены крупнее, чем на карте.</p>
    <p>Применение условных ${share}% к объёму ТКО за 2025 год даёт около ${sensitivity} млн т до региональных поправок. Это проверка чувствительности к исходной базе. Потребление 1,9 млн т гибкой упаковки относится к одному сектору и использовано для сопоставления с более широким охватом модели.</p>
    <p>Предварительную оценку уточняют по фактическим потокам, поставщикам, доступности сбора и составу отходов. Массу собранных отходов, пригодного полимера и готовой гранулы оценивают раздельно.</p>
    <p class="feedstock-map-credit">Границы карты · ${external('Natural Earth','https://www.naturalearthdata.com/about/terms-of-use/')}</p>
   </div>
  </details>
 </div>`;
}

export function homeFeedstockEstimate(){
 return `<div class="feedstock-estimate" id="russia-feedstocks" role="region" aria-labelledby="feedstock-estimate-title" data-feedstock-chart data-view="all">
  <div class="feedstock-estimate-intro">
   <h3 id="feedstock-estimate-title">Пять источников. Единый промышленный ресурс.</h3>
   <p>Плёночные отходы образуются в быту, торговле, промышленности, сельском хозяйстве и строительстве. По расчётной модели ЭРА их совокупный объём составляет около ${marketNationalTonnes} млн тонн в год.</p>
  </div>
  <div class="feedstock-layout">
   ${ring()}
   <div class="feedstock-breakdown">
    <div class="feedstock-legend" role="group" aria-label="Виды сырья">${marketFeedstocks.map(category).join('')}</div>
    <button class="feedstock-reset" data-feedstock-choice="all" aria-pressed="true" aria-controls="feedstock-details" type="button" disabled>Все виды сырья</button>
    <div class="feedstock-details" id="feedstock-details">
     <article data-feedstock-detail="all" data-active>
      <h4>Вся сырьевая база</h4><p>Выберите сектор или строку, чтобы увидеть состав сырья и где оно образуется.</p>
     </article>
     ${marketFeedstocks.map(detail).join('')}
     <p class="sr-only" aria-live="polite" aria-atomic="true" data-feedstock-announcement></p>
    </div>
   </div>
  </div>
  <p class="feedstock-caption">Ориентировочная структура сырьевой базы по модели ЭРА. Доли заданы в расчётном сценарии. Объёмы категорий приведены с округлением.</p>
  <p class="feedstock-caveat">Базовая оценка по доступным данным охватывает потоки, которые можно описать количественно. Часть разрозненных источников трудно оценить. По оценке ЭРА, фактический потенциал может быть существенно выше. Его уточняют по регионам, составу отходов и возможностям сбора.</p>
  ${methodology()}
 </div>`;
}
