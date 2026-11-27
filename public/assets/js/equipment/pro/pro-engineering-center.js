const center=document.querySelector('[data-pro-engineering-center]');
if(center)initialize(center);

function initialize(root){
 const find=selector=>root.querySelector(selector);
 const viewer=find('[data-engineering-viewer]');
 const viewport=find('[data-engineering-viewport]');
 const title=find('[data-engineering-title]');
 const count=find('[data-engineering-count]');
 const loading=find('[data-engineering-loading]');
 const error=find('[data-engineering-error]');
 const dialog=find('[data-engineering-dialog]');
 const dialogSlot=find('[data-engineering-dialog-slot]');
 const zoom=find('[data-engineering-zoom]');
 const scaleLabel=find('[data-engineering-scale]');
 const decrease=zoom.querySelector('[data-engineering-scale-by="-.5"]');
 const increase=zoom.querySelector('[data-engineering-scale-by=".5"]');
 const reset=zoom.querySelector('[data-engineering-reset]');
 const previous=find('[data-engineering-step="-1"]');
 const next=find('[data-engineering-step="1"]');
 const groups=[...root.querySelectorAll('[data-engineering-tab]')].map(tab=>{
  const panel=find('#'+tab.getAttribute('aria-controls'));
  return {tab,panel,slot:panel.querySelector('[data-engineering-slot]'),
   strip:panel.querySelector('[data-engineering-strip]'),frames:[...panel.querySelectorAll('[data-engineering-frame]')],index:0};
 });
 let group=groups[0],image=find('[data-engineering-image]'),generation=0;
 let scale=1,x=0,y=0,opener=null,previousOverflow='';
 const pointers=new Map();
 let gesture,hadPinch=false,suppressTapUntil=0;
 const pad=value=>String(value).padStart(2,'0');
 const limit=(n,min,max)=>Math.max(min,Math.min(max,n));

 function revealFrame(frame){
  const strip=group.strip;
  const item=frame.getBoundingClientRect(),bounds=strip.getBoundingClientRect();
  if(item.left<bounds.left)strip.scrollLeft+=item.left-bounds.left-2;
  if(item.right>bounds.right)strip.scrollLeft+=item.right-bounds.right+2;
 }

 function syncSelection(){
  const frame=group.frames[group.index];
  root.dataset.engineeringGroup=group.tab.dataset.engineeringTab;
  root.dataset.engineeringView=frame.dataset.engineeringFrame;
  title.textContent=frame.getAttribute('aria-label');
  count.textContent=pad(group.index+1)+' / '+pad(group.frames.length);
  previous.disabled=group.index===0;
  next.disabled=group.index===group.frames.length-1;
  group.frames.forEach(item=>{
   const active=item===frame;
   item.setAttribute('aria-pressed',String(active));
   item.tabIndex=active?0:-1;
  });
  if(!dialog.open)revealFrame(frame);
 }

 function draw(){
  const width=image.naturalWidth||Number(image.getAttribute('width'));
  const height=image.naturalHeight||Number(image.getAttribute('height'));
  const w=viewport.clientWidth,h=viewport.clientHeight;
  const fit=Math.min(w/width,h/height);
  const maxX=Math.max(0,(width*fit*scale-w)/2);
  const maxY=Math.max(0,(height*fit*scale-h)/2);
  x=limit(x,-maxX,maxX);y=limit(y,-maxY,maxY);
  image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  viewport.dataset.engineeringScaled=String(scale>1);
  scaleLabel.textContent=Math.round(scale*100)+'%';
  decrease.disabled=scale===1;increase.disabled=scale===4;reset.disabled=scale===1;
 }

 function resetZoom(){
  scale=1;x=0;y=0;draw();
 }
 function zoomAt(value,anchorX=0,anchorY=0){
  const factor=limit(value,1,4)/scale;
  x=anchorX-(anchorX-x)*factor;y=anchorY-(anchorY-y)*factor;
  scale=limit(value,1,4);draw();
 }

 function loadState(busy,failed=false){
  viewport.setAttribute('aria-busy',String(busy));
  loading.hidden=!busy;
  error.hidden=!failed;
 }
 async function loadFrame({retry=false}={}){
  const frame=group.frames[group.index];
  const {engineeringFrame,engineeringSrc,engineeringFull,engineeringSize,engineeringFullSize}=frame.dataset;
  const src=dialog.open?engineeringFull:engineeringSrc;
  const seq=++generation;
  if(!retry&&image.getAttribute('src')===src&&image.complete&&image.naturalWidth){
   loadState(false);return;
  }
  loadState(true);
  const candidate=new Image();
  const [width,height]=(dialog.open?engineeringFullSize:engineeringSize).split(' ').map(Number);
  candidate.width=width;
  candidate.height=height;
  candidate.alt=frame.getAttribute('aria-label');
  candidate.draggable=false;
  candidate.decoding='async';
  candidate.className='pec-image';
  candidate.dataset.engineeringImage='';
  candidate.dataset.engineeringLoadedView=engineeringFrame;
  candidate.src=src;
  try{
   await candidate.decode();
   if(seq!==generation)return;
   image.replaceWith(candidate);image=candidate;
   loadState(false);draw();
  }catch{
   if(seq===generation)loadState(false,true);
  }
 }

 function go(index,focus=false){
  const frame=group.frames[index];
  if(!frame)return;
  if(index!==group.index){
   group.index=index;
   resetZoom();syncSelection();loadFrame();
  }
  if(focus)frame.focus({preventScroll:true});
 }
 function activate(target,focus=false){
  if(target!==group){
   group=target;
   groups.forEach(item=>{
    const active=item===group;
    item.tab.setAttribute('aria-selected',String(active));item.tab.tabIndex=active?0:-1;item.panel.hidden=!active;
   });
   group.slot.append(viewer);
   for(const thumb of group.strip.querySelectorAll('template[data-engineering-thumb]'))thumb.replaceWith(thumb.content);
   resetZoom();syncSelection();loadFrame();
  }
  if(focus)target.tab.focus({preventScroll:true});
 }

 function openFullscreen(button){
  if(dialog.open)return;
  opener=button;previousOverflow=document.body.style.overflow;
  group.slot.style.minHeight=viewer.getBoundingClientRect().height+'px';
  dialogSlot.append(viewer);
  zoom.hidden=false;viewport.tabIndex=0;
  dialog.showModal();
  document.body.style.overflow='hidden';
  viewport.focus({preventScroll:true});
  draw();loadFrame();
 }
 function restoreFullscreen(){
  if(!opener)return;
  const button=opener;opener=null;
  pointers.clear();gesture=null;hadPinch=false;
  group.slot.append(viewer);group.slot.style.removeProperty('min-height');
  zoom.hidden=true;viewport.tabIndex=-1;
  document.body.style.overflow=previousOverflow;
  resetZoom();syncSelection();loadFrame();
  button.focus({preventScroll:true});
 }
 dialog.addEventListener('close',restoreFullscreen);
 window.addEventListener('pagehide',()=>{
  if(dialog.open){dialog.close();restoreFullscreen();}
 });

 root.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.hasAttribute('data-engineering-tab'))activate(groups.find(item=>item.tab===button));
  else if(button.hasAttribute('data-engineering-frame'))go(group.frames.indexOf(button));
  else if(button.hasAttribute('data-engineering-step'))go(group.index+Number(button.dataset.engineeringStep));
  else if(button.hasAttribute('data-engineering-open')){
   if(button.parentElement!==viewport||event.detail===0||performance.now()>suppressTapUntil)openFullscreen(button);
  }else if(button.hasAttribute('data-engineering-close'))dialog.close();
  else if(button.hasAttribute('data-engineering-scale-by'))zoomAt(scale+Number(button.dataset.engineeringScaleBy));
  else if(button.hasAttribute('data-engineering-reset'))resetZoom();
  else if(button.hasAttribute('data-engineering-retry'))loadFrame({retry:true});
 });

 function navigationKey(key,index,length,wrap){
  if(key==='Home')return 0;
  if(key==='End')return length-1;
  if(key!=='ArrowLeft'&&key!=='ArrowRight')return null;
  const position=index+(key==='ArrowRight'?1:-1);
  return wrap?(position+length)%length:limit(position,0,length-1);
 }
 root.addEventListener('keydown',event=>{
  const target=event.target;
  if(target.matches('[data-engineering-tab]')){
   const index=navigationKey(event.key,groups.findIndex(item=>item.tab===target),groups.length,true);
   if(index!==null){event.preventDefault();activate(groups[index],true);}
  }else if(target.matches('[data-engineering-frame]')){
   const index=navigationKey(event.key,group.frames.indexOf(target),group.frames.length,false);
   if(index!==null){event.preventDefault();go(index,true);}
  }else if(dialog.open&&target===viewport&&scale===1){
   const index=navigationKey(event.key,group.index,group.frames.length,false);
   if(index!==null){event.preventDefault();go(index);}
  }
  if(!dialog.open||event.key!=='Tab')return;
  const focusable=[...dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const edge=event.shiftKey?focusable[0]:focusable.at(-1);
  if(target===edge){
   event.preventDefault();
   (event.shiftKey?focusable.at(-1):focusable[0]).focus();
  }
 });

 const point=event=>({x:event.clientX,y:event.clientY});
 const middle=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function startGesture(){
  const [first,second]=pointers.values();
  if(!first){gesture=null;return;}
  const pinch=Boolean(second)&&dialog.open;
  if(pinch)hadPinch=true;
  gesture={point:pinch?middle(first,second):first,size:pinch?distance(first,second):0,scale,x,y};
 }
 viewport.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.target.closest('[data-engineering-retry]'))return;
  if(event.pointerType!=='touch'&&(!dialog.open||scale===1))return;
  if(!pointers.size)hadPinch=false;
  pointers.set(event.pointerId,point(event));
  if(dialog.open)viewport.setPointerCapture(event.pointerId);
  startGesture();
 });
 viewport.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  pointers.set(event.pointerId,point(event));
  if(!dialog.open||!gesture)return;
  const [first,second]=pointers.values();
  if(second&&gesture.size>0){
   const bounds=viewport.getBoundingClientRect();
   const cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2;
   const midpoint=middle(first,second);
   scale=limit(gesture.scale*distance(first,second)/gesture.size,1,4);
   const factor=scale/gesture.scale;
   x=midpoint.x-cx-(gesture.point.x-cx-gesture.x)*factor;
   y=midpoint.y-cy-(gesture.point.y-cy-gesture.y)*factor;
   draw();
  }else if(scale>1){
   x=gesture.x+first.x-gesture.point.x;y=gesture.y+first.y-gesture.point.y;
   draw();
  }
 });
 function endGesture(event){
  if(!pointers.delete(event.pointerId))return;
  if(event.type==='pointerup'&&event.pointerType==='touch'&&gesture&&!hadPinch&&!pointers.size&&scale===1){
   const dx=event.clientX-gesture.point.x,dy=event.clientY-gesture.point.y;
   if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){
    suppressTapUntil=performance.now()+400;
    go(group.index+(dx<0?1:-1));
   }
  }
  startGesture();
 }
 for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,endGesture);
 viewport.addEventListener('wheel',event=>{
  if(!dialog.open||!event.deltaY)return;
  event.preventDefault();
  const b=viewport.getBoundingClientRect();
  zoomAt(scale-Math.sign(event.deltaY)*.25,event.clientX-b.left-b.width/2,event.clientY-b.top-b.height/2);
 },{passive:false});

 const initialError=()=>{
  if(generation===0)loadState(false,true);
 };
 image.addEventListener('error',initialError,{once:true});
 if(image.complete&&!image.naturalWidth)initialError();
 new ResizeObserver(()=>{
  draw();
  if(!dialog.open)revealFrame(group.frames[group.index]);
 }).observe(viewport);
 syncSelection();
 root.dataset.engineeringReady='true';
}
