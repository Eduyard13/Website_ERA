import {linePlacement} from '../content/line-placement.mjs';
import {formatLineNumber} from '../content/line-engineering.mjs';
import {documentFileMeta} from './documents.mjs';

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function lineDimensions(document){
 const slug=document.objectSlug;
 const {idPrefix,length,width,source,caption,views}=linePlacement[slug];
 const href='/documents/'+document.file;
 const original=document.kind!=='raster-extract';
 const reference=slug==='separatsiya-02';
 const tabId=id=>`${idPrefix}-tab-${id}`;
 const panelId=id=>`${idPrefix}-view-${id}`;
 const pdfLink=`href="${href}" target="_blank" rel="noopener" data-pdf-open="${document.id}"`;
 const dimensions=[['Длина зоны на чертеже',length,'м'],['Ширина зоны на чертеже',width,'м'],['Расчётная площадь прямоугольного контура',length*width,'м²']];
 return `<div class="line-dimensions${reference?'':' line-dimensions--natural'}" data-line-dimensions>
  <header><p class="eyebrow">ЭРА / ИНЖЕНЕРНЫЙ АРХИВ</p><h3>Габариты и размещение линии</h3><p>${original?'Пример компоновки для оценки размещения оборудования в производственном помещении. Окончательная привязка и безопасные зоны уточняются под объект заказчика.':'Габариты механической части в плане. Проекции доступны на отдельном листе A4.'}</p></header>
  <dl class="line-dimensions-kpi">${dimensions.map(([label,value,unit])=>`<div><dt>${label}</dt><dd>${formatLineNumber(value)} <small>${unit}</small></dd></div>`).join('')}</dl>
  <div class="line-dimensions-tabs" role="tablist" aria-label="Проекции габаритного чертежа">
   ${views.map((view,i)=>`<button type="button" role="tab" id="${tabId(view.id)}" aria-controls="${panelId(view.id)}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-dimension-tab="${view.id}">${view.label}</button>`).join('')}
  </div>
  <div class="line-dimensions-stage">
   ${views.map((view,i)=>`<figure id="${panelId(view.id)}" role="tabpanel" aria-labelledby="${tabId(view.id)}" tabindex="0"${i?' hidden':''}>
    <a ${pdfLink} aria-label="Открыть ${original?'оригинальный PDF':'габаритную схему A4'}: ${escape(view.label)}"><img src="/assets/${view.file}" width="${view.width}" height="${view.height}"${reference?'':` style="--projection-width:${view.width}px;--projection-ratio:${view.width/view.height}"`} alt="${escape(view.label)} — ${original?'проекция из исходного чертежа A0':'габариты механической части'}" loading="lazy" decoding="async"></a>
    <figcaption>${view.label} · ${source}</figcaption>
   </figure>`).join('')}
  </div>
  <p class="line-dimensions-caption">${caption}</p>
  <div class="line-dimensions-actions"><span>${documentFileMeta(document)}</span><a class="button" ${pdfLink}>Открыть чертёж <span aria-hidden="true">⤢</span></a><a class="button secondary" href="${href}" download="${escape(document.downloadName)}">Скачать PDF <span aria-hidden="true">↓</span></a></div>
  <a class="text-link" href="/documents/drawings/?objectType=line&amp;product=${slug}">К документу в библиотеке ↗</a>
  <noscript><p>Без JavaScript доступен вид сверху. Все проекции можно открыть и скачать в PDF.</p></noscript>
 </div>`;
}
