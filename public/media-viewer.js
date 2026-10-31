const mediaViewer=document.querySelector('#media-viewer');
if(mediaViewer){
 const entries=[...document.querySelectorAll('[data-media]')];
 const image=mediaViewer.querySelector('#viewer-image');
 const video=mediaViewer.querySelector('#viewer-video');
 const error=mediaViewer.querySelector('#viewer-video-error');
 const videoActions=mediaViewer.querySelector('.viewer-video-actions');
 const fullscreen=mediaViewer.querySelector('[data-video-fullscreen]');
 let activeIndex=0,opener;
 const visibleEntries=()=>entries.filter(e=>!e.hidden);
 function stopVideo(){
  video.pause();
  if(video.hasAttribute('src')){
   video.removeAttribute('src');video.removeAttribute('poster');video.load();
  }
 }
 function showEntry(index,play=false){
  const items=visibleEntries();if(!items.length)return;
  activeIndex=(index+items.length)%items.length;
  const entry=items[activeIndex],isVideo=entry.dataset.type==='video';
  stopVideo();image.removeAttribute('src');error.hidden=true;
  image.hidden=isVideo;video.hidden=!isVideo;videoActions.hidden=!isVideo;
  mediaViewer.classList.toggle('is-video',isVideo);
  mediaViewer.querySelector('#viewer-title').textContent=entry.dataset.title;
  mediaViewer.querySelector('#viewer-source').textContent=entry.dataset.source;
  mediaViewer.querySelector('#viewer-product').href=entry.dataset.product;
  mediaViewer.querySelectorAll('[data-next],[data-prev]').forEach(b=>b.disabled=items.length<2);
  if(isVideo){
   video.poster=entry.dataset.poster;video.src=entry.dataset.video;
   mediaViewer.querySelector('#viewer-video-file').href=entry.dataset.video;
   fullscreen.hidden=!(video.requestFullscreen||video.webkitEnterFullscreen);
   // This is only called by an explicit click or key press. Native controls
   // remain available if a browser requires another gesture to start playback.
   if(play)video.play().catch(()=>{});
  }else{
   image.src=entry.dataset.image;image.alt=entry.dataset.title;
  }
 }
 entries.forEach(entry=>entry.querySelector('.media-open').addEventListener('click',event=>{
  event.preventDefault();opener=event.currentTarget;
  mediaViewer.showModal();showEntry(visibleEntries().indexOf(entry),true);
  document.body.classList.add('viewer-open');
  mediaViewer.querySelector('[data-close]').focus();
 }));
 mediaViewer.querySelector('[data-close]').addEventListener('click',()=>mediaViewer.close());
 mediaViewer.querySelector('[data-next]').addEventListener('click',()=>showEntry(activeIndex+1,true));
 mediaViewer.querySelector('[data-prev]').addEventListener('click',()=>showEntry(activeIndex-1,true));
 video.addEventListener('error',()=>{if(video.hasAttribute('src'))error.hidden=false;});
 fullscreen.addEventListener('click',async()=>{
  try{
   if(video.requestFullscreen)await video.requestFullscreen();
   else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
  }catch{/* Native player controls still provide the browser's supported modes. */}
 });
 mediaViewer.addEventListener('click',event=>{
  if(event.target!==mediaViewer)return;
  const r=mediaViewer.getBoundingClientRect();
  if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)mediaViewer.close();
 });
 mediaViewer.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft'].includes(event.key)||event.target.closest('video'))return;
  event.preventDefault();const direction=event.key==='ArrowRight'?1:-1;
  if(mediaViewer.classList.contains('is-video')){
   if(Number.isFinite(video.duration))video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+direction*5));
  }else showEntry(activeIndex+direction,true);
 });
 mediaViewer.addEventListener('close',()=>{
  stopVideo();image.removeAttribute('src');
  document.body.classList.remove('viewer-open');opener?.focus();
 });
}
