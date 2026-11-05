import {test} from 'node:test';
import assert from 'node:assert/strict';
import {economicsConfig as config} from '../public/economics-config.js';
import {calculateEconomics,initialEconomicsState,normalizeEconomicsState,changeEconomicsSelection,profitCurve} from '../public/economics-model.js';
import {renderCurve,renderBridge,renderMonth,renderMarketPrice,priceStageText} from '../public/economics-view.js';
const close=(actual,expected,tolerance=.00001)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('Рабочие месяцы ЛСП и КПП точно воспроизводят финансовые модели 05.11.2026',()=>{
 for(const [state,input,price,revenue,cash,dep,cost,tax,net,unit] of [
  [{},1116,50000,22868852.46,16288252.39,645536.95,16933789.34,1483765.78,4451297.34,7977.24],
  [{mode:'full'},970.4347826086957,110000,50311475.41,24930006.22,1961047.90,26891054.12,5855105.32,17565315.97,31479.06],
  [{mode:'full',salePrices:{full:100000}},970.4347826086957,100000,45737704.92,24930006.22,1961047.90,26891054.12,4711662.70,14134988.10,25331.52],
 ]){
  const r=calculateEconomics(state);close(r.state.input,input);close(r.output,558);close(r.grossPrice,price);close(r.revenue,revenue,.01);close(r.cashOpex,cash,.01);close(r.depreciation,dep,.01);close(r.totalCosts,cost,.01);close(r.tax,tax,.01);close(r.net,net,.01);close(r.perProduct.net,unit,.01);close(r.hoursPerLine,744);
 }
 const sep=calculateEconomics(),full=calculateEconomics({mode:'full'});
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
  assert.ok(renderBridge(r).includes('—'));assert.ok(renderCurve(r).includes('Убыток'));
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
   close(r.load,load);close(r.state.input,lines*config.modes[mode].referenceInput*load);assert.equal(state.salePrices.full,100000);assert.equal(state.salePrices.separation,50000);
  }
 }
 const a=initialEconomicsState(),b=initialEconomicsState();a.salePrices.full=90000;assert.equal(b.salePrices.full,110000);
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
test('Премиальная цена 110 ₽/кг относится к рабочему этапу, а не к дате сайта или прайсам продавцов',()=>{
 const r=calculateEconomics({mode:'full'});assert.match(priceStageText(r),/Премиальный этап, с 7-го рабочего месяца/);
 assert.match(priceStageText(calculateEconomics({mode:'full',salePrices:{full:100000}})),/Базовый этап/);
 assert.match(renderMarketPrice(r),/110 ₽\/кг с НДС/);assert.match(renderMarketPrice(r),/100 ₽\/кг/);
 assert.ok(!('granulationYield' in config));assert.ok(!('granulationYield' in r.state));
});
