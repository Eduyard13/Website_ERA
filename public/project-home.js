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
 for(const video of videos){
  video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause();}));
  const button=video.parentElement.querySelector('[data-resource-play]');if(!button)continue;
  const update=()=>{const focused=document.activeElement===button;button.hidden=!video.paused||video.currentTime>0&&!video.ended;if(button.hidden&&focused)video.focus({preventScroll:true});};
  button.addEventListener('click',async()=>{try{await video.play();}catch{button.hidden=false;video.focus({preventScroll:true});}});
  for(const event of ['play','pause','ended','seeked','loadedmetadata'])video.addEventListener(event,update);
  update();
 }
})();

(() => {
 const chart=document.querySelector('[data-feedstock-chart]');
 if(!chart)return;

 const buttons=[...chart.querySelectorAll('[data-feedstock-choice]')];
 const sectors=[...chart.querySelectorAll('[data-feedstock-sector]')];
 const centers=[...chart.querySelectorAll('[data-feedstock-center]')];
 const details=[...chart.querySelectorAll('[data-feedstock-detail]')];
 const announcement=chart.querySelector('[data-feedstock-announcement]');
 let selected='all';
 let preview=null;

 function paint(id){
  chart.dataset.view=id;
  for(const button of buttons)button.toggleAttribute('data-active',button.dataset.feedstockChoice===id);
  for(const sector of sectors)sector.toggleAttribute('data-active',sector.dataset.feedstockSector===id);
  for(const center of centers)center.hidden=center.dataset.feedstockCenter!==id;
  for(const detail of details){
   const active=detail.dataset.feedstockDetail===id;
   detail.toggleAttribute('data-active',active);
   detail.setAttribute('aria-hidden',String(!active));
  }
 }

 function choose(id){
  selected=id===selected?'all':id;
  preview=null;
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.feedstockChoice===selected));
  for(const sector of sectors)sector.setAttribute('aria-pressed',String(sector.dataset.feedstockSector===selected));
  paint(selected);
  const detail=details.find(item=>item.dataset.feedstockDetail===selected);
  announcement.textContent=detail.innerText.trim();
 }

 for(const control of [...buttons,...sectors]){
  const id=control.dataset.feedstockChoice||control.dataset.feedstockSector;
  control.addEventListener('click',()=>choose(id));
  control.addEventListener('pointerenter',event=>{
   if(event.pointerType==='touch')return;
   preview=control;
   paint(id);
  });
  control.addEventListener('pointerleave',()=>{
   if(preview!==control)return;
   preview=null;
   paint(selected);
  });
 }
 for(const button of buttons)button.disabled=false;
 for(const sector of sectors){
  sector.setAttribute('tabindex','0');
  sector.removeAttribute('aria-disabled');
  sector.addEventListener('keydown',event=>{
   if(event.key!=='Enter'&&event.key!==' ')return;
   event.preventDefault();
   if(!event.repeat)choose(sector.dataset.feedstockSector);
  });
 }
 chart.dataset.feedstockReady='true';
})();

(() => {
 const map=document.querySelector('[data-market-map]');
 if(!map)return;

 const modes=[...map.querySelectorAll('[data-market-mode]')];
 const reset=map.querySelector('[data-market-reset]');
 const pickers=[...map.querySelectorAll('[data-market-picker]')];
 const selects=[...map.querySelectorAll('[data-market-select]')];
 const features=[...map.querySelectorAll('[data-market-feature]')];
 const records=[...map.querySelectorAll('[data-market-record]')];
 const zones=[...map.querySelectorAll('[data-market-zone]')];
 const recordById=new Map(records.map(record=>[record.dataset.marketRecord,record]));
 const districts=map.querySelector('[data-market-districts]');
 const regions=map.querySelector('[data-market-regions]');
 const canvas=map.querySelector('[data-market-canvas]');
 const svg=canvas.querySelector('svg');
 const tooltip=map.querySelector('[data-market-tooltip]');
 const methodology=document.getElementById('feedstock-methodology');
 let mode='districts';

 function hideTooltip(){
  tooltip.hidden=true;
 }

 function showTooltip(feature){
  if(feature.dataset.marketGroup!==mode)return;
  const record=recordById.get(feature.dataset.marketFeature);
  tooltip.querySelector('strong').textContent=record.querySelector('[data-market-name]').textContent;
  tooltip.querySelector('span').textContent=record.querySelector('[data-market-volume]').textContent;
  tooltip.hidden=false;

  const [x,y]=feature.dataset.center.split(',').map(Number);
  const svgBounds=svg.getBoundingClientRect(),canvasBounds=canvas.getBoundingClientRect();
  const view=svg.viewBox.baseVal;
  const centerX=svgBounds.left-canvasBounds.left+x*svgBounds.width/view.width;
  const centerY=svgBounds.top-canvasBounds.top+y*svgBounds.height/view.height;
  const left=Math.min(Math.max(6,centerX+13),Math.max(6,canvasBounds.width-tooltip.offsetWidth-6));
  const top=Math.min(Math.max(6,centerY-tooltip.offsetHeight-13),Math.max(6,canvasBounds.height-tooltip.offsetHeight-6));
  tooltip.style.left=left+'px';
  tooltip.style.top=top+'px';
 }

 function selectRecord(id){
  if(!recordById.has(id))return;
  for(const input of selects)input.value=input.dataset.marketSelect===mode?id:'national';
  reset.setAttribute('aria-pressed',String(id==='national'));
  for(const record of records)record.hidden=record.dataset.marketRecord!==id;
  for(const feature of features){
   const active=feature.dataset.marketGroup===mode&&feature.dataset.marketFeature===id;
   feature.setAttribute('aria-pressed',String(active));
  }
  for(const zone of zones)zone.classList.toggle('is-selected',mode==='regions'&&zone.dataset.marketZone===id);
  hideTooltip();
 }

 function selectMode(next,id='national'){
  mode=next;
  map.dataset.mode=mode;
  districts.setAttribute('aria-hidden',String(mode!=='districts'));
  regions.toggleAttribute('hidden',mode!=='regions');
  for(const button of modes)button.setAttribute('aria-pressed',String(button.dataset.marketMode===mode));
  for(const picker of pickers)picker.hidden=picker.dataset.marketPicker!==mode;
  for(const feature of features){
   const active=feature.dataset.marketGroup===mode;
   feature.setAttribute('tabindex',active?'0':'-1');
   feature.setAttribute('aria-disabled',String(!active));
  }
  selectRecord(id);
 }

 for(const button of modes){
  button.disabled=false;
  button.addEventListener('click',()=>{if(button.dataset.marketMode!==mode)selectMode(button.dataset.marketMode);});
 }
 reset.disabled=false;
 reset.addEventListener('click',()=>selectRecord('national'));
 for(const input of selects){
  input.disabled=false;
  input.addEventListener('change',()=>selectRecord(input.value));
 }
 for(const feature of features){
  const choose=()=>{if(feature.dataset.marketGroup===mode)selectRecord(feature.dataset.marketFeature);};
  feature.addEventListener('click',choose);
  feature.addEventListener('keydown',event=>{
   if(event.key==='Escape'){hideTooltip();return;}
   if(event.key!=='Enter'&&event.key!==' ')return;
   event.preventDefault();
   if(!event.repeat)choose();
  });
  feature.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')showTooltip(feature);});
  feature.addEventListener('pointerleave',hideTooltip);
  feature.addEventListener('focus',()=>{if(feature.matches(':focus-visible'))showTooltip(feature);});
  feature.addEventListener('blur',hideTooltip);
 }
 for(const link of document.querySelectorAll('[data-market-district-link]')){
  link.addEventListener('click',event=>{
   if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const id=link.dataset.marketDistrictLink;
   selectMode('districts',id);
   if(event.detail===0)requestAnimationFrame(()=>recordById.get(id).querySelector('[data-market-name]').focus({preventScroll:true}));
  });
 }
 document.querySelector('.market-method-link').addEventListener('click',event=>{
  methodology.open=true;
  if(event.detail===0)requestAnimationFrame(()=>methodology.querySelector('summary').focus({preventScroll:true}));
 });
 const showMethodology=()=>{if(location.hash==='#feedstock-methodology')methodology.open=true;};
 showMethodology();
 window.addEventListener('hashchange',showMethodology);
 window.addEventListener('resize',hideTooltip);
 selectMode('districts');
 map.dataset.marketReady='true';
})();
