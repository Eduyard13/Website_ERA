const page=document.querySelector('[data-technology-final]');

if(page){
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

 function restoreHash(){
  let id;
  try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=reveal(id);
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
  scheduleOutline();
 }

 page.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');
  if(!link)return;
  try{reveal(decodeURIComponent(link.hash.slice(1)));}catch{/* Ignore malformed fragments. */}
 });
 addEventListener('hashchange',restoreHash);
 addEventListener('scroll',scheduleOutline,{passive:true});
 const observer=new ResizeObserver(()=>{
  page.style.setProperty('--tf-outline-height',outline.getBoundingClientRect().height+'px');
  scheduleOutline();
 });
 observer.observe(outline);
 observer.observe(page);
 restoreHash();
}
