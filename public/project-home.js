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
 const map=document.querySelector('[data-market-map]');
 if(!map)return;

 const modes=[...map.querySelectorAll('[data-market-mode]')];
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
  const selectedInput=selects.find(input=>input.dataset.marketSelect===mode);
  selectedInput.value=id;
  for(const record of records)record.hidden=record.dataset.marketRecord!==id;
  for(const feature of features){
   const active=feature.dataset.marketGroup===mode&&feature.dataset.marketFeature===id;
   feature.setAttribute('aria-pressed',String(active));
  }
  for(const zone of zones)zone.classList.toggle('is-selected',mode==='regions'&&zone.dataset.marketZone===id);
  hideTooltip();
 }

 function selectMode(next){
  mode=next;
  map.dataset.mode=mode;
  districts.setAttribute('aria-hidden',String(mode!=='districts'));
  regions.toggleAttribute('hidden',mode!=='regions');
  for(const button of modes)button.setAttribute('aria-pressed',String(button.dataset.marketMode===mode));
  for(const picker of pickers)picker.hidden=picker.dataset.marketPicker!==mode;
  for(const feature of features)feature.setAttribute('tabindex',feature.dataset.marketGroup===mode?'0':'-1');
  const visibleSelect=selects.find(input=>input.dataset.marketSelect===mode);
  selectRecord(visibleSelect.value);
 }

 for(const button of modes){
  button.disabled=false;
  button.addEventListener('click',()=>selectMode(button.dataset.marketMode));
 }
 for(const input of selects){
  input.disabled=false;
  input.addEventListener('change',()=>selectRecord(input.value));
 }
 for(const feature of features){
  feature.addEventListener('click',()=>selectRecord(feature.dataset.marketFeature));
  feature.addEventListener('keydown',event=>{
   if(event.key==='Escape'){hideTooltip();return;}
   if(event.key!=='Enter'&&event.key!==' ')return;
   event.preventDefault();
   selectRecord(feature.dataset.marketFeature);
  });
  feature.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')showTooltip(feature);});
  feature.addEventListener('pointerleave',hideTooltip);
  feature.addEventListener('focus',()=>showTooltip(feature));
  feature.addEventListener('blur',hideTooltip);
 }
 window.addEventListener('resize',hideTooltip);
 selectMode('districts');
 map.dataset.marketReady='true';
})();
