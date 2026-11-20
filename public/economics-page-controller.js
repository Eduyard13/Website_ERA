import {createEconomicsStore} from './economics-page-state.js';
import {renderMonth,renderBridge,renderCurve,breakEvenText,priceStageText,resultSummary,millions,percentage,tonnes} from './economics-view.js';
import {decimal,modeLabel,productCopy,renderScenarioPresets,groupedMonth,renderCostDetails,renderUnitDetail,renderSpecialist,basisText,financialValues,requestHref} from './economics-page-view.js';

export function initializeEconomicsPage(root){
 if(!root)return;
 const store=createEconomicsStore(),get=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
 const technology=get('[data-technology-page]');
 const base=technology?new URL(technology.href).pathname.replace(/\/technology\/?$/,''):'';
 const set=(selector,text)=>all(selector).forEach(e=>{if(e.textContent!==text)e.textContent=text;});
 const html=(selector,text)=>{const e=get(selector);if(e)e.innerHTML=text;};
 const price=get('[data-econ-price]'),numeric=get('[data-econ-number]'),range=get('[data-econ-range]'),month=get('[data-econ-month]');
 let renderedMode=root.dataset.econMode,pinned=null,monthResult=groupedMonth(store.get().result),frame=0,pending=null;
 function selectSegment(id){
  if(!month)return;
  const r=store.get().result,segment=monthResult.segments.find(s=>s.id===id);
  month.querySelectorAll('[data-segment]').forEach(e=>{e.toggleAttribute('data-selected',e.dataset.segment===id);if(e.tagName==='BUTTON')e.setAttribute('aria-pressed',String(e.dataset.segment===pinned));});
  set('[data-ring-label]',segment?segment.label:'Выручка без НДС');
  set('[data-ring-value]',millions(segment?segment.value:r.revenue));
  set('[data-ring-share]',segment&&r.revenue>0?percentage(segment.value/r.revenue)+' выручки':'за месяц');
  set('[data-segment-detail]',segment?segment.description:'Выберите статью на кольце или в легенде, чтобы увидеть её состав.');
 }
 function update(snapshot,action={}){
  const {state,result:r}=snapshot,changedMode=renderedMode!==state.mode,values={...financialValues(r),priceStage:priceStageText(r)};
  root.dataset.econMode=state.mode;root.dataset.econState=r.net<0?'loss':'profit';root.dataset.econYearState=r.yearNet<0?'loss':'profit';
  for(const [key,text] of Object.entries(values))set(`[data-value="${key}"]`,text);
  for(const [period,net] of [['month',r.net],['year',r.yearNet],['unit',r.net]]){
   set(`[data-profit-label="${period}"]`,(net<0?'Расчётный убыток':'Чистая прибыль')+(period==='unit'?'':period==='year'?' / год':' / месяц'));
   all(`[data-profit-period="${period}"]`).forEach(e=>e.dataset.result=net<0?'loss':'profit');
  }
  set('[data-summary-profit-label]',r.net<0||r.yearNet<0?'Прибыль / убыток':'Чистая прибыль');
  all('button[data-econ-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.econMode===state.mode)));
  all('[data-econ-lines]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econLines)===state.lines)));
  if(changedMode)html('[data-price-presets]',renderScenarioPresets(r));
  else all('[data-econ-preset]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econPreset)===r.grossPrice)));
  if(changedMode){
   const p=productCopy(state.mode),image=get('[data-product-image]');
   if(image){image.src=base+p.src;image.width=p.width;image.height=p.height;image.alt=p.alt;}
   get('[data-product-photo]')?.classList.toggle('ec-product-photo--granules',state.mode==='full');
   set('[data-product-title]',p.title);set('[data-product-caption]',p.caption);set('[data-product-applications]',p.applications);
   html('[data-product-passport]',p.passport);
   const link=get('[data-product-link]');if(link){link.href=base+p.href;link.firstChild.nodeValue=p.link+' ';}
  }
  const quality=get('[data-product-quality-copy]');if(quality)quality.hidden=state.mode!=='full';
  renderedMode=state.mode;
  const mass=get('[data-mass-product]');if(mass)mass.style.width=r.totalYield*100+'%';
  get('[data-mass-bar]')?.setAttribute('aria-label',`Вход ${tonnes(state.input)}, готовая продукция ${tonnes(r.output)}, остальная масса ${tonnes(state.input-r.output)}; доля готовой продукции в сценарии ${percentage(r.totalYield)}.`);
  monthResult=groupedMonth(r);
  if(!r.donutAvailable||!monthResult.segments.some(s=>s.id===pinned))pinned=null;
  html('[data-econ-month]',renderMonth(monthResult));selectSegment(pinned);
  html('[data-econ-bridge]',renderBridge(r,'kg'));html('[data-unit-details]',renderUnitDetail(r));
  html('[data-econ-curve]',renderCurve(r));html('[data-cost-details]',renderCostDetails(r));html('[data-specialist]',renderSpecialist(r));
  set('[data-month-basis]',basisText(r));set('[data-summary-break-even]',breakEvenText(r));
  set('[data-hero-basis]',`${Math.abs(r.load-1)<1e-12?'При полной загрузке':'При загрузке '+percentage(r.load)} · ${state.lines} ${state.lines===1?'комплект':'комплекта'} · готовый цех · цена реализации ${values.grossPrice} с НДС`);
  set('[data-capacity]',`Вход ${tonnes(state.input)}/мес. из ${tonnes(r.capacity)} · ${decimal(r.hoursPerLine,1)} ч на комплект. Допустимый диапазон загрузки: ${percentage(r.minimumInput/r.capacity)}–100%.`);
  if(range){range.min=String(r.minimumInput/r.capacity*100);range.step='any';range.value=String(r.load*100);range.setAttribute('aria-valuetext',`${decimal(r.load*100,4)}% загрузки, точный вход ${decimal(state.input,6)} т/мес.; минимум ${percentage(r.minimumInput/r.capacity)} для безубыточности месяца и года`);}
  if(price){price.setAttribute('aria-valuemin',String(r.minimumGrossPrice/1000));price.setAttribute('aria-valuenow',String(r.grossPrice/1000));if(document.activeElement!==price||action.type!=='price')price.value=String(r.grossPrice/1000);}
  if(numeric){numeric.setAttribute('aria-valuemin',String(r.minimumInput));numeric.setAttribute('aria-valuemax',String(r.capacity));numeric.setAttribute('aria-valuenow',String(state.input));if(document.activeElement!==numeric||action.type!=='input')numeric.value=String(Number(state.input.toFixed(6)));}
  set('#econ-price-limits',`От ${values.minimumPrice} до 1 000 ₽/кг. Нижняя цена покрывает расходы при полной загрузке. Можно ввести дробную цену через запятую.`);
  all('[data-economics-request]').forEach(link=>link.href=base+requestHref(r));
  all('.ec-payback').forEach(e=>e.dataset.paybackStatus=r.payback.status);
  if(action.type)set('[data-economics-status]',resultSummary(r)+` За год: ${millions(r.yearNet)}. ${values.paybackLabel}.`);
 }
 store.subscribe((snapshot,action)=>{
  pending={snapshot,action};
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;const current=pending;pending=null;update(current.snapshot,current.action);});
 });
 update(store.get());
 const clearNotice=()=>{const e=get('[data-econ-clamp]');if(e)e.hidden=true;};
 root.addEventListener('click',event=>{
  const mode=event.target.closest('button[data-econ-mode]'),lines=event.target.closest('[data-econ-lines]'),preset=event.target.closest('[data-econ-preset]');
  if(mode||lines){clearNotice();store.dispatch({type:'selection',value:mode?{mode:mode.dataset.econMode}:{lines:Number(lines.dataset.econLines)}});}
  if(preset){clearNotice();store.dispatch({type:'price',value:Number(preset.dataset.econPreset)});}
  if(event.target.closest('[data-econ-reset]')){clearNotice();store.dispatch({type:'reset'});}
  if(event.target.closest('[data-open-conditions]')){const e=get('#calculation-conditions');if(e)e.open=true;}
  if(event.target.closest('[data-open-offers]')){const e=get('#market-offers');if(e)e.open=true;}
 });
 const parse=text=>{const trimmed=text.trim().replace(',','.');return trimmed!==''&&/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)&&Number.isFinite(Number(trimmed))?Number(trimmed):null;};
 function bindNumber(field,type,multiplier){
  if(!field)return;
  field.addEventListener('input',()=>{
   const number=parse(field.value);if(number==null)return;
   store.dispatch({type,value:number*multiplier});
   const r=store.get().result,accepted=type==='price'?r.grossPrice/multiplier:r.state.input,notice=get('[data-econ-clamp]');
   if(notice){notice.hidden=Math.abs(number-accepted)<1e-8;if(!notice.hidden)notice.textContent=type==='price'?`Допустимая цена: от ${decimal(r.minimumGrossPrice/1000,2)} до 1 000 ₽/кг. Принято ${decimal(accepted,2)} ₽/кг.`:`Объём ограничен безубыточным диапазоном: от ${tonnes(r.minimumInput)} до ${tonnes(r.capacity)} в месяц.`;}
  });
  field.addEventListener('blur',()=>{const r=store.get().result;field.value=String(type==='price'?r.grossPrice/1000:Number(r.state.input.toFixed(6)));});
  field.addEventListener('keydown',event=>{
   if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();
   const current=store.get().result,currentValue=type==='price'?current.grossPrice/1000:current.state.input;
   field.value=String(currentValue+(event.key==='ArrowUp'?1:-1));field.dispatchEvent(new Event('input',{bubbles:true}));
  });
 }
 bindNumber(price,'price',1000);bindNumber(numeric,'input',1);
 range?.addEventListener('input',()=>{
  clearNotice();const r=store.get().result,min=r.minimumInput/r.capacity*100,requested=Number(range.value);
  const percent=requested<=min+1e-6?min:requested>=100-1e-6?100:Math.max(min,Math.round(requested/5)*5);
  store.dispatch({type:'input',value:r.capacity*percent/100});
 });
 range?.addEventListener('keydown',event=>{
  if(!['Home','End','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();clearNotice();const r=store.get().result,min=r.minimumInput/r.capacity*100,current=r.load*100;
  const down=['ArrowLeft','ArrowDown'].includes(event.key);
  const percent=event.key==='Home'?min:event.key==='End'?100:down?Math.max(min,Math.floor((current-1e-7)/5)*5):Math.min(100,Math.ceil((current+1e-7)/5)*5);
  store.dispatch({type:'input',value:r.capacity*percent/100});
 });
 month?.addEventListener('pointerover',e=>{const s=e.target.closest('[data-segment]');if(s&&!pinned)selectSegment(s.dataset.segment);});
 month?.addEventListener('pointerleave',()=>{if(!pinned)selectSegment(null);});
 month?.addEventListener('focusin',e=>{const s=e.target.closest('[data-segment]');if(s&&!pinned)selectSegment(s.dataset.segment);});
 month?.addEventListener('focusout',()=>queueMicrotask(()=>{if(!pinned&&!month.contains(document.activeElement))selectSegment(null);}));
 month?.addEventListener('click',e=>{const s=e.target.closest('[data-segment]');if(s){pinned=pinned===s.dataset.segment?null:s.dataset.segment;selectSegment(pinned);}});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=null;selectSegment(null);}});
 function restoreAnchor(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);if(!target||!root.contains(target))return;
  let opened=false;for(let node=target;node&&node!==root;node=node.parentElement)if(node.tagName==='DETAILS'&&!node.open){node.open=true;opened=true;}
  if(opened)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 }
 addEventListener('hashchange',restoreAnchor);addEventListener('pageshow',restoreAnchor);restoreAnchor();
 root.dataset.economicsReady='true';
 return store;
}
