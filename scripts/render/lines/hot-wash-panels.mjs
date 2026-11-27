const icons={
 separator:'<path d="M6 4h20l-7 10v5h-6v-5zM5 24h22a3 3 0 0 1 0 6H5a3 3 0 0 1 0-6Z"/><path d="M9 27h.1m7 0h.1m7 0h.1"/>',
 drop:'<path d="M16 3C10 12 7 16 7 22a9 9 0 0 0 18 0c0-6-3-10-9-19Z M11 22a5 5 0 0 0 5 5"/>',
 granule:'<circle cx="16" cy="6" r="4"/><circle cx="10" cy="15" r="4"/><circle cx="22" cy="15" r="4"/><circle cx="5" cy="25" r="4"/><circle cx="16" cy="25" r="4"/><circle cx="27" cy="25" r="4"/>',
 inspect:'<circle cx="14" cy="14" r="8"/><path d="m20 20 8 8M3 10V3h7m12 0h7v7M3 22v7h7"/>',
 loss:'<path d="M4 4v24h24M8 22l6-7 5 3 9-11m-7 0h7v7"/>',
 melt:'<path d="M12 4h8m-7 0v9L5 26q-1 3 3 3h16q4 0 3-3l-8-13V4M9 20h14"/>',
 rotor:'<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="3"/><path d="M16 13Q8 3 7 12l6 4m6 0q10-8 10 1l-10 2m-3 0q-3 12-9 6l6-7"/>',
 press:'<rect x="3" y="5" width="26" height="13" rx="3"/><path d="M3 15h26M8 11l4-2 4 4 4-4 4 2M16 20c-2 4-4 5-4 8a4 4 0 0 0 8 0c0-3-2-4-4-8"/>',
 wash:'<path d="M3 13h26l-4 14H7L3 13Zm2 6q3 3 6 0t6 0 6 0 4 0M10 8q-3-2 0-5m6 5q-3-2 0-5m6 5q-3-2 0-5"/>',
 rinse:'<path d="M16 3v5m-4 0h8l7 6H5l7-6ZM8 19l-2 3m10-3v4m8-4 2 3M10 25l-2 3m8-2v3m6-4 2 3"/>',
 water:'<path d="M7 12a10 10 0 0 1 18-3l2 4m0-7v7h-7M25 20a10 10 0 0 1-18 3l-2-4m0 7v-7h7"/>',
 product:'<path d="m4 9 12-5 12 5v14l-12 5-12-5V9Zm0 0 12 5 12-5M16 14v14M10 6l12 5"/>'
};
const icon=name=>`<svg class="hw-panel-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const pro='/catalog/lines/separatsiya-02/';
const cycleArrow='<svg class="hw-cycle-arrow" viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h19m-6-5 6 5-6 5"/></svg>';
const cycleCard=(image,step,title,caption)=>`${icon(image)}<p class="eyebrow">${step}</p><h3>${title}</h3><p>${caption}</p>`;

export function renderHotWashCycle(){
 return `<nav class="hw-cycle" data-hotwash-cycle aria-label="Полный цикл переработки">
  <p class="eyebrow">ЭРА / ПОЛНЫЙ ЦИКЛ ПЕРЕРАБОТКИ</p>
  <ol class="hw-cycle-grid">
   <li><a class="hw-cycle-card" href="${pro}">${cycleCard('separator','01 / ПОДГОТОВКА','Сухая сепарация','Предварительная очистка')}</a>${cycleArrow}</li>
   <li aria-current="step"><div class="hw-cycle-card hw-cycle-current">${cycleCard('drop','02 / ТЕКУЩИЙ ЭТАП','Горячая мойка','Глубокая очистка плёнки')}</div>${cycleArrow}</li>
   <li><div class="hw-cycle-card">${cycleCard('granule','03 / ГОТОВЫЙ ПРОДУКТ','Грануляция','Получение ПЭ-гранулы')}</div></li>
  </ol>
  <p class="hw-cycle-note">После сухой сепарации горячая мойка удаляет остаточные загрязнения с поверхности плёнки, подготавливая полимер к выпуску высококачественной гранулы.</p>
  <div class="hw-cycle-links"><a class="text-link" href="${pro}">Сухая сепарация ↗</a><a class="text-link" href="/technology/">Технология полного цикла ↗</a></div>
 </nav>`;
}

const qualityMetrics=[
 ['inspect','30–70','ppm','Остаточные включения','Всего 30–70 граммов на тонну плёнки после двух стадий очистки.','0,003–0,007% по массе'],
 ['loss','1–2','%','Потери полимера','Минимальные потери полезного материала на стадии горячей мойки.','От исходной массы плёнки'],
 ['melt','0,8–1,2','г/10 мин','Показатель текучести расплава','ПТР гранулы ПВД.','190 °C / 2,16 кг']
];

export function renderHotWashQuality(){
 return `<article class="hw-quality-panel era-indigo-surface" data-hotwash-quality aria-labelledby="hw-quality-title">
  <p class="eyebrow">ЭРА / КАЧЕСТВО КОНЕЧНОГО ПРОДУКТА</p>
  <h3 id="hw-quality-title">Вторичное сырьё. Качество, близкое к первичному.</h3>
  <p class="hw-quality-lead">Последовательная сухая сепарация, глубокая горячая мойка и двухстадийная грануляция позволяют получать полиэтиленовую гранулу с высокой степенью чистоты и характеристиками, приближенными к первичному сырью.</p>
  <div class="hw-quality-rule" aria-hidden="true"></div>
  <div class="hw-quality-grid">${qualityMetrics.map(([image,value,unit,title,copy,detail])=>`<div class="hw-quality-metric">
   ${icon(image)}<p class="hw-quality-value">${value}<small>${unit}</small></p><h4>${title}</h4><p>${copy}</p><p class="hw-quality-detail">${detail}</p>
  </div>`).join('')}</div>
  <div class="hw-quality-closing"><h4>Из плёнки — снова в плёнку.</h4><p>Возвращаем полимер в производственный цикл.</p><p class="hw-quality-application">Пригодность гранулы для конкретного изделия подтверждается испытаниями.</p></div>
 </article>`;
}

function expansionConnector(desktopPath,mobilePath){
 const svg=(layout,viewBox,path)=>`<svg class="hw-expansion-connector hw-expansion-connector--${layout}" viewBox="${viewBox}" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}" stroke-width="1.7" vector-effect="non-scaling-stroke"/></svg>`;
 return svg('desktop','0 0 56 256',desktopPath)+svg('mobile','0 0 400 32',mobilePath);
}

export function renderHotWashScaling(){
 return `<article class="hw-expansion" data-hotwash-expansion aria-labelledby="hw-expansion-title">
  <p class="eyebrow">ЭРА / МАСШТАБИРОВАНИЕ ПРОИЗВОДСТВА</p>
  <h3 id="hw-expansion-title">Одна мойка. Двойной потенциал.</h3>
  <p class="hw-expansion-lead">Архитектура линии предусматривает расширение производства за счёт подключения второй линии сухой сепарации и второго гранулятора.</p>
  <div class="hw-expansion-diagram" role="group" aria-label="Две сухие линии подают плёнку на один комплекс горячей мойки, затем плёнка поступает на два гранулятора">
   <div class="hw-expansion-stack">${[1,2].map(number=>`<div class="hw-expansion-node">${icon('separator')}<h4>Сухая сепарация</h4><span>Линия №${number}</span></div>`).join('')}</div>
   ${expansionConnector('M0 60H20Q28 60 28 68V188Q28 196 20 196H0 M28 128H55m-8-5 8 5-8 5','M99 1V10H301V1 M200 10V31m-5-6 5 6 5-6')}
   <div class="hw-expansion-node hw-expansion-wash">${icon('drop')}<h4>Горячая мойка</h4><span>Единый моечный комплекс</span><strong>HOT-WASH</strong></div>
   ${expansionConnector('M0 128H28V60H55 M28 128V196H55 M47 55l8 5-8 5 M47 191l8 5-8 5','M200 1V11H99V31m-5-6 5 6 5-6 M200 11H301V31m-5-6 5 6 5-6')}
   <div class="hw-expansion-stack">${[1,2].map(number=>`<div class="hw-expansion-node"><h4 class="eyebrow">ГРАНУЛЯТОР №${number}</h4><strong class="hw-expansion-rate">750 <small>кг/ч</small></strong><span>Номинальный выпуск</span></div>`).join('')}</div>
  </div>
  <div class="hw-expansion-result">
   <p class="eyebrow">ПОТЕНЦИАЛ РАСШИРЕННОЙ КОМПЛЕКТАЦИИ</p>
   <p class="hw-expansion-capacity">до 1 500 <small>кг/ч</small></p>
   <h4>Полиэтиленовой гранулы</h4>
   <p class="hw-expansion-conditions">При достаточной подаче сырья и подтверждённой пропускной способности моечного комплекса. Материальный баланс проверяют с учётом влажности, потерь и простоев. Энергопотребление расширенной комплектации рассчитывается отдельно.</p>
  </div>
 </article>`;
}

const operations=[
 ['separator','Подготовка сырья','Раскрытие тюков и защитная баллистическая сепарация перед мокрой обработкой.'],
 ['rotor','Мокрое измельчение','Резка плёнки в моющей жидкости, раскрытие складок и высвобождение загрязнений.'],
 ['press','Первичный отжим','Отделение рабочей жидкости и свободных загрязнений в роторной центрифуге.'],
 ['wash','Горячая мойка и флотация','Интенсивная обработка в нагретой моющей среде. Удаление клея, этикеток, масел и жиров.'],
 ['drop','Межступенчатый отжим','Отделение моющей жидкости перед переходом к ополаскиванию.'],
 ['rinse','Ополаскивание','Промывка плёнки чистой водой, удаление остатков моющих реагентов и загрязнений.'],
 ['press','Финальное обезвоживание','Окончательный механический отжим очищенной плёнки в третьей роторной центрифуге.'],
 ['water','Водооборот и очистка стоков','Локальная циркуляция, отделение загрязнений, очистка стоков и возврат воды в процесс.'],
 ['product','Выпуск готовой продукции','Три альтернативных маршрута: тюкование, капсуляция или выпуск полиэтиленовой гранулы.']
];

export function renderHotWashOperations(){
 return `<div class="hw-operations" data-hotwash-operations>
  <div class="line-section-heading"><div><p class="eyebrow">ТЕХНОЛОГИЧЕСКИЙ ПРОЦЕСС</p><h2>Девять операций.<br>Глубокая очистка полимера.</h2></div><p>Последовательная обработка плёнки в жидкой среде, многоступенчатое обезвоживание и очистка оборотной воды. От подготовленного сырья до полиэтиленовой гранулы.</p></div>
  <ol class="line-stages base-process-stages hw-operations-grid">${operations.map(([image,title,copy],index)=>{
   const number=String(index+1).padStart(2,'0');
   const accent=image==='wash'||image==='product';
   return `<li data-hotwash-operation="${number}"${accent?' class="hw-operation-accent"':''}><div class="hw-operation-top"><span>${number}</span>${icon(image)}</div><h3>${title}</h3><p>${copy}</p></li>`;
  }).join('')}</ol>
  <p class="hw-operations-note">Водооборот функционирует параллельно основному технологическому процессу.</p>
 </div>`;
}
