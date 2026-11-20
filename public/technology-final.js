import {calculateMaterialBalance} from './material-balance-model.js';

const page=document.querySelector('[data-technology-final]');

if(page){
 const balance=page.querySelector('[data-technology-balance]');
 const choices=[...balance.querySelectorAll('[data-tf-scenario]')];
 const polymer=balance.querySelector('[data-tf-polymer]');
 const inclusions=balance.querySelector('[data-tf-inclusions]');
 const bar=balance.querySelector('.tf-balance-bar');
 const format=new Intl.NumberFormat('ru-RU');
 for(const button of choices){
  button.disabled=false;
  button.addEventListener('click',()=>{
   const result=calculateMaterialBalance(button.dataset.tfScenario);
   for(const choice of choices)choice.setAttribute('aria-pressed',String(choice===button));
   polymer.textContent=format.format(result.polymer);
   inclusions.textContent=format.format(result.inclusions);
   bar.style.setProperty('--polymer',100-result.contamination+'%');
  });
 }
 if('IntersectionObserver' in window){
  const revealBlocks=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    entry.target.dataset.inView='';
    revealBlocks.unobserve(entry.target);
   }
  },{threshold:.15});
  page.querySelectorAll('[data-tf-reveal]').forEach(section=>revealBlocks.observe(section));
 }
 const outline=page.querySelector('.tf-outline');
 const track=outline.querySelector('.tf-outline-track');
 const links=[...track.querySelectorAll('a')];
 const sections=links.map(link=>document.getElementById(link.hash.slice(1)));
 let active=null;
 let scheduled=false;

 function reveal(id){
  const target=document.getElementById(id);
  if(!target||!page.contains(target))return null;
  for(let details=target.closest('details');details;details=details.parentElement?.closest('details'))details.open=true;
  return target;
 }

 function updateOutline(){
  scheduled=false;
  const boundary=parseFloat(getComputedStyle(outline).top)+outline.offsetHeight+24;
  let current=null;
  sections.forEach((section,index)=>{
   if(section.getBoundingClientRect().top<=boundary)current=links[index];
  });
  if(current===active)return;
  active?.removeAttribute('aria-current');
  active=current;
  if(!active)return;
  active.setAttribute('aria-current','location');
  const linkBox=active.getBoundingClientRect();
  const trackBox=track.getBoundingClientRect();
  if(linkBox.left<trackBox.left)track.scrollLeft+=linkBox.left-trackBox.left-10;
  if(linkBox.right>trackBox.right)track.scrollLeft+=linkBox.right-trackBox.right+10;
 }

 function scheduleOutline(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(updateOutline);
 }

 function restoreHash(behavior){
  let id;
  try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=reveal(id);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior}));
  scheduleOutline();
 }

 page.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link)return;
  try{reveal(decodeURIComponent(link.hash.slice(1)));}catch{/* Ignore malformed fragments. */}
 });
 addEventListener('hashchange',()=>restoreHash('auto'));
 addEventListener('scroll',scheduleOutline,{passive:true});
 const observer=new ResizeObserver(()=>{
  page.style.setProperty('--tf-outline-height',outline.getBoundingClientRect().height+'px');
  scheduleOutline();
 });
 observer.observe(outline);
 observer.observe(page);
 restoreHash('instant');
}
