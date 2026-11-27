import {createInvestmentStore,getFxSnapshot} from './economics-page-state.js';
import {compact,financialValues,priceText,renderAllocation,renderProfitChart,scenarioTopic} from './economics-page-view.js';

export function initializeEconomicsPage(root){
 if(!root?.hasAttribute('data-economics-page'))return;
 const bar=document.querySelector('[data-fx-bar]');
 const seed=root.querySelector('[data-econ-fx-seed]');
 const initialFx=getFxSnapshot(bar?.eraFxSnapshot)??(seed?JSON.parse(seed.textContent):null);
 const store=createInvestmentStore({fx:initialFx});
 const fields=[...root.querySelectorAll('[data-econ-value]')];
 const prices=[...root.querySelectorAll('[data-econ-price]')],networks=[...root.querySelectorAll('[data-econ-network]')];
 const periods=[...root.querySelectorAll('[data-econ-period]')],networkPrice=root.querySelector('[data-econ-network-price]');
 const requestLinks=[...root.querySelectorAll('[data-economics-request]')];
 const chart=root.querySelector('[data-econ-chart]'),allocation=root.querySelector('[data-econ-allocation]');
 const unitCaptions=root.querySelectorAll('[data-econ-unit-caption]');
 const costs=[...root.querySelectorAll('[data-econ-cost]')];
 const rateNodes=fields.filter(field=>field.dataset.econValue==='rate'||field.dataset.econValue.endsWith('Usd'));
 const scope=root.querySelector('[data-econ-request-scenario]'),live=root.querySelector('[data-economics-status]');
 let selected=null;
 const set=(node,text)=>{if(node.textContent!==text)node.textContent=text;};
 function render(snapshot,action){
  const {state,result,network}=snapshot,values=financialValues(snapshot);
  for(const field of action==='fx'?rateNodes:fields)set(field,values[field.dataset.econValue]);
  if(action==='fx')return;

  root.dataset.econScenario=state.scenario;
  root.dataset.econState=result.net<0?'loss':'profit';
  for(const button of prices)button.setAttribute('aria-pressed',String(button.dataset.econPrice===state.scenario));
  for(const button of networks)button.setAttribute('aria-pressed',String(Number(button.dataset.econNetwork)===state.complexes));
  for(const button of periods)button.setAttribute('aria-pressed',String(button.dataset.econPeriod===state.period));
  networkPrice.value=state.scenario;
  scope.hidden=network.state.lines===1;

  if(state.scenario!==selected){
   chart.innerHTML=renderProfitChart(snapshot.scenarios,state.scenario);
   allocation.innerHTML=renderAllocation(result);
   const items=new Map(result.costs.map(cost=>[cost.id,cost.value]));
   for(const amount of costs)set(amount,priceText(result.output>0?items.get(amount.dataset.econCost)/result.output:null,2));
   for(const caption of unitCaptions)set(caption,result.net<0?'Убыток':'Чистая прибыль');
   set(root.querySelector('[data-econ-tonne-caption]'),result.net<0?'Убыток с тонны':'Прибыль с тонны');
   selected=state.scenario;
  }
  for(const link of requestLinks){
   const url=new URL(link.href);
   url.searchParams.set('topic',scenarioTopic(link.dataset.economicsRequest==='network'?network:result));
   link.href=url.href;
  }
  if(action==='period'){
   set(live,`Вход ${values.balanceInput}. Готовая гранула ${values.balanceOutput}. Остальная масса ${values.balanceOther}.`);
  }else if(action){
   const current=action==='network'?network:result;
   set(live,`${priceText(current.grossPrice)}. Чистый результат ${compact(current.net)} в месяц, ${compact(current.yearNet)} за год.`);
  }
 }

 store.subscribe(render);
 render(store.get());
 bar?.addEventListener('era:fx-snapshot',event=>store.dispatch({type:'fx',value:event.detail}));
 const openReference=id=>{
  const dialog=document.getElementById(id)?.closest('dialog[data-econ-reference]');
  if(!dialog||!root.contains(dialog))return false;
  if(!dialog.open){
   root.querySelector('dialog[data-econ-reference][open]')?.close();
   dialog.showModal();
  }
  return true;
 };
 root.addEventListener('click',event=>{
  const reference=event.target.closest('[data-econ-reference-link]');
  if(reference&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&openReference(reference.hash.slice(1)))event.preventDefault();
  const control=event.target.closest('[data-econ-price],[data-econ-network],[data-econ-period]');
  if(!control)return;
  const {econPrice,econNetwork,econPeriod}=control.dataset;
  if(econPrice)store.dispatch({type:'price',value:econPrice});
  else if(econNetwork)store.dispatch({type:'network',value:Number(econNetwork)});
  else if(econPeriod)store.dispatch({type:'period',value:econPeriod});
 });
 networkPrice.addEventListener('change',()=>store.dispatch({type:'price',value:networkPrice.value}));
 const openLinkedReference=()=>{
  let id;
  try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  openReference(id);
 };
 window.addEventListener('hashchange',openLinkedReference);
 openLinkedReference();
 root.dataset.economicsReady='true';
}
