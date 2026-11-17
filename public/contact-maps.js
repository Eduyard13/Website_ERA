(()=>{
'use strict';
const root=document.querySelector('.contact-premium-page');
if(!root)return;
// This opt-in details exists only on the full contacts page. request.js remains shared.
const optional=root.querySelector('[data-contact-optional]');
const revealTopic=()=>{if(optional?.querySelector('[data-request-topic]')?.value.trim())optional.open=true;};
revealTopic();
root.addEventListener('click',event=>{if(event.target.closest('[data-project-request]'))queueMicrotask(revealTopic);});
const copy=root.querySelector('[data-copy-address]'),status=root.querySelector('[data-copy-status]'),address=root.querySelector('address [lang=en]');
if(copy&&address){
 copy.hidden=false;
 copy.addEventListener('click',async()=>{
  try{
   if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
   await navigator.clipboard.writeText(address.textContent);
   status.textContent='Адрес скопирован.';
  }catch{
   const range=document.createRange();range.selectNodeContents(address);
   const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
   status.textContent='Адрес выделен. Скопируйте его вручную.';
  }
 });
}
const map=root.querySelector('[data-contact-maps]');
if(!map)return;
const buttons=[...map.querySelectorAll('[data-map-select]')],panels=[...map.querySelectorAll('[data-map-panel]')];
const storageKey='era-contact-map-provider';
const allowedEmbed=value=>{
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&((url.hostname==='www.google.com'&&url.pathname==='/maps/embed')||(url.hostname==='yandex.com'&&url.pathname==='/map-widget/v1/'&&url.searchParams.has('pt')))?url.href:null;}catch{return null;}
};
function showUnavailable(panel){
 panel.querySelectorAll('iframe').forEach(frame=>frame.remove());
 panel.querySelector('.cp-map-message').hidden=false;
 panel.querySelector('[data-map-status]').textContent='Карта недоступна в этом браузере. Откройте её в картографическом сервисе.';
}
function mount(panel){
 const src=allowedEmbed(panel.dataset.mapEmbed);
 if(!src)return;
 let frame=panel.querySelector('iframe');
 if(frame&&frame.src!==src){frame.remove();frame=null;}
 if(!frame){
  frame=document.createElement('iframe');frame.src=src;
  frame.title=panel.dataset.mapLabel+' — производственная площадка ЭРА · BEIER Machinery';
  frame.width='100%';frame.height='340';frame.loading='lazy';frame.referrerPolicy='no-referrer-when-downgrade';
  panel.querySelector('[data-map-stage]').append(frame);
 }
 if(!frame.dataset.mapBound){
  frame.dataset.mapBound='true';frame.addEventListener('error',()=>showUnavailable(panel),{once:true});
 }
 panel.querySelector('.cp-map-message').hidden=true;
 // A load event cannot establish that a cross-origin map rendered.
}
function select(provider,{remember=false}={}){
 if(!panels.some(panel=>panel.dataset.mapPanel===provider))return;
 for(const panel of panels){
  panel.hidden=panel.dataset.mapPanel!==provider;
  if(panel.hidden)panel.querySelectorAll('iframe').forEach(frame=>frame.remove());
  else mount(panel);
 }
 buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mapSelect===provider)));
 if(remember)try{localStorage.setItem(storageKey,provider);}catch{}
}
for(const button of buttons)button.addEventListener('click',()=>select(button.dataset.mapSelect,{remember:true}));
map.querySelector('[data-map-switch]').hidden=false;
let preferred='google';try{preferred=localStorage.getItem(storageKey)||preferred;}catch{}
select(buttons.some(button=>button.dataset.mapSelect===preferred)?preferred:'google');
})();
