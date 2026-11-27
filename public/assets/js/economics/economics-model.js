import {economicsConfig,scenarioPrices} from './economics-config.js';
import {equipmentPayback} from './economics-payback.js';

const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const ratio=(a,b)=>b>0&&Number.isFinite(a/b)?a/b:null;

export function productionBasis(modeId,config=economicsConfig){
 const profile=config.modes[modeId];
 const monthHours=config.monthDays*config.hoursPerDay,yearHours=config.yearDays*config.hoursPerDay;
 if(!Number.isFinite(profile.inputRate)||!Number.isFinite(profile.outputRate)||
    profile.outputRate<0||profile.inputRate<profile.outputRate)throw new RangeError('Invalid production rates');
 const overhead=config.costs.filter(cost=>cost.id!=='feedstock');
 let costs,fixedCashOpex,runningCashPerHour;
 if(modeId==='full'){
  const residueRate=profile.inputRate-profile.outputRate;
  costs=overhead.map(cost=>{
   const {monthly=0,hourly=0,perOutputTonne=0,perResidueTonne=0,description=cost.description}=cost.full;
   const operatingRate=hourly+perOutputTonne*profile.outputRate+perResidueTonne*residueRate;
   return {...cost,description,monthly,operatingRate,value:monthly+operatingRate*config.referenceMonthHours};
  });
  fixedCashOpex=costs.reduce((total,cost)=>total+cost.monthly,0);
  runningCashPerHour=costs.reduce((total,cost)=>total+cost.operatingRate,0);
 }else{
  costs=overhead.map(cost=>({...cost,value:cost.separation*(cost.rateMultiplier??1)}));
  const nominalOverhead=costs.reduce((total,cost)=>total+cost.value,0);
  const identifiableFixed=costs.filter(cost=>cost.fixed).reduce((total,cost)=>total+cost.value,0);
  fixedCashOpex=Math.min(nominalOverhead,profile.otherFixedCashOpex+identifiableFixed);
  runningCashPerHour=(nominalOverhead-fixedCashOpex)/config.referenceMonthHours;
 }
 return {...profile,monthHours,yearHours,referenceInput:profile.inputRate*monthHours,referenceOutput:profile.outputRate*monthHours,
  totalYield:ratio(profile.outputRate,profile.inputRate)??0,fixedCashOpex,runningCashPerHour,costs};
}

export function normalizeEconomicsState(value={},config=economicsConfig){
 const mode=value.mode==='full'?'full':'separation';
 const maxLines=mode==='full'?Math.max(...config.networkSizes):3;
 const lines=clamp(Math.round(finite(value.lines,1)),1,maxLines);
 const capacity=lines*config.modes[mode].inputRate*config.monthDays*config.hoursPerDay;
 const salePrices=Object.fromEntries(Object.entries(config.modes).map(([id,profile])=>{
  const selected=id===mode?value.grossPrice??value.salePrices?.[id]:value.salePrices?.[id];
  const maxPrice=Math.max(1e6,...scenarioPrices(profile).map(stage=>stage.price));
  return [id,clamp(finite(selected,profile.defaultGrossPrice),0,maxPrice)];
 }));
 return {mode,lines,input:clamp(finite(value.input,capacity*finite(value.load,1)),0,capacity),salePrices};
}
export const initialEconomicsState=(mode='separation')=>normalizeEconomicsState({mode});

// A line-count or mode change preserves utilization, including full-load endpoints.
export function changeEconomicsSelection(value,selection,config=economicsConfig){
 const state=normalizeEconomicsState(value,config);
 const load=ratio(state.input,state.lines*productionBasis(state.mode,config).referenceInput)??0;
 const next=normalizeEconomicsState({...state,...selection},config);
 return normalizeEconomicsState({...next,input:load*next.lines*productionBasis(next.mode,config).referenceInput},config);
}

function monthlyCosts(state,basis,hours,feedCost,runningCosts,config){
 const raw={...config.costs.find(cost=>cost.id==='feedstock'),value:feedCost};
 const depreciation={id:'depreciation',label:'Амортизация',description:'Учитывается в полной себестоимости один раз.',value:state.lines*basis.depreciation,color:'#bcb5a7'};
 if(Math.abs(hours-config.referenceMonthHours)<1e-8){
  return [raw,...basis.costs.map(cost=>({...cost,value:cost.value*state.lines})),depreciation];
 }
 // Keep the aggregate fixed and running rows away from the reference hours.
 return [
  {id:'fixed-cash',label:'Постоянные денежные расходы',description:'Ежемесячные расходы на каждый комплекс.',value:state.lines*basis.fixedCashOpex,color:'#414663'},
  {id:'variable-cash',label:'Переменные денежные расходы',description:'Закупка сырья и операционные расходы по часам работы.',value:runningCosts+feedCost,color:'#8a96a2'},
  depreciation,
 ];
}

export function calculateEconomics(value={},config=economicsConfig){
 const state=normalizeEconomicsState(value,config);
 const basis=productionBasis(state.mode,config),lines=state.lines;
 const capacity=lines*basis.referenceInput,load=ratio(state.input,capacity)??0;
 const hoursPerLine=load*basis.monthHours,yearHoursPerLine=load*basis.yearHours;
 const totalYield=basis.totalYield,output=state.input*totalYield,grossPrice=state.salePrices[state.mode];
 const netPrice=grossPrice/(1+config.vatRate),revenue=output*netPrice,grossRevenue=output*grossPrice;
 const feedCost=state.input*config.feedstockPrice,runningCosts=lines*hoursPerLine*basis.runningCashPerHour;
 const variableCosts=feedCost+runningCosts,fixedCashCosts=lines*basis.fixedCashOpex;
 const depreciation=lines*basis.depreciation,cashOpex=fixedCashCosts+variableCosts,fixedCosts=fixedCashCosts+depreciation,totalCosts=cashOpex+depreciation;
 const pretax=revenue-totalCosts,tax=Math.max(0,pretax)*config.taxRate,net=pretax-tax;
 const variablePerInput=config.feedstockPrice+(ratio(basis.runningCashPerHour,basis.inputRate)??0);
 const contribution=totalYield*netPrice-variablePerInput,breakEven=contribution>0?fixedCosts/contribution:null;
 const costs=monthlyCosts(state,basis,hoursPerLine,feedCost,runningCosts,config);
 const perProduct=output>0?{grossPrice,price:netPrice,cash:ratio(cashOpex,output),variable:ratio(variableCosts,output),
  fixedCash:ratio(fixedCashCosts,output),depreciation:ratio(depreciation,output),totalCosts:ratio(totalCosts,output),tax:ratio(tax,output),net:ratio(net,output)}:null;

 // Fixed and non-cash budgets run by month. The yearly flow of material and running budget follow its own calendar.
 const yearInput=lines*yearHoursPerLine*basis.inputRate,yearOutput=yearInput*totalYield,yearRevenue=yearOutput*netPrice;
 const yearFixedCashCosts=config.monthsPerYear*fixedCashCosts,yearDepreciation=config.monthsPerYear*depreciation;
 const yearVariableCosts=yearInput*config.feedstockPrice+lines*yearHoursPerLine*basis.runningCashPerHour;
 const yearCashOpex=yearFixedCashCosts+yearVariableCosts,yearCosts=yearCashOpex+yearDepreciation;
 const yearPretax=yearRevenue-yearCosts,yearTax=Math.max(0,yearPretax)*config.taxRate,yearNet=yearPretax-yearTax;
 const annualOperatingCash=yearNet+yearDepreciation;
 const yearFactor=ratio(basis.yearHours,basis.monthHours);
 const yearBreakEvenInput=contribution>0?ratio(yearFixedCashCosts+yearDepreciation,yearFactor*contribution):null;
 const minimumInput=breakEven==null||yearBreakEvenInput==null?null:Math.max(breakEven,yearBreakEvenInput);
 const fullHourCosts=basis.inputRate*config.feedstockPrice+basis.runningCashPerHour;
 const fullMonthCosts=basis.fixedCashOpex+basis.depreciation+fullHourCosts*basis.monthHours;
 const fullYearCosts=config.monthsPerYear*(basis.fixedCashOpex+basis.depreciation)+fullHourCosts*basis.yearHours;
 const monthFloor=ratio(fullMonthCosts*(1+config.vatRate),basis.referenceOutput);
 const yearFloor=ratio(fullYearCosts*(1+config.vatRate),basis.yearHours*basis.outputRate);
 const minimumPriceStep=basis.minimumPriceStep??10;
 const minimumGrossPrice=monthFloor==null||yearFloor==null?null:Math.ceil(Math.max(monthFloor,yearFloor)/minimumPriceStep)*minimumPriceStep;
 const mode={...basis,priceStages:scenarioPrices(basis).map(stage=>({...stage,label:new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(stage.price/1000)+' ₽/кг'}))};
 const equipmentInvestment=Number.isFinite(basis.equipmentCost)&&basis.equipmentCost>0?basis.equipmentCost*lines:null;

 const result={
  state,mode,capacity,load,totalYield,output,other:state.input-output,grossPrice,salePrice:grossPrice,netPrice,grossRevenue,outputVat:grossRevenue-revenue,
  revenue,costs,feedCost,variableCosts,fixedCashCosts,fixedCosts,cashOpex,depreciation,totalCosts,pretax,tax,net,
  margin:ratio(net,revenue),perProduct,perInput:ratio(net,state.input),hoursPerLine,contribution,breakEven,
  yearInput,yearOutput,yearOther:yearInput-yearOutput,yearRevenue,yearFixedCashCosts,yearVariableCosts,yearDepreciation,yearCashOpex,yearCosts,yearPretax,yearTax,yearNet,
  yearMargin:ratio(yearNet,yearRevenue),yearHoursPerLine,equipmentInvestment,annualOperatingCash,averageMonthlyOperatingCash:annualOperatingCash/config.monthsPerYear,
  yearBreakEvenInput,minimumInput,minimumLoad:ratio(minimumInput??NaN,capacity),minimumGrossPrice,
  breakEvenGrossPrice:ratio(totalCosts*(1+config.vatRate),output),yearBreakEvenGrossPrice:ratio(yearCosts*(1+config.vatRate),yearOutput),
  yearUnitCosts:ratio(yearCosts,yearOutput),
  breakEvenState:contribution<=0?'negative-contribution':breakEven>capacity?'outside-capacity':'within-capacity',
  donutAvailable:revenue>0&&net>=0,
  segments:[...costs,
   {id:'tax',label:'Налог на прибыль',description:'Начисляется на положительную прибыль до налогообложения.',value:tax,color:'#ded9cd'},
   {id:'profit',label:net>=0?'Чистая прибыль':'Убыток',description:'Результат после операционных расходов, амортизации и налога на прибыль.',value:net,color:net>=0?'#c6a43b':'#a54e44'},
  ],
 };
 return {...result,payback:equipmentPayback(result)};
}

export function profitCurve(value={},steps=40,minimumInput=0,config=economicsConfig){
 const state=normalizeEconomicsState(value,config),capacity=state.lines*productionBasis(state.mode,config).referenceInput;
 const count=clamp(Math.floor(finite(steps,40)),1,400),minimum=clamp(finite(minimumInput,0),0,capacity);
 return Array.from({length:count+1},(_,index)=>{
  const input=minimum+(capacity-minimum)*index/count;
  return {input,net:calculateEconomics({...state,input},config).net};
 });
}
