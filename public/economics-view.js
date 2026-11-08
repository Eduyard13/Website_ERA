import {economicsConfig as config} from './economics-config.js';
import {calculateEconomics,profitCurve} from './economics-model.js';

const number=(value,digits=0)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
export const tonnes=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(value)+' т';
export const money=value=>value==null||!Number.isFinite(value)?'—':number(value)+' ₽';
export const millions=value=>value==null||!Number.isFinite(value)?'—':number(value/1000000,2)+' млн ₽';
export const percentage=value=>value==null||!Number.isFinite(value)?'—':number(value*100,2)+'%';
export const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const dot=color=>`<span class="econ-color-dot" style="--segment-color:${color}" aria-hidden="true"></span>`;
export function renderModeSwitch(widget,mode='separation'){
 const labels={market:'цены продукции',monthly:'экономика за месяц','per-tonne':'на тонну готовой продукции',curve:'прибыль по загрузке'};
 return `<div class="business-segmented" role="group" aria-label="Сценарий: ${labels[widget]}" data-widget-switch="${widget}">${Object.entries(config.modes).map(([key,m])=>`<button type="button" ${widget==='market'?'data-market-mode':'data-econ-mode'}="${key}" aria-pressed="${mode===key}">${m.label}</button>`).join('')}</div>`;
}
export function priceStageText(result){
 return result.mode.priceStages.find(stage=>stage.price===result.grossPrice)?.period||'Выбранная расчётная цена';
}
export function renderPriceNote(result){
 return `<strong>${number(result.grossPrice/1000,Number.isInteger(result.grossPrice/1000)?0:2)} ₽/кг с НДС</strong><span>${number(result.grossPrice)} ₽/т с НДС · ${priceStageText(result)}</span>`;
}
export function renderPricePresets(result,market=false){
 return result.mode.priceStages.map(stage=>`<button type="button" ${market?'data-market-price':'data-econ-preset'}="${stage.price}" aria-pressed="${stage.price===result.grossPrice}"><strong>${stage.label}</strong><span>${stage.period}</span></button>`).join('');
}
export function renderMarketPrice(result){
 return `<div class="market-model-copy"><p class="eyebrow">РАСЧЁТНЫЙ СЦЕНАРИЙ ЭРА</p><h3 data-market-product>${result.mode.product}</h3><div class="market-model-price" data-market-selected-price>${renderPriceNote(result)}</div><p>${config.priceDisclosure}</p></div><div class="market-model-stages"><span>Ценовые варианты финансовой модели · с НДС 22%</span><div class="econ-price-presets" data-market-presets>${renderPricePresets(result,true)}</div><p>Выбранная цена используется в едином финансовом сценарии страницы.</p></div>`;
}
const point=(cx,cy,r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];
function ringPath(start,end){
 const pad=Math.min(.012,(end-start)/8),a=start+pad,b=end-pad;
 const outerStart=point(160,160,137,a),outerEnd=point(160,160,137,b),innerEnd=point(160,160,99,b),innerStart=point(160,160,99,a),large=b-a>Math.PI?1:0;
 const xy=p=>p.map(v=>v.toFixed(3)).join(' ');
 return `M${xy(outerStart)}A137 137 0 ${large} 1 ${xy(outerEnd)}L${xy(innerEnd)}A99 99 0 ${large} 0 ${xy(innerStart)}Z`;
}
export function renderMonth(result){
 if(!result.donutAvailable)return `<div class="econ-loss-state" data-econ-loss><span>${result.revenue>0?'Расходы превышают выручку':'Нет выручки при выбранных параметрах'}</span><strong>${millions(result.net)}</strong><p>${result.state.input===0?'При нулевой загрузке остаются постоянные расходы и амортизация.':'Выбранная цена и нагрузка не покрывают затраты.'}</p></div><div class="econ-cost-table-wrap"><table class="econ-cost-table"><caption>Расходы и результат за месяц · без НДС</caption><thead><tr><th scope="col">Статья</th><th scope="col">Сумма</th></tr></thead><tbody>${result.segments.map(s=>`<tr><th scope="row">${dot(s.color)}${escape(s.label)}</th><td>${money(s.value)}<small>${result.revenue>0?percentage(s.value/result.revenue)+' выручки':'—'}</small></td></tr>`).join('')}</tbody></table></div>`;
 let angle=-Math.PI/2;
 const arcs=result.segments.filter(s=>s.value>0).map(s=>{const next=angle+s.value/result.revenue*Math.PI*2;const path=`<path d="${ringPath(angle,next)}" fill="${s.color}" data-segment="${s.id}"><title>${escape(s.label)}: ${money(s.value)}, ${percentage(s.value/result.revenue)}</title></path>`;angle=next;return path;}).join('');
 return `<div class="econ-month-layout"><div class="econ-ring-column"><div class="econ-ring"><svg viewBox="0 0 320 320" role="img" aria-label="Выручка без НДС ${millions(result.revenue)} за месяц: расходы, амортизация, налог и чистая прибыль"><circle cx="160" cy="160" r="118" fill="none" stroke="#ebe5d9" stroke-width="38"/>${arcs}</svg><div class="econ-ring-center"><span data-ring-label>Выручка без НДС</span><strong data-ring-value>${millions(result.revenue)}</strong><small data-ring-share>за месяц</small></div></div><p class="econ-segment-detail" data-segment-detail>Выберите статью на кольце или в легенде, чтобы увидеть её состав.</p></div><div class="econ-legend" aria-label="Статьи выручки без НДС за месяц">${result.segments.map(s=>`<button type="button" data-segment="${s.id}" aria-pressed="false" aria-label="${escape(s.label)}: ${money(s.value)} за месяц, ${percentage(s.value/result.revenue)} выручки. ${escape(s.description)}">${dot(s.color)}<span>${escape(s.label)}<strong>${millions(s.value)}</strong></span><small>${percentage(s.value/result.revenue)}</small></button>`).join('')}</div></div>`;
}
export function renderBridge(result,unit='tonne'){
 if(result.perProduct&&Object.values(result.perProduct).some(value=>!Number.isFinite(value)))return `<div class="econ-no-output"><strong>Объём слишком мал для расчёта на единицу продукции</strong><p>Увеличьте входящий тоннаж. Месячные постоянные расходы и амортизация продолжают учитываться.</p></div>${unitTotals(result)}`;
 if(!result.perProduct)return `<div class="econ-no-output"><strong>Товарного выпуска пока нет</strong><p>Показатели на тонну продукции появятся при положительном выходе. Постоянные расходы и амортизация продолжают учитываться.</p></div>${unitTotals(result)}`;
 const p=result.perProduct,steps=[
  {label:'Цена без НДС',start:0,end:p.price,value:p.price,color:'#242844'},
  {label:'Денежные расходы',start:p.price,end:p.price-p.cash,value:-p.cash,color:'#747b94'},
  {label:'Амортизация',start:p.price-p.cash,end:p.price-p.cash-p.depreciation,value:-p.depreciation,color:'#aaa99e'},
  {label:'Налог на прибыль',start:p.price-p.cash-p.depreciation,end:p.net,value:-p.tax,color:'#d2ccbf'},
  {label:p.net>=0?'Чистая прибыль':'Убыток',start:0,end:p.net,value:p.net,color:p.net>=0?'#c6a43b':'#a54e44'},
 ];
 const low=Math.min(0,...steps.flatMap(s=>[s.start,s.end])),high=Math.max(1,...steps.flatMap(s=>[s.start,s.end])),span=high-low;
 const x=v=>(v-low)/span*100,label=unit==='kg'?'кг':'т';
 const display=v=>number(v/(unit==='kg'?1000:1),unit==='kg'?2:0)+' ₽/'+label;
 return `<figure class="ec-waterfall" aria-label="Финансовый мост на единицу товарной продукции"><figcaption>От цены без НДС до чистой прибыли · ₽/${label}</figcaption><div class="ec-waterfall-rows">${steps.map(s=>`<div class="ec-waterfall-row"><span>${s.label}</span><div class="ec-waterfall-track"><i class="ec-waterfall-zero" style="left:${x(0)}%"></i><i class="ec-waterfall-bar" style="left:${x(Math.min(s.start,s.end))}%;width:${Math.abs(x(s.end)-x(s.start))}%;background:${s.color}"></i></div><strong data-bridge-value>${display(s.value)}</strong></div>`).join('')}</div><div class="ec-waterfall-scale"><span>${display(low)}</span><span>Общая денежная шкала</span><span>${display(high)}</span></div></figure>${unitTotals(result)}`;
}
function unitTotals(result){
 const label=result.net<0?'Убыток':'Чистая прибыль';
 return `<div class="econ-unit-totals"><div><span>${label} / т готовой продукции</span><strong>${money(result.perProduct?.net)}/т</strong></div><div><span>${label} / т входящего сырья</span><strong>${money(result.perInput)}/т</strong></div></div>`;
}
export function breakEvenText(result){
 if(result.breakEvenState==='negative-contribution')return 'При этой цене доход на тонну входа не покрывает переменные затраты. Безубыточность недостижима в рамках модели.';
 if(result.breakEvenState==='outside-capacity')return `Точка безубыточности ${tonnes(result.breakEven)} входа в месяц находится за пределом мощности ${tonnes(result.capacity)}.`;
 return `Точка безубыточности — ${tonnes(result.breakEven)} входящего сырья в месяц при выбранной цене.`;
}
function curvePlot(result,points,compact){
 const values=points.map(p=>p.net),min=Math.min(0,...values),max=Math.max(0,...values),padding=Math.max((max-min)*.12,100000),low=min-padding,high=max+padding;
 const width=compact?430:930,height=340,left=compact?62:92,right=width-24;
 const x=t=>left+t/result.capacity*(right-left),y=v=>56+(high-v)/(high-low)*196;
 const path=points.map((p,i)=>`${i?'L':'M'}${x(p.input).toFixed(2)} ${y(p.net).toFixed(2)}`).join(' ');
 const zero=y(0),currentX=x(result.state.input),currentY=y(result.net);
 const ticks=[0,result.capacity/2,result.capacity].map((t,i)=>`<text x="${x(t)}" y="281" text-anchor="${i===0?'start':i===2?'end':'middle'}" class="econ-svg-note">${number(t,Number.isInteger(t)?0:1)}</text>`).join('');
 const profitTicks=[max,0,min].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<text x="${left-10}" y="${y(v)+4}" text-anchor="end" class="econ-svg-note">${number(v/1000000,1)}</text>`).join('');
 return `<div class="econ-curve-plot econ-curve-plot--${compact?'compact':'wide'}"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(resultSummary(result))}">${compact?'':`<text x="${left}" y="23" class="econ-svg-note">Чистая прибыль, млн ₽/месяц</text>`}<rect x="${left}" y="${zero.toFixed(2)}" width="${right-left}" height="${Math.max(0,260-zero).toFixed(2)}" fill="#a54e440b"/>${result.breakEvenState==='within-capacity'?`<path d="M${x(result.breakEven).toFixed(2)} 56V260" stroke="#a54e44" stroke-dasharray="3 5"/><circle cx="${x(result.breakEven).toFixed(2)}" cy="${zero.toFixed(2)}" r="4" fill="#a54e44"><title>Точка безубыточности: ${tonnes(result.breakEven)} входа в месяц</title></circle>`:''}<path d="M${left} ${zero.toFixed(2)}H${right}" stroke="#aaa89f" stroke-dasharray="5 5"/><path d="M${left} 260H${right}" stroke="#d8d2c7"/><path d="${path}L${right} ${zero.toFixed(2)}L${left} ${zero.toFixed(2)}Z" fill="#c6a43b13"/><path d="${path}" fill="none" stroke="#242844" stroke-width="3" stroke-linecap="round"/><path d="M${currentX.toFixed(2)} ${currentY.toFixed(2)}V260" stroke="#ae8c31" stroke-dasharray="4 4"/><circle cx="${currentX.toFixed(2)}" cy="${currentY.toFixed(2)}" r="6" fill="${result.net>=0?'#c6a43b':'#a54e44'}" stroke="#f7f4ee" stroke-width="3"/>${ticks}${profitTicks}<text x="${(left+right)/2}" y="321" text-anchor="middle" class="econ-svg-note">Входящее сырьё, т/месяц</text></svg><div class="econ-point-label${currentY<120?' econ-point-label--below':''}${result.net<0?' econ-point-label--loss':''}" style="--plot-left:${left/width*100}%;--point-x:${currentX/width*100}%;--point-y:${currentY/height*100}%" data-point-label><strong>${millions(result.net)}/мес.</strong><span>${result.net<0?'Убыток':'Чистая прибыль'}</span></div></div>`;
}
export function renderCurve(result){
 const points=profitCurve(result.state);
 return `<figure class="econ-curve-figure">${curvePlot(result,points,false)}${curvePlot(result,points,true)}<figcaption><span>X — Входящее сырьё, т/месяц.</span> <span>Y — Чистая прибыль, млн ₽/месяц.</span><strong data-curve-accessible-result>${escape(resultSummary(result))}</strong></figcaption></figure><p class="econ-break-even" data-break-even>${escape(breakEvenText(result))}</p>`;
}
export function resultSummary(result){return `${result.mode.label}: вход ${tonnes(result.state.input)}, выпуск ${tonnes(result.output)}, выручка без НДС ${millions(result.revenue)}, ${result.net>=0?'чистая прибыль':'убыток'} ${millions(result.net)}, рентабельность продаж ${percentage(result.margin)}.`;}
export function initialResult(){return calculateEconomics();}
