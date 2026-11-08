import {createEconomicsStore} from './economics-page-state.js';
import {renderMonth,renderBridge,renderCurve,breakEvenText,priceStageText,resultSummary,money,millions,percentage,tonnes} from './economics-view.js';
import {decimal,unitMoney,modeLabel,productCopy,renderScenarioPresets,groupedMonth,renderCostDetails,renderUnitDetail,renderSpecialist,basisText} from './economics-page-view.js';

export function initializeEconomicsPage(root){
 if(!root)return;
 const store=createEconomicsStore(),get=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
 const base=new URL(get('[data-technology-page]').href).pathname.replace(/\/technology\/?$/,'');
 const set=(s,v)=>all(s).forEach(e=>e.textContent=v);
 const price=get('[data-econ-price]'),numeric=get('[data-econ-number]'),range=get('[data-econ-range]'),month=get('[data-econ-month]');
 let renderedMode=null,pinned=null,monthResult;
 function selectSegment(id){
  const {result}=store.get(),segment=monthResult.segments.find(s=>s.id===id);
  month.querySelectorAll('[data-segment]').forEach(e=>{e.toggleAttribute('data-selected',e.dataset.segment===id);if(e.tagName==='BUTTON')e.setAttribute('aria-pressed',String(e.dataset.segment===pinned));});
  set('[data-ring-label]',segment?segment.label:'Выручка без НДС');
  set('[data-ring-value]',millions(segment?segment.value:result.revenue));
  set('[data-ring-share]',segment?percentage(segment.value/result.revenue)+' выручки':'за месяц');
  set('[data-segment-detail]',segment?segment.description:'Выберите статью на кольце или в легенде, чтобы увидеть её состав.');
 }
 function update(snapshot,action={}){
  const {state,result:r,unit}=snapshot;
  const values={unitPrice:unitMoney(r.netPrice,unit),unitCost:unitMoney(r.perProduct?.totalCosts,unit),unitTax:unitMoney(r.perProduct?.tax,unit),unitProfit:unitMoney(r.perProduct?.net,unit)};
  for(const [key,value] of Object.entries(values))set(`[data-value="${key}"]`,value);
  all('[data-econ-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.econUnit===unit)));
  get('[data-econ-bridge]').innerHTML=renderBridge(r,unit);
  get('[data-unit-details]').innerHTML=renderUnitDetail(r,unit);
  if(action.type==='unit')return;
  const changedMode=renderedMode!==state.mode;
  root.dataset.econMode=state.mode;root.dataset.econState=r.net<0?'loss':'profit';
  const derived={input:tonnes(state.input),output:tonnes(r.output),product:r.mode.product,remainder:tonnes(state.input-r.output),yield:percentage(r.totalYield),remainderShare:percentage(1-r.totalYield),
   cost:unitMoney(r.perProduct?.totalCosts),profit:millions(r.net),revenue:millions(r.revenue),margin:percentage(r.margin),load:percentage(r.load),mode:modeLabel(r),
   grossPrice:decimal(r.grossPrice/1000,Number.isInteger(r.grossPrice/1000)?0:2)+' ₽/кг',grossTonne:money(r.grossPrice)+'/т',netPrice:unitMoney(r.netPrice),priceStage:priceStageText(r),
   breakEven:r.breakEven==null?'Недостижима':tonnes(r.breakEven)+'/мес.'};
  for(const [key,value] of Object.entries(derived))set(`[data-value="${key}"]`,value);
  all('[data-econ-profit-label]').forEach(e=>{const perMonth=e.closest('.ec-unit-kpis')==null;e.textContent=(r.net<0?'Убыток':'Чистая прибыль')+(perMonth?' / месяц':'');});
  all('[data-econ-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.econMode===state.mode)));
  all('[data-econ-lines]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econLines)===state.lines)));
  if(changedMode)all('[data-price-presets]').forEach(el=>el.innerHTML=renderScenarioPresets(r));
  else all('[data-econ-preset]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.econPreset)===r.grossPrice)));
  if(changedMode){
   const p=productCopy(state.mode),image=get('[data-product-image]');
   image.src=base+p.src;image.width=p.width;image.height=p.height;image.alt=p.alt;
   get('[data-product-photo]').classList.toggle('ec-product-photo--granules',state.mode==='full');
   set('[data-product-title]',p.title);set('[data-product-caption]',p.caption);set('[data-product-applications]',p.applications);
   get('[data-product-passport]').innerHTML=p.passport;
   const link=get('[data-product-link]');link.href=base+p.href;link.firstChild.nodeValue=p.link+' ';
  }
  renderedMode=state.mode;
  get('[data-mass-product]').style.width=r.totalYield*100+'%';
  get('[data-mass-bar]').setAttribute('aria-label',`Вход ${tonnes(state.input)}, товарная продукция ${tonnes(r.output)}, остальная масса ${tonnes(state.input-r.output)}; товарный выход ${percentage(r.totalYield)}.`);
  monthResult=groupedMonth(r);month.innerHTML=renderMonth(monthResult);pinned=null;
  get('[data-econ-curve]').innerHTML=renderCurve(r);
  get('[data-cost-details]').innerHTML=renderCostDetails(r);get('[data-specialist]').innerHTML=renderSpecialist(r);
  set('[data-month-basis]',basisText(r));set('[data-summary-break-even]',breakEvenText(r));
  set('[data-hero-basis]',`${state.lines} ${state.lines===1?'комплект':'комплекта'} · нормативные 744 ч/мес. · существующий цех · ${derived.grossPrice} с НДС`);
  set('[data-capacity]',`До ${tonnes(r.capacity)} входа на ${state.lines} ${state.lines===1?'комплект':'комплекта'} · нормативные 744 ч/мес. · загрузка ${percentage(r.load)}.`);
  range.max=String(r.capacity);numeric.max=String(Math.ceil(r.capacity*1000)/1000);range.value=String(state.input);
  range.setAttribute('aria-valuetext',`${tonnes(state.input)} входа в месяц, ${percentage(r.load)} загрузки, ${millions(r.net)} ${r.net<0?'убытка':'прибыли'}`);
  if(document.activeElement!==price||action.type!=='price')price.value=String(r.grossPrice/1000);
  if(document.activeElement!==numeric||action.type!=='input')numeric.value=String(Number(state.input.toFixed(3)));
  const topic=`Экономическое обоснование ЭРА · ${modeLabel(r)} · ${decimal(r.grossPrice/1000,2)} ₽/кг с НДС · ${state.lines} компл. · ${decimal(state.input,1)} т/мес.`;
  get('[data-economics-request]').href=base+'/contacts?topic='+encodeURIComponent(topic)+'#project-form';
  if(action.type)set('[data-economics-status]',resultSummary(r));
 }
 store.subscribe(update);update(store.get());
 root.addEventListener('click',event=>{
  const mode=event.target.closest('button[data-econ-mode]'),lines=event.target.closest('[data-econ-lines]'),preset=event.target.closest('[data-econ-preset]'),unit=event.target.closest('[data-econ-unit]');
  if(mode||lines){get('[data-econ-clamp]').hidden=true;store.dispatch({type:'selection',value:mode?{mode:mode.dataset.econMode}:{lines:Number(lines.dataset.econLines)}});}
  if(preset)store.dispatch({type:'price',value:Number(preset.dataset.econPreset)});
  if(unit)store.dispatch({type:'unit',value:unit.dataset.econUnit});
  if(event.target.closest('[data-open-conditions]'))get('#calculation-conditions').open=true;
  if(event.target.closest('[data-open-offers]'))get('#market-offers').open=true;
 });
 price.addEventListener('input',()=>{if(price.value===''||!Number.isFinite(price.valueAsNumber))return;store.dispatch({type:'price',value:price.valueAsNumber*1000});});
 price.addEventListener('change',()=>{price.value=String(store.get().result.grossPrice/1000);});
 numeric.addEventListener('input',()=>{
  if(numeric.value===''||!Number.isFinite(numeric.valueAsNumber))return;
  const requested=numeric.valueAsNumber;store.dispatch({type:'input',value:requested});
  const {result:r,state}=store.get(),notice=get('[data-econ-clamp]');notice.hidden=Math.abs(requested-state.input)<.000001;
  if(!notice.hidden)notice.textContent=`Объём ограничен диапазоном от 0 до ${tonnes(r.capacity)} входа в месяц.`;
 });
 numeric.addEventListener('change',()=>numeric.value=String(Number(store.get().state.input.toFixed(3))));
 range.addEventListener('input',()=>{get('[data-econ-clamp]').hidden=true;store.dispatch({type:'input',value:Number(range.value)});});
 month.addEventListener('pointerover',e=>{const s=e.target.closest('[data-segment]');if(s&&!pinned)selectSegment(s.dataset.segment);});
 month.addEventListener('pointerleave',()=>{if(!pinned)selectSegment(null);});
 month.addEventListener('focusin',e=>{const s=e.target.closest('[data-segment]');if(s&&!pinned)selectSegment(s.dataset.segment);});
 month.addEventListener('focusout',()=>queueMicrotask(()=>{if(!pinned&&!month.contains(document.activeElement))selectSegment(null);}));
 month.addEventListener('click',e=>{const s=e.target.closest('[data-segment]');if(s){pinned=pinned===s.dataset.segment?null:s.dataset.segment;selectSegment(pinned);}});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=null;selectSegment(null);}});
 const tabs=all('[data-market-tab]');
 function selectTab(tab){tabs.forEach(button=>{const selected=button===tab;button.tabIndex=selected?0:-1;button.setAttribute('aria-selected',String(selected));get('#'+button.getAttribute('aria-controls')).hidden=!selected;});}
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',e=>{const next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next==null)return;e.preventDefault();selectTab(tabs[next]);tabs[next].focus();});
 });
 function restoreAnchor(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);if(!target||!root.contains(target))return;
  let opened=false;for(let node=target;node&&node!==root;node=node.parentElement)if(node.tagName==='DETAILS'&&!node.open){node.open=true;opened=true;}
  if(id.startsWith('market-tab-'))selectTab(target);
  const panel=target.closest('[role="tabpanel"]');if(panel)selectTab(get('#'+panel.getAttribute('aria-labelledby')));
  if(opened)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
 }
 addEventListener('hashchange',restoreAnchor);addEventListener('pageshow',restoreAnchor);restoreAnchor();
 root.dataset.economicsReady='true';
 return store;
}
