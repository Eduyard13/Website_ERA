const art={
 water:'<path d="M44 8C36 24 20 40 20 51a24 24 0 0 0 48 0C68 40 52 24 44 8zM31 51q0 12 12 13"/>',
 four:'<g transform="translate(0 5)"><path d="M3 17h17v25l-6 7v8H9v-8l-6-7zM24 17h17v25l-6 7v8h-5v-8l-6-7zM45 17h17v25l-6 7v8h-5v-8l-6-7zM66 17h17v25l-6 7v8h-5v-8l-6-7zM3 29h17m4 0h17m4 0h17m4 0h17"/></g>',
 bale:'<path d="M12 27l19-12 44 3 4 38-20 13-44-4zM12 27l45 4 18-13M57 31l2 38M28 18l44 4M25 29l3 37m15-36 3 38M14 44l44 4 19-13"/>',
 film:'<path d="M12 39 33 20q6-5 16-3l19 1 9-4-23 25q-5 6-15 3l-18-3zM13 53l18-13m-9 8 16 8q10 4 16-2l23-23-14 4M15 58l20 8q10 3 17-3l24-23"/>',
 stones:'<path d="M6 58 16 39 30 33 40 43 36 63 17 66zM33 35l8-23 16-5 16 19-11 17-22 1zM39 60l7-16 17-5 17 15-7 12-22 2zM16 39l8 16 12 8m5-51 9 16 23-2M46 44l12 13 15 9"/>',
 feed:'<path d="M10 29h68L67 50v12H21V50zM21 50h46M28 56h32"/><circle cx="24" cy="24" r="3"/><circle cx="39" cy="22" r="4"/><circle cx="60" cy="24" r="3"/><circle cx="52" cy="12" r="2.5"/><circle cx="35" cy="6" r="3.5"/>',
 opener:'<path d="M12 26 44 11 76 26 44 42zM23 32 12 37l32 16 32-16-11-5M23 43l-11 5 32 16 32-16-11-5"/>',
 ballistic:'<path d="M4 60 7 34h74l3 26M5 54h78M25 27V11m-5 6 5-6 5 6m14 10V11m-5 6 5-6 5 6m14 10V11m-5 6 5-6 5 6"/><path d="M17 43h.1m12 5h.1m12-5h.1m11 5h.1m12-5h.1m10 5h.1" stroke-width="3.6"/>',
 dryer:'<path d="M16 24h61v40H16c-7 0-7-40 0-40zm-5 11H7q-7 0-7 10t7 10h4M38 19q5-5 0-10-4-5 0-9m9 19q5-5 0-10-4-5 0-9m9 19q5-5 0-10-4-5 0-9"/><ellipse cx="77" cy="44" rx="7" ry="20"/>',
 hand:'<path d="m14 45 18-16L52 11q6-5 8 0l-16 18 21-18q6-5 8 1L52 32l21-16q6-4 9 1L58 40l14-11q7-3 7 4L57 51l9-3q9-2 8 4L58 63 39 65l-8 4Z"/>',
 rotor:'<path d="M18 19h54v40H18m0-33H9q-6 0-6 13t6 13h9"/><ellipse cx="18" cy="39" rx="6" ry="20"/><ellipse cx="72" cy="39" rx="6" ry="20"/><path d="M28 28h.1m14 0h.1m15 0h.1m-26 11h.1m15 0h.1m14 0h.1M27 50h.1m14 0h.1m16 0h.1" stroke-width="3.3"/>',
 bunker:'<path d="M5 20h22v25l-8 7v7h-6v-7l-8-7zM33 20h22v25l-8 7v7h-6v-7l-8-7zM61 20h22v25l-8 7v7h-6v-7l-8-7zM11 20l5-5 5 5m18 0 5-5 5 5m18 0 5-5 5 5"/>',
 dust:'<g fill="currentColor" stroke="none"><circle cx="18" cy="29" r="4"/><circle cx="32" cy="46" r="4"/><circle cx="45" cy="18" r="4"/><circle cx="51" cy="37" r="4"/><circle cx="33" cy="62" r="4"/><circle cx="69" cy="51" r="4"/><circle cx="76" cy="24" r="4"/></g>'
};
const icon=(name,kind='base-process-icon')=>`<svg class="${kind}" viewBox="0 0 88 76" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${art[name]}</svg>`;
const flowIcon=name=>icon(name,'premium-flow-icon');

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const stages=[
 ['Подача и предварительное измельчение','Измельчитель вскрывает тюки и пакеты, формируя фрагменты 80–400 мм для равномерной подачи.'],
 ['Раскрытие спрессованных слоёв','Предварительный распушитель раскрывает плотные многослойные фрагменты и высвобождает зажатые загрязнения.'],
 ['Первая баллистическая сепарация','Плоская плёнка отделяется от объёмных предметов и мелкого просева.'],
 ['Роторная сушка','Нагретый воздух подсушивает плёнку до остаточной влажности 5% по техническому описанию. Осыпавшийся абразив и конденсат отводятся отдельно.'],
 ['Вторая баллистическая сепарация','После сушки повторная сепарация отделяет оставшиеся доступные включения перед сортировкой.'],
 ['Закрытый сортировочный бокс','Операторы выделяют до четырёх согласованных видов плёнки. Вакуумные высосы направляют их в отдельные бункеры; примеси сбрасывают в две шахты.'],
 ['Интенсивная очистка','Основной цветной микс проходит три ступени роторного распушителя: барабанную, дисковую и воздушную.'],
 ['Раздельное накопление','Четыре выбранные фракции и основной цветной микс поступают в пять отдельных бункеров; на воздушной линии пятого бункера работает пылевой циклон.'],
 ['Прессование и выдача','Каждый бункер поочерёдно подаёт свою партию на общий пресс. Увязанные тюки маркируют и хранят раздельно.']
];
const outcome=(title,symbol,description,extra='')=>'<article class="premium-outcome '+extra+'">'+icon(symbol)+'<h4>'+title+'</h4><p>'+description+'</p></article>';
const nodes=[
 ['prep','feed'],
 ['opener','opener'],
 ['ballistic1','ballistic',null,null,'Отделение объёмных включений и мелкого просева.'],
 ['dryer','dryer',null,null,'Нагретый воздух подсушивает плёнку. Абразив и конденсат отводятся отдельно.'],
 ['ballistic2','ballistic'],
 ['sorting','hand','Закрытый сортировочный бокс','12 → площадка 13 и лента 14 · ангар 35','Вакуумные высосы 18 направляют до четырёх видов плёнки в свои бункеры 17. Две шахты для ручного сброса примесей.'],
 ['rotor','rotor','Интенсивная очистка',null,'Основной цветной микс проходит барабанную, дисковую и воздушную ступени.'],
 ['accumulation','bunker',null,null,'Пять отдельных бункеров по 4,7 м³. Пылевой циклон 20 очищает воздух пятого бункера.'],
 ['press','bale',null,null,'Один общий пресс принимает партии по очереди. Перед сменой вида освобождают тракт и пресс. Тюки увязывают автоматически, маркируют и хранят раздельно.']
];

const edges={
 film:['prep-opener','opener-ballistic1','ballistic1-dryer','dryer-ballistic2','ballistic2-sorting',
  'sorting-rotor','sorting-fractions','rotor-mix','accumulation-press'],
 solids:['ballistic1-solids','dryer-solids','ballistic2-solids','sorting-solids','rotor-solids','solids-header','solids-footer'],
 dust:['mix-dust'],
 water:['dryer-condensate']
};

const streams=`<div class="premium-streams">
 <h5>5 потоков на накопление</h5>
 <ul class="premium-fractions" data-premium-stream="fractions" aria-label="Четыре отдельные фракции">${[1,2,3,4].map(n=>`<li>${flowIcon('opener')}Фракция ${n}</li>`).join('')}</ul>
 <p class="premium-mix" data-premium-stream="mix">${flowIcon('dust')}Основной цветной микс</p>
</div>`;

function renderTile(index,sourceStages){
 const [id,artwork,title,positions,detail]=nodes[index];
 const [stageTitle,stagePositions,stageDetail]=sourceStages[index];
 return `<article class="premium-tile${id==='accumulation'?' premium-accumulation':''}" data-premium-node="${id}">
  <div class="premium-tile-copy">
   <div class="premium-tile-top"><span class="premium-stage-number">${String(index+1).padStart(2,'0')}</span>${flowIcon(artwork)}</div>
   <h4>${esc(title??stageTitle)}</h4>
   <p class="premium-positions">${esc(positions??stagePositions)}</p>
   <p>${esc(detail??stageDetail)}</p>
  </div>${id==='accumulation'?streams:''}
 </article>`;
}

const connectors=`<svg class="premium-routes" aria-hidden="true" focusable="false">
 <defs>${Object.keys(edges).map(kind=>`<marker id="premium-arrow-${kind}" viewBox="0 0 8 10" refX="7" refY="5" markerWidth="8" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path class="premium-edge-${kind}" d="M1 1 L7 5 L1 9"/></marker>`).join('')}</defs>
 ${Object.entries(edges).flatMap(([kind,routes])=>routes.map(route=>`<path class="premium-edge-${kind}" data-premium-route="${route}"${kind==='solids'&&!route.startsWith('solids-')?'':` marker-end="url(#premium-arrow-${kind})"`}/>`)).join('')}
</svg>`;

const waste=`<div class="premium-waste">
 <div class="premium-waste-solids" data-premium-node="solids">
  <strong>${flowIcon('stones')}Твёрдые включения</strong>
  <p>Отводы: 25/26 (обе баллистические ступени), 27 → 28 (сушка), 30 (бокс), 31 (ротор)</p>
  <span class="premium-waste-route">29 → 32 → рама 33 → биг-бэг</span>
 </div>
 <div class="premium-waste-item" data-premium-node="dust">${flowIcon('dust')}<p><strong>Пыль</strong><small>циклон 20 · пятый бункер</small></p></div>
 <div class="premium-waste-item" data-premium-node="condensate">${flowIcon('water')}<p><strong>Конденсат</strong><small>контур сушилки 34</small></p></div>
</div>`;

export function renderPremiumProcess(sourceStages){
 if(sourceStages.length!==9)throw Error('PREMIUM: expected nine stages');
 return '<div class="line-section-heading"><div><p class="eyebrow">ТЕХНОЛОГИЧЕСКИЙ ПРОЦЕСС</p><h2>Двойная сепарация.<br>Сушка между ступенями.</h2></div><p>PREMIUM сочетает предварительное раскрытие плёнки, две баллистические ступени и роторную сушку. Закрытая сортировка и интенсивная доочистка позволяют выпускать раздельные товарные партии из пяти потоков.</p></div>'+
 '<ol class="line-stages premium-stages" aria-label="Девять этапов технологического процесса">'+stages.map(([title,description],i)=>'<li><span class="line-index">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(title)+'</h3><p>'+esc(description)+'</p></li>').join('')+'</ol>'+
 `<div class="premium-map" data-premium-process-map aria-labelledby="premium-flow-title">
   <div class="premium-scheme">
    <header class="premium-map-heading">
     <div class="premium-map-copy"><p class="eyebrow">ДВИЖЕНИЕ МАТЕРИАЛА · PREMIUM</p>
      <h3 id="premium-flow-title">Две баллистические ступени<br>с роторной сушкой между ними</h3>
      <p>Последовательное раскрытие слоёв, двухступенчатая сепарация, роторная сушка, сортировка по видам и раздельное накопление пяти потоков перед поочерёдным прессованием.</p>
     </div>
     <img class="premium-map-render" src="/assets/lines/separatsiya-03/first-separation.webp" width="1369" height="608" loading="lazy" decoding="async" alt="Баллистическая ступень, ленточные транспортёры и роторная сушилка линии PREMIUM">
    </header>
    <div class="premium-chart">
     ${connectors}
     <div class="premium-upstream">${nodes.slice(0,5).map((_,i)=>renderTile(i,sourceStages)).join('')}</div>
     ${waste}
     <div class="premium-downstream">${nodes.slice(5).map((_,i)=>renderTile(i+5,sourceStages)).join('')}</div>
     <p class="premium-bypass">18 · вакуумные высосы → четыре бункера 17</p>
    </div>
   </div>`+
 '<div class="premium-outcomes">'+outcome('Основной цветной микс','film','Интенсивно очищенная плёнка, отдельно накопленная и спрессованная в тюки.','premium-output')+outcome('Четыре выбранные фракции','four','Раздельные партии по видам плёнки для дальнейшей переработки или реализации.')+outcome('Включения, пыль и влага','stones','Три независимых маршрута отвода: твёрдые включения в биг-бэг, пыль через циклон и конденсат из сушильного контура.')+'</div></div>';
}
