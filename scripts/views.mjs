import {nodeCard} from './equipment-card.mjs';
import {catalogHub} from './catalog-hub.mjs';
import {renderGallery} from './gallery.mjs';
import {renderEquipment,renderDocuments} from './equipment.mjs';
import {renderFilmSeparation} from './line.mjs';
import {renderMiniFilmSeparation} from './mini-line.mjs';
import {presentationTechnology,presentationAutomation} from './home.mjs';
import {nodes,lines,categories} from '../content/catalog.mjs';
import {stages} from '../content/site.mjs';
const link=(t,h,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${h}">${t}<span aria-hidden="true">↗</span></a>`;
const intro=(label,title,text)=>`<section class="section page-intro"><p class="eyebrow">${label}</p><h1>${title}</h1><p class="lead">${text}</p></section>`;
const placeholder=(n,label='Изображение готовится')=>`<div class="asset-placeholder"><span class="placeholder-number" aria-hidden="true">${String(n).padStart(2,'0')}</span><span>${label}</span></div>`;
export {nodeCard};
const lineCard=l=>{
 const attributes=`data-line data-line-id="${l.slug}" data-group="${l.group}" aria-labelledby="line-${l.slug}-title"`;
 if(l.enabled&&l.status==='source-checked')return `<a class="line-card line-card--complete${l.slug==='separatsiya-01'?' line-card--mini':''}" ${attributes} href="${l.path}"><span class="line-card-cover"><img src="/assets/${l.cardFile}" srcset="/assets/${l.cardSmallFile} 768w, /assets/${l.cardFile} 1536w" sizes="(min-width:1344px) 628px, (min-width:768px) calc((100vw - 88px) / 2), calc(100vw - 40px)" width="1536" height="1024" alt="${l.cardImageAlt||'Линия сепарации плёнок и пакетов с сортировочным боксом'}" fetchpriority="high" decoding="async"></span><div class="line-card-content"><span class="eyebrow">СЕПАРАЦИЯ ${l.number} / ГОТОВАЯ ЛИНИЯ</span><h3 id="line-${l.slug}-title">${l.cardTitle}</h3><p class="line-card-subtitle">${l.cardDescription}</p><span class="line-card-feature">${l.cardFeature}</span><dl class="line-card-metrics">${l.cardMetrics.map(m=>`<div${m.text?' class="line-card-metric--text"':''}><dt>${m.label}</dt><dd>${m.value}<small>${m.unit}</small></dd>${m.note?`<p>${m.note}</p>`:''}</div>`).join('')}</dl><span class="card-action">Подробнее о линии <span aria-hidden="true">↗</span></span></div></a>`;
 const reserved=l.number==='01';
 return `<article class="line-card line-card--draft${reserved?' line-card--reserved':''}" ${attributes}>${reserved?'<div class="line-card-placeholder" aria-hidden="true"><span>01</span></div>':''}<div class="line-card-draft-content"><span class="eyebrow">${l.number?'СЕПАРАЦИЯ '+l.number:'ГОРЯЧАЯ МОЙКА'}</span><h3 id="line-${l.slug}-title">${l.title}</h3>${l.cardDescription?`<p class="line-card-subtitle">${l.cardDescription}</p>`:''}<span class="status">В разработке</span></div></article>`;
};
export {galleryDialog} from './media.mjs';
export const extraRoutes=[...nodes.slice(1).map(n=>n.path),...lines.filter(l=>l.enabled).map(l=>l.path)];
export function revisedPage(path){
 if(path==='/documents')return renderDocuments();
 const equipment=nodes.find(n=>n.path===path);if(equipment)return renderEquipment(equipment);
 if(path==='/technology')return presentationTechnology();
 if(path==='/automation')return presentationAutomation();
 if(path==='/catalog')return catalogHub();
 if(path==='/catalog/equipment')return intro('КАТАЛОГ ЭРА','Оборудование для каждой стадии.','12 узлов для подготовки, очистки и дальнейшей переработки сырья. Характеристики, компоновки и документы — в каждой карточке.')+`<section class="section catalog-section"><form class="filters" id="catalog-filters" role="search"><label>Найти оборудование<input type="search" name="q" placeholder="Название или назначение"></label><label>Операция<select name="category"><option value="">Все операции</option>${categories.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Сырьё<select name="material"><option value="">Все записи</option>${[...new Set(nodes.flatMap(n=>n.materials))].map(m=>`<option>${m}</option>`).join('')}</select></label><button type="reset">Сбросить</button></form><p class="filter-result" id="catalog-result" role="status" aria-live="polite"></p><div class="node-grid">${nodes.map(nodeCard).join('')}</div><div class="catalog-card-notes"><p>Потребляемая мощность — расчётная: 70% от установленной. Фактические подача и нагрузка зависят от сырья и режима.</p><p>* Показатели влажности зависят от подготовки материала и настроек; целевые значения проверяются на выбранном сырье.</p></div><p class="empty-state" id="catalog-empty" hidden>По этим условиям ничего не найдено. Измените запрос или сбросьте фильтры.</p><noscript><p>Для интерактивных фильтров включите JavaScript. Ниже доступны все карточки.</p></noscript></section>`;
 if(path==='/catalog/lines')return intro('ЛИНИИ И КОМПЛЕКСЫ','Комплектации линий.','Сепарация и мойка плёночного сырья. Комплектация подбирается под состав сырья и требуемый результат.')+`<section class="section"><div class="filters" id="line-filters"><label>Направление<select name="group"><option value="">Все комплектации</option><option>Сепарация</option><option>Мойка</option></select></label><button type="button" data-line-reset>Сбросить</button></div><p id="line-result" class="filter-result" role="status" aria-live="polite"></p><div class="line-grid">${lines.map(lineCard).join('')}</div><p class="note">Производительность, состав оборудования и требования к сырью определяются при подборе комплектации.</p></section>`;
 if(path==='/media')return renderGallery();
 const line=lines.find(l=>l.enabled&&l.path===path);
 if(line?.slug==='separatsiya-01')return renderMiniFilmSeparation(line);
 if(line?.slug==='separatsiya-02')return renderFilmSeparation(line);
 if(line)return `<div class="breadcrumbs"><a href="/">Главная</a> / <a href="/catalog/lines">Линии</a> / ${line.title}</div>`+intro(line.group+' / КОМПЛЕКТАЦИЯ',line.title,'Подберём последовательность операций и состав оборудования под ваше сырьё.')+`<section class="section"><div class="three-cols"><div><h3>Сырьё и результат</h3><p>Опишите материал, характер загрязнений и нужный конечный продукт.</p></div><div><h3>Состав и схема</h3><p>Выберем узлы подготовки, очистки и дальнейшей переработки для вашей задачи.</p></div><div><h3>Размещение</h3><p>При подборе учтём площадку, доступные ресурсы и доступ для обслуживания.</p></div></div><div class="actions">${link('Обсудить комплектацию','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Запрос ЭРА: '+line.title))}</div></section>`;
 return null;
}
