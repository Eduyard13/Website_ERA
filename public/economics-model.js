import {economicsConfig as config} from './economics-config.js';
import {equipmentPayback} from './economics-payback.js';

const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function normalizeEconomicsState(value={}){
 const mode=value.mode==='full'?'full':'separation',profile=config.modes[mode];
 const lines=clamp(Math.round(finite(value.lines,1)),1,3),capacity=lines*profile.referenceInput;
 return {
  mode,lines,input:clamp(finite(value.input,capacity),0,capacity),
  salePrices:Object.fromEntries(Object.entries(config.modes).map(([key,m])=>[key,clamp(finite(value.salePrices?.[key],m.defaultGrossPrice),0,1000000)])),
 };
}
export const initialEconomicsState=(mode='separation')=>normalizeEconomicsState({mode});

// A mode/line-count change preserves utilisation, including full-load endpoints.
export function changeEconomicsSelection(value,selection){
 const state=normalizeEconomicsState(value),load=state.input/(state.lines*config.modes[state.mode].referenceInput);
 const next=normalizeEconomicsState({...state,...selection});
 return normalizeEconomicsState({...next,input:load*next.lines*config.modes[next.mode].referenceInput});
}
function monthlyCosts(state,profile,load,cashOpex,depreciation){
 let costs;
 if(Math.abs(load-1)<1e-12){
  costs=config.costs.map(cost=>({...cost,value:cost[state.mode]*state.lines}));
  // Reconcile rounded published categories to the precise working-column total.
  costs.find(c=>c.id==='disposal').value+=cashOpex-costs.reduce((sum,c)=>sum+c.value,0);
 }else{
  // Partial-load data supplies aggregate splits, not coefficients per category.
  costs=[
   {id:'fixed-cash',label:'Постоянные денежные расходы',description:'Постоянная часть операционных расходов каждого параллельного комплекта.',value:state.lines*profile.fixedCashOpex,color:'#414663'},
   {id:'variable-cash',label:'Переменные денежные расходы',description:'Переменная часть операционных расходов пропорциональна загрузке.',value:state.lines*profile.variableCashOpex*load,color:'#8a96a2'},
  ];
 }
 return [...costs,{id:'depreciation',label:'Амортизация',description:'Включена в себестоимость и прибыль один раз. Денежный поток рассчитывается отдельно.',value:depreciation,color:'#bcb5a7'}];
}
export function calculateEconomics(value={}){
 const state=normalizeEconomicsState(value),mode=config.modes[state.mode],capacity=state.lines*mode.referenceInput,load=state.input/capacity;
 const totalYield=mode.totalYield,output=state.input*totalYield,grossPrice=state.salePrices[state.mode],netPrice=grossPrice/(1+config.vatRate);
 const revenue=output*netPrice,grossRevenue=output*grossPrice;
 const fixedCashCosts=state.lines*mode.fixedCashOpex,variableCosts=state.lines*mode.variableCashOpex*load;
 const depreciation=state.lines*mode.depreciation,cashOpex=fixedCashCosts+variableCosts,fixedCosts=fixedCashCosts+depreciation,totalCosts=cashOpex+depreciation;
 const pretax=revenue-totalCosts,tax=Math.max(0,pretax)*config.taxRate,net=pretax-tax;
 const contribution=totalYield*netPrice-mode.variableCashOpex/mode.referenceInput,breakEven=contribution>0?fixedCosts/contribution:null;
 const costs=monthlyCosts(state,mode,load,cashOpex,depreciation);
 const perProduct=output>0?{grossPrice,price:netPrice,cash:cashOpex/output,variable:variableCosts/output,fixedCash:fixedCashCosts/output,depreciation:depreciation/output,totalCosts:totalCosts/output,tax:tax/output,net:net/output}:null;
 // Stable calendar year: output follows operating hours; monthly fixed costs do not.
 const yearFactor=config.yearDays/config.monthDays;
 const yearInput=state.input*yearFactor,yearOutput=output*yearFactor,yearRevenue=yearOutput*netPrice;
 const yearFixedCashCosts=12*fixedCashCosts,yearVariableCosts=variableCosts*yearFactor,yearDepreciation=12*depreciation;
 const yearCashOpex=yearFixedCashCosts+yearVariableCosts,yearCosts=yearCashOpex+yearDepreciation;
 const yearPretax=yearRevenue-yearCosts,yearTax=Math.max(0,yearPretax)*config.taxRate,yearNet=yearPretax-yearTax;
 const annualOperatingCash=yearNet+yearDepreciation;
 const yearBreakEvenInput=contribution>0?(yearFixedCashCosts+yearDepreciation)/(yearFactor*contribution):null;
 const minimumInput=breakEven==null||yearBreakEvenInput==null?null:Math.max(breakEven,yearBreakEvenInput);
 const fullMonthCosts=mode.fixedCashOpex+mode.variableCashOpex+mode.depreciation;
 const fullYearCosts=12*(mode.fixedCashOpex+mode.depreciation)+mode.variableCashOpex*yearFactor;
 const minimumGrossPrice=Math.ceil(Math.max(fullMonthCosts/mode.referenceOutput,fullYearCosts/(mode.referenceOutput*yearFactor))*(1+config.vatRate)/10)*10;
 const ratio=(a,b)=>b>0&&Number.isFinite(a/b)?a/b:null;
 const result={
  state,mode,capacity,load,totalYield,output,grossPrice,salePrice:grossPrice,netPrice,grossRevenue,outputVat:grossRevenue-revenue,
  revenue,costs,variableCosts,fixedCashCosts,fixedCosts,cashOpex,depreciation,totalCosts,pretax,tax,net,
  margin:revenue>0?net/revenue:null,perProduct,perInput:state.input>0?net/state.input:null,
  hoursPerLine:load*config.availableHours,contribution,breakEven,
  yearInput,yearOutput,yearRevenue,yearFixedCashCosts,yearVariableCosts,yearDepreciation,yearCashOpex,yearCosts,yearPretax,yearTax,yearNet,
  yearMargin:ratio(yearNet,yearRevenue),yearHoursPerLine:load*config.yearHours,
  annualOperatingCash,averageMonthlyOperatingCash:annualOperatingCash/12,
  yearBreakEvenInput,minimumInput,minimumLoad:minimumInput==null?null:minimumInput/capacity,minimumGrossPrice,
  breakEvenGrossPrice:ratio(totalCosts*(1+config.vatRate),output),yearBreakEvenGrossPrice:ratio(yearCosts*(1+config.vatRate),yearOutput),
  yearUnitCosts:ratio(yearCosts,yearOutput),
  breakEvenState:contribution<=0?'negative-contribution':breakEven>capacity?'outside-capacity':'within-capacity',
  donutAvailable:revenue>0&&net>=0,
  segments:[...costs,
   {id:'tax',label:'Налог на прибыль',description:'25% положительной прибыли до налогообложения. Месячное начисление для сравнения; календарный ДДС — в финансовой модели.',value:tax,color:'#ded9cd'},
   {id:'profit',label:net>=0?'Чистая прибыль':'Убыток',description:'Результат по выручке без НДС после операционных расходов, амортизации и налога на прибыль.',value:net,color:net>=0?'#c6a43b':'#a54e44'},
  ],
 };
 return {...result,payback:equipmentPayback(result)};
}
export function profitCurve(value={},steps=40,minimumInput=0){
 const state=normalizeEconomicsState(value),capacity=state.lines*config.modes[state.mode].referenceInput,count=clamp(Math.floor(finite(steps,40)),1,400);
 const minimum=clamp(finite(minimumInput,0),0,capacity);
 return Array.from({length:count+1},(_,index)=>{const input=minimum+(capacity-minimum)*index/count;return {input,net:calculateEconomics({...state,input}).net};});
}
