import {contextCanGoBack,contextFallbackHref} from './context-history.js';
const panel=document.querySelector('[data-context-navigation]');
if(panel){
 document.documentElement.classList.add('has-context-navigation');
 const measure=()=>document.documentElement.style.setProperty('--context-nav-space',panel.getBoundingClientRect().height+'px');measure();new ResizeObserver(measure).observe(panel);
 const back=panel.querySelector('[data-context-back]');back.href=contextFallbackHref(back.href);
 back.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||event.currentTarget.target&&event.currentTarget.target!=='_self')return;
  if(contextCanGoBack()){event.preventDefault();history.back();}
 });
 panel.dataset.contextReady='true';
}
