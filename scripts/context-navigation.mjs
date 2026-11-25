import {nodes,lines} from '../content/catalog.mjs';
import {documentCategories} from '../content/document-manifest.mjs';
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const lineRoutes=new Set(['separatsiya-01','separatsiya-02','separatsiya-03','moyka-plenki'].map(slug=>'/catalog/lines/'+slug));
export const linePresentationPage=path=>lineRoutes.has(path);
const lineSections=[
 ['purpose','Назначение'],['raw-materials','Сырьё'],['composition','Схема линии'],['process','Процесс'],
 ['quality','Продукт'],['kair','КАИР'],['specs','Характеристики'],['placement','Габариты'],
 ['photos','Фото'],['documents','Документы'],['request','Обратная связь'],['equipment','Состав узлов']
];
export function contextNavigationData(path){
 if(typeof path!=='string')return null;
 const category=documentCategories.find(c=>path==='/documents/'+c.id);
 if(category)return {parent:'/documents/',crumbs:[{title:'Документация',href:'/documents/'},{title:category.title}]};
 const node=nodes.find(n=>n.path===path);
 if(node)return {parent:'/catalog/equipment/',crumbs:[{title:'Каталог',href:'/catalog/'},{title:'Отдельные узлы',href:'/catalog/equipment/'},{title:node.title}]};
 const line=lines.find(l=>l.enabled&&l.path===path);
 if(line)return {parent:'/catalog/lines/',crumbs:[{title:'Каталог',href:'/catalog/'},{title:'Линии и комплексы',href:'/catalog/lines/'},{title:line.tier?(line.slug==='separatsiya-03'?'Сухая сепарация и сушка · '+line.tier:'Сухая сепарация · '+line.tier):line.title}]};
 return null;
}
export function contextNavigation(path){
 const entry=contextNavigationData(path);if(!entry)return '';
 const sectionLinks=linePresentationPage(path)?`<div class="line-section-nav" data-line-section-nav role="group" aria-label="Разделы линии">${lineSections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</div>`:'';
 return `<nav class="context-navigation" data-context-navigation aria-label="Навигация по разделу"><div class="context-navigation-inner"><a class="context-back" data-context-back href="${entry.parent}"><span aria-hidden="true">←</span>Назад</a><ol class="context-crumbs">${entry.crumbs.map(crumb=>`<li>${crumb.href?`<a href="${crumb.href}">${escape(crumb.title)}</a>`:`<span aria-current="page">${escape(crumb.title)}</span>`}</li>`).join('')}</ol></div>${sectionLinks}</nav>`;
}
