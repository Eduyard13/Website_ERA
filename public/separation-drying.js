const root=document.querySelector('#line03-construction');
if(root){
 const select=root.querySelector('[data-diagram-select]');
 for(const button of document.querySelectorAll('[data-separation03-select]'))button.addEventListener('click',()=>{
  select.value=button.dataset.separation03Select;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#composition').scrollIntoView({block:'start',behavior:'instant'});
  select.focus({preventScroll:true});
 });
}
