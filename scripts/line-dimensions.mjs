import assets from '../content/separatsiya-02-dimensions-assets.json' with {type:'json'};
import {documentFileMeta} from './documents.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function lineDimensions(d){
 const href='/documents/'+d.file;
 return `<div class="line-dimensions" data-line-dimensions><header><p class="eyebrow">ЭРА / ИНЖЕНЕРНЫЙ АРХИВ</p><h3>Габариты и размещение линии</h3><p>Пример компоновки для оценки размещения оборудования в производственном помещении. Окончательная привязка и безопасные зоны уточняются под объект заказчика.</p></header>
 <dl class="line-dimensions-kpi"><div><dt>Длина зоны на чертеже</dt><dd>45 <small>м</small></dd></div><div><dt>Ширина зоны на чертеже</dt><dd>18 <small>м</small></dd></div><div><dt>Расчётная площадь прямоугольного контура</dt><dd>810 <small>м²</small></dd></div></dl>
 <div class="line-dimensions-tabs" role="tablist" aria-label="Проекции габаритного чертежа">${assets.views.map((v,i)=>`<button type="button" role="tab" id="dimension-tab-${v.id}" aria-controls="dimension-view-${v.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-dimension-tab="${v.id}">${v.label}</button>`).join('')}</div>
 <div class="line-dimensions-stage">${assets.views.map((v,i)=>`<figure id="dimension-view-${v.id}" role="tabpanel" aria-labelledby="dimension-tab-${v.id}" tabindex="0"${i?' hidden':''}><a href="${href}" target="_blank" rel="noopener" data-pdf-open="${d.id}" aria-label="Открыть оригинальный PDF: ${escape(v.label)}"><img src="/assets/${v.file}" width="${v.width}" height="${v.height}" alt="${escape(v.label)} — проекция из исходного чертежа A0, с размерами и позициями" loading="lazy" decoding="async"></a><figcaption>${v.label} · из исходного листа A0</figcaption></figure>`).join('')}</div>
 <p class="line-dimensions-caption">Представленная схема размещения (исходный чертёж). Точная привязка выполняется под площадку заказчика.</p>
 <div class="line-dimensions-actions"><span>${documentFileMeta(d)}</span><a class="button" href="${href}" target="_blank" rel="noopener" data-pdf-open="${d.id}">Открыть чертёж <span aria-hidden="true">⤢</span></a><a class="button secondary" href="${href}" download="${escape(d.downloadName)}">Скачать PDF <span aria-hidden="true">↓</span></a></div><a class="text-link" href="/documents/drawings/?objectType=line&amp;product=separatsiya-02">К документу в библиотеке ↗</a>
 <noscript><p>Без JavaScript доступен вид сверху. Все три проекции можно открыть и скачать в исходном PDF.</p></noscript></div>`;
}
