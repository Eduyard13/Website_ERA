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
const map = root.querySelector('[data-contact-maps]');
const preferences = window.eraMapPreferences;
const panels = [...(map?.querySelectorAll('[data-map-embed]') || [])];
if (!preferences || !panels.length) return;

const switcher = map.querySelector('[data-map-switch]');
const buttons = [...map.querySelectorAll('[data-map-select]')];
function approvedSource(value){
 try {
  const url = new URL(value);
  if (url.username || url.password) return null;
  if (url.origin === 'https://www.google.com' && url.pathname === '/maps/embed') return url.href;
  if (url.origin === 'https://yandex.com' && url.pathname === '/map-widget/v1/' && url.searchParams.has('pt')) return url.href;
 } catch { /* Keep the external map links available. */ }
 return null;
}
function mount(panel){
 const src = approvedSource(panel.dataset.mapEmbed);
 if (!src || panel.querySelector('iframe')) return;
 const message = panel.querySelector('.cp-map-message');
 const frame = document.createElement('iframe');
 frame.src = src;
 frame.title = panel.dataset.mapLabel + ' — производственная площадка ЭРА · BEIER Machinery';
 frame.width = '100%';
 frame.height = '340';
 frame.loading = 'lazy';
 frame.referrerPolicy = 'no-referrer';
 frame.addEventListener('error', () => {
  if (!frame.isConnected) return;
  frame.remove();
  message.hidden = false;
  panel.querySelector('[data-map-status]').textContent = 'Карта недоступна. Откройте её по ссылке ниже.';
 }, {once:true});
 panel.querySelector('[data-map-stage]').append(frame);
 message.hidden = true;
}
function applyPreferences(){
 const {choice, provider} = preferences.read();
 const allowed = choice === 'allow';
 const selected = (allowed && panels.find(panel => panel.dataset.mapPanel === provider)) || panels[0];
 if (switcher) switcher.hidden = !allowed;
 for (const panel of panels) {
  panel.hidden = panel !== selected;
  if (allowed && panel === selected) mount(panel);
  else {
   panel.querySelector('iframe')?.remove();
   panel.querySelector('.cp-map-message').hidden = false;
  }
 }
 for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.mapSelect === selected.dataset.mapPanel));
}
for (const button of buttons) button.addEventListener('click', () => preferences.select(button.dataset.mapSelect));
window.addEventListener('era:map-preferences', applyPreferences);
applyPreferences();
})();
