for(const monitor of document.querySelectorAll('[data-kair]')){
 const slides=[...monitor.querySelectorAll('[data-kair-slide]')];if(!slides.length)continue;
 let index=0,manualPause=false,hovered=false,focused=false,inView=false,timer,changing=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),pause=monitor.querySelector('[data-kair-pause]');
 let playing=monitor.dataset.autoplay==='true'&&slides.length>1&&!reduced.matches;
 const interval=Math.max(1000,Number(monitor.dataset.interval)||7000),transition=Number(monitor.dataset.transition)||800;
 monitor.style.setProperty('--kair-transition',transition+'ms');
 const stop=()=>{clearTimeout(timer);timer=null;};
 const canPlay=()=>playing&&!manualPause&&!hovered&&!focused&&!document.hidden&&inView&&!changing;
 const schedule=()=>{stop();if(canPlay())timer=setTimeout(()=>select(index+1,false),interval);};
 const ready=async image=>{if(image.complete&&image.naturalWidth)return;if(image.complete&&image.currentSrc)throw new Error('Image unavailable');await new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});});if(image.decode)await image.decode();};
 async function select(next,manual=true){
  if(changing)return;next=(next+slides.length)%slides.length;if(next===index)return;
  stop();changing=true;
  if(manual)manualPause=true;
  try{
   const target=slides[next],previous=slides[index];target.querySelector('img').loading='eager';await ready(target.querySelector('img'));
   if(!manual&&(!playing||manualPause||hovered||focused||document.hidden||!inView))return;
   previous.querySelector('a').setAttribute('tabindex','-1');
   target.hidden=false;target.style.zIndex='3';target.querySelector('a').setAttribute('tabindex','0');void target.offsetWidth;
   if(reduced.matches)target.dataset.current='true';else requestAnimationFrame(()=>target.dataset.current='true');
   await new Promise(resolve=>setTimeout(resolve,reduced.matches?0:transition));
   previous.hidden=true;previous.dataset.current='false';previous.querySelector('a').setAttribute('tabindex','-1');target.style.zIndex='';index=next;
   monitor.querySelector('[data-kair-caption]').textContent=target.dataset.title;
   const counter=monitor.querySelector('[data-kair-counter]');if(counter)counter.textContent=`${index+1} из ${slides.length}`;
   if(manual)monitor.querySelector('[data-kair-status]').textContent=`Экран ${index+1} из ${slides.length}: ${target.dataset.title}`;
  }catch{manualPause=true;if(manual)monitor.querySelector('[data-kair-status]').textContent='Не удалось загрузить экран. Текущий экран остаётся открытым.';}
  finally{changing=false;updatePause();schedule();}
 }
 function updatePause(){if(pause){pause.textContent=manualPause||!playing?'Продолжить показ':'Пауза';pause.setAttribute('aria-pressed',String(manualPause||!playing));}}
 slides.forEach((slide,i)=>{slide.hidden=i!==0;slide.dataset.current=String(i===0);slide.querySelector('a').setAttribute('tabindex',i===0?'0':'-1');});
 const pauseForInspection=()=>{manualPause=true;stop();updatePause();};
 slides.forEach(slide=>slide.querySelector('a').addEventListener('click',pauseForInspection));
 monitor.querySelector('[data-kair-inspect]').addEventListener('click',()=>{pauseForInspection();slides[index].querySelector('.media-open').click();});
 if(slides.length===1)continue;
 monitor.querySelector('[data-kair-counter]').textContent=`1 из ${slides.length}`;
 monitor.querySelector('[data-kair-prev]').addEventListener('click',()=>select(index-1));monitor.querySelector('[data-kair-next]').addEventListener('click',()=>select(index+1));
 pause.addEventListener('click',()=>{if(!playing||manualPause){playing=true;manualPause=false;}else manualPause=true;updatePause();schedule();});
 monitor.addEventListener('pointerenter',()=>{hovered=true;stop();});monitor.addEventListener('pointerleave',()=>{hovered=false;schedule();});
 monitor.addEventListener('focusin',()=>{focused=true;stop();});monitor.addEventListener('focusout',event=>{if(!monitor.contains(event.relatedTarget)){focused=false;schedule();}});
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',()=>{if(reduced.matches)playing=false;updatePause();schedule();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(monitor);else{inView=true;}
 updatePause();schedule();
}
