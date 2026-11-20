import {categories,lines,nodes} from '../content/catalog.mjs';
import {lineMetrics} from '../content/film-separation.mjs';
import {separation03Specification,separation03Staff} from '../content/separation-03.mjs';
import {dryFilmOutputLabels,formatLineNumber,lineMetric,linePowerTotals} from '../content/line-engineering.mjs';
import {linePlacement} from '../content/line-placement.mjs';

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const branches=[['lines','Линии и комплексы','/catalog/lines'],['equipment','Отдельные узлы','/catalog/equipment']];
export function catalogBranchNav(active){
 return `<nav class="catalog-branch-nav catalog-branch-nav--${active}" aria-label="Разделы каталога"><a class="catalog-branch-back" href="/catalog/">← Весь каталог</a><div class="catalog-branch-links">${branches.map(([id,label,href])=>id===active?`<span aria-current="page">${label}</span>`:`<a href="${href}/">${label}</a>`).join('')}</div></nav>`;
}
const categoryLabels={'Сухая сепарация и очистка':'Сухая сепарация','Очистка рабочей жидкости':'Очистка стоков'};
const quickFilters=(name,label,all,values,labels={})=>`<div class="catalog-quick-filters" role="group" aria-label="${label}" data-quick-filter="${name}" hidden>${['',...values].map(value=>`<button type="button" data-filter-value="${escape(value)}" aria-pressed="${!value}">${escape(value?labels[value]||value:all)}</button>`).join('')}</div>`;
export function equipmentFilters(){
 return `<form class="filters catalog-branch-filters" id="catalog-filters" role="search"><div class="catalog-search-row"><label class="catalog-search">Найти оборудование<input type="search" name="q" placeholder="Название или назначение" disabled></label><label class="catalog-material">Сырьё<select name="material" disabled><option value="">Все виды сырья</option>${[...new Set(nodes.flatMap(n=>n.materials))].map(value=>`<option>${escape(value)}</option>`).join('')}</select></label><button type="reset" disabled>Сбросить</button></div><label data-native-filter="category">Операция<select name="category" disabled><option value="">Все узлы</option>${categories.map(value=>`<option>${escape(value)}</option>`).join('')}</select></label>${quickFilters('category','Производственная задача','Все узлы',categories,categoryLabels)}</form>`;
}
export function lineFilters(){
 const groups=[...new Set(lines.map(line=>line.group))];
 return `<form class="filters catalog-branch-filters catalog-branch-filters--lines" id="line-filters"><label data-native-filter="group">Направление<select name="group" disabled><option value="">Все линии</option>${groups.map(value=>`<option>${escape(value)}</option>`).join('')}</select></label>${quickFilters('group','Направление линии','Все линии',groups)}<button type="button" data-line-reset disabled>Сбросить</button></form>`;
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
