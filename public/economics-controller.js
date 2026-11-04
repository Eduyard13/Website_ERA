import {economicsConfig as config} from './economics-config.js';
import {initialEconomicsState,normalizeEconomicsState,calculateEconomics} from './economics-model.js';
import {renderMonth,renderBridge,renderCurve,tonnes,money,millions,percentage,resultSummary} from './economics-view.js';

export function initializeEconomics(root){
 if(!root)return;
 let state=initialEconomicsState(),result=calculateEconomics(state),pinned=null;
 const get=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
 const range=get('[data-econ-range]'),numeric=get('[data-econ-number]'),price=get('[data-econ-price]'),separationYield=get('[data-econ-yield]'),granulationYield=get('[data-econ-granulation-yield]');
 const month=get('[data-econ-month]');
 function selectSegment(id){
  const segment=result.segments.find(s=>s.id===id);
  all('[data-segment]').forEach(e=>{e.toggleAttribute('data-selected',e.dataset.segment===id);if(e.tagName==='BUTTON')e.setAttribute('aria-pressed',String(e.dataset.segment===pinned));});
  if(!get('[data-ring-label]'))return;
  get('[data-ring-label]').textContent=segment?segment.label:'Выручка';
  get('[data-ring-value]').textContent=millions(segment?segment.value:result.revenue);
  get('[data-ring-share]').textContent=segment?percentage(segment.value/result.revenue)+' выручки':'за месяц';
  get('[data-segment-detail]').textContent=segment?segment.description:'Выберите статью на кольце или в легенде, чтобы увидеть её состав.';
 }
 function update({syncInputs=false,announce=true}={}){
  state=normalizeEconomicsState(state);result=calculateEconomics(state);pinned=null;
  all('[data-econ-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.econMode===state.mode)));
  all('[data-econ-lines]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econLines)===state.lines)));
  root.dataset.econMode=state.mode;root.dataset.econState=result.net<0?'loss':'profit';
  get('[data-econ-output]').textContent=tonnes(result.output);get('[data-econ-product]').textContent=result.mode.product;
  get('[data-econ-revenue]').textContent=millions(result.revenue);get('[data-econ-profit]').textContent=millions(result.net);
  get('[data-econ-profit-label]').textContent=result.net<0?'Убыток в модели':'Чистая прибыль в модели';get('[data-econ-margin]').textContent=percentage(result.margin);
  month.innerHTML=renderMonth(result);get('[data-econ-bridge]').innerHTML=renderBridge(result);get('[data-econ-curve]').innerHTML=renderCurve(result);
  range.max=String(result.capacity);numeric.max=String(result.capacity);range.value=String(state.input);
  range.setAttribute('aria-valuetext',tonnes(state.input)+' входа в месяц');
  if(syncInputs){numeric.value=String(state.input);price.value=String(result.salePrice);separationYield.value=String(state.separationYield*100);granulationYield.value=String(state.granulationYield*100);}
  get('[data-granulation-assumption]').hidden=state.mode!=='full';
  get('[data-econ-capacity]').textContent=`До ${tonnes(result.capacity)} входа за ${config.availableHours} ч на ${state.lines===1?'одну линию':state.lines+' линии'}. При текущем объёме — ${Math.round(result.hoursPerLine)} ч на каждую линию.`;
  if(announce)get('[data-econ-status]').textContent=resultSummary(result);
 }
 const clearClamp=()=>{get('[data-econ-clamp]').hidden=true;};
 all('[data-econ-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.econMode;clearClamp();update({syncInputs:true});}));
 all('[data-econ-lines]').forEach(b=>b.addEventListener('click',()=>{
  const previous=state.input;state.lines=Number(b.dataset.econLines);state=normalizeEconomicsState(state);
  const clamped=state.input<previous,notice=get('[data-econ-clamp]');notice.hidden=!clamped;
  if(clamped)notice.textContent=`Объём уменьшен до ${tonnes(state.input)} — предела мощности выбранного числа линий.`;
  update({syncInputs:true});
 }));
 range.addEventListener('input',()=>{state.input=Number(range.value);numeric.value=range.value;clearClamp();update({announce:false});});
 range.addEventListener('change',()=>get('[data-econ-status]').textContent=resultSummary(result));
 numeric.addEventListener('input',()=>{if(numeric.value==='')return;state.input=Number(numeric.value);clearClamp();update({announce:false});});
 numeric.addEventListener('change',()=>update({syncInputs:true}));
 for(const [element,assign] of [[price,v=>{state.salePrices[state.mode]=v;}],[separationYield,v=>{state.separationYield=v/100;}],[granulationYield,v=>{state.granulationYield=v/100;}]]){
  element.addEventListener('input',()=>{if(element.value==='')return;assign(Number(element.value));update({announce:false});});
  element.addEventListener('change',()=>update({syncInputs:true}));
 }
 month.addEventListener('pointerover',e=>{const target=e.target.closest('[data-segment]');if(target&&!pinned)selectSegment(target.dataset.segment);});
 month.addEventListener('pointerleave',()=>{if(!pinned){const focused=document.activeElement?.closest?.('[data-segment]');selectSegment(focused&&month.contains(focused)?focused.dataset.segment:null);}});
 month.addEventListener('focusin',e=>{const target=e.target.closest('[data-segment]');if(target&&!pinned)selectSegment(target.dataset.segment);});
 month.addEventListener('focusout',()=>queueMicrotask(()=>{if(!pinned&&!month.contains(document.activeElement))selectSegment(null);}));
 month.addEventListener('click',e=>{const target=e.target.closest('[data-segment]');if(!target)return;pinned=pinned===target.dataset.segment?null:target.dataset.segment;selectSegment(pinned);});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=null;selectSegment(null);}});
 update({syncInputs:true,announce:false});
 return {getResult:()=>result};
}
