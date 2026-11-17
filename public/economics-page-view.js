import {economicsConfig as config} from './economics-config.js';
import {escape,money,millions,percentage,tonnes} from './economics-view.js';

export const decimal=(value,digits=2)=>value==null||!Number.isFinite(value)?'—':new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
export const unitMoney=(value,unit='kg')=>value==null||!Number.isFinite(value)?'—':`${decimal(value/(unit==='kg'?1000:1),unit==='kg'?2:0)} ₽/${unit==='kg'?'кг':'т'}`;
export const modeLabel=result=>result.state.mode==='full'?'Полный цикл':'Сухая сепарация';
export function paybackLabel(result){
 const p=result.payback;
 if(p.status==='estimate')return p.months.map(n=>decimal(n,1)).join('–')+' мес.';
 if(p.status==='unreachable')return 'Не достигается в выбранном сценарии';
 if(p.status==='review')return 'Требуется инвестиционная оценка';
 return 'Индивидуальная оценка';
}
export function scenarioTopic(r){
 return `Экономическое обоснование ЭРА · ${modeLabel(r)} · ${decimal(r.grossPrice/1000,2)} ₽/кг с НДС · ${r.state.lines} компл. · загрузка ${percentage(r.load)} · вход ${tonnes(r.state.input)}/мес. · выпуск ${tonnes(r.output)}/мес. · результат ${millions(r.net)}/мес. и ${millions(r.yearNet)}/год`;
}
export const requestHref=r=>'/contacts?topic='+encodeURIComponent(scenarioTopic(r))+'#project-form';
export function financialValues(r){
 return {input:tonnes(r.state.input),output:tonnes(r.output),yearInput:tonnes(r.yearInput),yearOutput:tonnes(r.yearOutput),
  revenue:millions(r.revenue),yearRevenue:millions(r.yearRevenue),costs:millions(r.totalCosts),yearCosts:millions(r.yearCosts),tax:millions(r.tax),yearTax:millions(r.yearTax),
  profit:millions(r.net),yearNet:millions(r.yearNet),profitMillions:decimal(r.net/1e6),yearNetMillions:decimal(r.yearNet/1e6),margin:percentage(r.margin),yearMargin:percentage(r.yearMargin),
  cost:unitMoney(r.perProduct?.totalCosts),yearUnitCosts:unitMoney(r.yearUnitCosts),grossPrice:decimal(r.grossPrice/1000,Number.isInteger(r.grossPrice/1000)?0:2)+' ₽/кг',grossTonne:decimal(r.grossPrice,2)+' ₽/т',
  minimumInput:tonnes(r.minimumInput),minimumLoad:percentage(r.minimumInput/r.capacity),minimumPrice:unitMoney(r.minimumGrossPrice),
  netPrice:unitMoney(r.netPrice),load:percentage(r.load),mode:modeLabel(r),product:r.mode.product,yield:percentage(r.totalYield),remainder:tonnes(r.state.input-r.output),remainderShare:percentage(1-r.totalYield),
  paybackLabel:paybackLabel(r),breakEvenPrice:unitMoney(r.breakEvenGrossPrice),yearBreakEvenPrice:unitMoney(r.yearBreakEvenGrossPrice),
  breakEven:r.breakEvenState==='within-capacity'?tonnes(r.breakEven)+'/мес.':r.breakEvenState==='outside-capacity'?'За пределом мощности':'Недостижим',
  priceHeadroom:r.breakEvenGrossPrice==null?'—':unitMoney(r.grossPrice-r.breakEvenGrossPrice),yearOperatingCash:millions(r.annualOperatingCash),
  yearFixedCash:millions(r.yearFixedCashCosts),yearVariableCash:millions(r.yearVariableCosts),yearDepreciation:millions(r.yearDepreciation),
  unitPrice:unitMoney(r.netPrice),unitCost:unitMoney(r.perProduct?.totalCosts),unitTax:unitMoney(r.perProduct?.tax),unitProfit:unitMoney(r.perProduct?.net)};
}
export function renderScenarioPresets(result){
 return result.mode.priceStages.map(stage=>`<button type="button" data-econ-preset="${stage.price}" aria-pressed="${stage.price===result.grossPrice}"><strong>${stage.label}</strong><span>${escape(stage.period)}</span></button>`).join('');
}
export function groupedMonth(result){
 if(result.load<1-1e-12)return result;
 const groups=[
  ['feedstock','Сырьё',['feedstock'],'#242844'],
  ['payroll','Фонд оплаты труда и взносы',['payroll'],'#414663'],
  ['utilities','Энергия и вода',['electricity','water'],'#737b8f'],
  ['other','Остальные производственные расходы',['reagents','transport','ppe','supplies','office','disposal','building'],'#a9aa99'],
  ['depreciation','Амортизация',['depreciation'],'#bcb5a7'],
  ['tax','Налог на прибыль',['tax'],'#ded9cd'],
  ['profit',result.net<0?'Убыток':'Чистая прибыль',['profit'],result.net<0?'#a54e44':'#c6a43b'],
 ];
 const segments=groups.map(([id,label,ids,color])=>{
  const members=result.segments.filter(s=>ids.includes(s.id));
  return {id,label,color,value:members.reduce((sum,s)=>sum+s.value,0),members,description:members.map(s=>`${s.label}: ${money(s.value)}. ${s.description}`).join(' ')};
 });
 return {...result,segments};
}
export function renderCostDetails(result){
 return `<div class="ec-table-scroll"><table class="ec-table"><caption>Все статьи расходов и результат · за месяц, без НДС</caption><thead><tr><th scope="col">Статья и основание</th><th scope="col">Сумма, ₽/мес.</th></tr></thead><tbody>${result.segments.map(s=>`<tr><th scope="row">${escape(s.label)}<small>${escape(s.description)}</small></th><td>${money(s.value)}</td></tr>`).join('')}</tbody></table></div>`;
}
export function renderUnitDetail(result){
 return `<div class="ec-table-scroll"><table class="ec-table"><caption>Состав себестоимости рабочего месяца</caption><thead><tr><th scope="col">Статья</th><th scope="col">₽/кг</th><th scope="col">₽/т</th></tr></thead><tbody>${result.costs.map(s=>`<tr><th scope="row">${escape(s.label)}</th><td>${unitMoney(result.output>0?s.value/result.output:null)}</td><td>${unitMoney(result.output>0?s.value/result.output:null,'tonne')}</td></tr>`).join('')}</tbody></table></div><p class="ec-note">${result.load<1-1e-12?'При частичной загрузке доступны только постоянные и переменные денежные расходы. Коэффициенты отдельных статей не заданы.':'Детализация рабочего месяца финансовых моделей ЭРА. Амортизация включена в себестоимость один раз.'}</p>`;
}
export function renderSpecialist(result){
 const rows=[['Входящая смесь',tonnes(result.state.input)+' / месяц'],['Товарный выход',percentage(result.totalYield)],['Нормативный месяц',`${config.monthDays} день · ${config.availableHours} часа на комплект`],['Часы при выбранной загрузке',decimal(result.hoursPerLine,1)+' ч на комплект'],['Предельный товарный выпуск',tonnes(result.state.lines*config.modes[result.state.mode].referenceOutput)+' / месяц'],['Цена закупки смеси','6 000 ₽/т без доставки и входящего НДС'],['Постоянные денежные расходы',money(result.fixedCashCosts)],['Переменные денежные расходы',money(result.variableCosts)],['Амортизация',money(result.depreciation)],['Производственный штат',`${result.mode.staff*result.state.lines} человек · ${config.activeSorters*result.state.lines} сортировщика в активной смене`],['База площадки','Существующий цех с готовой инфраструктурой'],['НДС / налог на прибыль','22% / 25% положительной прибыли']];
 return `<dl class="ec-assumptions">${rows.map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('')}</dl><p>Постоянные расходы и амортизация сохраняются при любой загрузке. Переменная часть меняется пропорционально входящему тоннажу. Для 2–3 комплектов масштабируются мощность, штат и расходы; экономия масштаба не заложена.</p><p>Тарифы, зарплаты, влажность, засорённость, ПТР и закупочная цена здесь не являются регулируемыми параметрами: индивидуальный пересчёт выполняется по согласованным исходным данным.</p><p>Полный цикл ограничен рабочей производительностью гранулятора 750 кг/ч, то есть 558 т/месяц на комплект. Электроэнергия сохранена по рабочему столбцу полной модели.</p><p>Самостоятельная ЛСП не включает сушильную установку, мойку и грануляцию. В составе линии горячей мойки гранулятор предусмотрен; при собственной грануляции возможна поставка без него.</p><p>Новая аренда и строительство не включены. Выручка рассчитывается без НДС, амортизация вычитается один раз, налог начисляется только на положительную прибыль. Календарный денежный поток, финансирование и капитальные вложения требуют отдельного инвестиционного расчёта.</p>`;
}
export function productCopy(mode){
 return mode==='full'?{
  title:'Вторичная ПЭ-гранула для нового производства',src:'/assets/presentation/granules.webp',width:390,height:304,alt:'Существующий образец вторичной полиэтиленовой гранулы ЭРА',caption:'Образец высококачественной вторичной ПЭ-гранулы',
  passport:`<div><dt>Остаточные посторонние включения</dt><dd><strong>30–70 ppm</strong><span>30–70 г/т · 0,003–0,007% по массе · целевой показатель ЭРА</span></dd></div><div><dt>Показатель текучести расплава (ПТР)</dt><dd><strong>0,8–1,2 г/10 мин</strong><span>190 °C / 2,16 кг · предварительный ориентир под плёнки и пакеты. Значение конкретной партии закрепляется в спецификации; диапазон не является универсальным для всех плёночных марок.</span></dd></div><div><dt>Назначение</dt><dd>Плёнки, пакеты и другая ПЭ-продукция по согласованной спецификации и результатам пробной переработки.</dd></div><div><dt>Основа стоимости</dt><dd>Чистота, стабильность состава и требуемый ПТР определяют промышленное применение и цену партии.</dd></div>`,
  applications:'Производство плёнок и пакетов, отдельных ПЭ-изделий и другие согласованные применения. Подбор рецептуры и требования к материалу зависят от изделия и оборудования покупателя.',
  href:'/technology#granule-quality',link:'Как обеспечивается качество гранулы',
 }:{
  title:'Очищенная полиэтиленовая плёночная фракция',src:'/assets/project-home/products/clean_film_bale.webp',width:960,height:1704,alt:'Реальная очищенная полиэтиленовая плёнка после подготовки на оборудовании ЭРА',caption:'Очищенная плёночная фракция после переработки',
  passport:`<div><dt>Товарный продукт</dt><dd><strong>Очищенная плёнка</strong><span>Подготовленная фракция для следующего передела</span></dd></div><div><dt>Форма отгрузки</dt><dd>По комплектации линии. В расширенной линии сепарации — прессование в тюки.</dd></div><div><dt>Назначение</dt><dd>Дальнейшая мойка и грануляция на предприятии покупателя.</dd></div><div><dt>Приёмка партии</dt><dd>По полимерному составу, остаточным загрязнениям и согласованным требованиям покупателя.</dd></div>`,
  applications:'Поставки переработчикам плёночного сырья с собственной мойкой и грануляцией. Требования к составу, загрязнениям и форме поставки закрепляются с покупателем партии.',
  href:'/catalog/lines/separatsiya-02',link:'Оборудование сухой сепарации',
 };
}
export function basisText(result){return `${result.state.lines} ${result.state.lines===1?'комплект':'комплекта'} · вход ${tonnes(result.state.input)}/мес. · ${decimal(result.hoursPerLine,1)} ч из нормативных 744 ч/мес. · товарный выход ${percentage(result.totalYield)} · штат ${result.mode.staff*result.state.lines} человек · ${config.activeSorters*result.state.lines} сортировщика в активной смене.`;}
