import source from '../content/pro-engineering-views.json' with {type:'json'};
import {linePlacement} from '../content/line-placement.mjs';
import {formatLineNumber} from '../content/line-engineering.mjs';
import {documentFileMeta} from './documents.mjs';

const assetRoot='lines/separatsiya-02/engineering-center/';
const placement=linePlacement['separatsiya-02'];
const scope='pro-engineering';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const asset=variant=>'/assets/'+variant.file;
const packaged=(view,variant)=>({...view[variant],file:assetRoot+view[variant].file});
const drawings=placement.views.map((view,index)=>({
 id:view.id,title:view.label,shortLabel:['Сверху','Сбоку 1','Сбоку 2','Лист A0'][index],
 display:view,full:view,thumb:{file:assetRoot+'drawings/'+view.id+'-thumb.webp',width:360,height:Math.round(view.height*360/view.width)}
}));
const groups=[
 {id:'overview',label:'Обзор линии',views:source.views.filter(view=>view.group==='overview')},
 {id:'detail',label:'Детализация',views:source.views.filter(view=>view.group==='detail')},
 {id:'drawings',label:'Чертежи',views:drawings}
];

function symbol(path){
 return `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
}
const left=symbol('M14.5 5.5 8 12l6.5 6.5');
const right=symbol('M9.5 5.5 16 12l-6.5 6.5');
const expand=symbol('M8.5 4H4v4.5M15.5 4H20v4.5M20 15.5V20h-4.5M4 15.5V20h4.5');
const close=symbol('m6 6 12 12M18 6 6 18');
const reset=symbol('M3.5 12a8.5 8.5 0 1 1 2.1 5.6M3.5 6v6h6');

function metrics(){
 const primary=[
  ['Длина зоны на чертеже',placement.length,'м'],
  ['Ширина зоны на чертеже',placement.width,'м'],
  ['Площадь прямоугольного контура',placement.length*placement.width,'м²']
 ];
 const heights=[['Высота помещения по ТО','9'],['Высота оборудования по ТО','≈6,5']];
 return `<dl class="pec-metrics">${primary.map(([label,value,unit])=>`<div><dt>${label}</dt><dd>${formatLineNumber(value)} <small>${unit}</small></dd></div>`).join('')}</dl>
 <dl class="pec-heights">${heights.map(([label,value])=>`<div><dt>${label}</dt><dd>${value} м</dd></div>`).join('')}</dl>`;
}
function filmstrip(group){
 return `<ul class="pec-strip" data-engineering-strip data-engineering-ui aria-label="${group.label}. Ракурсы">
  ${group.views.map((view,index)=>{
   const drawing=group.id==='drawings';
   const [thumb,display,full]=['thumb','display','full'].map(kind=>drawing?view[kind]:packaged(view,kind));
   return `<li><button class="pec-thumb" type="button"${drawing?` id="${placement.idPrefix}-tab-${view.id}" data-dimension-tab="${view.id}"`:''}
    data-engineering-frame="${view.id}" data-engineering-src="${asset(display)}" data-engineering-full="${asset(full)}"
    data-engineering-size="${display.width} ${display.height}" data-engineering-full-size="${full.width} ${full.height}"
    aria-controls="${scope}-stage" aria-label="${escape(view.title)}" aria-pressed="${index===0}">
    <img src="${asset(thumb)}" width="${thumb.width}" height="${thumb.height}" alt="" loading="lazy" decoding="async">
    <span>${escape(view.shortLabel)}</span></button></li>`;
  }).join('')}
 </ul>`;
}
function viewer(){
 const first=groups[0].views[0],display=packaged(first,'display');
 return `<div class="pec-viewer" data-engineering-viewer>
  <div class="pec-stage" id="${scope}-stage">
   <div class="pec-viewport" data-engineering-viewport role="group" aria-labelledby="${scope}-caption" tabindex="-1">
    <img class="pec-image" src="${asset(display)}" width="${display.width}" height="${display.height}" alt="${escape(first.title)}" data-engineering-image data-engineering-loaded-view="${first.id}" loading="lazy" decoding="async" draggable="false">
    <button class="pec-image-open" type="button" data-engineering-open data-engineering-ui aria-label="Открыть изображение на весь экран"></button>
    <div class="pec-error" data-engineering-error hidden><p role="status">Не удалось загрузить изображение</p><button type="button" data-engineering-retry>Повторить</button></div>
    <span class="pec-loading" data-engineering-loading role="status" hidden>Загрузка ракурса…</span>
   </div>
   <button class="pec-control pec-prev" type="button" data-engineering-step="-1" data-engineering-ui aria-label="Предыдущий ракурс" disabled>${left}</button>
   <button class="pec-control pec-next" type="button" data-engineering-step="1" data-engineering-ui aria-label="Следующий ракурс">${right}</button>
   <button class="pec-control pec-expand" type="button" data-engineering-open data-engineering-ui aria-label="На весь экран" title="На весь экран">${expand}</button>
  </div>
  <div class="pec-caption">
   <p id="${scope}-caption" data-engineering-title aria-live="polite">${escape(first.title)}</p>
   <span data-engineering-count>01 / 10</span>
  </div>
  <div class="pec-zoom" data-engineering-zoom hidden aria-label="Масштаб изображения">
   <button class="pec-control" type="button" data-engineering-scale-by="-.5" aria-label="Уменьшить" title="Уменьшить">−</button>
   <output data-engineering-scale>100%</output>
   <button class="pec-control" type="button" data-engineering-scale-by=".5" aria-label="Увеличить" title="Увеличить">+</button>
   <button class="pec-control" type="button" data-engineering-reset aria-label="Сбросить масштаб" title="Сбросить масштаб">${reset}</button>
  </div>
 </div>`;
}
function drawingActions(drawing){
 const href='/documents/'+drawing.file;
 return `<div class="pec-documents">
  <p>${documentFileMeta(drawing)}</p>
  <div class="pec-document-actions">
   <a class="button" href="${href}" target="_blank" rel="noopener" data-pdf-open="${drawing.id}">Открыть чертёж <span aria-hidden="true">⤢</span></a>
   <a class="button secondary" href="${href}" download="${escape(drawing.downloadName)}">Скачать PDF <span aria-hidden="true">↓</span></a>
   <a class="text-link" href="/documents/drawings/?objectType=line&amp;product=${drawing.objectSlug}">К документу в библиотеке ↗</a>
  </div>
 </div>`;
}
export function renderProEngineeringCenter(drawing){
 return `<div class="pro-engineering-center" data-pro-engineering-center data-engineering-group="overview" data-engineering-view="v01">
  <div class="pec-heading">
   <p class="eyebrow">ЭРА / ИНЖЕНЕРНЫЙ ОБЗОР · PRO</p>
   <h2>Интерактивный инженерный центр</h2>
   <p>Изучите компоновку линии, расположение оборудования и организацию производственного пространства. От общего вида до точных инженерных чертежей.</p>
  </div>
  <div class="pec-panel">
   ${metrics()}
   <div class="pec-tabs" role="tablist" aria-label="Режим просмотра" data-engineering-ui>
    ${groups.map(({id,label},index)=>`<button type="button" role="tab" id="${scope}-tab-${id}" aria-controls="${scope}-panel-${id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-engineering-tab="${id}">${label}</button>`).join('')}
   </div>
   ${groups.map((group,index)=>`<div class="pec-tabpanel" role="tabpanel" id="${scope}-panel-${group.id}" aria-labelledby="${scope}-tab-${group.id}" data-engineering-panel="${group.id}"${index?' hidden':''}${group.id==='drawings'?' data-line-dimensions':''}>
    <div data-engineering-slot>${index?'':viewer()}</div>
    ${filmstrip(group)}
    ${group.id==='drawings'?drawingActions(drawing):''}
   </div>`).join('')}
   <noscript><p class="pec-no-script"><a href="/documents/${drawing.file}" target="_blank" rel="noopener">Открыть оригинальный чертёж А0</a> · <a href="/documents/${drawing.file}" download="${escape(drawing.downloadName)}">Скачать PDF</a></p></noscript>
  </div>
  <dialog class="pec-dialog" data-engineering-dialog aria-labelledby="${scope}-caption">
   <button class="pec-control pec-close" type="button" data-engineering-close aria-label="Закрыть полноэкранный просмотр" title="Закрыть">${close}</button>
   <div class="pec-dialog-slot" data-engineering-dialog-slot></div>
  </dialog>
 </div>`;
}
