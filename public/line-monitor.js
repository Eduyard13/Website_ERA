import { findCalloutPosition, readOccupancy } from './line-callout-layout.mjs';

// This controller is scoped to the full-line vector-callout block only.
for(const root of document.querySelectorAll('#line02-construction[data-diagram-mode="fit"]')){
 const pins=[...root.querySelectorAll('button[data-part]')],guides=[...root.querySelectorAll('[data-part-guide]')];
 const byCallout=new Map(pins.map(pin=>[pin.dataset.callout,pin]));
 const select=root.querySelector('[data-diagram-select]'),expand=root.querySelector('[data-diagram-fullscreen]');
 const zoom=root.querySelector('[data-diagram-zoom]'),zoomLabel=root.querySelector('[data-fullscreen-zoom]');
 const viewport=root.querySelector('[data-diagram-viewport]'),canvas=root.querySelector('.diagram-canvas'),projection=root.querySelector('.diagram-projection');
 const tooltip=root.querySelector('[data-diagram-tooltip]');
 const image=projection.querySelector('svg image');
 const viewBox=projection.querySelector('svg').viewBox.baseVal;
 const [columns,rows,encoded]=root.dataset.calloutMask.split(',');
 const occupancy=readOccupancy(Number(columns),Number(rows),encoded);
 const leaderPoints=new Map(guides.map(guide=>[
  guide.dataset.partGuide,
  [...guide.querySelectorAll('[data-line-leader]')].map(path=>path
   .getAttribute('d').split(/[ML]/).filter(point=>point.trim())
   .map(point=>point.trim().split(/\s+/).map(Number)))
 ]));
 let selected=select.value,activePin=pins.find(p=>p.dataset.part===selected),tipPin=null,pinned=false;
 let modal=null,placeholder=null,drag=null,previousOverflow='',expanded=false,fitBase=1;
 function nearestPin(number){
  const candidates=pins.filter(p=>p.dataset.part===String(number)),v=viewport.getBoundingClientRect();
  const distance=pin=>{const p=pin.getBoundingClientRect();return Math.hypot(p.left+p.width/2-v.left-v.width/2,p.top+p.height/2-v.top-v.height/2);};
  return candidates.reduce((best,pin)=>!best||distance(pin)<distance(best)?pin:best,null);
 }
 function choose(pin){
  if(!pin)return;if(tipPin&&tipPin!==pin)hideTip();
  activePin=pin;selected=pin.dataset.part;select.value=selected;root.dataset.selectedCallout=pin.dataset.callout;
  for(const p of pins)p.setAttribute('aria-pressed',String(p.dataset.part===selected));
  for(const g of guides)g.dataset.active=String(g.dataset.partGuide===selected);
  root.querySelector('[data-detail-number]').textContent=selected.padStart(2,'0');
  root.querySelector('[data-detail-label]').textContent=pin.dataset.label;
  root.querySelector('[data-detail-description]').textContent=pin.dataset.description;
 }
 function hideTip(){
  tipPin?.removeAttribute('aria-describedby');tipPin=null;pinned=false;tooltip.hidden=true;
 }
 function positionTip(){
  if(!tipPin||tooltip.hidden)return;
  const pin=tipPin.getBoundingClientRect(),v=viewport.getBoundingClientRect();
  const header=expanded?0:Math.max(0,...[...document.querySelectorAll('.site-header,[data-context-navigation]')].map(e=>e.getBoundingClientRect().bottom));
  const bounds={
   left:Math.max(8,v.left+8),
   right:Math.min(innerWidth-8,v.right-8),
   top:Math.max(8,header+8,v.top+8),
   bottom:Math.min(innerHeight-8,v.bottom-8)
  };
  const x=pin.left+pin.width/2,y=pin.top+pin.height/2;
  if(x<v.left||x>v.right||y<v.top||y>v.bottom||x<0||x>innerWidth||y<header||y>innerHeight){
   hideTip();
   return;
  }

  const scene=image.getBoundingClientRect();
  const markers=pins.map(button=>button.getBoundingClientRect());
  const leaders=leaderPoints.get(tipPin.dataset.part).map(points=>points.map(([x,y])=>[
   scene.left+x*scene.width/viewBox.width,
   scene.top+y*scene.height/viewBox.height
  ]));
  tooltip.dataset.placement='floating';
  const space=bounds.right-bounds.left;
  tooltip.style.width=Math.max(1,Math.min(300,Math.max(220,space*.52),space))+'px';
  const size=tooltip.getBoundingClientRect();
  const position=findCalloutPosition({bounds,scene,pin,size,occupancy,markers,leaders});
  if(position){
   tooltip.style.left=position.left+'px';
   tooltip.style.top=position.top+'px';
  }else{
   tooltip.dataset.placement='dock';
   for(const property of ['width','left','top'])tooltip.style.removeProperty(property);
  }
 }
 function showTip(pin,persist=false){
  if(!pin||drag)return;
  if(tipPin!==pin)hideTip();choose(pin);tipPin=pin;pinned=pinned||persist;
  tooltip.querySelector('[data-tip-label]').textContent=selected.padStart(2,'0')+' · '+pin.dataset.tooltipLabel;
  tooltip.querySelector('[data-tip-description]').textContent=pin.dataset.tooltipDescription;
  pin.setAttribute('aria-describedby',tooltip.id);tooltip.hidden=false;positionTip();
 }
 function revealPin(pin){
  if(!expanded||zoom.value==='fit'||!pin)return;
  const p=pin.getBoundingClientRect(),v=viewport.getBoundingClientRect();
  viewport.scrollBy({left:p.left+p.width/2-v.left-v.width/2,top:p.top+p.height/2-v.top-v.height/2,behavior:'instant'});
 }
 pins.forEach(pin=>{
  pin.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')showTip(pin);});
  pin.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&tipPin===pin&&!pinned&&!pin.matches(':focus-visible'))hideTip();});
  pin.addEventListener('focus',()=>{choose(pin);revealPin(pin);showTip(pin);});
  pin.addEventListener('blur',()=>{if(tipPin===pin&&!pinned)hideTip();});
  pin.addEventListener('click',()=>showTip(pin,true));
  pin.addEventListener('keydown',event=>{
   const values=[...select.options].map(o=>o.value),index=values.indexOf(selected);
   const next=['ArrowRight','ArrowDown'].includes(event.key)?(index+1)%values.length:['ArrowLeft','ArrowUp'].includes(event.key)?(index+values.length-1)%values.length:event.key==='Home'?0:event.key==='End'?values.length-1:null;
   if(next===null)return;event.preventDefault();nearestPin(values[next]).focus({preventScroll:true});
  });
 });
 for(const hit of root.querySelectorAll('[data-callout-hit]')){
  const pin=byCallout.get(hit.dataset.calloutHit);
  hit.addEventListener('pointerenter',()=>{if(!drag)choose(pin);});
  hit.addEventListener('click',()=>showTip(pin,true));
 }
 document.addEventListener('pointerdown',event=>{
  if(root.contains(event.target)&&event.target.closest('button[data-part],[data-callout-hit],[role="tooltip"]'))return;
  hideTip();
 });
 select.addEventListener('change',()=>{hideTip();choose(nearestPin(select.value));revealPin(activePin);});
 function applyZoom(){
  const scale=zoom.value==='fit'?1:zoom.value==='detail'?Math.max(1,1200/fitBase):Number(zoom.value);
  root.style.setProperty('--diagram-zoom',scale);root.dataset.zoomed=String(scale>1);
 }
 function fitWidth(){
  if(!expanded)return;
  const ratio=projection.style.aspectRatio.split('/').map(Number);
  fitBase=Math.max(1,Math.min(viewport.clientWidth,canvas.clientHeight*ratio[0]/ratio[1]));
  root.style.setProperty('--line-fit-width',fitBase+'px');applyZoom();positionTip();
 }
 function setExpanded(active){
  hideTip();expanded=active;root.dataset.expanded=String(active);zoomLabel.hidden=!active;
  expand.setAttribute('aria-pressed',String(active));expand.firstChild.textContent=active?'Закрыть схему ':'Развернуть схему ';
  zoom.value='fit';root.style.setProperty('--diagram-zoom','1');root.dataset.zoomed='false';
  viewport.scrollTop=0;viewport.scrollLeft=0;
  if(active){viewport.tabIndex=0;fitWidth();}else viewport.removeAttribute('tabindex');
 }
 function closeModal(){
  if(!modal)return;
  const current=modal;modal=null;if(current.open)current.close();
  placeholder.replaceWith(root);placeholder=null;current.remove();
  document.body.style.overflow=previousOverflow;setExpanded(false);expand.focus({preventScroll:true});
 }
 function openModal(){
  const rect=root.getBoundingClientRect();placeholder=document.createElement('div');placeholder.style.height=rect.height+'px';placeholder.setAttribute('aria-hidden','true');
  root.before(placeholder);modal=document.createElement('dialog');modal.className='line-monitor-modal';modal.setAttribute('aria-label','Интерактивная схема линии, полноэкранный просмотр');
  placeholder.after(modal);modal.append(root);previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  modal.addEventListener('cancel',event=>{event.preventDefault();closeModal();});modal.addEventListener('close',closeModal);
  modal.showModal();setExpanded(true);expand.focus({preventScroll:true});
 }
 expand.addEventListener('click',async()=>{
  if(modal){closeModal();return;}
  if(document.fullscreenElement===root){await document.exitFullscreen();return;}
  if(root.requestFullscreen&&document.fullscreenEnabled){try{await root.requestFullscreen();return;}catch{/* Use the existing accessible modal fallback. */}}
  openModal();
 });
 document.addEventListener('fullscreenchange',()=>{
  if(modal)return;const active=document.fullscreenElement===root;
  if(active||expanded){setExpanded(active);if(!active)expand.focus({preventScroll:true});}
 });
 root.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
   hideTip();if(expanded){event.preventDefault();if(modal)closeModal();else if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});}
  }
  if(expanded&&event.key==='Tab'){
   const targets=[...root.querySelectorAll('button,select,a[href],[tabindex="0"]')].filter(e=>e.getClientRects().length),first=targets[0],last=targets.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
  }
 });
 zoom.addEventListener('change',()=>{if(!expanded)return;hideTip();applyZoom();choose(nearestPin(selected));revealPin(activePin);});
 viewport.addEventListener('pointerdown',event=>{
  if(!expanded||root.dataset.zoomed!=='true'||event.pointerType!=='mouse'||event.button!==0||event.target.closest('button,[data-callout-hit]'))return;
  drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);root.dataset.diagramDragging='';hideTip();
 });
 viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}});
 const end=()=>{drag=null;delete root.dataset.diagramDragging;};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,end);
 viewport.addEventListener('scroll',positionTip,{passive:true});window.addEventListener('scroll',positionTip,{passive:true});window.addEventListener('resize',positionTip);
 new ResizeObserver(fitWidth).observe(canvas);
 window.addEventListener('pagehide',()=>{end();hideTip();closeModal();});
 root.dataset.monitorReady='true';
}
