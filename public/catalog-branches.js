import {readFilterState,filterUrl,matchesEquipment} from './catalog-filter-model.js';

const form=document.querySelector('#catalog-filters, #line-filters');
if(form){
 const equipment=form.id==='catalog-filters';
 const keys=equipment?['q','category','material']:['group'];
 const controls=Object.fromEntries(keys.map(key=>[key,form.elements.namedItem(key)]));
 const cards=[...document.querySelectorAll(equipment?'[data-node]':'[data-line]')];
 const result=document.getElementById(equipment?'catalog-result':'line-result');
 const empty=document.getElementById('catalog-empty');
 const comparison=document.querySelector('[data-line-comparison]');
 if(keys.every(key=>controls[key])&&cards.length&&result&&(!equipment||empty)){
  const allowed=Object.fromEntries(keys.map(key=>[key,key==='q'?null:[...controls[key].options].map(option=>option.value)]));
  const enhanced=[];
  for(const key of equipment?['category']:['group']){
   const group=form.querySelector(`[data-quick-filter="${key}"]`);
   const label=form.querySelector(`[data-native-filter="${key}"]`);
   const buttons=group?[...group.querySelectorAll('button[data-filter-value]')]:[];
   // A missing or stale button group leaves the working native select visible.
   if(group&&label&&buttons.length===allowed[key].length&&new Set(buttons.map(button=>button.dataset.filterValue)).size===buttons.length&&buttons.every(button=>allowed[key].includes(button.dataset.filterValue))){
    enhanced.push({key,group,label,buttons});
   }
  }
  const apply=()=>{
   const state=Object.fromEntries(keys.map(key=>[key,controls[key].value.trim()]));
   let count=0;
   for(const card of cards){
    card.hidden=equipment?!matchesEquipment(card.dataset,state):!!state.group&&card.dataset.group!==state.group;
    if(!card.hidden)count++;
   }
   for(const {key,buttons} of enhanced)for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.filterValue===state[key]));
   result.textContent=equipment?`Найдено: ${count} из ${cards.length} узлов`:`Комплектаций: ${count}`;
   if(empty)empty.hidden=count>0;
   if(comparison)comparison.hidden=!!state.group&&state.group!=='Сепарация';
   const next=filterUrl(location.href,equipment?state:{...state,optional:''});
   if(next.href!==location.href)history.replaceState(history.state,'',next);
  };
  const restore=()=>{
   const state=readFilterState(new URL(location.href),allowed);
   for(const key of keys)controls[key].value=state[key];
   apply();
  };
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',apply);
  form.addEventListener('change',apply);
  form.addEventListener('reset',event=>{
   event.preventDefault();
   for(const key of keys)controls[key].value='';
   apply();
  });
  form.querySelector('[data-line-reset]')?.addEventListener('click',()=>{controls.group.value='';apply();});
  for(const {key,buttons} of enhanced)for(const button of buttons)button.addEventListener('click',()=>{controls[key].value=button.dataset.filterValue;apply();});
  restore();
  for(const control of form.querySelectorAll('[disabled]'))control.disabled=false;
  for(const {group,label} of enhanced){label.hidden=true;group.hidden=false;}
  form.dataset.catalogReady='true';
  window.addEventListener('pageshow',restore);
  window.addEventListener('popstate',restore);
 }
}
