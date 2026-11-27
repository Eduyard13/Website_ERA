import {escape,tonnes} from './economics-view.js';

export const decimal=(value,max=2,min=0)=>value==null||!Number.isFinite(value)?'—':
 new Intl.NumberFormat('ru-RU',{maximumFractionDigits:max,minimumFractionDigits:min}).format(value).replace(/^-/,'−');
export const percent=(value,max=1)=>value==null?'—':decimal(value*100,max)+'%';
export const priceText=(value,decimals=0)=>value==null?'—':decimal(value/1000,2,decimals)+' ₽/кг';
export const compact=(amount,currency='₽')=>{
 if(amount==null||!Number.isFinite(amount))return '—';
 if(Math.abs(amount)>=1e6)return decimal(amount/1e6,2,2)+' млн '+currency;
 if(currency==='$'&&Math.abs(amount)>=1000)return decimal(amount/1000,2,2)+' тыс. $';
 return decimal(amount,currency==='$'?2:0)+' '+currency;
};
export const rublesPerTonne=amount=>amount==null?'—':decimal(amount,0)+' ₽/т';
export const day=iso=>iso?iso.split('-').reverse().join('.'):'Не указана';
export const paybackLabel=result=>{
 const {status,months}=result.payback;
 if(status==='estimate')return months.map(n=>decimal(n,1,1)).join('–')+' мес.';
 return status==='unreachable'?'Не определяется':'Индивидуальная оценка';
};
const annualLabel=r=>r.yearNet<0?'Расчётный убыток за стабильный год':'Расчётная чистая прибыль за стабильный год';
export const monthLabel=r=>r.net<0?'Расчётный убыток в месяц':'Расчётная чистая прибыль в месяц';
export const massText=(amount,period)=>period==='hour'?decimal(amount*1000)+' кг/ч':decimal(amount)+' т';
export const complexes=n=>n===1?'1 комплекс':n>=2&&n<=4?n+' комплекса':n+' комплексов';
export function scenarioTopic(r){
 return `Полный цикл · ${complexes(r.state.lines)} · ${priceText(r.grossPrice)} с НДС · загрузка ${percent(r.load)} · выход ${percent(r.totalYield)} · ${tonnes(r.output)}/мес. · результат ${compact(r.net)}/мес. и ${compact(r.yearNet)}/год`;
}
export const requestHref=r=>'/contacts?topic='+encodeURIComponent(scenarioTopic(r))+'#project-form';
export const fxLabel=fx=>fx?
 `Курс ЦБ РФ · 1 USD = ${decimal(fx.rateRubPerUsd,4,2)} ₽ · действует с ${day(fx.effectiveDate)}${fx.status==='live'?'':fx.status==='stale'?' · последний доступный курс':' · сохранённый курс'}`:
 'Курс ЦБ РФ недоступен';
const unavailableUsd='USD недоступен';
const dollars=(n,fx)=>fx&&n!=null?'≈ '+compact(n/fx.rateRubPerUsd,'$'):unavailableUsd;
const roundedDollars=(amount,fx,step,unit,label)=>fx?
 `≈ ${decimal(Math.round(amount/fx.rateRubPerUsd/step)*step/unit,1)} ${label} $`:unavailableUsd;

export function financialValues({config,state,result:r,network:n,balance,fx}){
 const {period}=state;
 const netPerTonne=r.perProduct?.net??null;
 const monthMillions=state.scenario==='base'&&r.yearNet>0?Math.round(r.net/1e6):0;
 const roundedHeadline=monthMillions>0;
 const yearMillions=monthMillions*config.monthsPerYear;
 const payback=paybackLabel(r);
 return {
  monthLabel:monthLabel(r),yearLabel:annualLabel(r),
  heroMonthNet:roundedHeadline?`≈ ${decimal(monthMillions,0)} млн ₽`:compact(r.net),
  heroYearNet:roundedHeadline?`≈ ${decimal(yearMillions,0)} млн ₽`:compact(r.yearNet),
  heroMonthUsd:roundedHeadline?roundedDollars(monthMillions*1e6,fx,10000,1000,'тыс.'):dollars(r.net,fx),
  heroYearUsd:roundedHeadline?roundedDollars(yearMillions*1e6,fx,100000,1e6,'млн'):dollars(r.yearNet,fx),
  heroPayback:state.scenario==='base'&&r.payback.status==='individual'?'≈ 1 год':payback,
  monthNet:compact(r.net),yearNet:compact(r.yearNet),monthUsd:dollars(r.net,fx),yearUsd:dollars(r.yearNet,fx),
  price:priceText(r.grossPrice),payback,rate:fxLabel(fx),
  unitPrice:priceText(r.netPrice,2),unitCost:priceText(r.perProduct?.totalCosts,2),unitTax:priceText(r.perProduct?.tax,2),
  unitProfit:priceText(netPerTonne,2),tonneNet:rublesPerTonne(netPerTonne),
  tonneUsd:fx&&netPerTonne!=null?'≈ '+decimal(netPerTonne/fx.rateRubPerUsd,2)+' $/т':unavailableUsd,
  margin:percent(r.margin),revenue:compact(r.revenue),expenses:compact(r.totalCosts),
  output:tonnes(r.output),yearOutput:tonnes(r.yearOutput),load:percent(r.load),
  balanceInput:massText(balance.input,period),balanceOutput:massText(balance.output,period),
  balanceOther:massText(balance.input-balance.output,period),
  networkSize:complexes(n.state.lines),networkMonth:compact(n.net),networkMonthLabel:monthLabel(n),
  networkYear:compact(n.yearNet),networkYearLabel:annualLabel(n),networkMonthUsd:dollars(n.net,fx),networkYearUsd:dollars(n.yearNet,fx),
  networkInput:tonnes(n.state.input),networkOutput:tonnes(n.output),networkYearOutput:tonnes(n.yearOutput),
  networkRevenue:compact(n.revenue),networkMargin:percent(n.margin),networkPayback:paybackLabel(n),
  networkInvestment:compact(n.equipmentInvestment),networkInvestmentUsd:dollars(n.equipmentInvestment,fx),
 };
}

export function renderAllocation(result){
 const rows=[['cost','Полная себестоимость',result.totalCosts],['tax','Налог на прибыль',result.tax],
  ['profit',result.net<0?'Убыток':'Чистая прибыль',result.net]];
 const available=result.revenue>0&&result.net>=0;
 const share=value=>available?value/result.revenue:null;
 const segments=available?`<div class="ec-allocation-track" aria-hidden="true">${rows.map(([key,,amount])=>
  `<span data-part="${key}" style="flex-basis:${share(amount)*100}%"></span>`).join('')}</div>`:'';
 return `${segments}<dl class="ec-allocation-items">${rows.map(([key,label,amount])=>
  `<div data-part="${key}"><dt>${label}</dt><dd>${compact(amount)}${available?` <small>${percent(share(amount),2)}</small>`:''}</dd></div>`).join('')}</dl>`;
}

function chartDomain(values){
 const low=Math.min(0,...values),high=Math.max(0,...values);
 const rough=(high-low)/4||1;
 const magnitude=10**Math.floor(Math.log10(rough));
 const step=([1,2,2.5,5,10].find(n=>n*magnitude>=rough)??10)*magnitude;
 const from=Math.floor(low/step),to=Math.max(from+1,Math.ceil(high/step));
 return {ticks:Array.from({length:to-from+1},(_,i)=>(from+i)*step),low:from*step,high:to*step};
}
export function renderProfitChart(stages,selected){
 const values=stages.map(stage=>stage.result.net/1e6);
 const {ticks,low,high}=chartDomain(values);
 const top=value=>(high-value)/(high-low)*100;
 const scale=ticks.map(value=>`<span data-zero="${value===0}" style="--at:${top(value)}%">${decimal(value)}</span>`).join('');
 const columns=stages.map(({id,price,result},index)=>{
  const v=values[index],a=top(Math.max(0,v)),b=top(Math.min(0,v));
  return `<div class="ec-bar-column" data-active="${id===selected}" data-loss="${v<0}" aria-label="${priceText(price)} с НДС. ${monthLabel(result)} ${compact(result.net)}">
   <div class="ec-bar-plot"><i style="top:${a}%;height:${b-a}%"></i><b style="--at:${v<0?b:a}%">${decimal(v)}</b></div>
   <span class="ec-bar-label">${priceText(price)}</span>
  </div>`;
 }).join('');
 return `<div class="ec-profit-chart" role="group" aria-label="Сравнение чистой прибыли, млн рублей в месяц">
  <div class="ec-chart-scale" aria-hidden="true">${scale}</div><div class="ec-bar-columns">${columns}</div>
 </div>`;
}

export function renderResilienceScale({threshold,basePrice,reserve}){
 if(threshold==null)return '<p class="ec-scale-missing">Цена безубыточности не определяется при текущем выпуске.</p>';
 const upper=Math.max(basePrice,threshold,1)*1.08;
 const from=threshold/upper*100,to=basePrice/upper*100;
 const start=Math.min(from,to),length=Math.abs(from-to);
 return `<div class="ec-price-scale" role="group" aria-label="Цена реализации с НДС. Порог ${priceText(threshold,2)}. Базовая цена ${priceText(basePrice)}.">
  <div class="ec-scale-legend">
   <div><span>Цена безубыточности</span><strong>${priceText(threshold,2)}</strong></div>
   <div class="ec-scale-reserve" data-negative="${reserve<0}"><span>${reserve<0?'До порога не хватает':'Запас цены'}</span><strong>${priceText(Math.abs(reserve),2)}</strong></div>
   <div><span>Базовая цена</span><strong>${priceText(basePrice)}</strong></div>
  </div>
  <div class="ec-scale-track" style="--threshold:${from}%;--base:${to}%;--gap-start:${start}%;--gap-length:${length}%">
   <span class="ec-scale-threshold" title="Нулевой результат">0</span><span class="ec-scale-base" title="Базовый сценарий"></span>
  </div>
  <div class="ec-scale-caption"><span>До порога · убыток</span><span>На пороге · нулевой результат</span><span>Выше порога · прибыль</span></div>
 </div>`;
}

export const valueMarkup=(values,key,tag='strong')=>`<${tag} data-econ-value="${key}">${escape(values[key])}</${tag}>`;
