for(const monitor of document.querySelectorAll('[data-kair]')){
 const slides=[...monitor.querySelectorAll('[data-kair-slide]')];if(!slides.length)continue;
 const viewer=monitor.querySelector('[data-kair-viewer]'),viewerImage=viewer.querySelector('[data-kair-viewer-image]'),fullscreenRoot=viewer.querySelector('.kair-viewer-shell');
 const pause=monitor.querySelector('[data-kair-pause]'),status=monitor.querySelector('[data-kair-status]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const interval=Math.max(1000,Number(monitor.dataset.interval)||8000),transition=Math.max(0,Number(monitor.dataset.transition)||600);
 let index=0,desired=0,serial=0,timer=null,changing=false,hovered=false,focused=false,inView=false,manualPause=false,opener=null,wasFullscreen=false,closing=false;
 let playing=monitor.dataset.autoplay==='true'&&slides.length>1&&!reduced.matches;
 monitor.style.setProperty('--kair-transition',transition+'ms');
 const stop=()=>{clearTimeout(timer);timer=null;};
 const canPlay=()=>playing&&!manualPause&&!hovered&&!focused&&!document.hidden&&inView&&!viewer.open;
 const schedule=()=>{stop();if(canPlay()&&!changing)timer=setTimeout(()=>select(index+1,false),interval);};
 const ready=async image=>{image.loading='eager';if(image.decode)await image.decode();else if(!image.complete)await new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});});if(!image.naturalWidth)throw new Error('Image unavailable');};
 const preloadNext=()=>{if(inView&&slides.length>1){const image=slides[(index+1)%slides.length].querySelector('img');ready(image).catch(()=>{});}};
 const originalImages=new Map();
 function original(next){
  const url=slides[next].dataset.image;
  if(!originalImages.has(url)){
   const image=new Image();image.src=url;
   originalImages.set(url,ready(image).catch(error=>{originalImages.delete(url);throw error;}));
  }
  return originalImages.get(url);
 }
 function updatePause(){
  const paused=manualPause||!playing;
  if(pause){pause.textContent=paused?'Продолжить показ':'Пауза';pause.setAttribute('aria-pressed',String(paused));}
  const note=monitor.querySelector('[data-kair-play-note]');
  if(note)note.textContent=paused?'Показ приостановлен · листайте стрелками':`Автопоказ · ${Math.round(interval/1000)} секунд на экран`;
 }
 function update(){
  monitor.querySelector('[data-kair-caption]').textContent=slides[index].dataset.title;
  const counter=monitor.querySelector('[data-kair-counter]');if(counter)counter.textContent=`${index+1} из ${slides.length}`;
  viewer.querySelector('[data-kair-viewer-title]').textContent=slides[index].dataset.title;
  viewer.querySelector('[data-kair-viewer-counter]').textContent=`${index+1} из ${slides.length}`;
  viewer.querySelector('[data-kair-original]').href=slides[index].dataset.image;
  if(viewer.open){viewerImage.src=slides[index].dataset.image;viewerImage.alt=slides[index].querySelector('img').alt;}
 }
 async function select(next,manual=true){
  next=(next+slides.length)%slides.length;desired=next;
  if(next===index){
   ++serial;stop();changing=false;if(manual)manualPause=true;
   slides.forEach((slide,i)=>{slide.hidden=i!==index;slide.dataset.current=String(i===index);slide.style.zIndex='';slide.querySelector('a').tabIndex=i===index?0:-1;});
   updatePause();schedule();return;
  }
  const token=++serial;stop();changing=true;
  if(manual)manualPause=true;
  updatePause();
  try{
   await ready(slides[next].querySelector('img'));
   if(viewer.open)await original(next);
   if(token!==serial||(!manual&&!canPlay()))return;
   const previous=slides[index],target=slides[next];
   slides.forEach(slide=>{if(slide!==previous&&slide!==target){slide.hidden=true;slide.dataset.current='false';slide.querySelector('a').tabIndex=-1;}});
   target.hidden=false;target.querySelector('a').tabIndex=0;target.style.zIndex='3';
   previous.querySelector('a').tabIndex=-1;void target.offsetWidth;
   target.dataset.current='true';previous.dataset.current='false';index=next;update();
   if(manual)status.textContent=`Экран ${index+1} из ${slides.length}: ${target.dataset.title}`;
   await new Promise(resolve=>setTimeout(resolve,reduced.matches?0:transition));
   if(token===serial){slides.forEach(slide=>{slide.hidden=slide!==target;if(slide!==target)slide.querySelector('a').tabIndex=-1;});target.style.zIndex='';}
  }catch{
   if(token===serial){manualPause=true;desired=index;status.textContent='Не удалось загрузить экран. Текущий экран остаётся открытым.';}
  }finally{
   if(token===serial){changing=false;updatePause();schedule();preloadNext();}
  }
 }
 const move=direction=>select(desired+direction);
 function pauseForInspection(){manualPause=true;stop();updatePause();}
 async function openInspection(trigger){
  pauseForInspection();opener=trigger||monitor.querySelector('[data-kair-inspect]');
  viewer.querySelector('[data-kair-viewer-error]').hidden=true;
  viewer.showModal();document.body.classList.add('kair-viewer-open');update();
  viewer.querySelector('[data-kair-close]').focus();
  // A user click is required by browsers; a viewport-size dialog is the fallback.
  if(fullscreenRoot.requestFullscreen)try{await fullscreenRoot.requestFullscreen();}catch{}
  try{await original(index);}catch{if(viewer.open)viewer.querySelector('[data-kair-viewer-error]').hidden=false;}
 }
 async function closeInspection(){
  if(closing)return;closing=true;
  try{if(document.fullscreenElement===fullscreenRoot)await document.exitFullscreen();}catch{}
  finally{if(viewer.open)viewer.close();closing=false;}
 }
 slides.forEach((slide,i)=>{
  slide.hidden=i!==0;slide.dataset.current=String(i===0);slide.querySelector('a').tabIndex=i===0?0:-1;
  slide.querySelector('a').addEventListener('click',event=>{event.preventDefault();openInspection(event.currentTarget);});
 });
 monitor.querySelector('[data-kair-inspect]').addEventListener('click',event=>openInspection(event.currentTarget));
 viewer.querySelector('[data-kair-close]').addEventListener('click',closeInspection);
 viewer.addEventListener('cancel',event=>{event.preventDefault();closeInspection();});
 viewer.addEventListener('close',()=>{
  document.body.classList.remove('kair-viewer-open');viewerImage.removeAttribute('src');
  const target=opener?.isConnected&&opener.getClientRects().length?opener:monitor.querySelector('[data-kair-inspect]');
  target.focus({preventScroll:true});schedule();
 });
 document.addEventListener('fullscreenchange',()=>{
  const full=document.fullscreenElement===fullscreenRoot;
  if(wasFullscreen&&!full&&viewer.open)closeInspection();
  wasFullscreen=full;
 });
 monitor.addEventListener('keydown',event=>{
  if(slides.length<2||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||event.target.closest('select,input,textarea'))return;
  event.preventDefault();
  if(event.key==='Home')select(0);else if(event.key==='End')select(slides.length-1);else move(event.key==='ArrowRight'?1:-1);
 });
 viewerImage.addEventListener('load',()=>{viewer.querySelector('[data-kair-viewer-error]').hidden=true;});
 if(slides.length>1){
  monitor.querySelector('[data-kair-prev]').addEventListener('click',()=>move(-1));
  monitor.querySelector('[data-kair-next]').addEventListener('click',()=>move(1));
  viewer.querySelector('[data-kair-viewer-prev]').addEventListener('click',()=>move(-1));
  viewer.querySelector('[data-kair-viewer-next]').addEventListener('click',()=>move(1));
  pause.addEventListener('click',()=>{if(!playing||manualPause){playing=true;manualPause=false;}else manualPause=true;updatePause();schedule();});
 }
 monitor.addEventListener('pointerenter',()=>{hovered=true;stop();});
 monitor.addEventListener('pointerleave',()=>{hovered=false;schedule();});
 monitor.addEventListener('focusin',()=>{focused=true;stop();});
 monitor.addEventListener('focusout',event=>{if(!monitor.contains(event.relatedTarget)){focused=false;schedule();}});
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener('change',()=>{if(reduced.matches)playing=false;updatePause();schedule();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;preloadNext();schedule();},{threshold:.25}).observe(monitor);
 else{inView=true;preloadNext();}
 update();updatePause();schedule();
}
