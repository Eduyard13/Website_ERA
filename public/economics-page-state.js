import {normalizeEconomicsState,changeEconomicsSelection,calculateEconomics} from './economics-model.js';

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
