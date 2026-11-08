import {normalizeEconomicsState,changeEconomicsSelection,calculateEconomics} from './economics-model.js';

// UI defaults are separate from the historical financial-model defaults.
export function createEconomicsStore(){
 let state=normalizeEconomicsState({salePrices:{separation:50000,full:100000}});
 let unit='kg',result=calculateEconomics(state);
 const subscribers=new Set();
 const snapshot=()=>({state:structuredClone(state),result,unit});
 function dispatch(action){
  if(action.type==='selection')state=changeEconomicsSelection(state,action.value);
  else if(action.type==='price')state=normalizeEconomicsState({...state,salePrices:{...state.salePrices,[state.mode]:action.value}});
  else if(action.type==='input')state=normalizeEconomicsState({...state,input:action.value});
  else if(action.type==='unit'){unit=action.value==='tonne'?'tonne':'kg';}
  else return;
  if(action.type!=='unit')result=calculateEconomics(state);
  const value=snapshot();subscribers.forEach(fn=>fn(value,action));
 }
 return {get:snapshot,dispatch,subscribe(fn){subscribers.add(fn);return()=>subscribers.delete(fn);}};
}
