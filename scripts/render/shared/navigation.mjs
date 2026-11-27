import {primaryLinks,navigationGroups,hiddenNavigationLinks} from '../../../content/shared/navigation.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const belongs=(path,parent)=>path===parent||path.startsWith(parent+'/');
export function normalizeNavigationPath(value,basePath=''){
 let path=new URL(value||'/','https://era.invalid').pathname;
 const base=basePath.replace(/\/+$/,'');
 if(base&&(path===base||path.startsWith(base+'/')))path=path.slice(base.length)||'/';
 return path.replace(/\/+$/,'')||'/';
}
export function navigationState(value,{basePath=''}={}){
 const original=normalizeNavigationPath(value,basePath),path=original==='/company-details'?'/contacts':original;
 const primary=primaryLinks.find(item=>item.href==='/'?path==='/':belongs(path,item.href));
 const section=primary?.section||([...navigationGroups.flatMap(g=>g.links),...hiddenNavigationLinks].some(l=>l.href===path)||belongs(path,'/documents')||path==='/contacts/sent'?'all':null);
 const panelPath=belongs(path,'/documents')?'/documents':belongs(path,'/catalog/equipment')?'/catalog/equipment':belongs(path,'/catalog/lines')?'/catalog/lines':path==='/contacts/sent'?'/contacts':path;
 return {path,section,panelPath};
}
const contactHref=()=>'/contacts#project-form';
function primaryLink(item,state){
 const current=state.path===item.href,active=state.section===item.section;
 return `<a class="primary-link" href="${item.href}" data-label="${item.label}"${item.title?` title="${escape(item.title)}"`:""}${current?' aria-current="page"':''}${active?' data-current-section="true"':''}><span>${item.label}</span></a>`;
}
export function navigation(path){const state=navigationState(path);return primaryLinks.map(item=>primaryLink(item,state)).join('');}
function panelLink(item,state){
 const exact=state.path===item.href,parent=!exact&&state.panelPath===item.href;
 return `<a class="drawer-link" href="${item.href}"${exact?' aria-current="page"':''}${parent?' data-current-branch="true"':''}><span>${item.label}</span><span aria-hidden="true">↗</span></a>`;
}
export function siteHeader(path){
 const state=navigationState(path),cta=contactHref(state.path);
 return `<header class="site-header"><div class="header-primary"><a class="brand" href="/" aria-label="ЭРА — на главную"><img src="/assets/logo.svg" alt="ЭРА" width="112" height="44"></a><nav class="primary-nav" aria-label="Основная навигация">${navigation(path)}</nav><div class="header-actions"><button type="button" class="all-sections-toggle" data-menu-toggle data-label="Все разделы" aria-label="Все разделы" aria-expanded="false" aria-controls="site-menu"${state.section==='all'?' data-current-section="true"':''}><svg class="menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.3"/></svg><span class="menu-label-desktop">Все разделы</span><span class="menu-label-mobile">Меню</span></button><a class="header-cta" href="${cta}" data-project-request>Связаться с нами <span aria-hidden="true">↗</span></a></div></div></header>`;
}
export function siteMenu(path){
 const state=navigationState(path),cta=contactHref(state.path);
 const groups=navigationGroups.map((group,i)=>`<section class="drawer-group${i<3?' is-primary':' is-supporting'}" aria-labelledby="drawer-group-${i}"><h2 class="drawer-group-heading" id="drawer-group-${i}">${escape(group.label)}</h2><ul class="drawer-group-links">${group.links.map(item=>`<li>${panelLink(item,state)}</li>`).join('')}</ul></section>`);
 return `<dialog id="site-menu" class="site-menu" data-menu-layout="3-plus-2" aria-labelledby="site-menu-title"><div class="drawer-head"><p id="site-menu-title">Все разделы</p><button type="button" class="drawer-close" data-menu-close aria-label="Закрыть меню">Закрыть <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16" stroke="currentColor" stroke-width="1.3"/></svg></button></div><div class="drawer-scroll"><nav class="drawer-groups" aria-label="Все разделы сайта"><div class="drawer-major-groups">${groups.slice(0,3).join('')}</div><div class="drawer-support-groups">${groups.slice(3).join('')}</div></nav><div class="drawer-footer"><div class="drawer-contact-copy"><h2>Есть задача по переработке сырья?</h2><p>Поможем подобрать технологию и оборудование.</p></div><a class="button drawer-contact-cta" href="${cta}" data-project-request>Обсудить проект <span aria-hidden="true">↗</span></a></div></div></dialog>`;
}
