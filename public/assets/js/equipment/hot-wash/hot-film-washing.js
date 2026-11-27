// Specification rows select the existing monitor; the shared controller remains the owner of its state.
const page=document.querySelector('[data-hot-wash-line]');
if(page){
 const monitor=page.querySelector('[data-line-diagram="moyka-plenki"]');
 const select=monitor?.querySelector('[data-diagram-select]');
 if(select)for(const row of page.querySelectorAll('[data-hotwash-position]')){
  const button=row.querySelector('[data-hotwash-select]');
  if(!button)continue;
  row.addEventListener('click',event=>{
   if(event.target.closest('a'))return;
   select.value=button.dataset.hotwashSelect;
   select.dispatchEvent(new Event('change',{bubbles:true}));
   monitor.scrollIntoView({behavior:'instant',block:'start'});
   select.focus({preventScroll:true});
  });
 }
}
