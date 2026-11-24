// PRO: native process map, styled from the approved BASE implementation.
const art={
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

const productFilm='<svg class="base-product-film" viewBox="0 0 320 240" aria-hidden="true" focusable="false"><defs><linearGradient id="pro-film-surface" x1="0" y1="1" x2=".9" y2="0"><stop stop-color="#d4e1f5" stop-opacity="0"/><stop offset=".35" stop-color="#e8eff9" stop-opacity=".10"/><stop offset=".78" stop-color="#edf4ff" stop-opacity=".30"/><stop offset="1" stop-color="#f8fbff" stop-opacity=".12"/></linearGradient><linearGradient id="pro-film-fold" x1="0" y1="1" x2=".8" y2=".1"><stop stop-color="#a2b8de" stop-opacity="0"/><stop offset=".54" stop-color="#b7c8e6" stop-opacity=".18"/><stop offset=".76" stop-color="#f1f5fd" stop-opacity=".52"/><stop offset="1" stop-color="#c8d7ee" stop-opacity=".12"/></linearGradient><linearGradient id="pro-film-edge" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#dce8ff" stop-opacity="0"/><stop offset=".5" stop-color="#e5edff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity=".72"/></linearGradient></defs><path d="M0 240C73 226 119 194 162 142C205 91 237 38 320 10L320 101C247 108 205 151 161 194C131 223 104 234 79 240Z" fill="url(#pro-film-surface)"/><path d="M55 240C111 219 144 191 174 140C215 71 246 28 320 0L320 52C260 75 224 126 194 174C171 213 149 228 127 240Z" fill="url(#pro-film-fold)"/><path d="M82 240C132 211 167 161 206 134C250 102 281 95 320 84L320 139C269 153 235 175 192 207C170 224 150 235 137 240Z" fill="url(#pro-film-surface)"/><path d="M9 240C79 222 121 192 162 142C205 91 237 38 320 10M55 240C111 219 144 191 174 140C215 71 246 28 320 0M82 240C132 211 167 161 206 134C250 102 281 95 320 84M137 240C169 227 190 206 216 188C256 161 284 148 320 139" fill="none" stroke="url(#pro-film-edge)" stroke-width=".85"/><path d="M35 240C102 218 144 172 185 118C224 65 266 36 320 18M105 240C156 208 183 168 217 142C249 118 283 107 320 100M119 240C170 212 198 179 231 156C258 137 288 125 320 119" fill="none" stroke="url(#pro-film-edge)" stroke-opacity=".45" stroke-width=".6"/></svg>';

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const tiles=[
 ['prep','01–03','Подготовка сырья','feed','Вскрытие тюков и подача'],
 ['ballistic','04','Баллистическая сепарация','ballistic','Отделение объёмных включений и просева'],
 ['sorting','08–09','Закрытый сортировочный бокс','box','С вакуумными высосами'],
 ['rotor','12–15','Интенсивная очистка','rotor','Ротор · диски · воздух'],
 ['fifth','20 · 1 из 5','Пятый бункер','bunker','Основной цветной микс'],
 ['press','22–25','Общий пресс','press','Поочерёдная подача партий'],
 ['mix','ВЫХОД','Тюки очищенной плёнки','bale','Основной цветной микс'],
 ['fractions','10','4 выбранные фракции','film','Вакуумный высос из бокса'],
 ['four','20 · 4 из 5','4 отдельных бункера','four','Раздельное накопление'],
 ['sorted','ВЫХОД','Тюки отсортированной плёнки','bale','Раздельно по видам']
];
const tile=([id,num,title,symbol,detail])=>'<article class="pro-flow-tile pro-flow-'+id+(['mix','sorted'].includes(id)?' pro-flow-output':'')+'" data-pro-flow-node="'+id+'"><div class="pro-flow-tile-top"><span>'+num+'</span>'+icon(symbol)+'</div><h4>'+title+'</h4><p>'+detail+'</p></article>';
// Connector coordinates follow the seven equal grid columns and fixed row heights.
// Broken grey strokes at crossings distinguish independent routes (no junction).
const edges=[
 ['prep','ballistic','M188 125H212','gold'],
 ['ballistic','sorting','M388 125H412','gold'],
 ['sorting','rotor','M588 125H612','gold'],
 ['rotor','fifth','M788 125H812','gold'],
 ['fifth','press','M988 125H1012','gold'],
 ['press','mix','M1188 125H1212','gold'],
 ['sorting','fractions','M500 250V322','gold'],
 ['fractions','four','M588 430H612','gold'],
 ['four','press','M988 430H1088Q1100 430 1100 418V250','gold'],
 ['press','sorted','M1188 188H1198Q1200 188 1200 198V418Q1200 430 1212 430','gold'],
 ['ballistic','solids','M300 250V275H100V566Q100 586 120 586H480Q500 586 500 606V616','solid'],
 ['sorting','solids','M450 250V275H300','solid','join'],
 ['rotor','solids','M650 250V275H509 M491 275H450','solid','join'],
 ['rotor','dust','M750 250V295H1020V421 M1020 439V576Q1020 586 1030 586H1090Q1100 586 1100 596V616','dust'],
 ['fifth','dust','M900 250V295H1020','dust','join'],
 ['four','dust','M800 538V576Q800 586 810 586H1030','dust','join']
];
const routeSVG=()=>'<svg class="pro-flow-edges" viewBox="0 0 1400 742" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>'+[['gold','#ae842b'],['solid','#77808a'],['dust','#8998a9']].map(([key,color])=>'<marker id="pro-arrow-'+key+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="'+color+'"/></marker>').join('')+'</defs>'+edges.map(([from,to,path,kind,join])=>'<path class="pro-edge pro-edge--'+kind+'" data-pro-route="'+from+'-'+to+'" d="'+path+'"'+(join?'':' marker-end="url(#pro-arrow-'+kind+')"')+'/>').join('')+'</svg>';
const branch=(id,num,title,desc,symbol)=>'<article class="pro-flow-waste pro-flow-'+id+'" data-pro-flow-node="'+id+'">'+icon(symbol)+'<div><span>'+num+'</span><h4>'+title+'</h4><p>'+desc+'</p></div></article>';
const outcomes=[
 ['film','ОСНОВНОЙ ЦВЕТНОЙ МИКС','Тюки очищенной плёнки','Оставшийся на ленте материал проходит интенсивную очистку, поступает в пятый бункер и прессуется в тюки.'],
 ['four','ЧЕТЫРЕ ВЫБРАННЫЕ ФРАКЦИИ','Раздельные партии','Четыре вида плёнки отбирают в закрытом боксе, направляют пневмотранспортом в четыре отдельных бункера и поочерёдно подают на общий пресс. Для дополнительной роторной очистки их можно повторно подать в линию отдельной партией.'],
 ['stones','ВКЛЮЧЕНИЯ И ПЫЛЬ','Раздельный отвод','Твёрдые включения идут по транспортёрам 06–07, 11, 16–18 к раме-наполнителю 19 и собираются в биг-бэг. Пыль отделяется в роторном узле и пяти бункерах системой пылеулавливания.']
];
export function renderProProcess(stages){
 const copy=stages.map(([title,desc],i)=>i===2?['Закрытый сортировочный бокс','Операторы выделяют четыре согласованных вида плёнки. Вакуумные высосы направляют выбранные фракции в отдельные бункеры; бумага, картон и другие отбираемые примеси поступают в отдельные шахты.']:i===3?['Интенсивная очистка',desc]:[title,desc]);
 return '<div class="line-section-heading"><div><p class="eyebrow">ТЕХНОЛОГИЧЕСКИЙ ПРОЦЕСС</p><h2>Шесть операций.<br>Связанная технология.</h2></div><p>Сначала плёнка освобождается от основной массы включений. Затем потоки разделяются, очищаются и накапливаются для поочерёдного прессования.</p></div>'+
 '<ol class="line-stages base-process-stages" aria-label="Шесть этапов технологического процесса">'+copy.map(([title,desc],i)=>'<li><span class="line-index">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p></li>').join('')+'</ol>'+
 '<div class="base-process-map" data-pro-process-map aria-labelledby="pro-flow-title"><header class="base-process-map-heading"><p class="eyebrow">МАРШРУТ ПОТОКОВ · PRO</p><h3 id="pro-flow-title">Как линия разделяет основной микс и выбранные фракции</h3><p>Наглядная карта движения основного потока, четырёх выбранных фракций и отходящих включений.</p></header>'+
 '<div class="base-flow-chart"><div class="base-flow-legend"><span><i></i>Полезные потоки плёнки</span><span><i></i>Отвод твёрдых включений</span><span><i></i>Пылевоздушный поток</span></div><div class="pro-flow-grid" lang="ru" aria-label="Маршруты оборудования PRO">'+routeSVG()+tiles.map(tile).join('')+
 branch('solids','06–07 · 11 · 16–19','Конвейеры и биг-бэг','От баллистики, сортировочного бокса и роторного узла','stones')+
 branch('dust','14 · 20–21','Пылеулавливание','От роторного узла и всех пяти бункеров','dust')+
 '</div><p class="pro-flow-note"><strong>5 бункеров — один общий пресс.</strong> Все пять бункеров дополнительно отделяют пылевые включения. Перед сменой фракции очищают общие транспортёры; партии маркируют и хранят раздельно.</p></div>'+
 '<div class="base-flow-outcomes" aria-label="Результаты процесса">'+outcomes.map(([symbol,kicker,title,desc],i)=>'<article class="base-flow-outcome'+(i===0?' base-flow-outcome--product':'')+'" data-pro-flow-outcome="'+symbol+'"><div class="base-flow-outcome-head">'+icon(symbol)+'<div><span>'+kicker+'</span><h4>'+title+'</h4></div></div><p>'+desc+'</p>'+(i===0?productFilm:'')+'</article>').join('')+'</div></div>';
}
