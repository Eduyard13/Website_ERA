import {selectGalleryItems,galleryStats,validGalleryTypes,durationLabel} from './gallery-model.js';
import {createGalleryViewer} from './gallery-viewer.js';

const root=document.querySelector('[data-gallery-showroom]');
if(root){
 const data=JSON.parse(document.getElementById('gallery-data').textContent),base=root.dataset.galleryBase.replace(/\/$/,'');
 const asset=file=>base+'/assets/'+file,route=path=>base+(path||'/');
 const normalizePath=path=>base&&path.startsWith(base+'/')?path.slice(base.length):path;
 const get=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)],form=get('#media-filters'),grid=get('[data-gallery-archive-grid]');
 let filter={type:'all',collection:'',product:'',topic:'',q:''},mode='collections',limit=24,filtered=[],renderKey='';
 const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!=null)el.textContent=text;return el;};
 function mediaCard(m){
  const article=node('article','gs-archive-card'),link=node('a'),visual=node('div','gs-archive-image'),image=node('img'),copy=node('div','gs-archive-copy');
  link.href=asset(m.file);link.dataset.galleryOpen='';link.dataset.galleryItem=m.id;link.dataset.galleryCollection=filter.collection;link.dataset.galleryScope='archive';
  image.src=asset(m.thumbnail||m.poster||m.file);image.alt=m.title;image.width=m.width;image.height=m.height;image.loading='lazy';image.decoding='async';visual.append(image);
  if(m.kind==='video'){const badge=node('span','gs-small-play'),icon=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');path.setAttribute('d','M8 4v16l13-8Z');icon.append(path);badge.append(icon);visual.append(badge,node('span','gs-duration',durationLabel(m.durationSeconds)));}
  copy.append(node('span','gs-kind',data.kinds[m.kind]),node('h3','',m.title),node('p','',m.productTitle));link.append(visual,copy);article.append(link);return article;
 }
 function renderArchive(force=false){
  filtered=selectGalleryItems(data.items,filter);const key=JSON.stringify(filter)+':'+limit;if(!force&&key===renderKey)return;renderKey=key;
  grid.replaceChildren(...filtered.slice(0,limit).map(mediaCard));
  const stats=galleryStats(filtered),parts=[['photo','Фото'],['video','Видео'],['scheme','Схемы'],['visualization','Визуализации'],['frame','Кадры']].filter(([kind])=>stats[kind]).map(([kind,label])=>label+': '+stats[kind]);
  get('#media-result').textContent=`Найдено: ${filtered.length} из ${data.items.length}${parts.length?' · '+parts.join(' · '):''}`;
  get('#media-empty').hidden=filtered.length>0;get('[data-gallery-load-more]').hidden=limit>=filtered.length;
  get('[data-gallery-load-more]').textContent=`Показать ещё · осталось ${Math.max(0,filtered.length-limit)}`;
  all('[data-gallery-type]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.galleryType===filter.type)));
 }
 const viewer=createGalleryViewer({data,asset,route,archiveItems:()=>filtered});
 function setOptionValue(select,value){
  if(value&&![...select.options].some(option=>option.value===value)){const option=document.createElement('option');option.value=value;option.textContent='Не найдено: '+value.slice(0,80);select.append(option);}
  select.value=value;
 }
 function showMode(){
  root.dataset.galleryMode=mode;all('[data-gallery-editorial]').forEach(section=>section.hidden=mode==='all');get('#gallery-results').hidden=mode!=='all';
  all('[data-gallery-mode-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.galleryModeButton===mode)));
 }
 function writeFilters(push=false){
  const url=new URL(location.href),values={view:mode,type:filter.type==='all'?'':filter.type,category:filter.collection,product:filter.product?route(filter.product):'',topic:filter.topic,q:filter.q};
  for(const [key,value] of Object.entries(values))if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
  history[push?'pushState':'replaceState']({...history.state,galleryViewer:false,galleryLimit:limit},'',url);
 }
 function readLocation(){
  const params=new URLSearchParams(location.search),type=params.get('type');
  const nextFilter={type:validGalleryTypes.includes(type)?type:'all',collection:params.get('category')||'',product:normalizePath(params.get('product')||''),topic:params.get('topic')||'',q:(params.get('q')||'').slice(0,200)};
  if(JSON.stringify(nextFilter)!==JSON.stringify(filter))limit=24;filter=nextFilter;
  if(Number.isFinite(history.state?.galleryLimit))limit=Math.max(24,Math.min(data.items.length,history.state.galleryLimit));
  mode=params.get('view')==='all'?'all':params.get('view')==='collections'?'collections':['type','product','topic','q','category'].some(key=>params.has(key))?'all':'collections';
  for(const key of ['q','topic'])form.elements[key].value=filter[key];
  setOptionValue(form.elements.collection,filter.collection);setOptionValue(form.elements.product,filter.product?route(filter.product):'');setOptionValue(form.elements.topic,filter.topic);
  showMode();renderArchive();viewer.restore();
 }
 root.addEventListener('click',event=>{
  const opener=event.target.closest('[data-gallery-open]');
  if(opener&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();viewer.open({item:opener.dataset.galleryItem,collection:opener.dataset.galleryCollection,album:opener.dataset.galleryAlbum,scope:opener.dataset.galleryScope},{element:opener});return;}
  const modeButton=event.target.closest('[data-gallery-mode-button]');
  if(modeButton){mode=modeButton.dataset.galleryModeButton;showMode();renderArchive();writeFilters(true);if(mode==='all')get('#gallery-results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  const type=event.target.closest('[data-gallery-type]');if(type){filter.type=type.dataset.galleryType;limit=24;renderArchive();writeFilters(true);}
  const sectionLink=event.target.closest('[data-gallery-section-link]');if(sectionLink){mode='collections';showMode();writeFilters(false);}
 });
 form.addEventListener('submit',event=>event.preventDefault());
 const updateFilters=event=>{filter={...filter,q:form.elements.q.value.slice(0,200),collection:form.elements.collection.value,product:normalizePath(form.elements.product.value),topic:form.elements.topic.value};limit=24;renderArchive();writeFilters(event.type==='change');};
 form.addEventListener('input',event=>{if(event.target.name==='q')updateFilters(event);});form.addEventListener('change',updateFilters);
 form.addEventListener('reset',()=>setTimeout(()=>{filter={type:'all',collection:'',product:'',topic:'',q:''};limit=24;renderArchive();writeFilters(true);},0));
 get('[data-gallery-load-more]').addEventListener('click',()=>{limit+=24;renderArchive();history.replaceState({...history.state,galleryLimit:limit},'',location.href);});
 const videoCategory=get('[data-gallery-video-category]'),videoProduct=get('[data-gallery-video-product]');
 function filterVideos(){
  let count=0;all('[data-gallery-video-card]').forEach(card=>{const item=data.items.find(m=>m.id===card.dataset.galleryVideoCard);card.hidden=!!videoCategory.value&&item.videoCategory!==videoCategory.value||!!videoProduct.value&&!item.albumIds.includes(videoProduct.value);if(!card.hidden)count++;});get('[data-gallery-video-empty]').hidden=count>0;
 }
 videoCategory.addEventListener('change',filterVideos);videoProduct.addEventListener('change',filterVideos);get('[data-gallery-video-reset]').addEventListener('click',()=>{videoCategory.value='';videoProduct.value='';filterVideos();});
 addEventListener('popstate',readLocation);addEventListener('pageshow',event=>{if(event.persisted)readLocation();});readLocation();root.dataset.galleryReady='true';
}
