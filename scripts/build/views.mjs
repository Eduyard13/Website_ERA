import {siteContacts} from '../../content/pages/contacts/contact.mjs';
import {nodeCard} from '../render/equipment/equipment-card.mjs';
import {catalogHub} from '../render/equipment/catalog-hub.mjs';
import {catalogBranchNav,lineCard,lineComparison,catalogNoScript} from '../render/equipment/catalog-branches.mjs';
import {renderGallery} from '../render/pages/gallery.mjs';
import {renderEquipment,renderDocuments} from '../render/equipment/equipment.mjs';
import {renderFilmSeparation} from '../render/lines/line.mjs';
import {renderHotFilmWashing} from '../render/lines/hot-film-washing.mjs';
import {renderSeparationDrying} from '../render/lines/separation-drying.mjs';
import {renderMiniFilmSeparation} from '../render/lines/mini-line.mjs';
import {presentationTechnology,presentationAutomation} from '../render/pages/home.mjs';
import {documentCategories} from '../../content/documents/document-manifest.mjs';
import {nodes,lines} from '../../content/equipment/catalog.mjs';
import {stages} from '../../content/shared/site.mjs';
const link=(t,h,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${h}">${t}<span aria-hidden="true">↗</span></a>`;
const intro=(label,title,text)=>`<section class="section page-intro"><p class="eyebrow">${label}</p><h1>${title}</h1><p class="lead">${text}</p></section>`;
const placeholder=(n,label='Изображение готовится')=>`<div class="asset-placeholder"><span class="placeholder-number" aria-hidden="true">${String(n).padStart(2,'0')}</span><span>${label}</span></div>`;
export {nodeCard};
export {galleryDialog} from '../render/shared/media.mjs';
export const extraRoutes=[...documentCategories.map(c=>'/documents/'+c.id),...nodes.slice(1).map(n=>n.path),...lines.filter(l=>l.enabled).map(l=>l.path)];
export function revisedPage(path){
 if(path==='/documents')return renderDocuments();
 if(path.startsWith('/documents/')){const category=documentCategories.find(c=>path==='/documents/'+c.id);if(category)return renderDocuments({categoryId:category.id});}
 const equipment=nodes.find(n=>n.path===path);if(equipment)return renderEquipment(equipment);
 if(path==='/technology')return presentationTechnology();
 if(path==='/automation')return presentationAutomation();
 if(path==='/catalog')return catalogHub();
 if(path==='/catalog/equipment')return '<div class="catalog-branch-page catalog-branch-page--equipment">'+intro('КАТАЛОГ ЭРА','Оборудование для каждой стадии.','Узлы для подготовки, очистки и дальнейшей переработки сырья. Характеристики, компоновки и документы — в каждой карточке.')+`<section class="section catalog-section catalog-branch">${catalogBranchNav('equipment')}<p class="filter-result" id="catalog-result" role="status" aria-live="polite">Найдено: ${nodes.length} из ${nodes.length} узлов</p><div class="node-grid">${nodes.map(nodeCard).join('')}</div><div class="catalog-card-notes"><p>Потребляемая мощность — расчётная: 70% от установленной. Фактические подача и нагрузка зависят от сырья и режима.</p><p>* Показатели влажности зависят от подготовки материала и настроек; целевые значения проверяются на выбранном сырье.</p></div><p class="empty-state" id="catalog-empty" hidden>По этим условиям ничего не найдено. Измените запрос или сбросьте фильтры.</p>${catalogNoScript}</section></div>`;
 if(path==='/catalog/lines')return '<div class="catalog-branch-page catalog-branch-page--lines">'+intro('ЛИНИИ И КОМПЛЕКСЫ','Технологические решения.','Комплектации для сухой сепарации и горячей мойки плёнок. Выберите решение под ваше сырьё и требуемый результат.')+`<section class="section catalog-branch">${catalogBranchNav('lines')}<p id="line-result" class="filter-result" role="status" aria-live="polite">Комплектаций: ${lines.length}</p><div class="line-grid">${lines.map(lineCard).join('')}</div>${lineComparison()}<p class="note">Производительность, состав оборудования и требования к сырью определяются при подборе комплектации.</p>${catalogNoScript}</section></div>`;
 if(path==='/media')return renderGallery();
 const line=lines.find(l=>l.enabled&&l.path===path);
 if(line?.slug==='moyka-plenki')return renderHotFilmWashing(line);
 if(line?.slug==='separatsiya-03')return renderSeparationDrying(line);
 if(line?.slug==='separatsiya-01')return renderMiniFilmSeparation(line);
 if(line?.slug==='separatsiya-02')return renderFilmSeparation(line);
 if(line)return `<div class="breadcrumbs"><a href="/">Главная</a> / <a href="/catalog/lines">Линии</a> / ${line.title}</div>`+intro(line.group+' / КОМПЛЕКТАЦИЯ',line.title,'Подберём последовательность операций и состав оборудования под ваше сырьё.')+`<section class="section"><div class="three-cols"><div><h3>Сырьё и результат</h3><p>Опишите материал, характер загрязнений и нужный конечный продукт.</p></div><div><h3>Состав и схема</h3><p>Выберем узлы подготовки, очистки и дальнейшей переработки для вашей задачи.</p></div><div><h3>Размещение</h3><p>При подборе учтём площадку, доступные ресурсы и доступ для обслуживания.</p></div></div><div class="actions">${link('Обсудить комплектацию',`mailto:${siteContacts.email}?subject=`+encodeURIComponent('Запрос ЭРА: '+line.title))}</div></section>`;
 return null;
}
