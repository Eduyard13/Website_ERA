// Full-line fit mode is deliberately independent of the legacy pan/zoom diagrams.
for(const root of document.querySelectorAll('[data-diagram-mode="fit"]')){
 const pins=[...root.querySelectorAll('[data-part]')],regions=[...root.querySelectorAll('[data-part-guide]')];
 const select=root.querySelector('[data-diagram-select]'),expand=root.querySelector('[data-diagram-fullscreen]');
 const zoom=root.querySelector('[data-diagram-zoom]'),zoomLabel=root.querySelector('[data-fullscreen-zoom]');
 const viewport=root.querySelector('[data-diagram-viewport]'),canvas=root.querySelector('.diagram-canvas'),projection=root.querySelector('.diagram-projection');
 let selected=select.value,modal=null,placeholder=null,drag=null,previousOverflow='',expanded=false;
 function choose(number){
  const pin=pins.find(p=>p.dataset.part===String(number));if(!pin)return;
  selected=pin.dataset.part;select.value=selected;
  for(const p of pins)p.setAttribute('aria-pressed',String(p.dataset.part===selected));
  for(const r of regions)r.dataset.active=String(r.dataset.partGuide===selected);
  root.querySelector('[data-detail-number]').textContent=selected.padStart(2,'0');
  root.querySelector('[data-detail-label]').textContent=pin.dataset.label;
  root.querySelector('[data-detail-description]').textContent=pin.dataset.description;
 }
 pins.forEach(pin=>{
  pin.addEventListener('pointerenter',()=>{if(!drag)choose(pin.dataset.part);});
  pin.addEventListener('focus',()=>choose(pin.dataset.part));
  pin.addEventListener('click',()=>choose(pin.dataset.part));
  pin.addEventListener('keydown',event=>{
   const values=[...select.options].map(o=>o.value),index=values.indexOf(selected);
   const next=['ArrowRight','ArrowDown'].includes(event.key)?(index+1)%values.length:['ArrowLeft','ArrowUp'].includes(event.key)?(index+values.length-1)%values.length:event.key==='Home'?0:event.key==='End'?values.length-1:null;
   if(next===null)return;event.preventDefault();pins.find(p=>p.dataset.part===values[next]).focus({preventScroll:true});
  });
 });
 regions.forEach(region=>{
  region.addEventListener('pointerenter',()=>{if(!drag)choose(region.dataset.partGuide);});
  region.addEventListener('click',()=>{if(!drag)choose(region.dataset.partGuide);});
 });
 select.addEventListener('change',()=>choose(select.value));
 function fitWidth(){
  if(!expanded)return;
  const ratio=projection.style.aspectRatio.split('/').map(Number);
  const width=Math.max(1,Math.min(viewport.clientWidth,canvas.clientHeight*ratio[0]/ratio[1]));
  root.style.setProperty('--line-fit-width',width+'px');
 }
 function setExpanded(active){
  expanded=active;root.dataset.expanded=String(active);zoomLabel.hidden=!active;
  expand.setAttribute('aria-pressed',String(active));expand.firstChild.textContent=active?'Закрыть схему ':'Развернуть схему ';
  zoom.value='fit';root.style.setProperty('--diagram-zoom','1');root.dataset.zoomed='false';
  viewport.scrollTop=0;viewport.scrollLeft=0;
  if(active){viewport.tabIndex=0;fitWidth();}else viewport.removeAttribute('tabindex');
 }
 function closeModal(){
  if(!modal)return;
  const current=modal;modal=null;
  if(current.open)current.close();
  placeholder.replaceWith(root);placeholder=null;current.remove();
  document.body.style.overflow=previousOverflow;setExpanded(false);expand.focus({preventScroll:true});
 }
 function openModal(){
  const rect=root.getBoundingClientRect();placeholder=document.createElement('div');placeholder.style.height=rect.height+'px';placeholder.setAttribute('aria-hidden','true');
  root.before(placeholder);modal=document.createElement('dialog');modal.className='line-monitor-modal';modal.setAttribute('aria-label','Интерактивная схема линии, полноэкранный просмотр');
  placeholder.after(modal);modal.append(root);previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  modal.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
  modal.addEventListener('close',closeModal);modal.showModal();setExpanded(true);expand.focus({preventScroll:true});
 }
 expand.addEventListener('click',async()=>{
  if(modal){closeModal();return;}
  if(document.fullscreenElement===root){await document.exitFullscreen();return;}
  if(root.requestFullscreen&&document.fullscreenEnabled){try{await root.requestFullscreen();return;}catch{/* Accessible modal below. */}}
  openModal();
 });
 document.addEventListener('fullscreenchange',()=>{
  if(modal)return;const active=document.fullscreenElement===root;
  if(active||expanded){setExpanded(active);if(!active)expand.focus({preventScroll:true});}
 });
 root.addEventListener('keydown',event=>{
  if(!expanded)return;
  if(event.key==='Escape'){
   event.preventDefault();if(modal)closeModal();else if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});
  }
  if(event.key==='Tab'){
   const targets=[...root.querySelectorAll('button,select,a[href],[tabindex="0"]')].filter(e=>e.getClientRects().length),first=targets[0],last=targets.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true});}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true});}
  }
 });
 zoom.addEventListener('change',()=>{
  if(!expanded)return;const scale=zoom.value==='fit'?1:Number(zoom.value);
  root.style.setProperty('--diagram-zoom',scale);root.dataset.zoomed=String(scale>1);
  viewport.scrollTop=0;viewport.scrollLeft=0;
 });
 viewport.addEventListener('pointerdown',event=>{
  if(!expanded||root.dataset.zoomed!=='true'||event.pointerType!=='mouse'||event.button!==0||event.target.closest('button'))return;
  drag={x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(event.pointerId);root.dataset.diagramDragging='';
 });
 viewport.addEventListener('pointermove',event=>{if(drag){viewport.scrollLeft=drag.left+drag.x-event.clientX;viewport.scrollTop=drag.top+drag.y-event.clientY;}});
 const end=()=>{drag=null;delete root.dataset.diagramDragging;};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,end);
 new ResizeObserver(fitWidth).observe(canvas);
 window.addEventListener('pagehide',()=>{end();closeModal();});
 root.dataset.monitorReady='true';
}
