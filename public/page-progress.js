(()=>{
 'use strict';
 const main=document.querySelector('main');if(!main)return;
 const header=document.querySelector('.site-header'),footer=document.querySelector('footer');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const homeLabels={hero:'Ресурс',problem:'Сырьё',process:'Обработка',products:'Продукты',evidence:'Практика',business:'Экономика',integration:'Интеграция',contact:'Ваш проект'};
 const rail=document.createElement('nav');rail.className='page-progress-rail';rail.setAttribute('aria-label','Разделы страницы');rail.hidden=true;
 document.body.append(rail);
 let entries=[],links=[],frame=0;
 const clean=text=>text?.replace(/\s+/g,' ').trim()||'';
 const visible=element=>!element.closest('[hidden],[aria-hidden="true"],dialog,details:not([open])')&&element.getClientRects().length>0;
 const headerHeight=()=>header?.getBoundingClientRect().height||0;
 function labelFor(element){
  const home=homeLabels[element.dataset.homeBlock];if(home)return home;
  const label=element.getAttribute('data-page-progress-label')||element.getAttribute('aria-label');if(label)return clean(label);
  if(element.querySelector('#line-filters'))return 'Выбор комплектации';
  if(element.matches('.catalog-section')||element.querySelector('#catalog-filters'))return 'Каталог узлов';
  if(element.matches('.gallery-section'))return 'Фото и видео';
  if(element.matches('.documents-section'))return 'Документы оборудования';
  if(element.matches('.web-after-economics'))return 'Расчёт под ваше сырьё';
  const heading=element.querySelector(element.matches('[data-econ-widget]')?'h3':'h1,h2');
  const eyebrow=[...element.querySelectorAll('.eyebrow')].find(node=>node.closest('section,article')===element);
  if(heading?.matches('h1'))return clean(heading.innerText);
  if(eyebrow)return clean(eyebrow.textContent).replace(/^\d+\s*[\/→]\s*/,'');
  if(heading&&heading.closest('section,article')===element)return clean(heading.innerText);
  return clean(element.querySelector('a[data-project-request],.button,caption,h1,h2')?.textContent)||clean(element.textContent).slice(0,100)||'Содержание страницы';
 }
 function fragmentFor(element,index){
  // The historical homepage #economics bookmark opens the calculations page.
  if(main.querySelector('[data-resource-home]')&&element.id==='economics')return 'resource-business-title';
  if(!element.id){let id='page-section-'+(index+1);while(document.getElementById(id))id+='-block';element.id=id;}
  return element.id;
 }
 function collect(){
  const sections=[...main.querySelectorAll('section')].filter(element=>!element.parentElement.closest('section')&&visible(element));
  const elements=sections.flatMap(section=>[section,...section.querySelectorAll('[data-econ-widget]')].filter(visible));
  if(!elements.length)elements.push(main);
  if(entries.length===elements.length&&elements.every((element,index)=>entries[index].element===element))return;
  entries=elements.map((element,index)=>({element,fragment:fragmentFor(element,index),label:labelFor(element)}));
  const repeats=new Map();entries.forEach(({label})=>repeats.set(label,(repeats.get(label)||0)+1));
  entries.forEach(entry=>{
   if(repeats.get(entry.label)>1){const heading=entry.element.querySelector('h1,h2,h3');if(heading)entry.label=clean(heading.innerText);}
  });
  rail.replaceChildren(...entries.map(({fragment,label},index)=>{
   const link=document.createElement('a');link.href='#'+fragment;link.dataset.pageSection=String(index+1);link.setAttribute('aria-label',`${index+1}. ${label}`);
   const mark=document.createElement('span');mark.className='page-progress-mark';mark.setAttribute('aria-hidden','true');
   const tooltip=document.createElement('span');tooltip.className='page-progress-tooltip';tooltip.setAttribute('aria-hidden','true');tooltip.textContent=String(index+1).padStart(2,'0')+' / '+label;
   link.append(mark,tooltip);link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    event.preventDefault();const url=new URL(location.href);url.hash=fragment;history.pushState(null,'',url);goTo(entries[index].element);
   });return link;
  }));
  links=[...rail.querySelectorAll('a')];rail.dataset.sectionCount=String(entries.length);
  entries.forEach(({element})=>resize?.observe(element));
 }
 function goTo(element){
  const top=element.getBoundingClientRect().top+scrollY-headerHeight()-16;
  scrollTo({top:Math.max(0,top),behavior:reduced.matches?'instant':'smooth'});
 }
 function toneFor(element){
  for(let node=element;node instanceof Element;node=node.parentElement){
   const rgba=getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
   if(rgba?.length>=3&&(rgba[3]??1)>.7)return rgba[0]*.2126+rgba[1]*.7152+rgba[2]*.0722<125?'dark':'light';
  }return 'light';
 }
 function update(){
  frame=0;collect();
  const head=headerHeight(),probe=head+Math.min(180,(innerHeight-head)*.25);
  let active=0;entries.forEach(({element},index)=>{if(element.getBoundingClientRect().top<=probe)active=index;});
  links.forEach((link,index)=>{if(index===active){if(!link.hasAttribute('aria-current'))link.setAttribute('aria-current','location');}else link.removeAttribute('aria-current');});
  const bounds=main.getBoundingClientRect();
  rail.hidden=!!document.fullscreenElement||bounds.bottom<=head+16;
  rail.dataset.activeSection=String(active+1);rail.dataset.tone=toneFor(footer&&bounds.bottom<(head+innerHeight)/2?footer:entries[active].element);
  rail.style.setProperty('--progress-step',Math.max(10,Math.min(innerWidth<768?28:36,(innerHeight-head-36)/entries.length))+'px');
 }
 function queue(){if(!frame)frame=requestAnimationFrame(update);}
 const resize='ResizeObserver' in window?new ResizeObserver(queue):null;
 resize?.observe(main);if(header)resize?.observe(header);
 // New content sections and visibility changes update the outline; card lists,
 // graphs and individual values do not add navigation stops.
 new MutationObserver(records=>{
  if(records.some(record=>record.type==='attributes'||[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&(node.matches('section,[data-econ-widget]')||node.querySelector('section,[data-econ-widget]')))))queue();
 }).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','aria-hidden','open']});
 function restoreGeneratedAnchor(){
  queue();if(location.hash.startsWith('#page-section-'))requestAnimationFrame(()=>{const entry=entries.find(item=>'#'+item.fragment===location.hash);if(entry)goTo(entry.element);});
 }
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);addEventListener('fullscreenchange',queue);
 addEventListener('hashchange',restoreGeneratedAnchor);addEventListener('popstate',restoreGeneratedAnchor);addEventListener('pageshow',restoreGeneratedAnchor);
 update();restoreGeneratedAnchor();
})();
