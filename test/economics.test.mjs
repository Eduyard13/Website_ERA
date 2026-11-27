import {test} from 'node:test';
import assert from 'node:assert/strict';
import {economicsConfig as config,scenarioPrices,marketOffers} from '../public/economics-config.js';
import {calculateEconomics,initialEconomicsState,normalizeEconomicsState,changeEconomicsSelection,profitCurve,productionBasis} from '../public/economics-model.js';
import {renderCurve,renderBridge,renderMonth,renderMarketPrice,priceStageText} from '../public/economics-view.js';
import {createEconomicsStore,createInvestmentStore,getFxSnapshot} from '../public/economics-page-state.js';
import {financialValues,priceText,renderAllocation,renderProfitChart,renderResilienceScale,scenarioTopic} from '../public/economics-page-view.js';
import {moscowDay} from '../public/fx-core.js';
import {economicsPage} from '../scripts/economics-page.mjs';
const close=(actual,expected,tolerance=.00001)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('Рабочий месяц сохраняет ЛСП и пересчитывает КПП для выхода 50%',()=>{
 for(const [state,input,price,revenue,cash,dep,cost,tax,net,unit] of [
  [{salePrices:{separation:50000}},1116,50000,22868852.46,16288252.39,645536.95,16933789.34,1483765.78,4451297.34,7977.24],
  [{mode:'full',salePrices:{full:110000}},1116,110000,50311475.41,26127428.06,1961047.90,28088475.96,5555749.86,16667249.59,29869.62],
  [{mode:'full',salePrices:{full:100000}},1116,100000,45737704.92,26127428.06,1961047.90,28088475.96,4412307.24,13236921.72,23722.08],
 ]){
  const r=calculateEconomics(state);close(r.state.input,input);close(r.output,558);close(r.grossPrice,price);close(r.revenue,revenue,.01);close(r.cashOpex,cash,.01);close(r.depreciation,dep,.01);close(r.totalCosts,cost,.01);close(r.tax,tax,.01);close(r.net,net,.01);close(r.perProduct.net,unit,.01);close(r.hoursPerLine,744);
 }
 const sep=calculateEconomics({salePrices:{separation:50000}}),full=calculateEconomics({mode:'full',salePrices:{full:110000}});
 close(sep.margin,.19464454288,.00001);close(full.margin,.33128127238,.00001);
 close(sep.totalYield,.5);close(full.totalYield,.5);close(full.output,744*.75);
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
  if(mode==='separation')for(const cost of config.costs)close(r.costs.find(c=>c.id===cost.id).value,cost.id==='feedstock'?6696000:cost.separation,.02);
  for(const id of ['water','reagents','building'])if(mode==='separation'||id==='building')close(r.costs.find(c=>c.id===id).value,0);
  assert.equal(r.costs.filter(c=>c.id==='depreciation').length,1);
 }
});
test('Нулевая загрузка сохраняет постоянные расходы и амортизацию, убыток и прочерки на тонну',()=>{
 for(const mode of ['separation','full']){
  const r=calculateEconomics({mode,input:0,lines:2});
  close(r.output,0);close(r.revenue,0);close(r.variableCosts,0);close(r.tax,0);close(r.net,-r.fixedCosts);
  close(r.cashOpex,2*productionBasis(mode).fixedCashOpex);close(r.depreciation,2*config.modes[mode].depreciation);
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
  for(const lines of mode==='full'?[2,3,5]:[2,3]){
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
   close(r.load,load);close(r.state.input,lines*productionBasis(mode).referenceInput*load);assert.equal(state.salePrices.full,100000);assert.equal(state.salePrices.separation,45000);
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
 close(normalizeEconomicsState({mode:'full',input:999999}).input,productionBasis('full').referenceInput);
 assert.ok(profitCurve({},0).length>=2);
});
test('Ценовые пресеты описывают цену, а не обещание роста по рабочим месяцам',()=>{
 const r=calculateEconomics({mode:'full',salePrices:{full:110000}});assert.equal(priceStageText(r),'Премиальный');
 assert.equal(priceStageText(calculateEconomics({mode:'full'})),'Базовый');
 assert.equal(priceStageText(calculateEconomics({mode:'full',salePrices:{full:100000}})),'Развитие');
 assert.match(renderMarketPrice(r),/110 ₽\/кг с НДС/);assert.match(renderMarketPrice(r),/80 ₽\/кг/);
 for(const mode of Object.values(config.modes))for(const p of mode.priceStages)assert.doesNotMatch(p.period,/месяц|этап|перв/iu);
 assert.ok(!('granulationYield' in config));assert.ok(!('granulationYield' in r.state));
});
test('SSR, модель и единое состояние начинают с согласованной базы 45/90 ₽ за кг',()=>{
 const store=createEconomicsStore();assert.equal(store.get().state.salePrices.separation,45000);assert.equal(store.get().state.salePrices.full,90000);
 assert.equal(config.modes.full.defaultGrossPrice,90000);assert.equal(calculateEconomics({mode:'full'}).grossPrice,90000);
 store.dispatch({type:'selection',value:{mode:'full'}});close(store.get().result.net,9806593.85,.01);
 store.dispatch({type:'price',value:100000});const r=store.get().result;
 close(r.net,13236921.72,.01);close(r.margin,.28940939961,.00001);
 assert.equal(priceText(r.perProduct.totalCosts),'50,34 ₽/кг');assert.equal(priceText(r.perProduct.tax),'7,91 ₽/кг');assert.equal(priceText(r.perProduct.net),'23,72 ₽/кг');
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
test('Прежний режим состояния фиксирует полный цикл при открытии, смене комплектов и сбросе',()=>{
 const store=createEconomicsStore({lockedMode:'full'});
 const baseline=store.get();
 assert.equal(baseline.state.mode,'full');assert.equal(baseline.state.lines,1);
 assert.equal(baseline.result.grossPrice,90000);assert.equal(baseline.result.load,1);assert.equal(baseline.result.output,558);
 close(baseline.result.revenue,41163934.43,.01);close(baseline.result.totalCosts,28088475.96,.01);
 close(baseline.result.net,9806593.85,.01);close(baseline.result.yearNet,112931175.36,.01);
 assert.deepEqual(baseline.result.payback,{status:'individual'});
 store.dispatch({type:'price',value:100000});
 const at100=store.get().result;
 close(at100.net,13236921.72,.01);close(at100.yearNet,153320519.62,.01);
 assert.deepEqual(at100.payback,{status:'individual'});
 store.dispatch({type:'price',value:99500});
 store.dispatch({type:'input',value:baseline.result.capacity*.8});
 for(const lines of [2,3,1]){
  store.dispatch({type:'selection',value:{mode:'separation',lines}});
  const {state,result}=store.get();
  assert.equal(state.mode,'full');assert.equal(state.lines,lines);
  assert.equal(result.grossPrice,99500);close(result.load,.8);
  assert.equal(result.payback.status,'individual');
 }
 store.dispatch({type:'input',value:0});
 assert.ok(store.get().result.net>=0);assert.ok(store.get().result.yearNet>=0);
 store.dispatch({type:'unit',value:'tonne'});
 store.dispatch({type:'reset'});assert.deepEqual(store.get(),baseline);
 assert.equal(createEconomicsStore().get().state.mode,'separation');
});
test('Непредставимо малый положительный выпуск не выводит Infinity или NaN в денежных показателях',()=>{
 const r=calculateEconomics({input:1e-308});assert.equal(priceText(r.perProduct.totalCosts),'—');
 assert.doesNotMatch(renderBridge(r),/NaN|Infinity|∞/);assert.match(renderBridge(r),/Объём слишком мал/);
});

test('Семь ценовых ориентиров: независимые денежные контроли месяца и 365-дневного года',()=>{
 const controls=[
  ['separation',40000,18295081.97,1020969.47,215409836.07,10750124.35,[13,19.5]],
  ['separation',45000,20581967.21,2736133.40,242336065.57,30944796.49,[6.2,9.3]],
  ['separation',50000,22868852.46,4451297.34,269262295.08,51139468.62,[4.1,6.1]],
  ['full',80000,36590163.93,6376265.98,430819672.13,72541831.10,null],
  ['full',90000,41163934.43,9806593.85,484672131.15,112931175.36,null],
  ['full',100000,45737704.92,13236921.72,538524590.16,153320519.62,null],
  ['full',110000,50311475.41,16667249.59,592377049.18,193709863.88,null],
 ];
 for(const [mode,price,revenue,net,yearRevenue,yearNet,range] of controls){
  const r=calculateEconomics({mode,salePrices:{[mode]:price}});
  close(r.revenue,revenue,.01);close(r.net,net,.01);close(r.yearRevenue,yearRevenue,.01);close(r.yearNet,yearNet,.01);
  assert.equal(r.payback.status,range?'estimate':'individual');assert.deepEqual(r.payback.months??null,range);
  close(r.yearOutput,6570);close(r.yearHoursPerLine,8760);assert.notEqual(r.yearNet,r.net*12);
 }
 close(calculateEconomics().yearInput,13140);close(calculateEconomics({mode:'full'}).yearInput,13140);
 close(calculateEconomics().breakEvenGrossPrice/1000,37.0236971238792,.00001);
 close(calculateEconomics({mode:'full'}).breakEvenGrossPrice/1000,61.41208005136819,.00001);
});
test('Год сохраняет 12 месяцев постоянных расходов, объёмные переменные и положительный налог во всех масштабах',()=>{
 for(const mode of ['separation','full'])for(const lines of [1,2,3])for(const load of [0,.5,.8,1])for(const preset of scenarioPrices(config.modes[mode])){
  const r=calculateEconomics({mode,lines,input:productionBasis(mode).referenceInput*lines*load,salePrices:{[mode]:preset.price}});
  close(r.yearOutput,6570*lines*load);close(r.yearDepreciation,12*config.modes[mode].depreciation*lines);
  close(r.yearFixedCashCosts,12*productionBasis(mode).fixedCashOpex*lines);
  close(r.yearVariableCosts,r.variableCosts*365/31);
  close(r.revenue,r.totalCosts+r.tax+r.net);close(r.yearRevenue,r.yearCosts+r.yearTax+r.yearNet);
  close(r.annualOperatingCash,r.yearNet+r.yearDepreciation);close(r.averageMonthlyOperatingCash,r.annualOperatingCash/12);
  assert.ok(r.tax>=0&&r.yearTax>=0);
  if(!load){assert.equal(r.yearVariableCosts,0);assert.equal(r.yearTax,0);assert.equal(r.yearMargin,null);assert.equal(r.yearUnitCosts,null);assert.equal(r.breakEvenGrossPrice,null);assert.equal(r.yearBreakEvenGrossPrice,null);assert.equal(r.payback.status,'unreachable');}
  else{close(r.yearUnitCosts*r.yearOutput,r.yearCosts);close(r.yearBreakEvenGrossPrice/1.22*r.yearOutput,r.yearCosts);}
  const one=calculateEconomics({mode,input:productionBasis(mode).referenceInput*load,salePrices:{[mode]:preset.price}});
  for(const field of ['yearInput','yearOutput','yearRevenue','yearCosts','yearTax','yearNet'])close(r[field],one[field]*lines,.00001);
  assert.deepEqual(r.payback,one.payback);
 }
});
test('Контроль неполной загрузки: 80%, 50%, убыток и поток при нуле',()=>{
 for(const [mode,load,net,yearNet] of [
  ['separation',.8,1063192.39,11247265.19],['full',.8,5601265.95,63416830.71],
  ['separation',.5,-1928292.17,-24398709.00],['full',.5,-942301.20,-14472915.01],
 ]){const r=calculateEconomics({mode,input:productionBasis(mode).referenceInput*load});close(r.net,net,.01);close(r.yearNet,yearNet,.01);}
 const lossWithCash=calculateEconomics({mode:'full',input:productionBasis('full').referenceInput*.49});
 assert.ok(lossWithCash.yearNet<0&&lossWithCash.annualOperatingCash>0);assert.equal(lossWithCash.payback.status,'individual');
});
test('Своя цена и точный объём пересчитывают год; срок не интерполируется за пределами утверждённых узлов',()=>{
 const exact=calculateEconomics({mode:'full',input:777.123456,salePrices:{full:90555.55}});
 close(exact.grossPrice,90555.55);close(exact.state.input,777.123456);assert.equal(exact.payback.status,'individual');
 const offGrid=calculateEconomics({mode:'full',input:productionBasis('full').referenceInput*.82345});
 close(offGrid.load,.82345);assert.equal(offGrid.payback.status,'individual');
 const zeroPrice=calculateEconomics({salePrices:{separation:0}});assert.equal(zeroPrice.yearRevenue,0);assert.equal(zeroPrice.yearTax,0);assert.equal(zeroPrice.payback.status,'unreachable');
});
test('Сброс восстанавливает обе базовые цены, первый продукт и полную загрузку одним уведомлением',()=>{
 const store=createEconomicsStore(),seen=[];store.subscribe(snapshot=>seen.push(snapshot));
 store.dispatch({type:'selection',value:{mode:'full',lines:3}});store.dispatch({type:'price',value:99500});store.dispatch({type:'input',value:101.123});
 const before=seen.length;store.dispatch({type:'reset'});assert.equal(seen.length,before+1);
 const {state,result}=store.get();assert.deepEqual(state,initialEconomicsState());close(result.load,1);assert.equal(result.grossPrice,45000);assert.equal(state.salePrices.full,90000);
});

test('Прежний интерфейс расчёта начинается с безубыточности и не допускает отрицательный месяц или год',()=>{
 for(const mode of ['separation','full'])for(const lines of [1,2,3]){
  const store=createEconomicsStore();store.dispatch({type:'selection',value:{mode,lines}});
  for(const price of [0,...scenarioPrices(config.modes[mode]).map(p=>p.price),99555.55]){
   store.dispatch({type:'price',value:price});
   for(const input of [0,1,productionBasis(mode).referenceInput*lines*.5,productionBasis(mode).referenceInput*lines]){
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

test('Независимый контроль полного цикла во всех 16 сценариях',()=>{
 // Control totals for the 27.11.2026 estimate: fixed cash, depreciation and hourly expenses including feedstock.
 const fixedMonthly=12999012.979132,depreciation=1961047.8954266747;
 const hourCash=13128415.083362048/744;
 const monthCosts=fixedMonthly+depreciation+hourCash*744;
 const yearCosts=12*(fixedMonthly+depreciation)+hourCash*8760;
 for(const lines of [1,2,3,5])for(const grossPrice of [80000,90000,100000,110000]){
  const r=calculateEconomics({mode:'full',grossPrice,lines});
  assert.equal(r.state.lines,lines);assert.equal(r.mode.staff,54);
  close(r.state.input,1116*lines);close(r.output,558*lines);close(r.other,558*lines);
  close(r.yearInput,13140*lines);close(r.yearOutput,6570*lines);close(r.yearOther,6570*lines);
  const monthRevenue=558*lines*grossPrice/1.22,yearRevenue=6570*lines*grossPrice/1.22;
  close(r.totalCosts,monthCosts*lines);close(r.yearCosts,yearCosts*lines);
  close(r.revenue,monthRevenue);close(r.yearRevenue,yearRevenue);
  close(r.tax,.25*(monthRevenue-r.totalCosts));close(r.yearTax,.25*(yearRevenue-r.yearCosts));
  close(r.net,.75*(monthRevenue-r.totalCosts));close(r.yearNet,.75*(yearRevenue-r.yearCosts));
  close(r.margin,r.net/monthRevenue);close(r.perProduct.net,r.net/(558*lines));
  close(r.breakEvenGrossPrice,monthCosts*1.22/558);
  close(r.costs.reduce((s,cost)=>s+cost.value,0),r.totalCosts);
  close([r.totalCosts,r.tax,r.net].reduce((s,amount)=>s+amount/r.revenue,0),1);
 }
});

test('Региональная смета сходится по статьям, календарю и границам безубыточности',()=>{
 const r=calculateEconomics({mode:'full'});
 const control={feedstock:6696000,payroll:6185218.93,electricity:8492115.58,water:24558.94,
  reagents:602200,transport:969923.19,ppe:775933.99,supplies:686325.42,office:114000,
  disposal:1581152,building:0,depreciation:1961047.90};
 assert.deepEqual(r.costs.map(cost=>cost.id),Object.keys(control));
 for(const cost of r.costs)close(cost.value,control[cost.id],.01);
 close(r.fixedCashCosts,12999012.979132);close(r.variableCosts,13128415.083362048);
 close(r.totalCosts,28088475.96,.01);close(r.yearCosts,334097230.67,.01);
 close(r.tax,3268864.62,.01);close(r.yearTax,37643725.12,.01);
 assert.equal(priceText(r.perProduct.price,2),'73,77 ₽/кг');
 assert.equal(priceText(r.perProduct.totalCosts,2),'50,34 ₽/кг');
 assert.equal(priceText(r.perProduct.tax,2),'5,86 ₽/кг');
 assert.equal(priceText(r.perProduct.net,2),'17,57 ₽/кг');
 assert.equal(priceText(r.yearBreakEvenGrossPrice,2),'62,04 ₽/кг');
 assert.equal(r.minimumGrossPrice,70000);close(r.minimumLoad,.54384461244);
 const half=calculateEconomics({mode:'full',load:.5});
 close(half.net,-942301.20,.01);assert.equal(half.tax,0);assert.equal(half.yearTax,0);
 const idle=calculateEconomics({mode:'full',load:0});
 close(idle.totalCosts,14960060.87,.01);assert.equal(idle.variableCosts,0);
});

test('Единое состояние синхронизирует цену, сохраняя масштаб, период и базовые показатели отдельно',()=>{
 const store=createInvestmentStore(),base=store.get();
 assert.deepEqual(base.state,{scenario:'base',complexes:1,period:'hour'});
 assert.equal(base.result.state.mode,'full');assert.equal(base.separation.state.mode,'separation');
 assert.equal(base.separation.grossPrice,50000);close(base.separation.net,4451297.339062745);
 close(calculateEconomics({mode:'separation'}).net,2736133.40,.01);
 const actions=[];store.subscribe((value,action)=>actions.push([value,action]));
 store.dispatch({type:'network',value:5});
 close(store.get().network.net,5*base.result.net);
 assert.equal(store.get().result,base.result);
 assert.equal(store.get().network.margin,base.result.margin);
 store.dispatch({type:'price',value:'development'});
 const updated=store.get();
 assert.equal(updated.result.grossPrice,100000);assert.equal(updated.network.grossPrice,100000);
 close(updated.network.yearNet,5*updated.result.yearNet);
 assert.equal(updated.baseline,base.baseline);assert.equal(updated.resilience,base.resilience);
 assert.equal(updated.separation,base.separation);
 assert.match(scenarioTopic(updated.network),/Полный цикл · 5 комплексов · 100 ₽\/кг с НДС · загрузка 100% · выход 50%/);
 store.dispatch({type:'period',value:'year'});
 assert.deepEqual(store.get().balance,{input:13140,output:6570});
 assert.equal(store.get().result,updated.result);
 store.dispatch({type:'reset'});
 assert.deepEqual(store.get(),base);
 assert.deepEqual(actions.map(([,action])=>action),['network','price','period','reset']);
});

const mutableConfig=()=>structuredClone(config);
test('Тестовые вводные автоматически обновляют исходные суммы, статический HTML и интерактивные сценарии',()=>{
 const custom=mutableConfig(),base=calculateEconomics({mode:'full'});
 custom.feedstockPrice=7000;
 const moreRaw=calculateEconomics({mode:'full'},custom);
 close(moreRaw.totalCosts-base.totalCosts,1116000);
 close(moreRaw.perProduct.totalCosts-base.perProduct.totalCosts,2000);
 assert.match(economicsPage({config:custom}),/7 ₽\/кг<\/strong>.*?Входящее сырьё/s);
 assert.match(economicsPage({config:custom}),/×12,86</);
 custom.modes.full.defaultGrossPrice=95000;
 custom.costs.find(cost=>cost.id==='electricity').full.hourly*=1.1;
 custom.costs.find(cost=>cost.id==='payroll').full.monthly+=400000;
 custom.vatRate=.2;custom.taxRate=.3;
 const revised=calculateEconomics({mode:'full'},custom),html=economicsPage({config:custom});
 close(revised.totalCosts,moreRaw.totalCosts+345911.55816+400000);
 assert.equal(revised.grossPrice,95000);close(revised.revenue,558*95000/1.2);
 close(revised.tax,.3*(revised.revenue-revised.totalCosts));
 assert.match(html,/data-econ-price="base" data-price-rub="95000" aria-pressed="true"/);
 assert.match(html,/data-econ-value="price">95 ₽\/кг</);
 assert.match(html,/НДС 20%/);
 const next=mutableConfig();
 next.modes.full.inputRate=2;next.modes.full.outputRate=.9;next.monthDays=30;next.yearDays=360;
 const rates=calculateEconomics({mode:'full'},next),snapshot=createInvestmentStore({config:next}).get();
 close(rates.totalYield,.45);close(rates.output,648);close(rates.yearOutput,7776);close(rates.feedCost,8640000);
 close(rates.costs.reduce((s,c)=>s+c.value,0),rates.totalCosts);
 assert.equal(financialValues(snapshot).balanceInput,'2\u00a0000 кг/ч');
 assert.match(economicsPage({config:next}),/900 кг готовой гранулы/);
 assert.match(economicsPage({config:next}),/45%/);
 const offers=marketOffers.map(o=>o.id==='alfa-stretch'?{...o,price:78,checkedAt:'2026-11-26'}:o);
 const marketUpdate=economicsPage({offers});
 assert.match(marketUpdate,/78 ₽\/кг/);assert.match(marketUpdate,/26\.11\.2026/);
 assert.match(marketUpdate,/data-econ-value="price">90 ₽\/кг</);
});

test('Окупаемость использует денежный поток при подтверждённом CAPEX; убытки не исключаются из графиков',()=>{
 const custom=mutableConfig();custom.modes.full.equipmentCost=90000000;
 const base=calculateEconomics({mode:'full'},custom),network=calculateEconomics({mode:'full',lines:5},custom);
 assert.equal(network.equipmentInvestment,450000000);
 close(base.payback.months[0],90000000/((base.yearNet+base.yearDepreciation)/12));
 close(network.payback.months[0],base.payback.months[0]);
 assert.equal(calculateEconomics({mode:'full',grossPrice:0},custom).payback.status,'unreachable');

 custom.modes.full.defaultGrossPrice=50000;
 const snapshot=createInvestmentStore({config:custom}).get();
 assert.equal(snapshot.result.grossPrice,50000);assert.ok(snapshot.result.net<0);assert.equal(snapshot.result.tax,0);
 assert.equal(financialValues(snapshot).heroMonthNet,financialValues(snapshot).monthNet);
 assert.match(financialValues(snapshot).heroMonthNet,/^−/);
 assert.ok(snapshot.resilience.reserve<0);
 assert.match(renderResilienceScale(snapshot.resilience),/data-negative="true"/);
 const loss=renderAllocation(snapshot.result);
 assert.doesNotMatch(loss,/ec-allocation-track|NaN|Infinity|flex-basis:-/);
 assert.match(loss,/Убыток.*?−/s);
 assert.match(renderProfitChart(snapshot.scenarios,'base'),/data-active="true" data-loss="true"/);

 const atZero=calculateEconomics({mode:'full',grossPrice:base.breakEvenGrossPrice},custom);
 close(atZero.net,0);
 assert.ok(calculateEconomics({mode:'full',grossPrice:base.breakEvenGrossPrice-1},custom).net<0);
 assert.ok(calculateEconomics({mode:'full',grossPrice:base.breakEvenGrossPrice+1},custom).net>0);
 custom.modes.full.outputRate=0;
 const noOutput=calculateEconomics({mode:'full'},custom);
 assert.equal(noOutput.perProduct,null);assert.equal(noOutput.breakEvenGrossPrice,null);assert.equal(noOutput.margin,null);
 assert.doesNotMatch(economicsPage({config:custom}),/NaN|Infinity/);
});

function cbrFixture(day='2026-11-26'){
 return {schemaVersion:1,source:'CBR',requestedDate:day,effectiveDate:day,fetchedAt:day+'T09:00:00Z',
  sourceUrl:'https://www.cbr.ru/scripts/XML_daily.asp?date_req='+day.split('-').reverse().join('/'),
  rates:{USD:{nominal:2,value:164.253,rate:82.1265},EUR:{nominal:1,value:95,rate:95},CNY:{nominal:10,value:115,rate:11.5}}};
}

test('Единый официальный курс конвертирует значения и показывает дату, состояние кэша или недоступность',()=>{
 const fixture=cbrFixture(),event={data:fixture,status:'live'};
 const live=getFxSnapshot(event,'2026-11-26');
 assert.deepEqual(live,{rateRubPerUsd:82.1265,effectiveDate:'2026-11-26',status:'live'});
 assert.equal(getFxSnapshot(event,'2026-11-27').status,'stale');
 assert.equal(getFxSnapshot(event,'2026-11-25'),null);
 const store=createInvestmentStore({fx:live});
 const base=financialValues(store.get());
 assert.equal(base.monthUsd,'≈ 119,41 тыс. $');assert.equal(base.tonneUsd,'≈ 213,99 $/т');
 assert.equal(base.heroMonthNet,'≈ 10 млн ₽');assert.equal(base.heroYearNet,'≈ 120 млн ₽');
 assert.equal(base.heroMonthUsd,'≈ 120 тыс. $');assert.equal(base.heroYearUsd,'≈ 1,5 млн $');
 assert.equal(base.heroYearNote,'Расчёт за 365 дней — 112,93 млн ₽');
 assert.match(base.rate,/26\.11\.2026/);
 store.dispatch({type:'network',value:5});
 assert.equal(financialValues(store.get()).networkMonthUsd,'≈ 597,04 тыс. $');
 store.dispatch({type:'fx',value:{data:{...fixture,source:'other'}}});
 assert.equal(financialValues(store.get()).rate,base.rate);
 const withoutRate=financialValues(createInvestmentStore().get());
 assert.equal(withoutRate.monthUsd,'USD недоступен');assert.equal(withoutRate.heroYearUsd,'USD недоступен');
 const dated=cbrFixture(moscowDay());
 const ssr=economicsPage({rates:dated});
 assert.match(ssr,/data-econ-fx-seed/);assert.match(ssr,/data-econ-value="heroYearUsd">≈ 1,5 млн \$/);
 store.dispatch({type:'fx',value:{data:{...dated,rates:{...dated.rates,USD:{nominal:1,value:100,rate:100}}},status:'live'}});
 const refreshed=financialValues(store.get());
 assert.equal(refreshed.heroYearUsd,'≈ 1,2 млн $');assert.equal(refreshed.heroMonthUsd,'≈ 100 тыс. $');
 assert.equal(refreshed.heroYearNet,base.heroYearNet);assert.equal(refreshed.yearNet,base.yearNet);
 store.dispatch({type:'price',value:'premium'});
 const selected=financialValues(store.get());
 assert.equal(selected.heroYearNet,selected.yearNet);assert.equal(selected.heroMonthUsd,selected.monthUsd);
 assert.equal(selected.heroYearNote,'');
 assert.match(economicsPage(),/data-econ-value="rate">Курс ЦБ РФ недоступен/);
});
