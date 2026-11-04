import {economicsConfig as config} from './economics-config.js';

const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export const initialEconomicsState=()=>({mode:'separation',lines:1,input:config.baseInput,separationYield:config.separationYield,granulationYield:config.granulationYield,salePrices:{separation:config.modes.separation.salePrice,full:config.modes.full.salePrice}});
export function normalizeEconomicsState(value={}){
 const initial=initialEconomicsState(),lines=clamp(Math.round(finite(value.lines,1)),1,3);
 const capacity=lines*config.inputRate*config.availableHours;
 return {
  mode:value.mode==='full'?'full':'separation',lines,
  input:clamp(finite(value.input,initial.input),0,capacity),
  separationYield:clamp(finite(value.separationYield,initial.separationYield),0,1),
  granulationYield:clamp(finite(value.granulationYield,initial.granulationYield),0,1),
  salePrices:Object.fromEntries(Object.keys(config.modes).map(mode=>[mode,clamp(finite(value.salePrices?.[mode],initial.salePrices[mode]),0,1000000)])),
 };
}
export function calculateEconomics(value={}){
 const state=normalizeEconomicsState(value),mode=config.modes[state.mode];
 const capacity=state.lines*config.inputRate*config.availableHours;
 const totalYield=state.separationYield*(state.mode==='full'?state.granulationYield:1);
 const output=state.input*totalYield,salePrice=state.salePrices[state.mode],revenue=output*salePrice;
 const costs=config.costs.map(cost=>({...cost,value:cost[state.mode]*(cost.kind==='variable'?state.input/config.baseInput:state.lines)}));
 const variableCosts=costs.filter(c=>c.kind==='variable').reduce((sum,c)=>sum+c.value,0);
 const fixedCosts=costs.filter(c=>c.kind==='fixed').reduce((sum,c)=>sum+c.value,0);
 const pretax=revenue-variableCosts-fixedCosts,tax=Math.max(0,pretax)*config.taxRate,net=pretax-tax;
 const variableRate=config.costs.filter(c=>c.kind==='variable').reduce((sum,c)=>sum+c[state.mode],0)/config.baseInput;
 const contribution=totalYield*salePrice-variableRate;
 const breakEven=contribution>0?fixedCosts/contribution:null;
 const perProduct=output>0?{price:salePrice,variable:variableCosts/output,fixed:fixedCosts/output,tax:tax/output,net:net/output}:null;
 return {
  state,mode,capacity,totalYield,output,salePrice,revenue,costs,variableCosts,fixedCosts,pretax,tax,net,
  margin:revenue>0?net/revenue:null,
  perProduct,perInput:state.input>0?net/state.input:null,
  hoursPerLine:state.input/(config.inputRate*state.lines),contribution,breakEven,
  breakEvenState:contribution<=0?'negative-contribution':breakEven>capacity?'outside-capacity':'within-capacity',
  donutAvailable:revenue>0&&net>=0,
  segments:[...costs,{id:'tax',label:'Условный налог',description:`${(config.taxRate*100).toLocaleString('ru-RU')}% от положительной прибыли до условного налога; реальный налоговый режим не рассчитывается.`,value:tax,color:'#ded9cd'},{id:'profit',label:net>=0?'Чистая прибыль в модели':'Убыток в модели',description:'Результат после затрат, амортизации и условного налога. Денежный поток и окупаемость рассчитываются отдельно.',value:net,color:net>=0?'#c6a43b':'#a54e44'}],
 };
}
export function profitCurve(value={},steps=40){
 const state=normalizeEconomicsState(value),capacity=state.lines*config.inputRate*config.availableHours;
 return Array.from({length:steps+1},(_,index)=>{const input=capacity*index/steps;return {input,net:calculateEconomics({...state,input}).net};});
}
