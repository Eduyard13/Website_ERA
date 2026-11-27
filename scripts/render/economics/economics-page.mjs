import {economicsConfig,marketOffers} from '../../../public/assets/js/economics/economics-config.js';
import {marketSources,additionalMarketSources} from '../../../public/assets/js/economics/economics-market.js';
import {createInvestmentStore,getFxSnapshot} from '../../../public/assets/js/economics/economics-page-state.js';
import {escape,tonnes} from '../../../public/assets/js/economics/economics-view.js';
import {compact,complexes,day,decimal,financialValues,monthLabel,paybackLabel,percent,priceText,renderAllocation,renderProfitChart,renderResilienceScale,requestHref,valueMarkup} from '../../../public/assets/js/economics/economics-page-view.js';
import {technologyContent} from '../../../content/pages/technology/technology-final.mjs';
import {siteContacts} from '../../../content/pages/contacts/contact.mjs';
import {eraMedallion,factoryArt,icon,networkArt,ribbon} from './economics-art.mjs';

const feed='/assets/project-home/hero/feedstock_hero';
const granules='/assets/lines/moyka-plenki/product-granule.webp';
const bales='/assets/lines/separatsiya-03/product-bales.webp';
const arrow='<span aria-hidden="true">↗</span>';
const granuleAlt='Образец гранулы из технического описания линии ЭРА';
const photoGranules=(alt=granuleAlt)=>`<img src="${granules}" width="600" height="394" alt="${alt}" loading="lazy" decoding="async">`;
const heading=(label,id,title,lead='',classes='')=>`<div class="ec-heading ${classes}">
 <p class="eyebrow">${label}</p><h2 id="${id}">${title}</h2>${lead?`<p class="ec-lead">${lead}</p>`:''}
</div>`;
const band=(mark,text,{art=false}={})=>`<div class="ec-band ec-indigo${art?' ec-band-art':''}">
 ${art?photoGranules(''):''}${icon(mark)}<div>${text}</div>${ribbon()}
</div>`;
const request=(r,scope,secondary=false)=>`<a href="${requestHref(r)}" class="button${secondary?' secondary':''}" data-project-request data-economics-request="${scope}">Оставить заявку ${arrow}</a>`;
const referenceLink=(id,text)=>`<a href="#${id}" class="ec-link" data-econ-reference-link aria-haspopup="dialog">${text} ${arrow}</a>`;
const referenceDialog=(id,title,body)=>`<dialog id="${id}" class="ec-reference-dialog" data-econ-reference aria-labelledby="${id}-title">
 <div class="ec-reference-heading"><h2 id="${id}-title">${title}</h2><form method="dialog"><button type="submit" aria-label="Закрыть справку">×</button></form></div>
 <div class="ec-reference-body">${body}</div>
</dialog>`;

function hero(snapshot,v){
 return `<section class="ec-hero ec-edge" id="economic-case" data-page-progress-label="Инвестиционный потенциал" aria-labelledby="economic-case-title">
 <div class="ec-hero-art"><img src="/assets/economics/hero.webp" srcset="/assets/economics/hero-720.webp 720w, /assets/economics/hero.webp 1448w" sizes="(max-width:767px) 100vw, 57vw" width="1448" height="1086" alt="Концептуальная композиция с гранулой, промышленной площадкой и золотой линией роста" fetchpriority="high" decoding="async"></div>
 <div class="ec-shell ec-hero-inner">
  <div class="ec-hero-copy">
   <p class="eyebrow">ЭРА / ЭКОНОМИКА ПОЛНОГО ЦИКЛА</p>
   <h1 id="economic-case-title">Переработка плёнки в гранулу. <span>Экономика вашего производства.</span></h1>
   <p class="ec-hero-lead">От невостребованного сырья до готового полимерного продукта. Оцените финансовый потенциал предприятия полного цикла переработки.</p>
   <dl class="ec-hero-numbers">
    <div><dt>${v('monthLabel','span')}</dt><dd>${v('heroMonthNet')}${v('heroMonthUsd','small')}</dd></div>
    <div><dt>${v('yearLabel','span')}</dt><dd>${v('heroYearNet')}${v('heroYearUsd','small')}</dd></div>
    <div class="ec-hero-payback"><dt>Расчётный срок возврата вложений в оборудование</dt><dd>${v('heroPayback')}</dd></div>
   </dl>
   <div class="ec-actions"><a class="button" href="#production-constructor">Рассчитать своё производство ${arrow}</a>${request(snapshot.result,'complex',true)}</div>
  </div>
 </div>
 </section>`;
}

function raw({baseline,config}){
 const purchase=config.feedstockPrice,ratio=purchase>0?baseline.grossPrice/purchase:null;
 return `<section class="ec-section ec-value-section" id="raw-material" data-page-progress-label="Создание добавленной стоимости" aria-labelledby="ec-raw-title"><div class="ec-shell">
  ${heading('ЭРА / СОЗДАНИЕ ДОБАВЛЕННОЙ СТОИМОСТИ','ec-raw-title','Сырьё, которое недооценили. <span>Продукт, который востребован.</span>','Технология, меняющая экономическую ценность материала.','ec-heading-center')}
  <div class="ec-value-flow">
   <figure class="ec-photo-card ec-value-input"><img src="${feed}.webp" srcset="${feed}-480.webp 480w, ${feed}-880.webp 880w, ${feed}-1280.webp 1280w" sizes="(max-width:700px) 94vw, 40vw" width="1688" height="3000" loading="lazy" decoding="async" alt="Загрязнённая плёнка, поступающая на переработку">
    <figcaption><strong>${priceText(purchase)}</strong><span>Входящее сырьё<br><small>Закупка смеси</small></span></figcaption></figure>
   <div class="ec-value-stream" aria-label="Технология ЭРА">
    <span class="ec-stream-arrow" aria-hidden="true"></span>${eraMedallion()}<span class="ec-stream-arrow" aria-hidden="true"></span>
   </div>
   <figure class="ec-photo-card ec-value-output">${photoGranules()}<figcaption><strong>${priceText(baseline.grossPrice)}</strong><span>Готовая продукция<br><small>Базовая цена с НДС</small></span></figcaption></figure>
  </div>
  <div class="ec-band ec-value-band ec-indigo">${ratio==null?'':`<div><strong>×${decimal(ratio)}</strong><small>Соотношение цен за 1 кг, не прибыль</small></div>`}
   <p>Мы не просто перерабатываем отходы.<br><strong>Мы создаём экономическую ценность.</strong></p>${ribbon()}</div>
 </div></section>`;
}

const rangeText=values=>values.map(n=>decimal(n)).join('–')+'%';
function material({baseline:r,config},v){
 const input=r.mode.inputRate,output=r.mode.outputRate, yieldShare=r.totalYield;
 const title=`Из ${decimal(input)} ${Number.isInteger(input)&&new Intl.PluralRules('ru-RU').select(input)!=='one'?'тонн':'тонны'} сырья — <span>${decimal(output*1000)} кг готовой гранулы.</span>`;
 const inlet=40,product=inlet*yieldShare,remaining=inlet-product;
 return `<section class="ec-section ec-material" id="material-balance" data-page-progress-label="Материальный баланс" aria-labelledby="ec-balance-title"><div class="ec-shell">
  <div class="ec-balance-head">
   ${heading('ЭРА / ПРОИЗВОДСТВЕННЫЙ ПОТЕНЦИАЛ','ec-balance-title',title,'Расчётная производительность комплекса полного цикла.')}
   <div class="ec-periods" role="group" aria-label="Период материального баланса">${[['hour','Час','clock'],['month','Месяц','calendar'],['year','Год','calendar']].map(([id,label,mark])=>`<button type="button" data-econ-period="${id}" aria-pressed="${id==='hour'}">${icon(mark)}${label}</button>`).join('')}</div>
  </div>
  <div class="ec-material-flow" id="econ-volume">
   <svg class="ec-balance-branches" viewBox="0 0 960 240" preserveAspectRatio="none" aria-hidden="true">
    <path d="M195 120H501" stroke="#d9b675" stroke-width="${inlet}"/>
    <path d="M500 ${100+product/2}C560 ${100+product/2} 566 61 673 61" stroke="#e2b857" fill="none" stroke-width="${product}"/>
    <path d="M500 ${140-remaining/2}C560 ${140-remaining/2} 566 180 673 180" stroke="#bfb5a5" fill="none" stroke-width="${remaining}"/>
    ${product>0?'<path d="m665 43 25 18-25 18Z" fill="#e2b857"/>':''}${remaining>0?'<path d="m665 162 25 18-25 18Z" fill="#bfb5a5"/>':''}
   </svg>
   <article class="ec-flow-in ec-indigo"><span>${icon('layers')} Входящее сырьё</span>${v('balanceInput')}<small>${percent(input>0?1:null)}</small></article>
   <div class="ec-flow-medal">${eraMedallion()}</div>
   <div class="ec-flow-out">
    <svg class="ec-balance-mobile" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
     <path d="M50 0V29" stroke="#d9b675" stroke-width="12"/>
     <path d="M50 24Q8 24 8 57H100" stroke="#d7ae5b" fill="none" stroke-width="${product*.3}"/>
     <path d="M50 24Q8 24 8 79V146Q8 156 24 156H100" stroke="#b9ae9c" fill="none" stroke-width="${remaining*.3}"/>
    </svg>
    <article class="ec-flow-product"><span>${icon('granules')} Готовая гранула</span>${v('balanceOutput')}<b>${percent(input>0?yieldShare:null)}</b></article>
    <article class="ec-flow-other"><span>${icon('recycle')} Остальная масса</span>${v('balanceOther')}<b>${percent(input>0?1-yieldShare:null)}</b></article>
   </div>
  </div>
  <dl class="ec-material-facts">
   ${[['coins','Ежемесячный выпуск',tonnes(r.output)],['calendar','Годовой выпуск',tonnes(r.yearOutput)],['recycle','Ориентир загрязнённости сырья',rangeText(config.materialGuides.contamination)],['gear','Ориентир потерь полимерной фракции',rangeText(config.materialGuides.polymerLoss)]].map(([mark,label,value])=>`<div>${icon(mark)}<dt>${label}</dt><dd>${value}</dd></div>`).join('')}
  </dl>
  <p class="ec-notebox">В финансовую модель заложен консервативный выход готовой продукции — <strong>${percent(yieldShare)}</strong>. Остальная масса включает влагу, включения, потери материала и другие составляющие.</p>
  ${band('factory','<p>Консервативный расчёт. <strong>Промышленный масштаб.</strong></p>')}
 </div></section>`;
}

function product(){
 const q=technologyContent.quality;
 const benefits=[
  ['coins','Стабильное качество открывает доступ к более высокому ценовому сегменту.'],
  ['growth','После подтверждения качества покупателем возможен переход к верхнему порогу рыночной цены.'],
  ['handshake','Повторяемость помогает заключать долгосрочные контракты с предоплатой.'],
  ['calendar','При согласованной предоплате предприятие получает денежный поток заранее.'],
 ];
 const uses=[['film','Плёнки и пакеты'],['pipes','Трубы'],['bag','Тара'],['box','ПЭ-изделия']];
 return `<section class="ec-section ec-quality" id="product-quality" data-page-progress-label="Коммерческая ценность продукта" aria-labelledby="business-quality-title"><div class="ec-shell">
  ${heading('ЭРА / КОММЕРЧЕСКАЯ ЦЕННОСТЬ ПРОДУКТА','business-quality-title','Качество, за которое <span class="inline">платит рынок.</span>','Высококачественная вторичная ПЭ-гранула для нового производства.','ec-heading-center')}
  <div class="ec-quality-grid"><div>
   <div class="ec-quality-specs ec-indigo">
    <div>${icon('diamond')}<span>Остаточные включения</span><strong>${q.inclusions} ${q.inclusionsUnit}</strong><small>Целевой уровень ЭРА</small></div>
    <div>${icon('layers')}<span>Показатель текучести расплава</span><strong>${q.mfr} ${q.mfrUnit}</strong><small>Ориентир для плёночных марок ПВД · ${q.conditions}</small></div>${ribbon()}
   </div>
   <p class="ec-quality-tuning">ПТР гранулы можно настраивать под требования будущей продукции. Технологический режим подбирается под сырьё и согласованную спецификацию. Параметры партии подтверждаются испытаниями.</p>
   <ul class="ec-quality-benefits">${benefits.map(([mark,text])=>`<li>${icon(mark)}<span>${text}</span></li>`).join('')}</ul>
  </div><figure class="ec-quality-photo">${photoGranules()}</figure></div>
  <div class="ec-uses"><div class="ec-uses-head ec-indigo">Области применения<small>При соответствии марки и спецификации</small></div>
   ${uses.map(([mark,label])=>`<div>${icon(mark)}${label}</div>`).join('')}
  </div>
  <div class="ec-alternatives"><h3>Другие направления переработки полимерных потоков</h3><span>${icon('lab')} Пиролиз → нефтепродукты, включая бензиновые фракции</span><span>${icon('power')} Энергетика</span></div>
  ${band('layers','<p>Чистота. Стабильность. <strong>Цена выше.</strong></p><small>Качество открывает путь к долгосрочным контрактам и предсказуемой выручке.</small>')}
 </div></section>`;
}

const offerPrice=o=>(o.from?'от ':'')+decimal(o.price)+(o.priceMax?'–'+decimal(o.priceMax):'')+' ₽/кг';
const supplier=o=>`<a href="${escape(o.href)}" target="_blank" rel="noopener noreferrer">${escape(o.supplier)} ${arrow}</a>`;
function market({baseline},offers){
 const offer=id=>offers.find(row=>row.id===id);
 const start=offer('alfa-stretch'),top=offer('vtorplast-catalog');
 const selected=['soyuz-ldpe','vtorplast-clear','vtorplast-caramel','vtorplast-catalog'].map(offer);
 const steps=[
  {price:start.price,label:'Стартовое предложение',icon:'layers',amount:decimal(start.price)+' ₽/кг',copy:`${supplier(start)} · ${escape(start.title)}`},
  {price:baseline.grossPrice/1000,label:'Рабочий рынок',icon:'gear',amount:priceText(baseline.grossPrice),copy:'Базовый сценарий ЭРА · цена с НДС',base:true},
  {price:top.price,label:'Верхний ценовой сегмент',icon:'diamond',amount:offerPrice(top),copy:`${supplier(top)} · ${escape(top.title)}`},
 ].sort((a,b)=>a.price-b.price);
 const eu=marketSources.find(source=>source.id==='myceppi');
 return `<section class="ec-section ec-market" id="market" data-page-progress-label="Рыночные ориентиры" aria-labelledby="market-title"><div class="ec-shell">
  ${heading('РЫНОЧНЫЕ ОРИЕНТИРЫ','market-title','Рынок вторичной гранулы. <span>Обоснованная цена реализации.</span>','В основе модели ЭРА — рыночные предложения и отраслевые ориентиры.')}
  <div class="ec-ladder ec-indigo">${steps.map((s,i)=>`<article data-basis="${Boolean(s.base)}" style="--step:${i}"><div class="ec-ladder-price"><strong>${s.amount}</strong></div><div class="ec-ladder-copy">${icon(s.icon)}<h3>${s.label}</h3><p>${s.copy}</p></div></article>`).join('')}${ribbon()}</div>
  <div class="ec-market-sources-heading"><h3 class="ec-rule-title">Примеры рыночных источников</h3>${referenceLink('market-offers','Все источники рынка')}</div>
  <div class="ec-market-offers">${selected.map((s,i)=>`<article data-offer="${s.id}">${icon(i===1?'pipes':'layers')}<div>${supplier(s)}<strong>${offerPrice(s)}</strong><p>${escape(s.title)}</p><small>${escape(s.vat==='Не указан'?'НДС не указан':s.vat)} · ${s.priceDate==='Не указана'?'Проверено '+day(s.checkedAt):'Прайс '+escape(s.priceDate)}</small></div></article>`).join('')}</div>
  <h3 class="ec-rule-title">Международный ориентир</h3>
  <div class="ec-international-card ec-indigo">
   <div class="ec-international">${icon('globe')}
    <div><span>Вторичный rLDPE Film</span><strong>${decimal(eu.value)} ${eu.unit}</strong></div>
    <div><span>Первичный LDPE Film</span><strong>${decimal(eu.primaryValue)} ${eu.unit}</strong></div>
    <p><a href="${eu.href}" target="_blank" rel="noopener noreferrer">${eu.title} ${arrow}</a><br>${eu.period} · проверено ${day(eu.checkedAt)}</p>
   </div>
   ${band('growth','<p>Стабильное качество открывает возможность перехода <strong>к верхнему ценовому диапазону.</strong></p>',{art:true})}
  </div>
 </div></section>`;
}

function marketReferences(offers){
 const rows=[['ldpe','ПВД / LDPE'],['hdpe','ПНД / HDPE']].map(([kind,label])=>`<h3>Гранула ${label}</h3><div class="ec-table-scroll" role="region" aria-label="Предложения гранулы ${label}" tabindex="0">
  <table><thead><tr><th scope="col">Источник и материал</th><th scope="col">Предложение</th><th scope="col">Условия и проверка</th></tr></thead>
  <tbody>${offers.filter(o=>o.category===kind).map(o=>`<tr><th scope="row">${supplier(o)}<small>${escape(o.title)} · ${escape(o.polymer)}</small></th>
    <td>${offerPrice(o)}<small>НДС — ${escape(o.vat)} · ${escape(o.delivery)}</small></td><td>${escape(o.mfi)}<small>${escape(o.region)} · партия: ${escape(o.minimum)} · ${escape(o.packaging)}</small><small>${escape(o.note)} ${o.priceDate==='Не указана'?'':`Прайс ${escape(o.priceDate)}. `}Проверено ${day(o.checkedAt)}.</small></td></tr>`).join('')}</tbody>
  </table></div>`).join('');
 const refs=`<ul class="ec-reference-list">${marketSources.filter(s=>s.id!=='spimex').map(s=>`<li data-market-source="${s.id}"><a href="${escape(s.href)}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ${arrow}</a><p>${escape(s.kind)} · ${escape(s.period)}. ${escape(s.note)} Проверено ${day(s.checkedAt)}.</p></li>`).join('')}
 ${additionalMarketSources.map(([label,href,note])=>`<li><a href="${href}" target="_blank" rel="noopener noreferrer">${escape(label)} ${arrow}</a><p>${escape(note)}</p></li>`).join('')}</ul>`;
 return referenceDialog('market-offers','Источники и предложения рынка',rows+refs+'<p>Цены относятся к разным маркам и условиям поставки. Объявления продавцов служат ориентиром для переговоров. Международные значения приводятся в исходной валюте.</p>');
}

const expenseIcons={feedstock:'layers',payroll:'people',electricity:'power',water:'water',reagents:'lab',transport:'truck',ppe:'shield',
 supplies:'gear',office:'lab',disposal:'box',building:'factory',depreciation:'calendar'};
function unit({result:r},v){
 const equation=[['coins','Цена реализации без НДС','unitPrice'],['gear','Полная себестоимость','unitCost'],
  ['layers','Налог на прибыль','unitTax'],['growth',r.net<0?'Убыток':'Чистая прибыль','unitProfit']];
 return `<section class="ec-section ec-unit" id="economics" data-page-progress-label="Себестоимость" aria-labelledby="econ-tonne-title"><div class="ec-shell">
  <div class="ec-art-heading">${heading('ЭРА / СЕБЕСТОИМОСТЬ','econ-tonne-title','От цены реализации <span>до чистой прибыли.</span>','Прозрачная структура экономики для 1 кг готовой гранулы.')}${factoryArt()}</div>
  <div class="ec-unit-equation ec-indigo">
   <dl class="ec-equation-overview">${equation.map(([,title,key])=>`<div data-equation="${key}"><dt${key==='unitProfit'?' data-econ-unit-caption':''}>${title}</dt><dd>${v(key)}</dd></div>`).join('')}</dl>
   <div class="ec-equation-steps" role="group" aria-label="Расчёт на килограмм гранулы">${equation.map(([mark,title,key],i)=>`<div data-equation="${key}">${icon(mark)}<span class="ec-equation-label"${i===3?' data-econ-unit-caption':''}>${title}</span>${v(key)}</div>${i<3?`<span class="ec-equation-symbol">${i===2?'=':'−'}</span>`:''}`).join('')}</div>
   ${ribbon()}
  </div>
  <h3 class="ec-rule-title">Состав полной себестоимости</h3><p class="ec-subnote">Расходы на 1 кг готовой гранулы.</p>
  <ul class="ec-costs">${r.costs.map(cost=>`<li>${icon(expenseIcons[cost.id])}<div><strong>${escape(cost.label)}</strong><small>${escape(cost.description)}</small></div><b data-econ-cost="${cost.id}">${priceText(r.output>0?cost.value/r.output:null,2)}</b></li>`).join('')}</ul>
  <div class="ec-unit-result ec-indigo" id="econ-per-tonne-price">${photoGranules('')}${icon('growth')}
   <div><span>Чистый результат на тонну</span>${v('tonneNet')}${v('tonneUsd','small')}</div>
   <div><span>Чистый результат в месяц</span>${v('monthNet')}${v('monthUsd','small')}</div>
   ${v('rate','p')}${ribbon()}
  </div>
 </div></section>`;
}

function calculator(snapshot,v){
 const {result:r,scenarios,state,baseline}=snapshot;
 const facts=[['coins','Прибыль с тонны','tonneNet'],['percent','Рентабельность продаж','margin'],
  ['growth','Выручка без НДС в месяц','revenue'],['layers','Полные расходы в месяц','expenses']];
 const parameters=[['factory','Комплектация','1 комплекс'],['granules','Выпуск в месяц',v('output')],['calendar','Выпуск за стабильный год',v('yearOutput')],['clock','Возврат вложений в оборудование',v('payback')]];
 return `<section class="ec-section ec-calculator" id="production-constructor" data-page-progress-label="Инвестиционный калькулятор" aria-labelledby="econ-calculator-title"><div class="ec-shell">
  ${heading('ЭРА / ИНВЕСТИЦИОННЫЙ КАЛЬКУЛЯТОР','econ-calculator-title','Рассчитайте экономику <span class="inline">своего производства.</span>','Выберите цену реализации гранулы и оцените финансовый результат предприятия.')}
  <div class="ec-calculator-grid">
   <div class="ec-scenario-picker" role="group" aria-label="Цена гранулы с НДС для одного комплекса" id="econ-monthly-price">${scenarios.map(stage=>`<button type="button" data-econ-price="${stage.id}" data-price-rub="${stage.price}" aria-pressed="${state.scenario===stage.id}">
    ${icon(stage.icon)}<span><strong>${priceText(stage.price)}</strong><b>${stage.period}</b><small>${stage.description}</small></span><i aria-hidden="true"></i>
    <span class="ec-scenario-net"><small>${monthLabel(stage.result)}</small><strong>${compact(stage.result.net)}</strong></span></button>`).join('')}</div>
   <div class="ec-finance ec-indigo">
    <div class="ec-finance-head"><h3>Финансовый результат</h3><span>Цена гранулы с НДС · ${v('price')}</span></div>
    <dl class="ec-finance-primary">
     <div>${icon('calendar')}<dt>${v('monthLabel','span')}</dt><dd>${v('monthNet')}${v('monthUsd','small')}</dd></div>
     <div>${icon('calendar')}<dt>${v('yearLabel','span')}</dt><dd>${v('yearNet')}${v('yearUsd','small')}</dd></div>
    </dl>
    ${v('rate','p')}
    <dl class="ec-finance-facts">${facts.map(([mark,title,key])=>`<div>${icon(mark)}<dt>${key==='tonneNet'?'<span data-econ-tonne-caption>'+ (r.net<0?'Убыток с тонны':title)+'</span>':title}</dt><dd>${v(key)}</dd></div>`).join('')}</dl>
    <div class="ec-comparison"><h4>Сравнение чистого результата по сценариям <small>млн ₽ / месяц</small></h4><div data-econ-chart>${renderProfitChart(scenarios,state.scenario)}</div></div>
    <div class="ec-allocation" id="monthly-result"><h4>Распределение выручки без НДС</h4><div data-econ-allocation>${renderAllocation(r)}</div></div>
   </div>
  </div>
  <h3 class="ec-rule-title">Ключевые параметры проекта</h3>
  <dl class="ec-project-params">${parameters.map(([mark,title,value])=>`<div>${icon(mark)}<dt>${title}</dt><dd>${value}</dd></div>`).join('')}</dl>
  ${band('growth',baseline.net>0?'<p>Прибыль уже в базовом сценарии. <strong>Потенциал роста — вместе с вашим бизнесом.</strong></p>':'<p>Оцените финансовый результат <strong>при разных ценах реализации.</strong></p>',{art:true})}
  <p class="ec-subnote">Расчёт при номинальной загрузке одного комплекса и реализации всего выпуска. Выбранная цена включает НДС. ${referenceLink('calculation-conditions','Условия расчёта')}</p>
 </div></section>`;
}

function resilience({resilience:s}){
 const facts=[
  ['layers','Цена безубыточности',priceText(s.threshold,2)],
  ['coins',s.reserve<0?'Необходимое повышение цены':'Запас до порога',priceText(s.reserve==null?null:Math.abs(s.reserve),2)],
  ['percent',s.share<0?'Запас относительно базовой цены':'Допустимое снижение до порога',percent(s.share)],
  ['growth',(s.conservativeNet<0?'Убыток':'Чистая прибыль')+' при цене '+priceText(s.conservativePrice),compact(s.conservativeNet)+'/мес.'],
 ];
 return `<section class="ec-section ec-resilience" id="project-resilience" data-page-progress-label="Устойчивость бизнеса" aria-labelledby="econ-curve-title"><div class="ec-shell">
  <div class="ec-art-heading ec-resilience-heading">${photoGranules('')}${heading('ЭРА / ЭКОНОМИЧЕСКАЯ УСТОЙЧИВОСТЬ','econ-curve-title','Бизнес с <span class="inline">запасом прочности.</span>','Оцените запас базовой модели при изменении цены реализации.')}</div>
  <div class="ec-resilience-panel ec-indigo"><div class="ec-resilience-intro">${icon('layers')}<div><h3>Запас экономической устойчивости</h3><p>Цена реализации с НДС · ₽/кг готовой гранулы</p></div></div>
   ${renderResilienceScale(s)}${ribbon()}
  </div>
  <dl class="ec-resilience-facts">${facts.map(([mark,title,value])=>`<div>${icon(mark)}<dt>${title}</dt><dd>${value}</dd></div>`).join('')}</dl>
  ${band('growth','<p>Модель позволяет оценить запас финансовой устойчивости <strong>даже при снижении цены реализации.</strong></p>')}
  <p class="ec-subnote">Порог рассчитан при полной загрузке, неизменных расходах и реализации всего выпуска. Ценовой запас отражает чувствительность к цене и охватывает только этот фактор.</p>
 </div></section>`;
}

function growth(snapshot,v){
 const {config,baseline,separation,scenarios,state,network}=snapshot;
 const options=scenarios.map(s=>`<option value="${s.id}"${s.id===state.scenario?' selected':''}>${priceText(s.price)} · ${s.period}</option>`).join('');
 const compare=(result,mode,title,cop)=>`<article class="ec-stage-card ${mode==='full'?'ec-indigo':''}" data-growth-mode="${mode}">
  <figure>${mode==='full'?photoGranules():`<img src="${bales}" width="1510" height="370" alt="Упакованная очищенная плёнка в тюках из техописания сухой сепарации ЭРА" loading="lazy" decoding="async">`}</figure>
  <div><p class="eyebrow">${mode==='full'?'02 / РАЗВИТИЕ':'01 / СТАРТ'}</p><h3>${icon(mode==='full'?'granules':'layers')} ${title}</h3><p>${cop}</p>
   <dl>${[['Цена с НДС',priceText(result.grossPrice)],['Выпуск в месяц',tonnes(result.output)],[result.net<0?'Убыток в месяц':'Чистая прибыль в месяц',compact(result.net)],['Рентабельность продаж',percent(result.margin)]].map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
  </div></article>`;
 const goods=[['granules','Гранула в месяц','networkOutput'],['calendar','Гранула за год','networkYearOutput'],['recycle','Сырьё в месяц','networkInput'],
  ['growth','Выручка без НДС в месяц','networkRevenue'],['percent','Рентабельность продаж','networkMargin']];
 return `<section class="ec-section ec-growth" id="production-growth" data-page-progress-label="Поэтапное развитие" aria-labelledby="ec-growth-title"><div class="ec-shell">
  <div class="ec-stages">
   ${heading('ЭРА / ПОЭТАПНОЕ РАЗВИТИЕ','ec-growth-title','Два пути входа в отрасль. <span>Единая перспектива развития.</span>','Начните с доступного масштаба и поэтапно переходите к производству гранулы. Состав расширения определяется проектом.')}
   ${compare(separation,'separation','Сухая сепарация','Подготовка и реализация очищенной плёнки в тюках.')}
   ${icon('arrow')}${compare(baseline,'full','Полный цикл','Сепарация, горячая мойка и производство гранулы.')}
  </div>
  <div class="ec-network ec-indigo">
   ${networkArt()}
   <div class="ec-network-intro">
    ${heading('ЭРА / МАСШТАБИРОВАНИЕ БИЗНЕСА','ec-network-title','От одного предприятия <span>к промышленной сети.</span>','Выберите число одинаковых комплексов и оцените финансовый результат.')}
    <label class="ec-network-price"><span>Цена гранулы с НДС</span><select data-econ-network-price aria-label="Цена гранулы с НДС для сети">${options}</select></label>
   </div>
   <div class="ec-network-sizes" role="group" aria-label="Количество комплексов в сети">${config.networkSizes.map(n=>`<button type="button" data-econ-network="${n}" aria-pressed="${n===state.complexes}">${icon('factory')}<b>${n}</b><span>${complexes(n).split(' ')[1]}</span></button>`).join('')}</div>
   <p class="ec-network-selected">Полный цикл · ${v('networkSize')} · номинальная загрузка</p>
   <dl class="ec-network-profits">
    <div>${icon('coins')}<dt>${v('networkMonthLabel','span')}</dt><dd>${v('networkMonth')}${v('networkMonthUsd','small')}</dd></div>
    <div>${icon('calendar')}<dt>${v('networkYearLabel','span')}</dt><dd>${v('networkYear')}${v('networkYearUsd','small')}</dd></div>
   </dl>
   <dl class="ec-network-facts">${goods.map(([mark,label,key])=>`<div>${icon(mark)}<dt>${label}</dt><dd>${v(key)}</dd></div>`).join('')}</dl>
   <p class="ec-network-payback">Возврат вложений в оборудование · ${v('networkPayback')}${network.equipmentInvestment!=null?` <span>Инвестиции в оборудование · ${v('networkInvestment')} · ${v('networkInvestmentUsd','small')}</span>`:''}</p>
   ${v('rate','p')}
   <div class="ec-network-finale">${icon('growth')}<p><strong>Масштабируйте производство.</strong> Единая технология. Тиражируемая экономика. Региональный охват.</p></div>
   <p class="ec-network-note">Линейный сценарий одинаковых комплексов. Региональные различия и общесетевые расходы уточняются для проекта. Точки на карте условные.</p>
  </div>
 </div></section>`;
}

function conditionsReference({config,baseline:r}){
 return referenceDialog('calculation-conditions','Условия расчёта и источники',`<h3 id="economic-conditions">Производственная база</h3>
   <p>Нормативный месяц — ${config.monthDays} день и ${decimal(r.mode.monthHours)} ч. Стабильный год — ${config.yearDays} дней и ${decimal(r.mode.yearHours)} ч. Расчёт относится к полной загрузке и реализации всего выпуска. Предусмотрен готовый цех заказчика. Годовой ориентир на первом экране равен ${config.monthsPerYear} округлённым месячным суммам. Подробный годовой результат рассчитан за ${config.yearDays} дней.</p>
   <h3>Цены, НДС и расходы</h3>
   <p>Закупка — ${priceText(config.feedstockPrice)} за кг входящей смеси без доставки и входящего НДС. Реализация — с НДС ${percent(config.vatRate)} за кг готового продукта. У этих цен разные массы и база НДС. Выручка в расчёте — без НДС, полная себестоимость включает амортизацию. Налог на прибыль — ${percent(config.taxRate)} положительной прибыли до налога.</p>
   <p>Годовые переменные расходы учитывают объём и рабочие часы. Постоянные расходы и амортизация учитываются за ${config.monthsPerYear} месяцев. В смете полный платёж за мощность и содержание сети начисляется ежемесячно. Сетевая категория, тарифы и оплачиваемая мощность уточняются для конкретной площадки.</p>
   <h3>Оценка вложений</h3>
   <p>Подтверждение стоимости оборудования для пересчитанного сценария требуется для оценки срока возврата. При наличии согласованной стоимости метод учитывает операционный поток как чистую прибыль за год плюс амортизацию. Запуск, оборотный капитал и дополнительные капитальные затраты оцениваются отдельно. Расчёт не гарантирует фактическую доходность.</p>
   <h3>Финансовые и рыночные источники</h3>
   <p>Производственная смета от ${day(r.mode.estimate.asOf)} · ${escape(r.mode.estimate.region)}. Исходная модель — ${config.sources.filter(s=>s.mode==='full').map(s=>`${escape(s.title)} · ${escape(s.sheets)}`).join('<br>')}. Проверка опубликованных рыночных ориентиров — ${day(config.marketAsOf)}.</p>
   <p>${escape(config.priceDisclosure)} ${referenceLink('market-offers','Источники рынка')} <a class="ec-link" href="/technology#raw-material" data-technology-page>Технология переработки ${arrow}</a></p>`);
}

function discuss({network},v){
 return `<section class="ec-cta ec-edge" id="economics-project" data-page-progress-label="Ваш проект" aria-labelledby="ec-project-title">
  <div class="ec-cta-art"><img src="/assets/economics/factory.webp" width="890" height="819" alt="Концептуальная визуализация будущего производства переработки" loading="lazy" decoding="async"></div>
  ${ribbon()}<div class="ec-shell ec-cta-inner"><div class="ec-cta-copy">
   ${heading('ВАШ ПРОЕКТ С ЭРА','ec-project-title','Запустите собственное <span>производство переработки.</span>','Подберём оборудование, рассчитаем экономику, подготовим технико-коммерческое предложение и сопроводим проект до запуска производства.')}
   <ul>${[['layers','Индивидуальный расчёт'],['calendar','Прозрачная экономика'],['handshake','Сопровождение на всех этапах']].map(([mark,label])=>`<li>${icon(mark)}${label}</li>`).join('')}</ul>
   <div class="ec-cta-action">${request(network,'network')}<p>Обсудим ваш проект, рассчитаем инвестиции и сроки окупаемости.</p></div>
   <p class="ec-request-scenario" data-econ-request-scenario hidden>Сценарий сети · ${v('networkSize')}</p>
   <div class="ec-cta-links"><a href="${siteContacts.phoneHref}">${siteContacts.phone}</a><a href="mailto:${siteContacts.email}">${siteContacts.email}</a></div>
  </div></div>
 </section>`;
}

export function economicsPage({config=economicsConfig,rates,offers=marketOffers}={}){
 const snapshot=createInvestmentStore({config,fx:getFxSnapshot({data:rates,status:'cached'})}).get();
 const values=financialValues(snapshot),v=(key,tag)=>valueMarkup(values,key,tag);
 return `<div class="story commercial-page economics-page" data-commercial-home data-economics-page data-econ-mode="full" data-econ-locked-mode="full" data-econ-state="${snapshot.result.net<0?'loss':'profit'}" data-econ-scenario="base">
  ${snapshot.fx?`<script type="application/json" data-econ-fx-seed>${JSON.stringify(snapshot.fx)}</script>`:''}
  ${hero(snapshot,v)}${raw(snapshot)}${material(snapshot,v)}${product()}${market(snapshot,offers)}${unit(snapshot,v)}${calculator(snapshot,v)}
  ${resilience(snapshot)}${growth(snapshot,v)}${discuss(snapshot,v)}
  ${conditionsReference(snapshot)}${marketReferences(offers)}
  <p class="visually-hidden" data-economics-status role="status" aria-live="polite" aria-atomic="true"></p>
 </div>`;
}
