import {primaryLinks,navigationGroups} from '../content/navigation.mjs';
import {siteContacts} from '../content/contact.mjs';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const belongs=(path,parent)=>path===parent||path.startsWith(parent+'/');
export function normalizeNavigationPath(value,basePath=''){
 let path=new URL(value||'/','https://era.invalid').pathname;
 const base=basePath.replace(/\/+$/,'');
 if(base&&(path===base||path.startsWith(base+'/')))path=path.slice(base.length)||'/';
 return path.replace(/\/+$/,'')||'/';
}
export function navigationState(value,{basePath=''}={}){
 const path=normalizeNavigationPath(value,basePath);
 const section=path==='/'?'project':belongs(path,'/catalog')?'equipment':path==='/technology'?'technology':navigationGroups.flatMap(g=>g.links).some(l=>l.href===path)?'all':null;
 const panelPath=belongs(path,'/catalog/equipment')?'/catalog/equipment':belongs(path,'/catalog/lines')?'/catalog/lines':path;
 return {path,section,panelPath};
}
const contactHref=path=>path==='/'?'#discuss':'/contacts';
function primaryLink(item,state){
 const current=state.path===item.href,active=state.section===item.section;
 return `<a class="primary-link" href="${item.href}" data-label="${item.label}"${current?' aria-current="page"':''}${active?' data-current-section="true"':''}><span>${item.label}</span></a>`;
}
export function navigation(path){const state=navigationState(path);return primaryLinks.map(item=>primaryLink(item,state)).join('');}
function panelLink(item,state){
 const exact=state.path===item.href,parent=!exact&&state.panelPath===item.href;
 return `<a class="drawer-link" href="${item.href}"${exact?' aria-current="page"':''}${parent?' data-current-branch="true"':''}><span>${item.label}</span><span aria-hidden="true">↗</span></a>`;
}
export function siteHeader(path){
 const state=navigationState(path),cta=contactHref(state.path);
 return `<header class="site-header"><div class="header-primary"><a class="brand" href="/" aria-label="ЭРА — на главную"><img src="/assets/logo.png" alt="ЭРА" width="112" height="44"></a><nav class="primary-nav" aria-label="Основная навигация">${navigation(path)}</nav><div class="header-actions"><button type="button" class="all-sections-toggle" data-menu-toggle data-label="Все разделы" aria-expanded="false" aria-controls="site-menu"${state.section==='all'?' data-current-section="true"':''}><svg class="menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="1.3"/></svg><span class="menu-label-desktop">Все разделы</span><span class="menu-label-mobile">Меню</span></button><a class="header-cta" href="${cta}">Обсудить проект <span aria-hidden="true">↗</span></a></div></div></header>`;
}
export function siteMenu(path){
 const state=navigationState(path),cta=contactHref(state.path);
 return `<dialog id="site-menu" class="site-menu" aria-labelledby="site-menu-title"><div class="drawer-head"><p id="site-menu-title">Все разделы</p><button type="button" class="drawer-close" data-menu-close aria-label="Закрыть меню">Закрыть <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16" stroke="currentColor" stroke-width="1.3"/></svg></button><a class="button drawer-top-cta" href="${cta}">Обсудить проект <span aria-hidden="true">↗</span></a></div><div class="drawer-scroll"><div class="drawer-mobile-intro"><nav class="drawer-primary" aria-label="Основные направления">${primaryLinks.map(item=>primaryLink(item,state)).join('')}</nav></div><nav class="drawer-groups" aria-label="Все разделы сайта">${navigationGroups.map((group,i)=>`<section class="drawer-group" aria-labelledby="drawer-group-${i}"><h2 id="drawer-group-${i}">${group.label}</h2>${group.links.map(item=>panelLink(item,state)).join('')}</section>`).join('')}</nav><div class="drawer-footer"><a class="button drawer-contact-cta" href="${cta}">Обсудить проект <span aria-hidden="true">↗</span></a><a class="drawer-phone" href="${siteContacts.phoneHref}">${siteContacts.phone}</a><a class="drawer-email" href="mailto:${escape(siteContacts.email)}">${escape(siteContacts.email)}</a></div></div></dialog>`;
}
