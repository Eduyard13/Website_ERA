import {selectGalleryItems,findGalleryItem,durationLabel,thumbnailWindow} from './gallery-model.js';

export function createGalleryViewer({data,asset,route,archiveItems}){
 const dialog=document.getElementById('gallery-viewer');
 const get=s=>dialog.querySelector(s),image=get('[data-gallery-viewer-image]'),video=get('[data-gallery-viewer-video]');
 const category=get('[data-gallery-viewer-collection]'),album=get('[data-gallery-viewer-album]'),format=get('[data-gallery-viewer-format]');
 const error=get('[data-gallery-viewer-error]'),play=get('[data-gallery-play]'),slide=get('[data-gallery-slideshow]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const svg=(path,viewBox='0 0 24 24')=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg'),shape=document.createElementNS('http://www.w3.org/2000/svg','path');icon.setAttribute('viewBox',viewBox);icon.setAttribute('aria-hidden','true');shape.setAttribute('d',path);icon.append(shape);return icon;};
 let context={collection:'',album:'',format:'all',scope:'collection'},items=[],active=0,timer=null,opener=null,savedItem='',touch=null,owned=false;
 const text=(selector,value)=>get(selector).textContent=value;
 const isPhoto=item=>['photo','frame'].includes(item?.kind);
 function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}
 function stopSlideshow(){if(timer)clearInterval(timer);timer=null;slide.setAttribute('aria-pressed','false');slide.textContent='Слайд-шоу';}
 function stopVideo(){
  video.pause();if(video.hasAttribute('src')){video.removeAttribute('src');video.removeAttribute('poster');video.load();}
 }
 const baseItems=()=>context.scope==='archive'?archiveItems():data.items;
 function populateSelectors(){
  const base=baseItems();category.replaceChildren();option(category,'','Все коллекции');
  data.collections.filter(c=>data.items.some(m=>m.collections.includes(c.id))).forEach(c=>option(category,c.id,c.label));
  category.value=context.collection;if(category.selectedIndex<0){context.collection='';category.value='';}
  const inCategory=selectGalleryItems(base,{collection:context.collection});
  album.replaceChildren();option(album,'','Вся коллекция');
  const categoryOptions=selectGalleryItems(data.items,{collection:context.collection});
  data.albums.filter(a=>categoryOptions.some(m=>m.albumIds.includes(a.id))).forEach(a=>option(album,a.id,a.title));
  album.value=context.album;if(album.selectedIndex<0){context.album='';album.value='';}
  const inAlbum=selectGalleryItems(inCategory,{album:context.album});
  format.replaceChildren();option(format,'all','Всё');
  for(const [value,label] of [['photo','Фото'],['video','Видео'],['scheme','Схемы / визуализации'],['frame','Кадры из видео']])if(selectGalleryItems(inAlbum,{type:value}).length)option(format,value,label);
  format.value=context.format;if(format.selectedIndex<0){context.format='all';format.value='all';}
  items=selectGalleryItems(inAlbum,{type:context.format});
 }
 function writeLocation(push=false){
  const url=new URL(location.href),values={collection:context.collection,album:context.album,format:context.format==='all'?'':context.format,scope:context.scope==='archive'?'archive':'',item:items[active]?.id||''};
  for(const [key,value] of Object.entries(values))if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
  const state={...history.state,galleryViewer:owned||push};history[push?'pushState':'replaceState'](state,'',url);if(push)owned=true;
 }
 function updateThumbnails(){
  const strip=get('[data-gallery-filmstrip]'),fragment=document.createDocumentFragment(),window=thumbnailWindow(items.length,active);
  if(window.start){const note=document.createElement('span');note.className='gs-strip-note';note.textContent=`1…${window.start}`;fragment.append(note);}
  items.slice(window.start,window.end).forEach((m,offset)=>{
   const index=window.start+offset,button=document.createElement('button'),thumb=document.createElement('img');
   button.type='button';button.dataset.galleryThumbnail=String(index);button.setAttribute('aria-label',`${index+1}. ${m.title}${m.kind==='video'?', видео':''}`);button.setAttribute('aria-current',String(index===active));
   thumb.src=asset(m.thumbnail||m.poster||m.file);thumb.alt='';thumb.width=100;thumb.height=68;thumb.loading='lazy';thumb.decoding='async';button.append(thumb);
   if(m.kind==='video'){const badge=document.createElement('span');badge.className='gs-strip-video';badge.append(svg('M8 4v16l13-8Z'),document.createTextNode(durationLabel(m.durationSeconds)));button.append(badge);}
   button.addEventListener('click',()=>{stopSlideshow();show(index);writeLocation();});fragment.append(button);
  });
  if(window.end<items.length){const note=document.createElement('span');note.className='gs-strip-note';note.textContent=`${window.end+1}…${items.length}`;fragment.append(note);}
  strip.replaceChildren(fragment);
  requestAnimationFrame(()=>strip.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'}));
 }
 function show(index=0){
  stopVideo();image.removeAttribute('src');image.hidden=true;video.hidden=true;play.hidden=true;error.hidden=true;
  active=items.length?(index+items.length)%items.length:0;
  const m=items[active],selectedAlbum=data.albums.find(a=>a.id===context.album),selectedCategory=data.collections.find(c=>c.id===context.collection);
  const name=selectedAlbum?.title||selectedCategory?.label||(context.scope==='archive'?'Выбранные материалы':'Все коллекции');
  text('[data-gallery-viewer-name]',name);text('[data-gallery-viewer-counter]',items.length?`${String(active+1).padStart(2,'0')} / ${items.length}`:'0 / 0');
  get('[data-gallery-prev]').disabled=items.length<2;get('[data-gallery-next]').disabled=items.length<2;
  get('[data-gallery-video-actions]').hidden=true;
  if(!m){
   text('#gallery-viewer-title','Материалы не найдены');text('[data-gallery-viewer-kind]','');text('[data-gallery-viewer-description]','Выберите другую коллекцию, альбом или формат.');get('[data-gallery-viewer-description]').hidden=false;text('[data-gallery-viewer-owner]','');text('[data-gallery-viewer-source]','');get('[data-gallery-viewer-product]').hidden=true;slide.disabled=true;updateThumbnails();return;
  }
  const isVideo=m.kind==='video';dialog.dataset.kind=m.kind;
  text('#gallery-viewer-title',m.title);text('[data-gallery-viewer-kind]',data.kinds[m.kind]+(isVideo?' · '+durationLabel(m.durationSeconds):''));
  text('[data-gallery-viewer-description]',m.description);get('[data-gallery-viewer-description]').hidden=!m.description||m.description===m.title;text('[data-gallery-viewer-owner]',selectedAlbum?.title||m.productTitle);text('[data-gallery-viewer-source]',m.source);
  const link=get('[data-gallery-viewer-product]'),path=selectedAlbum?.path||m.productPath;link.hidden=!path;link.href=route(path||'/catalog');
  link.textContent=path?.startsWith('/catalog/equipment/')?'Подробнее об оборудовании':path?.startsWith('/catalog/lines/')?'Посмотреть линию':path==='/'?'О проекте':'Подробнее о технологии';
  const arrow=svg('M3 13 13 3M3 3h10v10','0 0 16 16');arrow.classList.add('arrow');arrow.firstChild.setAttribute('fill','none');arrow.firstChild.setAttribute('stroke','currentColor');arrow.firstChild.setAttribute('stroke-width','1.4');link.append(arrow);
  if(isVideo){
   video.hidden=false;video.poster=asset(m.poster);video.src=asset(m.file);play.hidden=false;get('[data-gallery-video-actions]').hidden=false;
   get('[data-gallery-video-file]').href=asset(m.file);get('[data-gallery-fullscreen]').hidden=!(video.requestFullscreen||video.webkitEnterFullscreen);stopSlideshow();
  }else{image.hidden=false;image.src=asset(m.file);image.alt=m.title;image.width=m.width;image.height=m.height;image.style.maxWidth=m.width+'px';image.style.maxHeight=m.height+'px';}
  slide.disabled=!isPhoto(m)||items.filter(isPhoto).length<2||reduced.matches;slide.title=reduced.matches?'Автопросмотр отключён настройкой уменьшенного движения':'';
  text('[data-gallery-viewer-status]',`${name}. ${active+1} из ${items.length}. ${m.title}. ${data.kinds[m.kind]}.`);updateThumbnails();
 }
 function navigate(direction,manual=true){
  if(manual)stopSlideshow();if(items.length<2)return;
  show(active+direction);writeLocation();if(!isPhoto(items[active]))stopSlideshow();
 }
 function open(value={}, {push=true,element=null}={}){
  stopSlideshow();context={collection:value.collection||'',album:value.album||'',format:value.format||'all',scope:value.scope==='archive'?'archive':'collection'};
  if(element){opener=element;savedItem=value.item||'';}
  populateSelectors();const found=findGalleryItem(items,value.item);const index=found?items.indexOf(found):0;
  if(!dialog.open){dialog.showModal();document.body.classList.add('viewer-open');get('[data-gallery-close]').focus();}
  show(index);if(value.item&&!found){error.hidden=false;error.textContent='Этот материал недоступен в выбранной подборке. Вы можете выбрать другую коллекцию или просмотреть доступные кадры.';}if(push)writeLocation(true);
 }
 function restoreFocus(){
  let target=opener;
  if(!target?.isConnected||!target.getClientRects().length)target=[...document.querySelectorAll('[data-gallery-open]')].find(e=>e.dataset.galleryItem===savedItem&&e.getClientRects().length);
  (target||document.querySelector('[data-gallery-mode-button]'))?.focus({preventScroll:true});
 }
 function closeUI(){
  stopSlideshow();stopVideo();image.removeAttribute('src');image.hidden=true;
  if(dialog.open)dialog.close();document.body.classList.remove('viewer-open');restoreFocus();
 }
 function close(){
  if(!dialog.open)return;const goBack=owned&&history.state?.galleryViewer;closeUI();owned=false;
  if(goBack){history.back();return;}
  const url=new URL(location.href);['collection','album','item','format','scope'].forEach(key=>url.searchParams.delete(key));history.replaceState({...history.state,galleryViewer:false},'',url);
 }
 function restore(){
  const params=new URLSearchParams(location.search);
  if(params.has('item')||params.has('album')||params.has('collection')){
   owned=!!history.state?.galleryViewer;
   const value=Object.fromEntries(['collection','album','item','format','scope'].map(key=>[key,params.get(key)||'']));
   if(value.album&&!value.collection)value.collection=data.albums.find(a=>a.id===value.album)?.collection||'';
   open(value,{push:false});
  }else if(dialog.open){owned=false;closeUI();}
 }
 get('[data-gallery-close]').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('close',()=>{stopSlideshow();stopVideo();document.body.classList.remove('viewer-open');});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();});
 get('[data-gallery-next]').addEventListener('click',()=>navigate(1));get('[data-gallery-prev]').addEventListener('click',()=>navigate(-1));
 dialog.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest('video,input,select,textarea'))return;e.preventDefault();navigate(e.key==='ArrowRight'?1:-1);});
 [category,album,format].forEach(select=>select.addEventListener('change',()=>{
  stopSlideshow();context={...context,collection:category.value,album:album.value,format:format.value,scope:select===format?context.scope:'collection'};populateSelectors();show(0);writeLocation();
 }));
 slide.addEventListener('click',()=>{
  if(timer){stopSlideshow();return;}if(slide.disabled)return;
  slide.setAttribute('aria-pressed','true');slide.textContent='Пауза';timer=setInterval(()=>navigate(1,false),5000);
 });
 get('[data-gallery-viewer-details]').addEventListener('toggle',e=>{if(e.target.open)stopSlideshow();});
 get('[data-gallery-viewer-details] summary').addEventListener('click',stopSlideshow);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSlideshow();});reduced.addEventListener('change',()=>{if(reduced.matches)stopSlideshow();slide.disabled=reduced.matches||!isPhoto(items[active])||items.filter(isPhoto).length<2;});
 image.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.isPrimary){touch={x:e.clientX,y:e.clientY};image.setPointerCapture?.(e.pointerId);}});
 image.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;touch=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)navigate(dx<0?1:-1);});image.addEventListener('pointercancel',()=>touch=null);
 // A browser may suppress the compatibility click immediately after a swipe.
 // Handle stationary button taps once; native video controls and strip drags stay native.
 let buttonTouch=null;
 dialog.addEventListener('touchstart',e=>{const point=e.touches[0],button=e.target.closest('button');buttonTouch=e.touches.length===1&&button&&!button.disabled?{button,x:point.clientX,y:point.clientY}:null;},{passive:true});
 dialog.addEventListener('touchend',e=>{
  const start=buttonTouch,point=e.changedTouches[0];buttonTouch=null;
  if(!start||!point||start.button.disabled||Math.hypot(point.clientX-start.x,point.clientY-start.y)>12)return;
  e.preventDefault();start.button.click();
 },{passive:false});
 dialog.addEventListener('touchcancel',()=>buttonTouch=null,{passive:true});
 image.addEventListener('error',()=>{if(image.hasAttribute('src')){error.hidden=false;error.textContent='Изображение не загрузилось. Выберите другой материал или проверьте соединение.';stopSlideshow();}});
 video.addEventListener('error',()=>{if(video.hasAttribute('src')){error.hidden=false;error.textContent='Не удалось воспроизвести видео. Его можно открыть отдельным файлом по ссылке.';}});
 play.addEventListener('click',()=>video.play().catch(()=>{error.hidden=false;error.textContent='Нажмите воспроизведение в плеере или откройте видео отдельно.';}));
 video.addEventListener('play',()=>{play.hidden=true;stopSlideshow();});video.addEventListener('pause',()=>play.hidden=video.hidden||!video.hasAttribute('src'));video.addEventListener('ended',()=>play.hidden=false);
 get('[data-gallery-fullscreen]').addEventListener('click',async()=>{try{if(video.requestFullscreen)await video.requestFullscreen();else video.webkitEnterFullscreen?.();}catch{error.hidden=false;error.textContent='Полноэкранный режим доступен также в стандартных кнопках видеоплеера.';}});
 addEventListener('pagehide',()=>{stopSlideshow();stopVideo();});
 return {open,restore,close,isOpen:()=>dialog.open};
}
