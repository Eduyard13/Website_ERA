for(const root of document.querySelectorAll('[data-diagram]')){
 const pins=[...root.querySelectorAll('[data-part]')],guides=[...root.querySelectorAll('[data-part-guide]')];
 const selector=root.querySelector('[data-diagram-select]'),tooltip=root.querySelector('[data-diagram-tooltip]'),canvas=root.querySelector('.diagram-canvas');
 const viewButtons=[...root.querySelectorAll('[data-view-switch]')],fullscreen=root.querySelector('[data-diagram-fullscreen]');
 let selected=root.querySelector('[data-part][aria-pressed=true]'),suppressHover=false,focusDriven=false;
 function hideTip(){tooltip.hidden=true;}
 function switchView(view){
  root.dataset.view=view;root.querySelectorAll('[data-diagram-view]').forEach(node=>node.dataset.current=String(node.dataset.diagramView===view));viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewSwitch===view)));
 }
 function choose(pin){
  selected=pin;switchView(pin.dataset.view);selector.value=pin.dataset.part;
  pins.forEach(p=>p.setAttribute('aria-pressed',String(p===pin)));
  guides.forEach(g=>g.dataset.active=String(g.dataset.partGuide===pin.dataset.part));
  root.querySelector('[data-detail-number]').textContent=pin.dataset.part.padStart(2,'0');
  root.querySelector('[data-detail-label]').textContent=pin.dataset.label;
  root.querySelector('[data-detail-description]').textContent=pin.dataset.description;
 }
 function showTip(pin){
  root.querySelector('[data-tip-number]').textContent=pin.dataset.part;
  root.querySelector('[data-tip-label]').textContent=pin.dataset.label;tooltip.hidden=false;
  const p=pin.getBoundingClientRect(),c=canvas.getBoundingClientRect(),t=tooltip.getBoundingClientRect();
  const left=Math.max(8,Math.min(c.width-t.width-8,p.left-c.left+p.width/2-t.width/2));
  const above=p.top-c.top-t.height-8,top=above>=4?above:p.bottom-c.top+8;
  tooltip.style.left=left+'px';tooltip.style.top=top+'px';
 }
 pins.forEach(pin=>{
  pin.addEventListener('pointerenter',()=>{if(!suppressHover&&!focusDriven){choose(pin);showTip(pin);}});
  pin.addEventListener('pointerleave',()=>{if(!focusDriven)hideTip();});
  pin.addEventListener('focus',()=>{suppressHover=false;focusDriven=true;choose(pin);showTip(pin);});
  pin.addEventListener('blur',()=>{focusDriven=false;hideTip();});
  pin.addEventListener('click',()=>{suppressHover=false;focusDriven=false;choose(pin);showTip(pin);});
 });
 guides.forEach(g=>{
  g.addEventListener('pointerenter',()=>{if(suppressHover||focusDriven)return;const pin=pins.find(p=>p.dataset.part===g.dataset.partGuide);choose(pin);showTip(pin);});
  g.addEventListener('pointerleave',()=>{if(!focusDriven)hideTip();});
 });
 viewButtons.forEach(button=>button.addEventListener('click',()=>{
  suppressHover=false;focusDriven=false;switchView(button.dataset.viewSwitch);hideTip();
  const pin=pins.find(p=>p.dataset.view===button.dataset.viewSwitch&&p===selected)||pins.find(p=>p.dataset.view===button.dataset.viewSwitch);
  choose(pin);
 }));
 selector.addEventListener('change',()=>{suppressHover=false;focusDriven=false;const pin=pins.find(p=>p.dataset.part===selector.value);choose(pin);showTip(pin);});
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('[data-part]'))hideTip();});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){suppressHover=true;hideTip();}});
 root.addEventListener('pointermove',event=>{
  if((suppressHover||focusDriven)&&(event.movementX||event.movementY)){
   suppressHover=false;focusDriven=false;const pin=event.target.closest('[data-part]');
   if(pin){choose(pin);showTip(pin);}
  }
 });
 window.addEventListener('resize',hideTip);
 fullscreen.hidden=!root.requestFullscreen;
 fullscreen.addEventListener('click',async()=>{
  hideTip();try{if(document.fullscreenElement===root)await document.exitFullscreen();else await root.requestFullscreen();}catch{}
 });
 document.addEventListener('fullscreenchange',()=>{
  const active=document.fullscreenElement===root;fullscreen.setAttribute('aria-pressed',String(active));
  fullscreen.firstChild.textContent=active?'Свернуть схему ':'Развернуть схему ';hideTip();
 });
}
