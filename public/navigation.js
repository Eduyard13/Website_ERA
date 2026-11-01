(()=>{
'use strict';
const menu=document.querySelector('#site-menu');
const toggle=document.querySelector('[data-menu-toggle]');
const siteHeader=document.querySelector('.site-header');
if(siteHeader){const measure=()=>document.documentElement.style.setProperty('--site-header-space',siteHeader.getBoundingClientRect().height+'px');measure();if('ResizeObserver' in window)new ResizeObserver(measure).observe(siteHeader);}
if(menu&&toggle){
 const header=document.querySelector('.site-header');
 const align=()=>{const r=header.getBoundingClientRect();menu.style.setProperty('--drawer-top',Math.max(0,r.bottom)+'px');menu.style.setProperty('--drawer-mobile-top',Math.max(0,r.top)+'px');};
 function open(){
  if(menu.open)return;
  align();document.body.style.setProperty('--menu-scroll-gap',Math.max(0,innerWidth-document.documentElement.clientWidth)+'px');document.body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true');
  menu.showModal();menu.querySelector('[data-menu-close]').focus({preventScroll:true});
 }
 function restore(){document.body.classList.remove('menu-open');document.body.style.removeProperty('--menu-scroll-gap');toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});}
 function close(){if(menu.open){menu.close();restore();}}
 toggle.addEventListener('click',()=>menu.open?close():open());
 menu.querySelector('[data-menu-close]').addEventListener('click',close);
 menu.addEventListener('cancel',event=>{event.preventDefault();close();});
 menu.addEventListener('close',()=>{if(!menu.open)restore();});
 const outside=event=>{const r=menu.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;};
 let startedOutside=false;
 menu.addEventListener('pointerdown',event=>{startedOutside=event.target===menu&&outside(event);});
 menu.addEventListener('click',event=>{
  if(startedOutside&&event.target===menu&&outside(event))close();
  if(event.target.closest('a[href]'))close();
  startedOutside=false;
 });
 menu.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const links=[...menu.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')].filter(e=>e.getClientRects().length);
  const first=links[0],last=links.at(-1),active=document.activeElement;
  if(event.shiftKey&&(active===first||!menu.contains(active))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(active===last||!menu.contains(active))){event.preventDefault();first.focus();}
 });
 // Keep the modal cycle inside the panel even when the browser would focus its toolbar.
 window.addEventListener('pageshow',()=>{if(menu.open)close();else{document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');}});
 window.addEventListener('resize',()=>{if(menu.open)align();});
}
})();
