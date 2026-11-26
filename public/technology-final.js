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
 function reveal(id){
  const target=document.getElementById(id);
  if(!target||!page.contains(target))return null;
  let opened=false;
  for(let details=target.closest('details');details;details=details.parentElement?.closest('details')){
   if(!details.open){details.open=true;opened=true;}
  }
  return opened?target:null;
 }

 function restoreHash(){
  let id;
  try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=reveal(id);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 }

 page.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  try{reveal(decodeURIComponent(link.hash.slice(1)));}catch{/* Ignore malformed fragments. */}
 });
 addEventListener('hashchange',restoreHash);
 addEventListener('pageshow',restoreHash);
 restoreHash();
}
