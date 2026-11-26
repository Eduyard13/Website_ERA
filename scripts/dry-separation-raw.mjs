import {filmSeparationMedia} from '../content/film-separation.mjs';
import {mediaAttributes} from './media.mjs';
// Unified, owner-approved dry-separation feedstock: common real photos,
// common types of removable contaminants, configuration-specific operating notes.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tiers={'separatsiya-01':'BASE','separatsiya-02':'PRO','separatsiya-03':'PREMIUM'};
const materials=[
 ['raw-agricultural','Сельскохозяйственная плёнка','Тепличные, укрывные и мульчирующие плёнки. Земля, песок, камни, ветки, листья, солома и другие растительные остатки. Плотные комки раскрываются перед очисткой.'],
 ['raw-packaging','Пакеты и плёнки с полигонов','Бытовые пакеты и использованная плёночная упаковка. Песок, грунт, бумага, картон, стекло, металл, жёсткие пластики и отделяемые твёрдые остатки. Узлы раскрывают завязанные пакеты и высвобождают включения.'],
 ['raw-bales','Стретч и упаковочная плёнка','Промышленная, транспортная и бытовая упаковка, включая стретч и термоусадочную плёнку. Слипшиеся слои, плотные комки, обмотанные предметы и фрагменты упаковки подготавливаются к разделению.']
];
const contamination=[
 ['mineral','Минеральные включения','Песок, грунт, камни и мелкий абразив.'],
 ['hard','Твёрдые предметы','Стекло, металл, жёсткие пластики и посторонняя тара.'],
 ['paper','Бумажные включения','Бумага, картон и фрагменты бумажной упаковки.'],
 ['leaf','Растительные и пищевые остатки','Ветки, кора, листья, солома и отделяемые твёрдые пищевые остатки.'],
 ['wind','Лёгкие включения','Пенопласт и другие отделяемые лёгкие микровключения.'],
 ['dust','Пылевые частицы','Пыль, мелкие свободные и летучие частицы.']
];
const icons={
 mineral:'<path d="M2 20 9 8l5 8 3-5 5 9H2Z"/>',
 hard:'<rect x="3" y="7" width="9" height="13" rx="1"/><path d="m12 7 5-4 4 5v12h-9M3 12h9"/>',
 paper:'<path d="M6 2h9l4 4v16H6zM15 2v5h4M9 12h7M9 16h7"/>',
 leaf:'<path d="M20 4C9 4 5 9 5 15a5 5 0 0 0 5 5c6 0 10-5 10-16ZM4 21c4-7 8-9 13-11"/>',
 wind:'<path d="M3 8h12a3 3 0 1 0-3-3M2 13h18a3 3 0 1 1-3 3M5 18h8a2 2 0 1 1-2 2"/>',
 dust:'<circle cx="7" cy="8" r="2"/><circle cx="17" cy="6" r="1.5"/><circle cx="15" cy="16" r="3"/><path d="M5 17h.01M21 12h.01M9 21h.01"/>'
};
const methods={
 'separatsiya-01':[
 ['Подготовка потока','Измельчитель раскрывает пакеты и тюки, высвобождая посторонние включения.'],
 ['Баллистика','Плоская плёнка, объёмные предметы и мелкий просев движутся раздельно.'],
 ['Контроль и ротор','Доступные включения удаляются на контрольном конвейере. Ротор, диски и воздушный отбор отделяют свободную мелочь.'],
 ['Аспирация','Отдельный контур улавливает пылевые частицы.']
 ],
 'separatsiya-02':[
 ['Подготовка и баллистика','Измельчитель раскрывает пакеты, баллистический сепаратор отводит объёмные предметы и просев.'],
 ['Сортировочный бокс','Операторы удаляют доступную бумагу, картон и другие включения, выделяя ценные виды плёнки.'],
 ['Ротор, диски и воздух','Основной микс доочищается от мелочи и лёгких микровключений.'],
 ['Пылеудаление','Пыль отделяется у роторного узла и во всех пяти бункерах-накопителях.']
 ],
 'separatsiya-03':[
 ['Первая баллистика','После измельчения и предварительного распушения снимается основная масса включений.'],
 ['Роторная сушка','Нагретый воздух ослабляет удержание влажного песка и абразива; осыпавшиеся частицы выводятся отдельно.'],
 ['Повторная баллистика','Подсушенная плёнка проходит дополнительное отделение доступных включений и просева.'],
 ['Сортировка и ротор','В боксе убирают доступные предметы. Основной микс дополнительно проходит роторную, дисковую и воздушную очистку.'],
 ['Пылеудаление','Пыль и мелкие летучие частицы направляются в отдельный контур.']
 ]
};
const photo=(key,slug)=>{
 const m=filmSeparationMedia[key];
 if(!m||m.type!=='photo')throw new Error('Missing real source photograph: '+key);
 const current={...m,product:'/catalog/lines/'+slug,productTitle:'Сухая сепарация '+tiers[slug]};
 return '<figure class="line-image line-image--photo dry-raw-photo" data-raw-photo="'+key+'" '+mediaAttributes(current)+'>'+
  '<a class="media-open" href="/assets/'+m.file+'" aria-label="Увеличить: '+esc(m.title)+'">'+
  '<img src="/assets/'+m.file+'" alt="'+esc(m.title)+'" loading="lazy" decoding="async"><span class="line-image-zoom" aria-hidden="true">⤢</span></a></figure>';
};
const metric=(value,unit,label)=>'<div class="dry-raw-metric"><strong>'+esc(value)+'<small>'+esc(unit)+'</small></strong><span>'+esc(label)+'</span></div>';
export function renderDrySeparationRaw(slug){
 const tier=tiers[slug];if(!tier)throw new Error('Unknown dry separation configuration: '+slug);
 const premium=tier==='PREMIUM';
 const photos=materials.map(([key,title,copy])=>'<article class="dry-raw-material">'+photo(key,slug)+'<h3>'+esc(title)+'</h3><p>'+esc(copy)+'</p></article>').join('');
 const metrics=metric('50–55','%','Засорённость исследованных партий')+
  metric('до 80','%','Засорённость сырья на испытаниях')+
  (premium?metric('до 30','%','Влажность входного сырья на испытаниях'):'');
 const note=premium
  ?'Засорённость и влажность определяют раздельно: при испытаниях отдельные партии имели засорённость до 80%. Роторная сушилка между двумя баллистическими ступенями помогает отделять загрязнения, удерживаемые влагой. Показатели уточняются по партии и режиму.'
  :'Рабочий расчёт выпуска принят при засорённости около 50%. Испытания подтвердили работу на сырье с засором до 80%; фактический выпуск и степень очистки зависят от состава партии.';
 const contaminants=contamination.map(([key,title,copy],i)=>
  '<article class="dry-raw-contaminant" data-contaminant="'+(i+1)+'"><span class="dry-raw-icon" aria-hidden="true">'+
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg></span>'+
  '<h4>'+esc(title)+'</h4><p>'+esc(copy)+'</p></article>').join('');
 const detail=slug==='separatsiya-02'?'':'<details class="line-more dry-raw-details"><summary>Как оборудование отделяет эти загрязнения</summary>'+
  '<div class="dry-raw-methods">'+methods[slug].map(([title,copy],i)=>'<div class="dry-raw-method"><span>'+String(i+1).padStart(2,'0')+'</span>'+
   '<div><strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p></div></div>').join('')+'</div></details>';
 return '<section class="section line-soft dry-raw-section" id="raw-materials" data-dry-raw="'+slug+'">'+
 '<div class="dry-raw-heading"><div><p class="eyebrow">С ЧЕМ РАБОТАЕМ <span class="dry-raw-tier">/ '+tier+'</span></p>'+
 '<h2>Плёнка разного происхождения.<br>Настройки под вашу партию.</h2></div>'+
 '<p class="dry-raw-lead">От полигонных пакетов до сельскохозяйственной и промышленной упаковки. Технология раскрывает слипшиеся фрагменты, высвобождает включения и подготавливает сырьё к сухой очистке.</p></div>'+
 '<div class="dry-raw-photos">'+photos+'</div>'+
 '<div class="dry-raw-evidence era-indigo-surface"><p class="dry-raw-evidence-label">ИСПЫТАНО НА СЛОЖНОМ ПЛЁНОЧНОМ СЫРЬЕ</p>'+
 '<div class="dry-raw-metrics">'+metrics+'</div><p class="dry-raw-note">'+esc(note)+'</p></div>'+
 '<div class="dry-raw-categories-head"><p class="eyebrow">ЧТО ОТДЕЛЯЕТ СУХАЯ СЕПАРАЦИЯ</p>'+
 '<h3>От крупного мусора до микровключений.</h3><p>Основные группы посторонних материалов, которые оборудование отделяет от плёночного потока.</p></div>'+
 '<div class="dry-raw-categories">'+contaminants+'</div>'+
 detail+'</section>';
}
