import {categories,lines} from '../../../content/equipment/catalog.mjs';
import {lineMetrics} from '../../../content/lines/base/film-separation.mjs';
import {separation03Specification,separation03Staff} from '../../../content/lines/premium/separation-03.mjs';
import {dryFilmOutputLabels,formatLineNumber,lineMetric,linePowerTotals} from '../../../content/lines/shared/line-engineering.mjs';
import {linePlacement} from '../../../content/lines/shared/line-placement.mjs';

import lineCatalogueCovers from '../../../content/equipment/line-catalogue-covers.json' with {type:'json'};

const lineCardCopy={
 'separatsiya-01':{features:['Один плёночный поток']},
 'separatsiya-02':{
  title:'Линия сухой сепарации плёнок с сортировкой и затюковкой',
  features:['Закрытый сортировочный бокс','Автоматизированный пресс'],
 },
 'separatsiya-03':{
  description:'Расширенная комплектация с роторной сушильной установкой',
  features:['Роторная сушка плёнки','Закрытый сортировочный бокс'],
 },
 'moyka-plenki':{
  title:'Линия горячей мойки и грануляции плёнок и пакетов',
  features:['Три вида готовой продукции','Грануляция включена'],
 },
};

function premiumCardMetrics(line){
 return [
  lineMetric(line,['Входной поток'],'кг/ч'),
  lineMetric(line,['Выход очищенной плёнки'],'кг/ч'),
  lineMetric(line,['Установленная мощность'],'кВт'),
  {...lineMetric(line,['Расчётная потребляемая мощность'],'кВт'),label:'Потребляемая мощность',note:'Расчётная, 70% от установленной'},
  {label:'Рабочий персонал',value:separation03Staff.primary,unit:'чел./смена'},
  lineMetric(line,['Остаточная влажность после сушки'],'%'),
 ];
}

export const lineCard=(l,index)=>{
 const attributes=`data-line data-line-id="${l.slug}" data-group="${l.group}" aria-labelledby="line-${l.slug}-title"`;
 if(l.enabled&&l.status==='source-checked'){
  const {file,smallFile,width,height,smallWidth,sha256,smallSha256}=lineCatalogueCovers[l.slug];
  const cover=`/assets/${file}?v=${sha256.slice(0,12)}`;
  const smallCover=`/assets/${smallFile}?v=${smallSha256.slice(0,12)}`;
  const {
   title=l.cardTitle,description=l.cardDescription,features=[l.cardFeature],
  }=lineCardCopy[l.slug]||{};
  const metrics=l.slug==='separatsiya-03'?premiumCardMetrics(l):l.cardMetrics;
  return `<a class="line-card line-card--complete${l.slug==='separatsiya-01'?' line-card--mini':''}" ${attributes} href="${l.path}"><span class="line-card-cover"><img src="${cover}" srcset="${smallCover} ${smallWidth}w, ${cover} ${width}w" sizes="(min-width:1344px) 628px, (min-width:768px) calc((100vw - 88px) / 2), calc(100vw - 40px)" width="${width}" height="${height}" alt="${l.cardImageAlt||l.title}" ${index===0?'fetchpriority="high"':'loading="lazy"'} decoding="async"></span><div class="line-card-content"><span class="eyebrow">${l.slug==='moyka-plenki'?'ГОРЯЧАЯ МОЙКА':l.tier} / ГОТОВАЯ ЛИНИЯ</span><h3 id="line-${l.slug}-title">${title}</h3><p class="line-card-subtitle">${description}</p><div class="line-card-features">${features.map(feature=>`<span class="line-card-feature">${feature}</span>`).join('')}</div><dl class="line-card-metrics">${metrics.map(m=>`<div${m.text?' class="line-card-metric--text"':''}><dt>${m.label}</dt><dd>${m.value}<small>${m.unit}</small></dd>${m.note?`<p>${m.note}</p>`:''}</div>`).join('')}</dl><span class="card-action">Подробнее о линии <span aria-hidden="true">↗</span></span></div></a>`;
 }
 const reserved=l.number==='01';
 return `<article class="line-card line-card--draft${reserved?' line-card--reserved':''}" ${attributes}>${reserved?'<div class="line-card-placeholder" aria-hidden="true"><span>01</span></div>':''}<div class="line-card-draft-content"><span class="eyebrow">${l.number?l.tier:'ГОРЯЧАЯ МОЙКА'}</span><h3 id="line-${l.slug}-title">${l.title}</h3>${l.cardDescription?`<p class="line-card-subtitle">${l.cardDescription}</p>`:''}<span class="status">В разработке</span></div></article>`;
};

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const branches=[['lines','Линии и комплексы','/catalog/lines'],['equipment','Отдельные узлы','/catalog/equipment']];
const categoryLabels={'Сухая сепарация и очистка':'Сухая сепарация','Очистка рабочей жидкости':'Очистка стоков'};
const groupLabels={'Сепарация':'Сухая сепарация','Мойка':'Горячая мойка'};
export function catalogBranchNav(active){
 const equipment=active==='equipment';
 const key=equipment?'category':'group';
 const values=equipment?categories:[...new Set(lines.map(line=>line.group))];
 const labels=equipment?categoryLabels:groupLabels;
 const all=equipment?'Все узлы':'Все линии';
 return `<nav class="catalog-branch-nav catalog-branch-nav--${active}" id="${equipment?'catalog-filters':'line-filters'}" aria-label="Навигация каталога">
  <div class="catalog-branch-nav-main"><a class="catalog-branch-back" href="/catalog/">← Весь каталог</a><div class="catalog-branch-links">${branches.map(([id,label,href])=>`<a href="${href}/"${id===active?' aria-current="page"':''}>${label}</a>`).join('')}</div></div>
  <div class="catalog-quick-filters" role="group" aria-label="${equipment?'Категории узлов':'Категории линий'}" data-quick-filter="${key}">${['',...values].map(value=>`<button type="button" data-filter-value="${escape(value)}" aria-pressed="${!value}" disabled>${escape(value?labels[value]||value:all)}</button>`).join('')}</div>
 </nav>`;
}

const comparisonLines=[
 {slug:'separatsiya-01',label:'Базовая',stages:1,sorting:'Дополнительная опция, по согласованию',bunkers:'Не входят в базовую комплектацию',press:'Не входит в базовую комплектацию'},
 {slug:'separatsiya-02',label:'С сортировкой',stages:1,sorting:'Есть, в закрытом боксе',press:'Есть'},
 {slug:'separatsiya-03',label:'С сушкой',stages:2,sorting:'Есть, в закрытом ангаре',press:'Есть',dryer:true},
];

export function lineComparison(source=lines){
 const selected=comparisonLines.map(configuration=>{
  const line=source.find(item=>item.slug===configuration.slug&&item.enabled&&item.status==='source-checked');
  if(!line)throw new Error(`Missing approved comparison line: ${configuration.slug}`);
  return {line,configuration};
 });
 const metric=(line,labels,unit)=>lineMetric(line,labels,unit).value;
 const row=(label,value)=>[label,...selected.map(({line,configuration})=>value(line,configuration))];
 const bunker02=lineMetrics.find(([,unit,label])=>unit==='м³'&&label==='Раздельные бункеры с пылеудалением');
 const bunker03=separation03Specification.find(item=>item.position===17);
 const rows=[
  row('Входной поток, кг/ч',line=>metric(line,['Входной поток'],'кг/ч')),
  row('Расчётный выход очищенной плёнки, кг/ч',(line)=>metric(line,dryFilmOutputLabels,'кг/ч')+(line.number==='01'?'*':'')),
  row('Установленная мощность',line=>formatLineNumber(linePowerTotals(line.slug).installed)+' кВт'),
  row('Расчётная потребляемая мощность',line=>formatLineNumber(linePowerTotals(line.slug).calculated)+' кВт'),
  row('Баллистические ступени',(line,configuration)=>configuration.stages),
  row('Роторная сушка',(line,configuration)=>configuration.dryer?'Есть':'Нет'),
  row('Влажность плёнки после сушилки',(line,configuration)=>configuration.dryer?'До '+metric(line,['Остаточная влажность после сушки'],'%').replace(/^до /,'')+'%':'—'),
  row('Раздельная сортировка',(line,configuration)=>configuration.sorting),
  row('Раздельные бункеры',(line,configuration)=>configuration.bunkers||(configuration.dryer?`${bunker03.quantity} × ${bunker03.parameter.replace(' каждый','')}`:`${bunker02[0]} ${bunker02[1]}`)),
  row('Автоматический пресс',(line,configuration)=>configuration.press),
  row('Основной персонал, чел./смена',(line,configuration)=>configuration.dryer?separation03Staff.primary:metric(line,['Рабочий персонал','Основной персонал'],'чел./смена')),
  row('Сортировщики, чел./смена',(line,configuration)=>line.number==='01'?'По опции':(configuration.dryer?separation03Staff.sorters:metric(line,['Сортировщики'],'чел.'))+' дополнительно'),
  row('Габариты в плане, м',line=>{const {length,width}=linePlacement[line.slug];return `${formatLineNumber(length)} × ${formatLineNumber(width)}`;}),
 ];
 return `<details class="catalog-comparison" data-line-comparison data-keep-open>
  <summary>Сравнить комплектации</summary>
  <div class="catalog-comparison-content">
   <div class="catalog-comparison-scroll" role="region" aria-label="Сравнение линий">
    <table role="table">
     <caption>Три комплектации сухой сепарации</caption>
     <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Параметр</th>${selected.map(({line,configuration})=>`<th role="columnheader" scope="col" data-comparison-line="${line.slug}"><span>${line.tier}</span><span>${line.title}</span><small>${configuration.label}</small></th>`).join('')}</tr></thead>
     <tbody role="rowgroup">${rows.map(([label,...values])=>`<tr role="row"><th role="rowheader" scope="row">${escape(label)}</th>${values.map(value=>`<td role="cell">${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
   </div>
   <p class="catalog-comparison-note">Выпуск рассчитан при засорённости около 50%. *Для комплектации BASE это ориентир выбранного исполнения: паспортная подача базового распушителя 600–700 кг/ч. Режимы подтверждают на сырье. Расчётная мощность — 70% установленной.</p>
   <div class="catalog-comparison-links">${selected.map(({line})=>`<a class="text-link" href="${line.path}">Подробнее о линии ${line.tier} <span aria-hidden="true">↗</span></a>`).join('')}</div>
  </div>
 </details>`;
}

export const catalogNoScript='<noscript><p class="catalog-no-script">Для интерактивных фильтров включите JavaScript. Сейчас доступны все карточки и ссылки на подробные страницы.</p></noscript>';
