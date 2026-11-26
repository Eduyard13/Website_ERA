/* Native links and disclosures work without JS. */
function connectSectionNav(nav,progress){
 const track=nav.querySelector('.ka-outline-track');
 const links=new Map([...track.querySelectorAll('a')].map(link=>[link.hash,link]));
 let current;
 function revealActive(){
  if(!current)return;
  const link=current.getBoundingClientRect(),row=track.getBoundingClientRect();
  if(link.left<row.left)track.scrollLeft+=link.left-row.left;
  else if(link.right>row.right)track.scrollLeft+=link.right-row.right;
 }
 function syncSection(){
  const hash=progress.querySelector('[aria-current="location"]')?.hash;
  const next=links.get(hash==='#kair-contact'?'#kair-project':hash);
  if(next===current)return;
  current?.removeAttribute('aria-current');
  current=next;
  current?.setAttribute('aria-current','location');
  revealActive();
 }
 // The side rail supplies the active section for both navigation controls.
 new MutationObserver(syncSection).observe(progress,{attributes:true,attributeFilter:['data-active-section']});
 if('ResizeObserver' in window)new ResizeObserver(revealActive).observe(track);
 syncSection();
}

const root=document.querySelector('[data-kair-system]');
if(root){
 const nav=root.querySelector('[data-kair-section-nav]');
 const progress=document.querySelector('.page-progress-rail');
 if(progress)connectSectionNav(nav,progress);
 else document.addEventListener('DOMContentLoaded',()=>{
  const rail=document.querySelector('.page-progress-rail');
  if(rail)connectSectionNav(nav,rail);
 },{once:true});

 const panelTabs=new Map();
 for(const group of root.querySelectorAll('[data-kair-tabs]')){
  const list=group.querySelector('[role=tablist]');
  if(!list)continue;
  const tabs=[...list.querySelectorAll(':scope > [data-ka-tab]')];
  const pairs=tabs.flatMap(tab=>{
   const panel=document.getElementById(tab.getAttribute('aria-controls'));
   return panel&&group.contains(panel)?[{tab,panel}]:[];
  });
  if(!pairs.length)continue;
  const pager=group.querySelector(':scope > [data-ka-pager]');
  const dots=pager?.querySelectorAll('.ka-pager-dots i')??[];
  const count=pager?.querySelector('[data-ka-count]');
  let current=Math.max(0,pairs.findIndex(({tab})=>tab.getAttribute('aria-selected')==='true'));

  function select(index,focus=false){
   current=(index+pairs.length)%pairs.length;
   pairs.forEach(({tab,panel},i)=>{
    const active=i===current;
    tab.setAttribute('aria-selected',String(active));
    tab.tabIndex=active?0:-1;
    panel.hidden=!active;
    panel.removeAttribute('data-ka-inactive');
   });
   dots.forEach((dot,i)=>{
    dot.toggleAttribute('data-current',i===current);
    if(i===current)dot.setAttribute('data-viewed','');
   });
   if(count)count.textContent=`${current+1} из ${pairs.length}`;
   const {tab}=pairs[current];
   if(tab.dataset.kaDirection)group.dataset.direction=tab.dataset.kaDirection;
   if(focus)tab.focus({preventScroll:true});
  }

  pairs.forEach(({tab,panel},i)=>{
   panelTabs.set(panel,()=>select(i));
   tab.addEventListener('click',()=>select(i));
   tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=i+1;
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=i-1;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=pairs.length-1;
    else return;
    event.preventDefault();
    select(next,true);
   });
  });
  pager?.querySelector('[data-ka-prev]')?.addEventListener('click',()=>select(current-1));
  pager?.querySelector('[data-ka-next]')?.addEventListener('click',()=>select(current+1));
  select(current);
 }

 function openLinkedPanel(){
  let id;
  try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);
  if(!target||!root.contains(target))return;
  const ancestors=[];
  for(let panel=target.closest('.ka-panel');panel;panel=panel.parentElement?.closest('.ka-panel')){
   ancestors.unshift(panel);
  }
  const hidden=ancestors.filter(panel=>panel.hidden);
  if(!hidden.length)return;
  for(const panel of hidden)panelTabs.get(panel)?.();
  requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 }
 window.addEventListener('hashchange',openLinkedPanel);
 window.addEventListener('pageshow',openLinkedPanel);
 openLinkedPanel();

 const graph=root.querySelector('[data-ka-graph]');
 if(graph&&'IntersectionObserver' in window){
  const observeGraph=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting)return;
   graph.dataset.inView='';
   observeGraph.disconnect();
  },{threshold:.2});
  observeGraph.observe(graph);
 }
 root.dataset.ready='true';
}
