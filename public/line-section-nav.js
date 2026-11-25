(()=>{
 const sections=document.querySelector('[data-line-section-nav]');
 const progress=document.querySelector('.page-progress-rail');
 if(!sections||!progress)return;
 const links=new Map([...sections.querySelectorAll('a')].map(link=>[link.hash,link]));
 const breadcrumbs=sections.parentElement.querySelector('.context-crumbs');
 breadcrumbs.scrollLeft=breadcrumbs.scrollWidth;
 let current;
 function syncSection(){
  const next=links.get(progress.querySelector('[aria-current="location"]')?.hash);
  if(next===current)return;
  current?.removeAttribute('aria-current');
  current=next;
  if(!current)return;
  current.setAttribute('aria-current','location');
  const link=current.getBoundingClientRect(),row=sections.getBoundingClientRect();
  if(link.left<row.left)sections.scrollLeft+=link.left-row.left;
  else if(link.right>row.right)sections.scrollLeft+=link.right-row.right;
 }
 // The page outline already follows scroll position and layout changes.
 new MutationObserver(syncSection).observe(progress,{attributes:true,attributeFilter:['data-active-section']});
 syncSection();
})();
