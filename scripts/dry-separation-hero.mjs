import {lineHeroImage} from './line-page-media.mjs';

// A single visual template for BASE, PRO and PREMIUM. Technical figures are supplied
// independently by each original line renderer, not copied across configurations.
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const presentations={
 'separatsiya-01':{
  heading:'Сухая сепарация плёнки BASE',
  hook:'Первый шаг от загрязнённой плёнки к очищенному сырью.',
  lead:'Базовая линия раскрывает тюки, отделяет крупные и мелкие включения и выполняет роторную доочистку. На выходе — один общий поток подготовленной плёнки для продажи переработчику или дальнейшей мойки.',
  tags:['Сухая очистка без воды','Один поток плёнки','Базовая комплектация']
 },
 'separatsiya-02':{
  heading:'Сухая сепарация плёнки PRO',
  hook:'Из загрязнённого сырья — в пять раздельных потоков плёнки.',
  lead:'Линия раскрывает пакеты и тюки, отделяет основную массу включений, сортирует плёнку по видам и автоматически формирует тюки. Подготовленные партии можно продавать переработчикам или направлять на горячую мойку.',
  tags:['Сухая очистка','Пять раздельных потоков','Автоматическая увязка']
 },
 'separatsiya-03':{
  heading:'Сухая сепарация и сушка PREMIUM',
  hook:'Две ступени сепарации, сушка и пять раздельных потоков плёнки.',
  lead:'Предварительное распушение, две баллистические ступени с роторной сушкой между ними, сортировка по видам и роторная доочистка основного микса. Пять накопителей и автоматический пресс формируют раздельные партии.',
  tags:['Две баллистические ступени','Роторная сушка','Пять раздельных потоков']
 }
};
const button=(label,href,secondary=false)=>'<a class="button '+(secondary?'secondary':'')+'" href="'+escape(href)+'">'+escape(label)+'<span aria-hidden="true">↗</span></a>';

export function renderDrySeparationHero({line,email,metrics,metricNote,documentHref,documentText,documentAttributes=''}) {
 const entry=presentations[line.slug];
 if(!entry)throw new Error('No source-specific dry line hero: '+line.slug);
 if(!Array.isArray(metrics)||metrics.length!==4)throw new Error('Four source-specific metrics are required for '+line.slug);
 if(!documentHref||!documentText)throw new Error('Original PDF reference is required for '+line.slug);
 const metricCards=metrics.map(({value,unit,label,detail},index)=>{
  if(value===undefined||!unit||!label)throw new Error('Missing technical metric '+index+' in '+line.slug);
  return '<div data-line-metric="'+(index+1)+'"><dt>'+escape(label)+'</dt><dd>'+escape(value)+'<small>'+escape(unit)+'</small></dd>'+(detail?'<span class="line-metric-detail">'+escape(detail)+'</span>':'')+'</div>';
 }).join('');
 return '<section class="section line-hero line-hero--commercial" data-dry-line-hero="'+escape(line.slug)+'">'+
  '<div class="line-hero-copy">'+
   '<p class="eyebrow">ЭРА / ПРОМЫШЛЕННАЯ ЛИНИЯ / '+escape(line.tier)+'</p>'+
   '<h1>'+escape(entry.heading)+'</h1>'+
   '<p class="line-slogan">'+escape(entry.hook)+'</p>'+
   '<p class="line-lead">'+escape(entry.lead)+'</p>'+
   '<div class="actions">'+button('Обсудить комплектацию',email)+button('Схема и состав линии','#composition',true)+'</div>'+
  '</div>'+
  '<div class="line-hero-visual">'+lineHeroImage(line)+
   '<div class="line-hero-tags">'+entry.tags.map(tag=>'<span>'+escape(tag)+'</span>').join('')+'</div>'+
  '</div>'+
  '<div class="line-metrics line-metrics--commercial">'+
   '<p class="line-metrics-eyebrow">ПРОИЗВОДСТВЕННЫЙ ПАСПОРТ <span>'+escape(line.tier)+'</span></p>'+
   '<dl>'+metricCards+'</dl>'+
   '<p class="line-metrics-note">'+escape(metricNote)+'</p>'+
   '<a class="text-link line-document-shortcut" href="'+escape(documentHref)+'"'+(documentAttributes?' '+documentAttributes:'')+'>'+escape(documentText)+' ↗</a>'+
  '</div>'+
 '</section>';
}
