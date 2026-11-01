import {clientLabel} from './client-copy.mjs';
import {mediaCountsMarkup} from './media-counts.mjs';
import {catalogHub} from './catalog-hub.mjs';
import {renderGallery} from './gallery.mjs';
import {renderEquipment,renderDocuments} from './equipment.mjs';
import {presentationTechnology,presentationAutomation} from './home.mjs';
import {nodes,lines,categories} from '../content/catalog.mjs';
import {stages} from '../content/site.mjs';
const link=(t,h,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${h}">${t}<span aria-hidden="true">↗</span></a>`;
const intro=(label,title,text)=>`<section class="section page-intro"><p class="eyebrow">${label}</p><h1>${title}</h1><p class="lead">${text}</p></section>`;
const placeholder=(n,label='Изображение готовится')=>`<div class="asset-placeholder"><span class="placeholder-number" aria-hidden="true">${String(n).padStart(2,'0')}</span><span>${label}</span></div>`;
export function nodeCard(n){return `<article class="node-card" data-node data-title="${n.title.toLowerCase()} ${n.description.toLowerCase()}" data-category="${n.category}" data-materials="${n.materials.join('|')}"><a class="card-visual" href="${n.path}" aria-label="${n.title}"><img src="/assets/${n.cardFile}" alt="Схема: ${n.title}" loading="lazy"></a><div class="node-body"><p class="eyebrow">${n.category}</p><h3><a href="${n.path}">${n.title}</a></h3><p>${n.description}</p><div class="confirmed-specs">${n.highlights.slice(0,2).map(([value,label])=>`<span>${value}<small>${clientLabel(label)}</small></span>`).join('')}</div>${mediaCountsMarkup(n)}<a class="card-action" href="${n.path}">Подробнее <span aria-hidden="true">↗</span></a></div></article>`;}
const lineCard=l=>`<article class="line-card" data-line data-group="${l.group}" data-optional="${!l.enabled}" ${!l.enabled?'hidden':''}><span class="eyebrow">${l.group} / ПРОЕКТ КОМПЛЕКТАЦИИ</span><h3>${l.title}</h3><p>${l.group==='Мойка'?'Мойка и обезвоживание плёночного сырья.':'Подготовка и сепарация плёночного сырья.'}</p><p class="status">Подбор под ваше сырьё</p><a class="card-action" href="${l.path}">Подобрать комплектацию <span aria-hidden="true">↗</span></a></article>`;
export {galleryDialog} from './media.mjs';
export const extraRoutes=[...nodes.slice(1).map(n=>n.path),...lines.map(l=>l.path)];
export function revisedPage(path){
 if(path==='/documents')return renderDocuments();
 const equipment=nodes.find(n=>n.path===path);if(equipment)return renderEquipment(equipment);
 if(path==='/technology')return presentationTechnology();
 if(path==='/automation')return presentationAutomation();
 if(path==='/catalog')return catalogHub();
 if(path==='/catalog/equipment')return intro('КАТАЛОГ ЭРА','Оборудование для каждой стадии.','12 узлов для подготовки, очистки и дальнейшей переработки сырья. Характеристики, компоновки и документы — в каждой карточке.')+`<section class="section catalog-section"><form class="filters" id="catalog-filters" role="search"><label>Найти оборудование<input type="search" name="q" placeholder="Название или назначение"></label><label>Операция<select name="category"><option value="">Все операции</option>${categories.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Сырьё<select name="material"><option value="">Все записи</option>${[...new Set(nodes.flatMap(n=>n.materials))].map(m=>`<option>${m}</option>`).join('')}</select></label><button type="reset">Сбросить</button></form><p class="filter-result" id="catalog-result" role="status" aria-live="polite"></p><div class="node-grid">${nodes.map(nodeCard).join('')}</div><p class="empty-state" id="catalog-empty" hidden>По этим условиям ничего не найдено. Измените запрос или сбросьте фильтры.</p><noscript><p>Для интерактивных фильтров включите JavaScript. Ниже доступны все карточки.</p></noscript></section>`;
 if(path==='/catalog/lines')return intro('ЛИНИИ И КОМПЛЕКСЫ','Комплектации линий.','Сепарация и мойка плёночного сырья. Комплектация подбирается под состав сырья и требуемый результат.')+`<section class="section"><div class="filters" id="line-filters"><label>Направление<select name="group"><option value="">Все комплектации</option><option>Сепарация</option><option>Мойка</option></select></label><label class="check-label"><input type="checkbox" name="optional">Показать дополнительную «Сепарацию 03»</label><button type="button" data-line-reset>Сбросить</button></div><p id="line-result" class="filter-result" role="status" aria-live="polite"></p><div class="line-grid">${lines.map(lineCard).join('')}</div><p class="note">Производительность, состав оборудования и требования к сырью определяются при подборе комплектации.</p></section>`;
 if(path==='/media')return renderGallery();
 const line=lines.find(l=>l.path===path);
 if(line)return `<div class="breadcrumbs"><a href="/">Главная</a> / <a href="/catalog/lines">Линии</a> / ${line.title}</div>`+intro(line.group+' / КОМПЛЕКТАЦИЯ',line.title,'Подберём последовательность операций и состав оборудования под ваше сырьё.')+`<section class="section"><div class="three-cols"><div><h3>Сырьё и результат</h3><p>Опишите материал, характер загрязнений и нужный конечный продукт.</p></div><div><h3>Состав и схема</h3><p>Выберем узлы подготовки, очистки и дальнейшей переработки для вашей задачи.</p></div><div><h3>Размещение</h3><p>При подборе учтём площадку, доступные ресурсы и доступ для обслуживания.</p></div></div><div class="actions">${link('Обсудить комплектацию','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Запрос ЭРА: '+line.title))}</div></section>`;
 return null;
}
