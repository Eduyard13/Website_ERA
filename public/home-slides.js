(()=>{
 'use strict';
 const root=document.querySelector('[data-resource-home]');
 const panels=[...(root?.querySelectorAll('[data-home-block]')||[])];
 if(panels.length!==8){document.documentElement.removeAttribute('data-home-view');return;}
 const html=document.documentElement,header=document.querySelector('.site-header'),footer=document.querySelector('.site-footer')||document.querySelector('footer');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(min-width:1000px) and (pointer:fine)');
 const labels=['Ресурс','Сырьё','Обработка','Продукты','Практика','Экономика','Интеграция','Ваш проект'];
 const fragments=panels.map(panel=>panel.id==='economics'?'resource-business-title':panel.id);
 let mode=new URLSearchParams(location.search).get('view')==='scroll'?'scroll':'slides';
 let active=0,moving=false,destination=0,unlockTimer,animationTimer,frame=0;
 let lastWheel=0,gestureTaken=false,wheelAmount=0;
 const rail=document.createElement('nav');rail.className='home-slide-rail';rail.setAttribute('aria-label','Разделы страницы');
 rail.innerHTML=panels.map((panel,i)=>`<a href="#${fragments[i]}" data-slide-to="${i}" aria-label="${i+1}. ${labels[i]}"><span class="home-slide-mark" aria-hidden="true"></span><span class="home-slide-tooltip" aria-hidden="true">${String(i+1).padStart(2,'0')} / ${labels[i]}</span></a>`).join('');
 const tools=document.createElement('div');tools.className='home-slide-tools';tools.setAttribute('role','group');tools.setAttribute('aria-label','Просмотр страницы');
 tools.innerHTML='<button type="button" data-slide-prev aria-label="Предыдущий раздел">↑</button><output data-slide-counter aria-live="polite" aria-atomic="true"></output><button type="button" data-slide-next aria-label="Следующий раздел">↓</button><button type="button" data-slide-mode></button>';
 document.body.append(rail,tools);
 const links=[...rail.querySelectorAll('a')],previous=tools.querySelector('[data-slide-prev]'),next=tools.querySelector('[data-slide-next]'),counter=tools.querySelector('[data-slide-counter]'),toggle=tools.querySelector('[data-slide-mode]');
 const headerHeight=()=>header?.getBoundingClientRect().height||0;
 const targetY=element=>Math.max(0,Math.round(element.getBoundingClientRect().top+scrollY-headerHeight()));
 const blocked=()=>!!document.querySelector('dialog[open]')||!!document.fullscreenElement;
 const atFooter=()=>{const rect=footer?.getBoundingClientRect();return !!rect&&rect.top<innerHeight-30&&rect.bottom<=innerHeight+3;};
 function paint(){
  links.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  const value=String(active+1).padStart(2,'0')+' / 08';
  if(counter.textContent!==value){counter.textContent=value;counter.setAttribute('aria-label',`${labels[active]}, раздел ${active+1} из 8`);}
  previous.disabled=active===0;next.setAttribute('aria-label',active===7?'К разделам сайта':'Следующий раздел');
  rail.dataset.tone=[0,7].includes(active)?'dark':'light';
  const inStory=root.getBoundingClientRect().bottom>headerHeight()+15&&!atFooter();
  tools.hidden=!inStory;
  rail.hidden=mode!=='slides'||!inStory;
  previous.hidden=next.hidden=counter.hidden=mode!=='slides'||!inStory;
  toggle.textContent=mode==='slides'?'Прокрутка':'Слайды';toggle.setAttribute('aria-label',mode==='slides'?'Включить обычную прокрутку':'Включить просмотр слайдами');
  tools.dataset.view=mode;root.dataset.activeSlide=String(active+1);
 }
 function sync(){
  frame=0;
  if(!moving){let index=0;for(let i=0;i<panels.length;i++)if(panels[i].getBoundingClientRect().top<=headerHeight()+10)index=i;active=index;}
  paint();
 }
 const queue=()=>{if(!frame)frame=requestAnimationFrame(sync);};
 function settle(){moving=false;clearTimeout(unlockTimer);sync();}
 function jump(index,{hash=false}={}){
  if(blocked())return;
  const element=index>=panels.length?footer:panels[Math.max(0,index)];if(!element)return;
  destination=Math.max(0,Math.min(7,index));active=destination;moving=true;
  panels.forEach(panel=>panel.classList.remove('home-slide-enter'));
  if(index<8&&!reduced.matches){element.classList.add('home-slide-enter');clearTimeout(animationTimer);animationTimer=setTimeout(()=>element.classList.remove('home-slide-enter'),800);}
  if(hash&&index<8){const url=new URL(location.href);url.hash=fragments[index];history.pushState(null,'',url);}
  paint();scrollTo({top:targetY(element),behavior:reduced.matches?'instant':'smooth'});
  clearTimeout(unlockTimer);unlockTimer=setTimeout(settle,reduced.matches?30:1000);
 }
 function setMode(value){
  const anchor=panels[active],offset=anchor.getBoundingClientRect().top;
  mode=value;html.dataset.homeView=mode;moving=false;gestureTaken=false;wheelAmount=0;
  const url=new URL(location.href);url.searchParams.set('view',mode);history.replaceState(null,'',url);
  scrollBy({top:anchor.getBoundingClientRect().top-offset,behavior:'instant'});
  if(mode==='slides')scrollTo({top:targetY(anchor),behavior:'instant'});
  sync();
 }
 toggle.addEventListener('click',()=>setMode(mode==='slides'?'scroll':'slides'));
 links.forEach((link,i)=>link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();jump(i,{hash:true});}));
 previous.addEventListener('click',()=>jump((moving?destination:active)-1));
 next.addEventListener('click',()=>jump((moving?destination:active)+1));
 // Use native touch scrolling and native overflow for long panels. On a fine
 // pointer, consume one complete wheel/trackpad gesture at a panel boundary.
 function wheel(event){
  if(mode!=='slides'||!fine.matches||blocked()||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
  if(event.target.closest?.('input,textarea,select,video,[contenteditable="true"]'))return;
  if(root.getBoundingClientRect().bottom<=headerHeight()+15||atFooter())return;
  const now=performance.now();if(now-lastWheel>300){gestureTaken=false;wheelAmount=0;}lastWheel=now;
  if(moving||gestureTaken){event.preventDefault();return;}
  sync();const panel=panels[active],direction=Math.sign(event.deltaY);
  for(let node=event.target;node&&node!==panel&&node instanceof Element;node=node.parentElement){
   const style=getComputedStyle(node);
   if(/auto|scroll/.test(style.overflowY)&&node.scrollHeight>node.clientHeight+3&&((direction>0&&node.scrollTop+node.clientHeight<node.scrollHeight-3)||(direction<0&&node.scrollTop>3)))return;
  }
  const rect=panel.getBoundingClientRect();
  if(direction>0&&rect.bottom>innerHeight+8)return;
  if(direction<0&&rect.top<headerHeight()-8)return;
  if(direction<0&&active===0)return;
  event.preventDefault();wheelAmount+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if(Math.abs(wheelAmount)<24)return;
  gestureTaken=true;wheelAmount=0;jump(active+direction);
 }
 addEventListener('wheel',wheel,{passive:false});
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);addEventListener('hashchange',queue);addEventListener('popstate',queue);addEventListener('pageshow',queue);
 addEventListener('scrollend',()=>{if(moving)settle();else queue();});
 html.dataset.homeView=mode;sync();
})();
