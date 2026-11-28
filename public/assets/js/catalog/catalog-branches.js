import {readFilterState,filterUrl} from './catalog-filter-model.js';

const nav=document.querySelector('.catalog-branch-nav');
if(nav){
 const filter=nav.querySelector('[data-quick-filter]');
 const key=filter.dataset.quickFilter;
 const equipment=key==='category';
 const cards=[...document.querySelectorAll(equipment?'[data-node]':'[data-line]')];
 const result=document.getElementById(equipment?'catalog-result':'line-result');
 const empty=document.getElementById('catalog-empty');
 const comparison=document.querySelector('[data-line-comparison]');
 const buttons=[...filter.querySelectorAll('[data-filter-value]')];
 const allowed=buttons.map(button=>button.dataset.filterValue);
 const apply=value=>{
  let count=0;
  for(const card of cards){
   card.hidden=Boolean(value)&&card.dataset[key]!==value;
   if(!card.hidden)count++;
  }
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.filterValue===value));
  const active=buttons.find(button=>button.dataset.filterValue===value);
  if(active&&filter.scrollWidth>filter.clientWidth){
   const bounds=filter.getBoundingClientRect(),selected=active.getBoundingClientRect();
   if(selected.left<bounds.left+4)filter.scrollLeft+=selected.left-bounds.left-4;
   else if(selected.right>bounds.right-4)filter.scrollLeft+=selected.right-bounds.right+4;
  }
  result.textContent=equipment?`Найдено: ${count} из ${cards.length} узлов`:`Комплектаций: ${count}`;
  if(empty)empty.hidden=count>0;
  if(comparison)comparison.hidden=Boolean(value)&&value!=='Сепарация';
  const next=filterUrl(location.href,key,value);
  if(next.href!==location.href)history.replaceState(history.state,'',next);
 };
 const restore=()=>apply(readFilterState(new URL(location.href),key,allowed));
 for(const button of buttons){
  button.disabled=false;
  button.addEventListener('click',()=>apply(button.dataset.filterValue));
 }
 const measure=()=>document.documentElement.style.setProperty('--catalog-branch-space',nav.getBoundingClientRect().height+'px');
 measure();
 new ResizeObserver(measure).observe(nav);
 restore();
 nav.dataset.catalogReady='true';
 window.addEventListener('pageshow',restore);
 window.addEventListener('popstate',restore);
}
