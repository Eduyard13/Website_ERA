import {calculateEconomics,profitCurve} from './economics-model.js';

const number=(value,digits=0)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
export const tonnes=value=>number(value,Number.isInteger(value)?0:1)+' т';
export const money=value=>value==null?'—':number(value)+' ₽';
export const millions=value=>value==null?'—':number(value/1000000,2)+' млн ₽';
export const percentage=value=>value==null?'—':number(value*100,1)+'%';
export const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const dot=color=>`<span class="econ-color-dot" style="--segment-color:${color}" aria-hidden="true"></span>`;
const point=(cx,cy,r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];
function ringPath(start,end){
 const pad=Math.min(.012,(end-start)/8),a=start+pad,b=end-pad;
 const outerStart=point(160,160,137,a),outerEnd=point(160,160,137,b),innerEnd=point(160,160,99,b),innerStart=point(160,160,99,a),large=b-a>Math.PI?1:0;
 const xy=p=>p.map(v=>v.toFixed(3)).join(' ');
 return `M${xy(outerStart)}A137 137 0 ${large} 1 ${xy(outerEnd)}L${xy(innerEnd)}A99 99 0 ${large} 0 ${xy(innerStart)}Z`;
}
export function renderMonth(result){
 if(!result.donutAvailable)return `<div class="econ-loss-state" data-econ-loss><span>${result.revenue>0?'Расходы превышают выручку':'Нет выручки при выбранных параметрах'}</span><strong>${millions(result.net)}</strong><p>${result.state.input===0?'При нулевой загрузке остаются постоянные расходы.':'Выбранная цена, выход и нагрузка не покрывают затраты.'}</p></div><div class="econ-cost-table-wrap"><table class="econ-cost-table"><caption>Расходы и результат за месяц</caption><thead><tr><th scope="col">Статья</th><th scope="col">Сумма</th></tr></thead><tbody>${result.segments.map(s=>`<tr><th scope="row">${dot(s.color)}${escape(s.label)}</th><td>${money(s.value)}<small>${result.revenue>0?percentage(s.value/result.revenue)+' выручки':'—'}</small></td></tr>`).join('')}</tbody></table></div>`;
 let angle=-Math.PI/2;
 const arcs=result.segments.filter(s=>s.value>0).map(s=>{const next=angle+s.value/result.revenue*Math.PI*2;const path=`<path d="${ringPath(angle,next)}" fill="${s.color}" data-segment="${s.id}"><title>${escape(s.label)}: ${money(s.value)}, ${percentage(s.value/result.revenue)}</title></path>`;angle=next;return path;}).join('');
 return `<div class="econ-month-layout"><div class="econ-ring-column"><div class="econ-ring"><svg viewBox="0 0 320 320" role="img" aria-label="Выручка ${millions(result.revenue)} за месяц: расходы и прибыль"><circle cx="160" cy="160" r="118" fill="none" stroke="#ebe5d9" stroke-width="38"/>${arcs}</svg><div class="econ-ring-center"><span data-ring-label>Выручка</span><strong data-ring-value>${millions(result.revenue)}</strong><small data-ring-share>за месяц</small></div></div><p class="econ-segment-detail" data-segment-detail>Выберите статью на кольце или в легенде, чтобы увидеть её состав.</p></div><div class="econ-legend" aria-label="Статьи выручки за месяц">${result.segments.map(s=>`<button type="button" data-segment="${s.id}" aria-pressed="false" aria-label="${escape(s.label)}: ${money(s.value)} за месяц, ${percentage(s.value/result.revenue)} выручки. ${escape(s.description)}">${dot(s.color)}<span>${escape(s.label)}<strong>${millions(s.value)}</strong></span><small>${percentage(s.value/result.revenue)}</small></button>`).join('')}</div></div>`;
}

export function renderBridge(result){
 if(!result.perProduct)return `<div class="econ-no-output"><strong>Товарного выпуска пока нет</strong><p>Показатели на тонну продукции появятся при положительном выходе. Постоянные расходы продолжают учитываться в месячном результате.</p></div>${unitTotals(result)}`;
 const p=result.perProduct,steps=[
  {label:'Цена продажи',start:0,end:p.price,value:p.price,color:'#242844'},
  {label:'Переменные',start:p.price,end:p.price-p.variable,value:-p.variable,color:'#747b94'},
  {label:'Постоянные',start:p.price-p.variable,end:p.price-p.variable-p.fixed,value:-p.fixed,color:'#aaa99e'},
  {label:'Условный налог',start:p.price-p.variable-p.fixed,end:p.net,value:-p.tax,color:'#d2ccbf'},
  {label:p.net>=0?'Чистая прибыль':'Убыток',start:0,end:p.net,value:p.net,color:p.net>=0?'#c6a43b':'#a54e44'},
 ];
 const low=Math.min(0,...steps.flatMap(s=>[s.start,s.end])),high=Math.max(1,...steps.flatMap(s=>[s.start,s.end])),span=high-low;
 const x=v=>145+(v-low)/span*400;
 const bars=steps.map((s,i)=>{const y=40+i*50;return `<text x="0" y="${y+8}" class="econ-svg-label">${s.label}</text><rect x="${x(Math.min(s.start,s.end)).toFixed(2)}" y="${y-12}" width="${Math.abs(x(s.end)-x(s.start)).toFixed(2)}" height="24" rx="3" fill="${s.color}"><title>${s.label}: ${money(s.value)}</title></rect>${i>0&&i<4?`<path d="M${x(s.start).toFixed(2)} ${y-38}V${y-14}" stroke="#a9a69b" stroke-dasharray="3 3"/>`:''}`;}).join('');
 return `<figure class="econ-bridge-figure"><svg viewBox="0 0 580 290" role="img" aria-label="Экономический мост на тонну товарной продукции: ${escape(steps.map(s=>s.label+' '+money(s.value)).join(', '))}"><path d="M${x(0).toFixed(2)} 16V260" stroke="#a9a69b" stroke-dasharray="4 4"/>${bars}<text x="${x(0).toFixed(2)}" y="281" text-anchor="middle" class="econ-svg-note">0 ₽</text></svg><figcaption>От цены продажи до результата на тонну товарной продукции.</figcaption></figure><dl class="econ-bridge-values">${steps.map(s=>`<div><dt>${s.label}</dt><dd>${money(s.value)}</dd></div>`).join('')}</dl>${unitTotals(result)}`;
}
function unitTotals(result){return `<div class="econ-unit-totals"><div><span>Прибыль / т продукции</span><strong>${money(result.perProduct?.net)}</strong></div><div><span>Прибыль / т входного сырья</span><strong>${money(result.perInput)}</strong></div></div>`;}

export function breakEvenText(result){
 if(result.breakEvenState==='negative-contribution')return 'При этой цене и выходе доход на тонну входа не покрывает переменные затраты. Безубыточность недостижима в рамках модели.';
 if(result.breakEvenState==='outside-capacity')return `Точка безубыточности ${tonnes(result.breakEven)} входа в месяц находится за пределом мощности ${tonnes(result.capacity)}.`;
 return `Точка безубыточности — ${tonnes(result.breakEven)} входного сырья в месяц при выбранных параметрах.`;
}
export function renderCurve(result){
 const points=profitCurve(result.state),all=points.map(p=>p.net),min=Math.min(0,...all),max=Math.max(0,...all),padding=Math.max((max-min)*.12,100000),low=min-padding,high=max+padding;
 const left=92,right=836,x=t=>left+t/result.capacity*(right-left),y=v=>32+(high-v)/(high-low)*212;
 const path=points.map((p,i)=>`${i?'L':'M'}${x(p.input).toFixed(2)} ${y(p.net).toFixed(2)}`).join(' ');
 const zero=y(0),currentX=x(result.state.input),currentY=y(result.net);
 const ticks=[0,result.capacity/2,result.capacity].map(t=>`<text x="${x(t)}" y="278" text-anchor="middle" class="econ-svg-note">${tonnes(t)}</text>`).join('');
 const profitTicks=[max,0,min].filter((v,i,a)=>a.indexOf(v)===i).map(v=>`<text x="82" y="${y(v)+4}" text-anchor="end" class="econ-svg-note">${number(v/1000000,Math.abs(v)>=100000000?0:1)}</text>`).join('');
 return `<figure class="econ-curve-figure"><svg viewBox="0 0 930 300" role="img" aria-label="Прибыль в месяц по загрузке. При ${tonnes(result.state.input)} входа — ${millions(result.net)}. ${escape(breakEvenText(result))}"><text x="${left}" y="28" class="econ-svg-note">млн ₽ / месяц</text><path d="M${left} ${zero.toFixed(2)}H${right}" stroke="#aaa89f" stroke-dasharray="5 5"/><path d="M${left} 250H${right}" stroke="#d8d2c7"/><path d="${path}L${right} ${zero.toFixed(2)}L${left} ${zero.toFixed(2)}Z" fill="#c6a43b13"/><path d="${path}" fill="none" stroke="#242844" stroke-width="3" stroke-linecap="round"/><path d="M${currentX.toFixed(2)} ${currentY.toFixed(2)}V250" stroke="#ae8c31" stroke-dasharray="4 4"/><circle cx="${currentX.toFixed(2)}" cy="${currentY.toFixed(2)}" r="6" fill="${result.net>=0?'#c6a43b':'#a54e44'}" stroke="#f7f4ee" stroke-width="3"/>${ticks}${profitTicks}</svg><figcaption>Прибыль в месяц / тоннаж входного сырья. Загрузка меняется ползунком выше.</figcaption></figure><p class="econ-break-even" data-break-even>${escape(breakEvenText(result))}</p>`;
}

export function resultSummary(result){return `${result.mode.label}: вход ${tonnes(result.state.input)}, выпуск ${tonnes(result.output)}, выручка ${millions(result.revenue)}, ${result.net>=0?'прибыль':'убыток'} ${millions(result.net)}, рентабельность продаж ${percentage(result.margin)}.`;}

export function initialResult(){return calculateEconomics();}
