import {test} from 'node:test';
import assert from 'node:assert/strict';
import {economicsConfig as config} from '../public/economics-config.js';
import {calculateEconomics,initialEconomicsState,normalizeEconomicsState,changeEconomicsSelection,profitCurve} from '../public/economics-model.js';
import {renderCurve,renderBridge,renderMonth,renderMarketPrice,priceStageText} from '../public/economics-view.js';
import {createEconomicsStore} from '../public/economics-page-state.js';
import {groupedMonth,productCopy,unitMoney} from '../public/economics-page-view.js';
const close=(actual,expected,tolerance=.00001)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('Рабочие месяцы ЛСП и КПП точно воспроизводят финансовые модели 05.11.2026',()=>{
 for(const [state,input,price,revenue,cash,dep,cost,tax,net,unit] of [
  [{salePrices:{separation:50000}},1116,50000,22868852.46,16288252.39,645536.95,16933789.34,1483765.78,4451297.34,7977.24],
  [{mode:'full',salePrices:{full:110000}},970.4347826086957,110000,50311475.41,24930006.22,1961047.90,26891054.12,5855105.32,17565315.97,31479.06],
  [{mode:'full',salePrices:{full:100000}},970.4347826086957,100000,45737704.92,24930006.22,1961047.90,26891054.12,4711662.70,14134988.10,25331.52],
 ]){
  const r=calculateEconomics(state);close(r.state.input,input);close(r.output,558);close(r.grossPrice,price);close(r.revenue,revenue,.01);close(r.cashOpex,cash,.01);close(r.depreciation,dep,.01);close(r.totalCosts,cost,.01);close(r.tax,tax,.01);close(r.net,net,.01);close(r.perProduct.net,unit,.01);close(r.hoursPerLine,744);
 }
 const sep=calculateEconomics({salePrices:{separation:50000}}),full=calculateEconomics({mode:'full',salePrices:{full:110000}});
 close(sep.margin,.19464454288,.00001);close(full.margin,.3491314032,.00001);
 close(sep.totalYield,.5);close(full.totalYield,.575);close(full.output,config.availableHours*config.outputRate);
 assert.equal(config.modes.separation.staff,39);assert.equal(config.modes.full.staff,54);
});
test('НДС исключается из цены один раз, амортизация не дублируется, налог равен 25% положительной прибыли',()=>{
 for(const mode of ['separation','full']){
  const r=calculateEconomics({mode});
  close(r.netPrice,r.grossPrice/1.22);close(r.revenue+r.outputVat,r.grossRevenue);
  close(r.totalCosts,r.cashOpex+r.depreciation);close(r.pretax,r.revenue-r.totalCosts);
  close(r.tax,r.pretax*.25);close(r.net,r.pretax*.75);
  for(const [key,total] of [['price',r.revenue],['cash',r.cashOpex],['depreciation',r.depreciation],['tax',r.tax],['net',r.net]])close(r.perProduct[key],total/r.output);
  close(r.perInput,r.net/r.state.input);
 }
});
test('Категории месячного кольца сходятся с выручкой без НДС, сухая ЛСП не содержит затрат мойки',()=>{
 for(const mode of ['separation','full'])for(const grossPrice of [0,10000,40000,50000,90000,100000,110000]){
  const r=calculateEconomics({mode,salePrices:{[mode]:grossPrice}});
  close(r.segments.reduce((sum,s)=>sum+s.value,0),r.revenue);
  close(r.costs.reduce((sum,s)=>sum+s.value,0),r.totalCosts);
  for(const cost of config.costs)close(r.costs.find(c=>c.id===cost.id).value,cost[mode],.02);
  for(const id of ['water','reagents','building'])if(mode==='separation'||id==='building')close(r.costs.find(c=>c.id===id).value,0);
  assert.equal(r.costs.filter(c=>c.id==='depreciation').length,1);
 }
});
test('Нулевая загрузка сохраняет постоянные расходы и амортизацию, убыток и прочерки на тонну',()=>{
 for(const mode of ['separation','full']){
  const r=calculateEconomics({mode,input:0,lines:2});
  close(r.output,0);close(r.revenue,0);close(r.variableCosts,0);close(r.tax,0);close(r.net,-r.fixedCosts);
  close(r.cashOpex,2*config.modes[mode].fixedCashOpex);close(r.depreciation,2*config.modes[mode].depreciation);
  assert.equal(r.margin,null);assert.equal(r.perProduct,null);assert.equal(r.perInput,null);assert.equal(r.donutAvailable,false);
  assert.ok(renderBridge(r).includes('—'));assert.ok(renderCurve(r).includes('безубыточный объём'));
 }
});
test('Убыточная цена не создаёт отрицательный налог или положительный сектор прибыли',()=>{
 const r=calculateEconomics({salePrices:{separation:10000}});
 assert.ok(r.net<0);assert.equal(r.tax,0);assert.equal(r.donutAvailable,false);assert.equal(r.breakEvenState,'negative-contribution');assert.equal(r.breakEven,null);
 assert.ok(renderMonth(r).includes('econ-cost-table'));
 assert.equal(calculateEconomics({salePrices:{separation:30000}}).breakEvenState,'outside-capacity');
});
test('1/2/3 одинаковых полностью загруженных комплекта масштабируют выпуск, штатные расходы и прибыль линейно',()=>{
 for(const mode of ['separation','full']){
  const one=calculateEconomics({mode});
  for(const lines of [2,3]){
   const many=calculateEconomics({mode,lines});
   for(const field of ['output','revenue','cashOpex','depreciation','tax','net','capacity'])close(many[field],one[field]*lines);
   close(many.margin,one.margin);close(many.hoursPerLine,744);
  }
 }
});
test('Смена количества комплектов и режима сохраняет долю загрузки, а цены режимов запоминаются независимо',()=>{
 for(const load of [0,.25,.5,.99,1]){
  let state=initialEconomicsState();state.input*=load;state.salePrices.full=100000;
  for(const lines of [3,1,2])for(const mode of ['full','separation']){
   state=changeEconomicsSelection(state,{mode,lines});const r=calculateEconomics(state);
   close(r.load,load);close(r.state.input,lines*config.modes[mode].referenceInput*load);assert.equal(state.salePrices.full,100000);assert.equal(state.salePrices.separation,45000);
  }
 }
 const a=initialEconomicsState(),b=initialEconomicsState();a.salePrices.full=90000;assert.equal(b.salePrices.full,90000);
});
test('Финансовые границы и кривая согласованы, без NaN, с настоящей точкой безубыточности',()=>{
 for(const mode of ['separation','full'])for(const lines of [1,2,3]){
  const base=calculateEconomics({mode,lines});close(calculateEconomics({mode,lines,input:base.breakEven}).net,0);
  for(const point of profitCurve({mode,lines})){close(point.net,calculateEconomics({mode,lines,input:point.input}).net);assert.ok(Number.isFinite(point.net));}
  for(const input of [0,base.capacity/2,base.capacity])assert.doesNotMatch(renderCurve(calculateEconomics({mode,lines,input})),/NaN|Infinity/);
 }
 const normalized=normalizeEconomicsState({input:Infinity,lines:-5,salePrices:{full:-12}});
 assert.equal(normalized.lines,1);assert.equal(normalized.input,1116);assert.equal(normalized.salePrices.full,0);
 close(normalizeEconomicsState({mode:'full',input:999999}).input,config.modes.full.referenceInput);
 assert.ok(profitCurve({},0).length>=2);
});
test('Ценовые пресеты описывают цену, а не обещание роста по рабочим месяцам',()=>{
 const r=calculateEconomics({mode:'full',salePrices:{full:110000}});assert.equal(priceStageText(r),'Повышенная');
 assert.equal(priceStageText(calculateEconomics({mode:'full'})),'Базовая цена');
 assert.equal(priceStageText(calculateEconomics({mode:'full',salePrices:{full:100000}})),'Дополнительная');
 assert.match(renderMarketPrice(r),/110 ₽\/кг с НДС/);assert.match(renderMarketPrice(r),/80 ₽\/кг/);
 for(const mode of Object.values(config.modes))for(const p of mode.priceStages)assert.doesNotMatch(p.period,/месяц|этап|перв/iu);
 assert.ok(!('granulationYield' in config));assert.ok(!('granulationYield' in r.state));
});
test('SSR, модель и единое состояние начинают с согласованной базы 45/90 ₽ за кг',()=>{
 const store=createEconomicsStore();assert.equal(store.get().state.salePrices.separation,45000);assert.equal(store.get().state.salePrices.full,90000);
 assert.equal(config.modes.full.defaultGrossPrice,90000);assert.equal(calculateEconomics({mode:'full'}).grossPrice,90000);
 store.dispatch({type:'selection',value:{mode:'full'}});close(store.get().result.net,10704660.23,.01);
 store.dispatch({type:'price',value:100000});const r=store.get().result;
 close(r.net,14134988.10,.01);close(r.margin,.30904454288,.00001);
 assert.equal(unitMoney(r.perProduct.totalCosts),'48,19 ₽/кг');assert.equal(unitMoney(r.perProduct.tax),'8,44 ₽/кг');assert.equal(unitMoney(r.perProduct.net),'25,33 ₽/кг');
});
test('Подписчики единого состояния получают один согласованный результат; память цен и загрузка сохраняются',()=>{
 const store=createEconomicsStore(),seen=[];const unsubscribe=store.subscribe(snapshot=>seen.push(snapshot));
 store.dispatch({type:'price',value:45000});store.dispatch({type:'input',value:892.8});
 store.dispatch({type:'selection',value:{mode:'full',lines:3}});close(store.get().result.load,.8);
 store.dispatch({type:'price',value:100000});store.dispatch({type:'selection',value:{mode:'separation'}});
 assert.equal(store.get().result.grossPrice,45000);close(store.get().result.load,.8);
 store.dispatch({type:'selection',value:{mode:'full'}});assert.equal(store.get().result.grossPrice,100000);
 const previous=store.get().result;store.dispatch({type:'unit',value:'tonne'});assert.equal(store.get().result,previous);assert.equal(store.get().unit,'tonne');
 for(const snapshot of seen){const expected=calculateEconomics(snapshot.state);close(snapshot.result.net,expected.net);close(snapshot.result.output,expected.output);}
 const copy=store.get();copy.state.salePrices.full=1;assert.equal(store.get().state.salePrices.full,100000);
 unsubscribe();const count=seen.length;store.dispatch({type:'input',value:0});assert.equal(seen.length,count);assert.ok(store.get().result.net>=0);assert.ok(store.get().result.yearNet>=0);
});
test('Укрупнение месячного кольца сохраняет все суммы, а при частичной загрузке остаются агрегаты модели',()=>{
 for(const mode of ['separation','full'])for(const lines of [1,2,3]){
  const r=calculateEconomics({mode,lines}),grouped=groupedMonth(r);
  assert.equal(grouped.segments.length,7);close(grouped.segments.reduce((a,s)=>a+s.value,0),r.revenue);
  assert.equal(grouped.segments.find(s=>s.id==='utilities').members.length,2);
  const originalIds=grouped.segments.flatMap(s=>s.members.map(m=>m.id));assert.deepEqual(originalIds.sort(),r.segments.map(s=>s.id).sort());
  const half=calculateEconomics({mode,lines,input:r.capacity/2});assert.equal(groupedMonth(half),half);assert.equal(half.costs.length,3);
 }
});
test('Паспорт гранулы отделён от плёнки; ПТР указан как предварительный ориентир с условиями измерения',()=>{
 const film=productCopy('separation'),granule=productCopy('full');
 assert.doesNotMatch(film.passport,/ppm|ПТР|г\/10/);assert.match(granule.passport,/30–70 ppm/);
 assert.match(granule.passport,/0,8–1,2 г\/10 мин/);assert.match(granule.passport,/190 °C \/ 2,16 кг/);assert.match(granule.passport,/предварительный ориентир/);
 assert.notEqual(film.src,granule.src);
});
test('Непредставимо малый положительный выпуск не выводит Infinity или NaN в денежных показателях',()=>{
 const r=calculateEconomics({input:1e-308});assert.equal(unitMoney(r.perProduct.totalCosts),'—');
 assert.doesNotMatch(renderBridge(r),/NaN|Infinity|∞/);assert.match(renderBridge(r),/Объём слишком мал/);
});

test('Семь ценовых ориентиров: независимые денежные контроли месяца и 365-дневного года',()=>{
 const controls=[
  ['separation',40000,18295081.97,1020969.47,215409836.07,10750124.35,[13,19.5]],
  ['separation',45000,20581967.21,2736133.40,242336065.57,30944796.49,[6.2,9.3]],
  ['separation',50000,22868852.46,4451297.34,269262295.08,51139468.62,[4.1,6.1]],
  ['full',80000,36590163.93,7274332.36,430819672.13,83344484.01,[9,11.2]],
  ['full',90000,41163934.43,10704660.23,484672131.15,123733828.27,[6.5,8.2]],
  ['full',100000,45737704.92,14134988.10,538524590.16,164123172.53,[5.1,6.4]],
  ['full',110000,50311475.41,17565315.97,592377049.18,204512516.79,[4.2,5.3]],
 ];
 for(const [mode,price,revenue,net,yearRevenue,yearNet,range] of controls){
  const r=calculateEconomics({mode,salePrices:{[mode]:price}});
  close(r.revenue,revenue,.01);close(r.net,net,.01);close(r.yearRevenue,yearRevenue,.01);close(r.yearNet,yearNet,.01);
  assert.equal(r.payback.status,'estimate');assert.deepEqual(r.payback.months,range);
  close(r.yearOutput,6570);close(r.yearHoursPerLine,8760);assert.notEqual(r.yearNet,r.net*12);
 }
 close(calculateEconomics().yearInput,13140);close(calculateEconomics({mode:'full'}).yearInput,11426.08695652174);
 close(calculateEconomics().breakEvenGrossPrice/1000,37.0236971238792,.00001);
 close(calculateEconomics({mode:'full'}).breakEvenGrossPrice/1000,58.79406097864388,.00001);
});
test('Год сохраняет 12 месяцев постоянных расходов, объёмные переменные и положительный налог во всех масштабах',()=>{
 for(const mode of ['separation','full'])for(const lines of [1,2,3])for(const load of [0,.5,.8,1])for(const preset of config.modes[mode].priceStages){
  const r=calculateEconomics({mode,lines,input:config.modes[mode].referenceInput*lines*load,salePrices:{[mode]:preset.price}});
  close(r.yearOutput,6570*lines*load);close(r.yearDepreciation,12*config.modes[mode].depreciation*lines);
  close(r.yearFixedCashCosts,12*config.modes[mode].fixedCashOpex*lines);
  close(r.yearVariableCosts,r.variableCosts*365/31);
  close(r.revenue,r.totalCosts+r.tax+r.net);close(r.yearRevenue,r.yearCosts+r.yearTax+r.yearNet);
  close(r.annualOperatingCash,r.yearNet+r.yearDepreciation);close(r.averageMonthlyOperatingCash,r.annualOperatingCash/12);
  assert.ok(r.tax>=0&&r.yearTax>=0);
  if(!load){assert.equal(r.yearVariableCosts,0);assert.equal(r.yearTax,0);assert.equal(r.yearMargin,null);assert.equal(r.yearUnitCosts,null);assert.equal(r.breakEvenGrossPrice,null);assert.equal(r.yearBreakEvenGrossPrice,null);assert.equal(r.payback.status,'unreachable');}
  else{close(r.yearUnitCosts*r.yearOutput,r.yearCosts);close(r.yearBreakEvenGrossPrice/1.22*r.yearOutput,r.yearCosts);}
  const one=calculateEconomics({mode,input:config.modes[mode].referenceInput*load,salePrices:{[mode]:preset.price}});
  for(const field of ['yearInput','yearOutput','yearRevenue','yearCosts','yearTax','yearNet'])close(r[field],one[field]*lines,.00001);
  assert.deepEqual(r.payback,one.payback);
 }
});
test('Контроль неполной загрузки: 80%, 50%, убыток и поток при нуле',()=>{
 for(const [mode,load,net,yearNet] of [
  ['separation',.8,1063192.39,11247265.19],['full',.8,6522233.68,74489128.59],
  ['separation',.5,-1928292.17,-24398709.00],['full',.5,248593.86,622079.08],
 ]){const r=calculateEconomics({mode,input:config.modes[mode].referenceInput*load});close(r.net,net,.01);close(r.yearNet,yearNet,.01);}
 const lossWithCash=calculateEconomics({mode:'full',input:config.modes.full.referenceInput*.49});
 assert.ok(lossWithCash.yearNet<0&&lossWithCash.annualOperatingCash>0);assert.equal(lossWithCash.payback.status,'review');
});
test('Своя цена и точный объём пересчитывают год; срок не интерполируется за пределами утверждённых узлов',()=>{
 const exact=calculateEconomics({mode:'full',input:777.123456,salePrices:{full:90555.55}});
 close(exact.grossPrice,90555.55);close(exact.state.input,777.123456);assert.equal(exact.payback.status,'individual');
 const offGrid=calculateEconomics({mode:'full',input:config.modes.full.referenceInput*.82345});
 close(offGrid.load,.82345);assert.equal(offGrid.payback.status,'individual');
 const zeroPrice=calculateEconomics({salePrices:{separation:0}});assert.equal(zeroPrice.yearRevenue,0);assert.equal(zeroPrice.yearTax,0);assert.equal(zeroPrice.payback.status,'unreachable');
});
test('Сброс восстанавливает обе базовые цены, первый продукт и полную загрузку одним уведомлением',()=>{
 const store=createEconomicsStore(),seen=[];store.subscribe(snapshot=>seen.push(snapshot));
 store.dispatch({type:'selection',value:{mode:'full',lines:3}});store.dispatch({type:'price',value:99500});store.dispatch({type:'input',value:101.123});
 const before=seen.length;store.dispatch({type:'reset'});assert.equal(seen.length,before+1);
 const {state,result}=store.get();assert.deepEqual(state,initialEconomicsState());close(result.load,1);assert.equal(result.grossPrice,45000);assert.equal(state.salePrices.full,90000);
});

test('Публичный расчёт начинается с безубыточности и не допускает отрицательный месяц или год',()=>{
 for(const mode of ['separation','full'])for(const lines of [1,2,3]){
  const store=createEconomicsStore();store.dispatch({type:'selection',value:{mode,lines}});
  for(const price of [0,...config.modes[mode].priceStages.map(p=>p.price),99555.55]){
   store.dispatch({type:'price',value:price});
   for(const input of [0,1,config.modes[mode].referenceInput*lines*.5,config.modes[mode].referenceInput*lines]){
    store.dispatch({type:'input',value:input});const r=store.get().result;
    assert.ok(r.net>=0&&r.yearNet>=0,`${mode}: public scenario is below break-even`);
    assert.ok(r.state.input>=r.minimumInput&&r.state.input<=r.capacity);
    assert.ok(r.grossPrice>=r.minimumGrossPrice);
    close(r.revenue,r.totalCosts+r.tax+r.net);close(r.yearRevenue,r.yearCosts+r.yearTax+r.yearNet);
   }
  }
  store.dispatch({type:'reset'});store.dispatch({type:'selection',value:{mode,lines}});store.dispatch({type:'input',value:0});
  const r=store.get().result;close(r.yearNet,0,.01);assert.ok(r.net>0);
  const points=profitCurve(r.state,40,r.breakEven);close(points[0].net,0,.01);assert.ok(points.every(p=>p.net>=-.01));
 }
});
