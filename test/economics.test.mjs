import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateEconomics,initialEconomicsState,normalizeEconomicsState,profitCurve} from '../public/economics-model.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<.00001,`${actual} != ${expected}`);

test('Два базовых экономических сценария совпадают с брифом на одном входном объёме',()=>{
 const sep=calculateEconomics(),full=calculateEconomics({mode:'full'});
 for(const [result,output,revenue,variable,fixed,tax,net,productProfit,inputProfit] of [[sep,360,16200000,9000000,2700000,900000,3600000,10000,5000],[full,324,24300000,12393000,5832000,1215000,4860000,15000,6750]]){
  close(result.output,output);close(result.revenue,revenue);close(result.variableCosts,variable);close(result.fixedCosts,fixed);close(result.tax,tax);close(result.net,net);close(result.perProduct.net,productProfit);close(result.perInput,inputProfit);
  close(result.segments.reduce((sum,s)=>sum+s.value,0),result.revenue);
 }
 close(full.net-sep.net,1260000);close(sep.margin,2/9);close(full.margin,.2);
});
test('Нулевой объём сохраняет постоянные расходы, убыток и пустые знаменатели',()=>{
 for(const mode of ['separation','full']){
  const r=calculateEconomics({mode,input:0,lines:2});
  close(r.output,0);close(r.revenue,0);close(r.variableCosts,0);close(r.tax,0);close(r.net,-r.fixedCosts);
  assert.equal(r.margin,null);assert.equal(r.perProduct,null);assert.equal(r.perInput,null);assert.equal(r.donutAvailable,false);
 }
});
test('Убыточная цена не создаёт отрицательного налога или положительного сектора прибыли',()=>{
 const r=calculateEconomics({...initialEconomicsState(),salePrices:{separation:10000,full:75000}});
 assert.ok(r.net<0);assert.equal(r.tax,0);assert.equal(r.donutAvailable,false);assert.equal(r.breakEvenState,'negative-contribution');assert.equal(r.breakEven,null);
 const lowYield=calculateEconomics({separationYield:.01});assert.equal(lowYield.breakEvenState,'negative-contribution');
 const lowContribution=calculateEconomics({salePrices:{separation:26000,full:75000}});assert.equal(lowContribution.breakEvenState,'outside-capacity');
});
test('Параллельные линии масштабируют постоянные затраты, ёмкость и выпуск без двойного счёта',()=>{
 for(const mode of ['separation','full']){
  const one=calculateEconomics({mode});
  for(const lines of [2,3]){
   const many=calculateEconomics({mode,lines,input:720*lines});
   close(many.net,one.net*lines);close(many.margin,one.margin);close(many.capacity,1080*lines);close(many.hoursPerLine,480);
  }
 }
 const reduced=normalizeEconomicsState({lines:1,input:2000});assert.equal(reduced.input,1080);
 const max=calculateEconomics({input:1080});close(max.output,540);close(max.hoursPerLine,720);
});
test('Финансовые границы и кривая согласованы, без NaN, с настоящей точкой безубыточности',()=>{
 for(const mode of ['separation','full']){
  const base=calculateEconomics({mode});close(calculateEconomics({mode,input:base.breakEven}).net,0);
  for(const point of profitCurve({mode})){close(point.net,calculateEconomics({mode,input:point.input}).net);assert.ok(Number.isFinite(point.net));}
 }
 const zeroOutput=calculateEconomics({separationYield:0});assert.equal(zeroOutput.perProduct,null);assert.equal(zeroOutput.margin,null);
 const normalized=normalizeEconomicsState({input:Infinity,lines:-5,separationYield:5,granulationYield:-1,salePrices:{full:-12}});
 assert.equal(normalized.lines,1);assert.equal(normalized.input,720);assert.equal(normalized.separationYield,1);assert.equal(normalized.granulationYield,0);assert.equal(normalized.salePrices.full,0);
});
