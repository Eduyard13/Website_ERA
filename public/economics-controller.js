import {economicsConfig as config} from './economics-config.js';
import {initialEconomicsState,normalizeEconomicsState,changeEconomicsSelection,calculateEconomics} from './economics-model.js';
import {renderMonth,renderBridge,renderCurve,renderPriceNote,renderPricePresets,tonnes,millions,percentage,resultSummary} from './economics-view.js';

function initializeWidget(root){
 const kind=root.dataset.econWidget;
 let state=initialEconomicsState(),result=calculateEconomics(state),pinned=null,renderedMode=null;
 const get=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
 const set=(selector,text)=>{const element=get(selector);if(element)element.textContent=text;};
 const range=get('[data-econ-range]'),numeric=get('[data-econ-number]'),price=get('[data-econ-price]'),month=get('[data-econ-month]');
 function selectSegment(id){
  const segment=result.segments.find(s=>s.id===id);
  all('[data-segment]').forEach(e=>{e.toggleAttribute('data-selected',e.dataset.segment===id);if(e.tagName==='BUTTON')e.setAttribute('aria-pressed',String(e.dataset.segment===pinned));});
  set('[data-ring-label]',segment?segment.label:'Выручка без НДС');
  set('[data-ring-value]',millions(segment?segment.value:result.revenue));
  set('[data-ring-share]',segment?percentage(segment.value/result.revenue)+' выручки':'за месяц');
  set('[data-segment-detail]',segment?segment.description:'Выберите статью на кольце или в легенде, чтобы увидеть её состав.');
 }
 function update({syncInputs=false,announce=true}={}){
  state=normalizeEconomicsState(state);result=calculateEconomics(state);pinned=null;
  all('button[data-econ-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.econMode===state.mode)));
  all('[data-econ-lines]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econLines)===state.lines)));
  root.dataset.econMode=state.mode;root.dataset.econState=result.net<0?'loss':'profit';
  set('[data-econ-output]',tonnes(result.output));set('[data-econ-product]',result.mode.product);
  set('[data-econ-revenue]',millions(result.revenue));set('[data-econ-profit]',millions(result.net));
  set('[data-econ-profit-label]',(result.net<0?'Убыток':'Чистая прибыль')+(kind==='curve'?' / месяц':''));
  set('[data-econ-margin]',percentage(result.margin));set('[data-econ-load]',percentage(result.load));
  get('[data-econ-price-note]').innerHTML=renderPriceNote(result);
  if(renderedMode!==state.mode)get('[data-econ-presets]').innerHTML=renderPricePresets(result);
  else all('[data-econ-preset]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econPreset)===result.grossPrice)));
  renderedMode=state.mode;
  if(kind==='monthly'){
   month.innerHTML=renderMonth(result);
   set('[data-econ-basis]',`Один комплект · ${config.availableHours} ч/месяц · товарный выход ${percentage(result.totalYield)} · производственный штат ${result.mode.staff} человек · ${config.activeSorters} сортировщика в активной смене.`);
  }else if(kind==='per-tonne'){
   set('[data-econ-unit-product]',result.mode.unitProduct+' · ₽/т готовой продукции');
   get('[data-econ-bridge]').innerHTML=renderBridge(result);
  }else{
   get('[data-econ-curve]').innerHTML=renderCurve(result);
   range.max=String(result.capacity);numeric.max=String(Number(result.capacity.toFixed(3)));range.value=String(state.input);
   range.setAttribute('aria-valuetext',`${tonnes(state.input)} входа в месяц, ${percentage(result.load)} загрузки, ${millions(result.net)} ${result.net<0?'убытка':'прибыли'} в месяц`);
   if(syncInputs)numeric.value=String(Number(state.input.toFixed(3)));
   set('[data-econ-capacity]',`До ${tonnes(result.capacity)} входа на ${state.lines===1?'один комплект':state.lines+' комплекта'} · ${config.availableHours} ч/месяц на комплект · загрузка ${percentage(result.load)}.`);
  }
  if(syncInputs)price.value=String(result.grossPrice/1000);
  if(announce)set('[data-econ-status]',resultSummary(result));
 }
 root.addEventListener('click',e=>{
  const mode=e.target.closest('button[data-econ-mode]'),lines=e.target.closest('[data-econ-lines]'),preset=e.target.closest('[data-econ-preset]');
  if(mode){if(get('[data-econ-clamp]'))get('[data-econ-clamp]').hidden=true;state=changeEconomicsSelection(state,{mode:mode.dataset.econMode});update({syncInputs:true});}
  if(lines){get('[data-econ-clamp]').hidden=true;state=changeEconomicsSelection(state,{lines:Number(lines.dataset.econLines)});update({syncInputs:true});}
  if(preset){state.salePrices[state.mode]=Number(preset.dataset.econPreset);update({syncInputs:true});}
 });
 price.addEventListener('input',()=>{if(price.value==='')return;state.salePrices[state.mode]=Number(price.value)*1000;update({announce:false});});
 price.addEventListener('change',()=>update({syncInputs:true}));
 if(range){
  range.addEventListener('input',()=>{state.input=Number(range.value);numeric.value=range.value;get('[data-econ-clamp]').hidden=true;update({syncInputs:true});});
  numeric.addEventListener('input',()=>{
   if(numeric.value==='')return;
   const requested=Number(numeric.value);state.input=requested;update();
   const notice=get('[data-econ-clamp]');notice.hidden=Math.abs(requested-state.input)<.00051;
   if(!notice.hidden)notice.textContent=`Объём ограничен диапазоном от 0 до ${tonnes(result.capacity)} входа в месяц.`;
  });
  numeric.addEventListener('change',()=>update({syncInputs:true}));
 }
 if(month){
  month.addEventListener('pointerover',e=>{const target=e.target.closest('[data-segment]');if(target&&!pinned)selectSegment(target.dataset.segment);});
  month.addEventListener('pointerleave',()=>{if(!pinned){const focused=document.activeElement?.closest?.('[data-segment]');selectSegment(focused&&month.contains(focused)?focused.dataset.segment:null);}});
  month.addEventListener('focusin',e=>{const target=e.target.closest('[data-segment]');if(target&&!pinned)selectSegment(target.dataset.segment);});
  month.addEventListener('focusout',()=>queueMicrotask(()=>{if(!pinned&&!month.contains(document.activeElement))selectSegment(null);}));
  month.addEventListener('click',e=>{const target=e.target.closest('[data-segment]');if(!target)return;pinned=pinned===target.dataset.segment?null:target.dataset.segment;selectSegment(pinned);});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=null;selectSegment(null);}});
 }
 update({syncInputs:true,announce:false});
 return {getResult:()=>result};
}
export function initializeEconomics(section){
 if(!section)return;
 return Object.fromEntries([...section.querySelectorAll('[data-econ-widget]')].map(root=>[root.dataset.econWidget,initializeWidget(root)]));
}
