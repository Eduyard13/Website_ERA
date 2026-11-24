const art={
 opener:'<path d="M10 20 43 7 77 20 43 33zM10 32l33 13 34-13M10 44l33 13 34-13M10 56l33 13 34-13"/>',
 dryer:'<rect x="12" y="25" width="64" height="37" rx="18"/><ellipse cx="60" cy="43.5" rx="16" ry="18.5"/><path d="M24 18q-6-6 0-12m15 12q-6-6 0-12m15 12q-6-6 0-12M18 66h52"/>',
 air:'<circle cx="44" cy="39" r="25"/><circle cx="44" cy="39" r="5"/><path d="M44 34Q23 8 37 8Q57 8 49 35M49 39Q80 24 76 40Q71 58 49 44M43 44Q36 75 25 63Q14 48 39 40"/>',
 water:'<path d="M44 8C36 24 20 40 20 51a24 24 0 0 0 48 0C68 40 52 24 44 8zM31 51q0 12 12 13"/>',
 box:'<rect x="9" y="29" width="70" height="36" rx="3"/><path d="M9 29l12-10h47l11 10M31 29v36m26-36v36M24 20V10q0-4 5-4h8m14 14V10q0-4 5-4h8M19 44h5m16 0h8m17 0h5"/>',
 bunker:'<path d="M19 14h50v30L53 59v9H35v-9L19 44zM19 27h50M19 44h50M19 14l10-7h30l10 7M23 45v24m42-24v24"/>',
 four:'<g transform="translate(0 5)"><path d="M3 17h17v25l-6 7v8H9v-8l-6-7zM24 17h17v25l-6 7v8h-5v-8l-6-7zM45 17h17v25l-6 7v8h-5v-8l-6-7zM66 17h17v25l-6 7v8h-5v-8l-6-7zM3 29h17m4 0h17m4 0h17m4 0h17"/></g>',
 press:'<path d="M8 22h69v43H8zM8 22h12v43M65 22v43M23 36h39v15H23zM31 36v15m11-15v15m11-15v15M32 8h22v14M43 8v14M77 56h8M11 65v6m62-6v6"/>',
 bale:'<path d="M12 27l19-12 44 3 4 38-20 13-44-4zM12 27l45 4 18-13M57 31l2 38M28 18l44 4M25 29l3 37m15-36 3 38M14 44l44 4 19-13"/>',
 feed:'<path d="M25 8h38l-12 17v10H37V25zM37 39l-7 8m14-6 2 7m7-8 7 7"/><rect x="12" y="51" width="64" height="15" rx="7.5"/><circle cx="23" cy="58.5" r="2.7"/><circle cx="44" cy="58.5" r="2.7"/><circle cx="65" cy="58.5" r="2.7"/>',
 ballistic:'<path d="M12 48 33 20h43L55 48zM24 54l-5 10m35-10-5 10M70 19l12-7m-4-2 5 1-2 6M70 34h13m-5-4 5 4-5 4M58 55l14 10m-1-6 1 6-6 1"/><g fill="currentColor" stroke="none"><circle cx="34" cy="29" r="1.8"/><circle cx="44" cy="29" r="1.8"/><circle cx="54" cy="29" r="1.8"/><circle cx="64" cy="29" r="1.8"/><circle cx="27" cy="40" r="1.8"/><circle cx="37" cy="40" r="1.8"/><circle cx="47" cy="40" r="1.8"/><circle cx="57" cy="40" r="1.8"/></g>',
 control:'<rect x="12" y="51" width="64" height="15" rx="7.5"/><circle cx="23" cy="58.5" r="2.7"/><circle cx="44" cy="58.5" r="2.7"/><circle cx="65" cy="58.5" r="2.7"/><path d="M34 11h20v12H34zM34 27 20 45h48L54 27" fill="none"/><path d="M44 31v10" stroke-dasharray="2 4"/>',
 rotor:'<path d="M9 62h8V48q0-8 8-8M65 40h7q7 0 7 7v4M57 14a28 28 0 0 1 15 19m-7-2 8 4 3-8"/><circle cx="44" cy="40" r="23"/><circle cx="44" cy="40" r="5"/><path d="M43 32c-9-9-4-15 0-15 7 0 10 10 5 16M51 38c12-5 16 1 14 6-3 7-13 5-16 0M40 47c-3 12-11 12-14 7-4-6 1-14 10-14M36 35c-12-1-15-8-11-12 5-5 13 1 15 9"/><g fill="currentColor" stroke="none"><circle cx="72" cy="55" r="1.6"/><circle cx="80" cy="60" r="1.7"/><circle cx="68" cy="64" r="1.5"/></g>',
 film:'<path d="M12 39 33 20q6-5 16-3l19 1 9-4-23 25q-5 6-15 3l-18-3zM13 53l18-13m-9 8 16 8q10 4 16-2l23-23-14 4M15 58l20 8q10 3 17-3l24-23"/>',
 stones:'<path d="M6 58 16 39 30 33 40 43 36 63 17 66zM33 35l8-23 16-5 16 19-11 17-22 1zM39 60l7-16 17-5 17 15-7 12-22 2zM16 39l8 16 12 8m5-51 9 16 23-2M46 44l12 13 15 9"/>',
 dust:'<path d="M7 25h26q11 0 11-7t-10-7M5 37h36q10 0 10 8t-10 8M9 49h17M59 14h22v17L73 48v17h-6V48l-8-17zM59 31h22M64 10h12"/>'
};
const icon=name=>'<svg class="base-process-icon" viewBox="0 0 88 76" fill="none" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+art[name]+'</svg>';


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
const tile=(id,num,title,symbol,detail,extra='')=>'<article class="premium-tile '+extra+'" data-premium-node="'+id+'"><div class="premium-tile-top"><span>'+num+'</span>'+icon(symbol)+'</div><h4>'+title+'</h4><p>'+detail+'</p></article>';
const arrow='<span class="premium-arrow" aria-hidden="true">↓</span>';
const service=(id,num,title,symbol,description)=>tile(id,num,title,symbol,description,'premium-service');
const outcome=(title,symbol,description,extra='')=>'<article class="premium-outcome '+extra+'">'+icon(symbol)+'<h4>'+title+'</h4><p>'+description+'</p></article>';
export function renderPremiumProcess(sourceStages){
 if(sourceStages.length!==9)throw Error('PREMIUM: expected nine stages');
 return '<div class="line-section-heading"><div><p class="eyebrow">ТЕХНОЛОГИЧЕСКИЙ ПРОЦЕСС</p><h2>Двойная сепарация.<br>Сушка между ступенями.</h2></div><p>PREMIUM сочетает предварительное раскрытие плёнки, две баллистические ступени и роторную сушку. Закрытая сортировка и интенсивная доочистка позволяют выпускать раздельные товарные партии из пяти потоков.</p></div>'+
 '<ol class="line-stages premium-stages" aria-label="Девять этапов технологического процесса">'+stages.map(([title,description],i)=>'<li><span class="line-index">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(title)+'</h3><p>'+esc(description)+'</p></li>').join('')+'</ol>'+
 '<div class="premium-map" data-premium-process-map aria-labelledby="premium-flow-title"><header class="premium-map-heading"><p class="eyebrow">МАРШРУТ ПОТОКОВ · PREMIUM</p><h3 id="premium-flow-title">От загрязнённой плёнки к пяти раздельным потокам</h3><p>Две баллистические ступени, роторная сушка, закрытый сортировочный бокс и общий пресс. Все маршруты показаны по позициям оборудования.</p></header>'+
 '<div class="premium-chart"><div class="premium-legend"><span><i></i>Полезные потоки плёнки</span><span><i></i>Твёрдые включения</span><span><i></i>Пылевоздушный поток</span><span><i></i>Воздушный контур и конденсат</span></div>'+
 '<div class="premium-upstream">'+
 tile('prep','37 · 01–03','Подача и измельчение','feed','Вскрытие тюков и пакетов')+
 tile('opener','03–05','Предварительное распушение','opener','Раскрытие спрессованных слоёв')+
 tile('ballistic1','05–09 · первая 07','Первая баллистическая сепарация','ballistic','Объёмные включения и просев → 25/26')+
 tile('dryer','09–11 · 34','Роторная сушка','dryer','Нагретый воздух · абразив → 27/28','premium-highlight')+
 tile('ballistic2','11–12 · вторая 07','Вторая баллистическая сепарация','ballistic','Оставшиеся включения → 25/26')+
 '</div><div class="premium-transition"><span>Плёночная фракция со второй баллистической ступени</span>'+arrow+'</div>'+
 '<div class="premium-downstream">'+tile('sorting','12–14 · 35','Закрытый сортировочный бокс','box','С вакуумными высосами · ручные сбросы → 30','premium-sort')+
 '<div class="premium-split" aria-hidden="true"><span></span><span></span></div>'+
 '<div class="premium-branches"><div class="premium-branch"><p class="premium-branch-label">ОСНОВНОЙ ЦВЕТНОЙ МИКС</p>'+
 tile('rotor','14–16','Интенсивная очистка','rotor','Ротор · диски · воздух · включения → 31','premium-highlight')+arrow+
 tile('fifth','19 → 17 · 1 из 5','Пятый бункер','bunker','Пневмотранспорт после роторной очистки · воздушная линия → циклон 20')+
 '</div><div class="premium-branch"><p class="premium-branch-label">ЧЕТЫРЕ ВЫБРАННЫЕ ФРАКЦИИ</p>'+
 tile('fractions','18 · 4 высоса','Отбор по видам','film','Вакуумный высос из бокса')+arrow+
 tile('four','17 · 4 из 5','Четыре отдельных бункера','four','Каждая выбранная фракция накапливается отдельно')+
 '</div></div><div class="premium-merge" aria-hidden="true"><span></span><span></span></div>'+
 tile('press','21–24 · 37','Общий пресс','press','Поочерёдная подача из пяти бункеров. Фракции не смешиваются. Автоматическая увязка и выдача тюков.','premium-press')+
 arrow+'<div class="premium-products">'+tile('mix','ВЫХОД','Тюки очищенной плёнки','bale','Основной цветной микс','premium-output')+tile('sorted','ВЫХОД','Тюки отсортированной плёнки','bale','Раздельные партии по видам','premium-output')+'</div></div>'+
 '<div class="premium-services"><h4>Отдельные технологические маршруты</h4><div class="premium-service-grid">'+
 service('solids','25/26 · 27/28 · 30 · 31','Твёрдые включения','stones','Обе баллистические ступени → 25/26; сушилка → 27/28; бокс → 30; ротор → 31. Все отводы → общий тракт 29 → 32 → рама 33 → биг-бэг.')+
 service('dust','20 · ВОЗДУШНАЯ ЛИНИЯ','Пылеулавливание','dust','Пылевой циклон 20 отделяет пыль на воздушной линии пятого бункера. Пыль выводится отдельно.')+
 service('air','10 ↔ 34','Воздушный контур сушилки','air','Контур 34 подаёт нагретый воздух в сушилку и направляет влажный воздух на конденсацию.')+
 service('condensate','34 → ОТДЕЛЬНЫЙ ОТВОД','Конденсат','water','Влага из воздушного контура 34 отводится отдельно от твёрдых включений и пыли.')+
 '</div></div><p class="premium-note"><strong>Повторная очистка:</strong> при необходимости выбранные фракции возвращают на вход отдельной партией для роторной доочистки. Перед сменой вида плёнки освобождают общий транспортный тракт и пресс.</p></div>'+
 '<div class="premium-outcomes">'+outcome('Основной цветной микс','film','Интенсивно очищенная плёнка, отдельно накопленная и спрессованная в тюки.','premium-output')+outcome('Четыре выбранные фракции','four','Раздельные партии по видам плёнки для дальнейшей переработки или реализации.')+outcome('Включения, пыль и влага','stones','Три независимых маршрута отвода: твёрдые включения в биг-бэг, пыль через циклон и конденсат из сушильного контура.')+'</div></div>';
}
