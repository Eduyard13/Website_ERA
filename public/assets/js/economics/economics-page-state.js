import {economicsConfig,scenarioPrices} from './economics-config.js';
import {normalizeEconomicsState,changeEconomicsSelection,calculateEconomics} from './economics-model.js';
import {moscowDay,validateRates} from '../core/fx-core.js';

// The visitor can select only production scenarios covering both calendar bases.
// The accounting model remains unchanged and can still audit loss scenarios.
export function normalizeProductionScenario(value={}){
 let state=normalizeEconomicsState(value),result=calculateEconomics(state);
 if(result.grossPrice<result.minimumGrossPrice){
  state=normalizeEconomicsState({...state,salePrices:{...state.salePrices,[state.mode]:result.minimumGrossPrice}});
  result=calculateEconomics(state);
 }
 const minimum=Math.min(result.capacity,result.minimumInput??result.capacity);
 // A sub-gram margin avoids a negative result caused only by floating-point error.
 const safeMinimum=minimum<result.capacity?Math.min(result.capacity,minimum+result.capacity*1e-12):minimum;
 return normalizeEconomicsState({...state,input:Math.max(state.input,safeMinimum)});
}

export function createEconomicsStore({initialMode='separation',lockedMode=null}={}){
 const initialState=()=>normalizeProductionScenario({mode:lockedMode??initialMode});
 let state=initialState();
 let unit='kg',result=calculateEconomics(state);
 const subscribers=new Set();
 const snapshot=()=>({state:structuredClone(state),result,unit});
 function dispatch(action){
  if(action.type==='reset'){state=initialState();unit='kg';}
  else if(action.type==='selection')state=changeEconomicsSelection(state,lockedMode?{...action.value,mode:lockedMode}:action.value);
  else if(action.type==='price')state=normalizeEconomicsState({...state,salePrices:{...state.salePrices,[state.mode]:action.value}});
  else if(action.type==='input')state=normalizeEconomicsState({...state,input:action.value});
  else if(action.type==='unit'){unit=action.value==='tonne'?'tonne':'kg';}
  else return;
  if(action.type!=='unit'){state=normalizeProductionScenario(state);result=calculateEconomics(state);}
  const value=snapshot();subscribers.forEach(fn=>fn(value,action));
 }
 return {get:snapshot,dispatch,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);}};
}

export function calculateScenarios(config=economicsConfig,mode='full'){
 return scenarioPrices(config.modes[mode]).map(stage=>({
  ...stage,result:calculateEconomics({mode,grossPrice:stage.price},config),
 }));
}

export function calculateResilience(base,conservative){
 const threshold=base.breakEvenGrossPrice;
 const reserve=threshold==null?null:base.grossPrice-threshold;
 return {threshold,reserve,share:base.grossPrice>0&&reserve!=null?reserve/base.grossPrice:null,
  basePrice:base.grossPrice,conservativePrice:conservative.grossPrice,conservativeNet:conservative.net};
}

export function getFxSnapshot(event, today=moscowDay()){
 try{
  const rates=validateRates(event?.data);
  if(rates.requestedDate>today)return null;
  return {rateRubPerUsd:rates.rates.USD.rate,effectiveDate:rates.effectiveDate,
   status:rates.requestedDate<today?'stale':event.status==='live'?'live':'cached'};
 }catch{return null;}
}

export function createInvestmentStore({config=economicsConfig,fx=null}={}){
 const scenarios=calculateScenarios(config);
 const baseline=scenarios.find(stage=>stage.id==='base').result;
 const conservative=scenarios.find(stage=>stage.id==='conservative').result;
 // LSP v1, sheet 00_Итоги, scenario «База 50». This price belongs to the Start card.
 const separation=calculateEconomics({mode:'separation',grossPrice:50000},config);
 const resilience=calculateResilience(baseline,conservative);
 const periods={hour:{input:baseline.mode.inputRate,output:baseline.mode.outputRate},
  month:{input:baseline.state.input,output:baseline.output},year:{input:baseline.yearInput,output:baseline.yearOutput}};
 const initial={scenario:'base',complexes:config.networkSizes[0],period:'hour'};
 let state=initial;
 const listeners=new Set();
 const snapshot=()=>{
  const result=scenarios.find(stage=>stage.id===state.scenario).result;
  const network=state.complexes===1?result:calculateEconomics({mode:'full',lines:state.complexes,grossPrice:result.grossPrice},config);
  return {config,state,scenarios,result,network,baseline,separation,resilience,balance:periods[state.period],fx};
 };
 function dispatch({type,value}){
  if(type==='price'&&scenarios.some(stage=>stage.id===value))state={...state,scenario:value};
  else if(type==='network'&&config.networkSizes.includes(value))state={...state,complexes:value};
  else if(type==='period'&&Object.hasOwn(periods,value))state={...state,period:value};
  else if(type==='reset')state=initial;
  else if(type==='fx')fx=getFxSnapshot(value)??fx;
  else return;
  const next=snapshot();
  listeners.forEach(listener=>listener(next,type));
 }
 return {get:snapshot,dispatch,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}};
}
