(()=>{
 const root=document.querySelector('[data-resource-home]');if(!root)return;
 // Historical bookmarks retain their original subject after the economics move.
 const financial=new Set(['market','market-title','economics','economics-title','econ-month-title','econ-tonne-title','econ-curve-title','econ-volume','econ-volume-number','econ-capacity']);
 const technical=new Set(['raw-title','raw-cleaning-title','solution-title','output-title','control-title','launch-title','detail-title','dry-separation','hot-washing','granulation','granule-quality','material-balance','contaminants']);
 function restoreAnchor(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=(financial.has(id)||id.startsWith('econ-')||id.startsWith('market-'))?root.querySelector('[data-economics-page]'):technical.has(id)?root.querySelector('a[href$="/technology#raw-material"]'):null;
  if(!target)return;
  const url=new URL(target.href);url.hash=id;url.search=location.search;location.replace(url);
 }
 restoreAnchor();addEventListener('hashchange',restoreAnchor);addEventListener('pageshow',restoreAnchor);
 const videos=[...root.querySelectorAll('video')];
 for(const video of videos)video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause();}));
})();
