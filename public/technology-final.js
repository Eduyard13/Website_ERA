const page=document.querySelector('[data-technology-final]');
if(page){
 const reveal=id=>{
  const target=document.getElementById(id);
  if(!target||!page.contains(target))return null;
  for(let details=target.closest('details');details;details=details.parentElement?.closest('details'))details.open=true;
  return target;
 };
 const restoreHash=()=>{
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=reveal(id);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 };
 page.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link)return;
  try{reveal(decodeURIComponent(link.hash.slice(1)));}catch{/* Ignore malformed incoming fragments. */}
 });
 addEventListener('hashchange',restoreHash);
 restoreHash();
}
