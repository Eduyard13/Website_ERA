for(const root of document.querySelectorAll('[data-diagram]')){
 const pins=[...root.querySelectorAll('[data-part]')],guides=[...root.querySelectorAll('[data-part-guide]')];
 const selector=root.querySelector('[data-diagram-select]'),tooltip=root.querySelector('[data-diagram-tooltip]'),canvas=root.querySelector('.diagram-canvas');
 const viewButtons=[...root.querySelectorAll('[data-view-switch]')],fullscreen=root.querySelector('[data-diagram-fullscreen]');
 const isLine=root.hasAttribute('data-line-diagram'),viewport=root.querySelector('[data-diagram-viewport]');
 let selected=root.querySelector('[data-part][aria-pressed=true]'),suppressHover=false,focusDriven=false;
 function hideTip(){tooltip.hidden=true;}
 function switchView(view){
  root.dataset.view=view;root.querySelectorAll('[data-diagram-view]').forEach(node=>node.dataset.current=String(node.dataset.diagramView===view));viewButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.viewSwitch===view)));
 }
 function revealPin(pin){
  if(!viewport)return;
  const p=pin.getBoundingClientRect(),v=viewport.getBoundingClientRect();
  if(p.left>=v.left+4&&p.right<=v.right-4&&p.top>=v.top+4&&p.bottom<=v.bottom-4)return;
  viewport.scrollBy({left:p.left-v.left-(v.width-p.width)/2,top:p.top-v.top-(v.height-p.height)/2,behavior:'instant'});
 }
 function choose(pin,reveal=false){
  selected=pin;switchView(pin.dataset.view);selector.value=pin.dataset.part;
  pins.forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.part===pin.dataset.part)));
  guides.forEach(g=>g.dataset.active=String(g.dataset.partGuide===pin.dataset.part));
  root.querySelector('[data-detail-number]').textContent=pin.dataset.part.padStart(2,'0');
  root.querySelector('[data-detail-label]').textContent=pin.dataset.label;
  root.querySelector('[data-detail-description]').textContent=pin.dataset.description;
  if(reveal)revealPin(pin);
 }
 function showTip(pin){
  root.querySelector('[data-tip-number]').textContent=pin.dataset.part;
  root.querySelector('[data-tip-label]').textContent=pin.dataset.label;tooltip.hidden=false;
  const description=root.querySelector('[data-tip-description]');if(description)description.textContent=pin.dataset.description;
  const p=pin.getBoundingClientRect(),c=canvas.getBoundingClientRect(),t=tooltip.getBoundingClientRect();
  let left=Math.max(8,Math.min(c.width-t.width-8,p.left-c.left+p.width/2-t.width/2));
  const above=p.top-c.top-t.height-8,desiredTop=above>=4?above:p.bottom-c.top+8;
  let top=isLine?Math.max(6,Math.min(c.height-t.height-6,desiredTop)):desiredTop;
  if(isLine){
   const regions=[...root.querySelectorAll(`[data-part-guide="${pin.dataset.part}"] .diagram-part-region`)].map(e=>e.getBoundingClientRect()).map(r=>({left:Math.max(0,r.left-c.left),right:Math.min(c.width,r.right-c.left),top:Math.max(0,r.top-c.top),bottom:Math.min(c.height,r.bottom-c.top)})).filter(r=>r.right>r.left&&r.bottom>r.top);
   const centreX=p.left-c.left+p.width/2,centreY=p.top-c.top+p.height/2;
   const candidates=[[left,top],[centreX-t.width/2,centreY-t.height-24],[centreX-t.width/2,centreY+24],...regions.flatMap(r=>[[r.left-t.width-12,centreY-t.height/2],[r.right+12,centreY-t.height/2],[centreX-t.width/2,r.top-t.height-12],[centreX-t.width/2,r.bottom+12]])];
   const ranked=candidates.map(([x,y])=>{
    x=Math.max(8,Math.min(c.width-t.width-8,x));y=Math.max(6,Math.min(c.height-t.height-6,y));
    const overlap=regions.reduce((sum,r)=>sum+Math.max(0,Math.min(x+t.width,r.right)-Math.max(x,r.left))*Math.max(0,Math.min(y+t.height,r.bottom)-Math.max(y,r.top)),0);
    return {x,y,score:overlap*100+Math.hypot(x+t.width/2-centreX,y+t.height/2-centreY)};
   }).sort((a,b)=>a.score-b.score);
   left=ranked[0].x;top=ranked[0].y;
  }
  tooltip.style.left=left+'px';tooltip.style.top=top+'px';
 }
 pins.forEach(pin=>{
  pin.addEventListener('pointerenter',()=>{if(!suppressHover&&!focusDriven&&!root.hasAttribute('data-diagram-dragging')){choose(pin);showTip(pin);}});
  pin.addEventListener('pointerleave',()=>{if(!focusDriven)hideTip();});
  pin.addEventListener('focus',()=>{suppressHover=false;focusDriven=true;choose(pin,isLine);showTip(pin);});
  pin.addEventListener('blur',()=>{focusDriven=false;hideTip();});
  pin.addEventListener('click',()=>{suppressHover=false;focusDriven=false;choose(pin);showTip(pin);});
 });
 guides.forEach(g=>{
  g.addEventListener('pointerenter',()=>{if(suppressHover||focusDriven||root.hasAttribute('data-diagram-dragging'))return;const pin=pins.find(p=>p.dataset.part===g.dataset.partGuide);choose(pin);showTip(pin);});
  g.addEventListener('pointerleave',()=>{if(!focusDriven)hideTip();});
 });
 viewButtons.forEach(button=>button.addEventListener('click',()=>{
  suppressHover=false;focusDriven=false;switchView(button.dataset.viewSwitch);hideTip();
  const pin=pins.find(p=>p.dataset.view===button.dataset.viewSwitch&&p===selected)||pins.find(p=>p.dataset.view===button.dataset.viewSwitch);
  choose(pin);
 }));
 selector.addEventListener('change',()=>{suppressHover=false;focusDriven=false;const pin=pins.find(p=>p.dataset.part===selector.value);choose(pin,isLine);showTip(pin);});
 document.addEventListener('pointerdown',event=>{if(!root.contains(event.target)||!event.target.closest('[data-part]'))hideTip();});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'){suppressHover=true;hideTip();}});
 if(isLine){
  root.addEventListener('keydown',event=>{
   if(!event.target.closest('[data-part]'))return;
   const numbers=[...selector.options].map(option=>option.value),index=numbers.indexOf(selected.dataset.part);
   const next=event.key==='ArrowRight'||event.key==='ArrowDown'?(index+1)%numbers.length:event.key==='ArrowLeft'||event.key==='ArrowUp'?(index+numbers.length-1)%numbers.length:event.key==='Home'?0:event.key==='End'?numbers.length-1:null;
   if(next==null)return;event.preventDefault();pins.find(pin=>pin.dataset.part===numbers[next]).focus({preventScroll:true});
  });
  root.querySelector('[data-diagram-zoom]').addEventListener('change',event=>{
   root.style.setProperty('--diagram-zoom',event.target.value);revealPin(selected);showTip(selected);
  });
  let drag=null;
  viewport.addEventListener('pointerdown',event=>{
   if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button'))return;
   drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);hideTip();root.setAttribute('data-diagram-dragging','');
  });
  viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}});
  const endDrag=()=>{drag=null;root.removeAttribute('data-diagram-dragging');};
  viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
  viewport.addEventListener('scroll',()=>{
   if(tooltip.hidden)return;const p=selected.getBoundingClientRect(),v=viewport.getBoundingClientRect();
   if(p.right<v.left||p.left>v.right||p.bottom<v.top||p.top>v.bottom)hideTip();else showTip(selected);
  });
  requestAnimationFrame(()=>revealPin(selected));
 }
 root.addEventListener('pointermove',event=>{
  if((suppressHover||focusDriven)&&(event.movementX||event.movementY)){
   suppressHover=false;focusDriven=false;const pin=event.target.closest('[data-part]');
   if(pin){choose(pin);showTip(pin);}
  }
 });
 window.addEventListener('resize',()=>{
  if(isLine)requestAnimationFrame(()=>{revealPin(selected);if(!tooltip.hidden)showTip(selected);});else hideTip();
 });
 fullscreen.hidden=!root.requestFullscreen;
 fullscreen.addEventListener('click',async()=>{
  hideTip();try{if(document.fullscreenElement===root)await document.exitFullscreen();else await root.requestFullscreen();}catch{}
 });
 document.addEventListener('fullscreenchange',()=>{
  const active=document.fullscreenElement===root;fullscreen.setAttribute('aria-pressed',String(active));
  fullscreen.firstChild.textContent=active?'Свернуть схему ':'Развернуть схему ';
  if(isLine)requestAnimationFrame(()=>{revealPin(selected);if(!tooltip.hidden)showTip(selected);});else hideTip();
 });
}
