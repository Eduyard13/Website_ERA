import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {basePath,render} from '../../scripts/build/build.mjs';
import {formatLineNumber,linePowerData,linePowerTotals} from '../../content/lines/shared/line-engineering.mjs';
import {linePlacement} from '../../content/lines/shared/line-placement.mjs';
import {publicLibraryDocuments} from '../../content/documents/document-library.mjs';
import {imageSize} from '../../scripts/media/image-size.mjs';
import {lines} from '../../content/equipment/catalog.mjs';
import {lineCoverFiles} from '../../scripts/render/lines/line-page-media.mjs';
import catalogueCovers from '../../content/equipment/line-catalogue-covers.json' with {type:'json'};

const expected={
 'separatsiya-01':{power:[225,157.5],belts:6,tabs:2,dimensions:['17,75','11,75','208,56'],format:'A4'},
 'separatsiya-02':{power:[405.2,283.64],belts:13,tabs:4,dimensions:['45','18','810'],format:'A0'},
 'separatsiya-03':{power:[642.4,449.68],belts:28,tabs:3,dimensions:['56,2','43,4','2 439,08'],format:'A0'},
 'moyka-plenki':{power:[1271.7,890.19],belts:15,tabs:4,dimensions:['68','33','2 244'],format:'A0'},
};
const cents=value=>Math.round(value*100);
const calculated=value=>Math.round(cents(value)*70/100)/100;
const section=(html,id)=>html.match(new RegExp(`<section[^>]* id="${id}">([\\s\\S]*?)</section>`))[1];

test('Электрические ведомости совпадают с суммой нагрузок и показывают все учтённые позиции',()=>{
 for(const [slug,{power,belts}] of Object.entries(expected)){
  const data=linePowerData[slug];
  const totals=linePowerTotals(slug);
  assert.deepEqual([totals.installed,totals.calculated],power,slug);
  assert.deepEqual([data.installed_kw,data.calculated_kw],power,slug);
  assert.equal(data.load_factor,0.7,slug);
  assert.equal(data.groups.belt.quantity,belts,slug);
  assert.equal(data.groups.screw?.quantity,slug==='moyka-plenki'?6:undefined);
  assert.equal(new Set(data.rows.map(row=>row.position)).size,data.rows.length,slug);
  const missing=data.rows.filter(row=>row.installed_total_kw===null).map(row=>row.position);
  assert.deepEqual(missing,slug==='separatsiya-01'?[4,11,13]:[],slug);
  for(const row of data.rows){
   if(row.installed_total_kw===null){
    assert.deepEqual([row.installed_unit_kw,row.calculated_unit_kw,row.calculated_total_kw],[null,null,null]);
    continue;
   }
   assert.equal(row.installed_total_kw,cents(row.installed_unit_kw)*row.quantity/100,`${slug}:${row.position}`);
   assert.equal(row.calculated_unit_kw,calculated(row.installed_unit_kw));
   assert.equal(row.calculated_total_kw,calculated(row.installed_total_kw));
  }
  for(const [group,subtotal] of Object.entries(data.groups)){
   const rows=data.rows.filter(row=>row.group===group);
   assert.equal(subtotal.quantity,rows.reduce((sum,row)=>sum+row.quantity,0),`${slug} ${group}`);
   assert.equal(subtotal.installed_kw,rows.reduce((sum,row)=>sum+cents(row.installed_total_kw??0),0)/100,`${slug} ${group}`);
   assert.equal(subtotal.calculated_kw,calculated(subtotal.installed_kw),`${slug} ${group}`);
  }
  assert.deepEqual(data.periods.map(period=>period.hours),[1,24,720,8760],slug);
  const specs=section(render('/catalog/lines/'+slug),'specs');
  assert.equal((specs.match(/class="line-more line-power-details" data-keep-open>/g)||[]).length,1,slug);
  for(const {hours,kwh} of data.periods){
   assert.equal(kwh,cents(totals.calculated)*hours/100,slug);
   const display=hours===1?`${formatLineNumber(kwh,true)} кВт·ч`:`${formatLineNumber(kwh/1000,true)} МВт·ч`;
   if(slug==='moyka-plenki'&&hours!==1)assert.ok(specs.includes(`data-base-spec-fact="energy-${hours}"`)&&specs.includes(display.replace(' МВт·ч',' <small>МВт·ч')),slug);
  }
  assert.equal((specs.match(/data-power-position="/g)||[]).length,data.rows.length,slug);
  if(['separatsiya-01','separatsiya-02','separatsiya-03'].includes(slug))assert.match(specs,/data-base-output-hours="8760"><dt>За год<\/dt><dd>6 570 <small>т<\/small>/);
  else if(slug!=='moyka-plenki')assert.match(specs,/13 140<\/td><td>6 570<\/td>/);
 }
 assert.equal(linePowerData['separatsiya-03'].rows.find(row=>row.position===29).quantity,5);
});

test('У каждой линии три документа и полные проекции из своего чертежа',async()=>{
 assert.equal(publicLibraryDocuments.length,36);
 const catalogue=render('/catalog/lines');
 for(const [slug,{tabs,dimensions,format}] of Object.entries(expected)){
  const html=render('/catalog/lines/'+slug);
  const documents=JSON.parse(html.match(/<script type="application\/json" id="line-document-data">(.*?)<\/script>/s)[1]);
  const library=publicLibraryDocuments.filter(doc=>doc.objectType==='line'&&doc.objectSlug===slug);
  assert.deepEqual(library.map(doc=>doc.category).sort(),['brochures','drawings','technical'],slug);
  assert.deepEqual(documents.map(doc=>doc.id).sort(),library.map(doc=>doc.id).sort(),slug);
  const drawing=library.find(doc=>doc.category==='drawings');
  assert.equal(drawing.format,format,slug);
  assert.equal(drawing.pages,1,slug);
  assert.equal(library.find(doc=>doc.category==='brochures').pages,3,slug);
  const placement=section(html,'placement');
  assert.equal((placement.match(/data-dimension-tab="/g)||[]).length,tabs,slug);
  assert.doesNotMatch(placement,/<a\b|\s(?:href|target|download|data-pdf-open)=/i);
  const documentation=section(html,'documents');
  assert.ok(documentation.includes(`/documents/${drawing.file}`)&&documentation.includes(`data-pdf-open="${drawing.id}"`),slug);
  for(const value of dimensions)assert.ok(placement.includes(`<dd>${value} <small>`),value);
  const {views}=linePlacement[slug];
  for(const view of views){
   const file='public/assets/'+view.file;
   assert.deepEqual(imageSize(file),{width:view.width,height:view.height},view.file);
   if(view.sha256){
    const bytes=await readFile(file);
    assert.equal(bytes.length,view.bytes,view.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),view.sha256,view.file);
   }
   assert.ok(placement.includes(`data-engineering-src="${basePath}/assets/${view.file}"`),view.file);
  }
  if(slug==='separatsiya-01'){
   assert.equal(drawing.kind,'raster-extract');
   assert.match(placement,/data-base-engineering-center/);
   assert.doesNotMatch(placement,/кВт|500–700|placement\.webp|dimensions-a0\.pdf/);
  }
  const card=catalogue.match(new RegExp(`<a class="line-card[^>]*data-line-id="${slug}"[\\s\\S]*?</a>`))[0];
  const {file,sha256}=catalogueCovers[slug];
  assert.ok(card.includes(`src="${basePath}/assets/${file}?v=${sha256.slice(0,12)}"`),slug);
  const hero=lineCoverFiles(lines.find(line=>line.slug===slug)).file;
  assert.ok(html.match(/<figure[^>]+data-line-catalog-cover[\s\S]*?<\/figure>/)[0].includes(`src="${basePath}/assets/${hero}"`),slug);
 }
 const separation=render('/catalog/lines/separatsiya-03');
 assert.match(section(separation,'specs'),/1 · Оператор[\s\S]*?2 · Водителя погрузчика/);
 assert.match(section(separation,'specs'),/5–13 человек/);
 assert.match(separation.match(/<section[^>]* class="[^"]*line-hero[^"]*"[\s\S]*?<\/section>/)[0],/data-pdf-open="separatsiya-03-technical"/);
});

test('Все четыре линии: единая утверждённая последовательность разделов и навигации',()=>{
 const expected=['purpose','raw-materials','composition','process','quality','kair','specs','placement','photos','documents','request','equipment'];
 const labels=['Назначение','Сырьё','Схема линии','Процесс','Продукт','КАИР','Характеристики','Габариты','Фото','Документы','Обратная связь','Состав узлов'];
 for(const slug of Object.keys({"separatsiya-01":1,"separatsiya-02":1,"separatsiya-03":1,"moyka-plenki":1})){
  const html=render('/catalog/lines/'+slug);
  const order=[...html.matchAll(/<section\b[^>]*\bid="([^"]+)"[^>]*>/g)].map(m=>m[1]).filter(id=>expected.includes(id));
  assert.deepEqual(order,expected,slug+' DOM order');
  const context=html.match(/<nav class="context-navigation" data-context-navigation[^>]*>(.*?)<\/nav>/s)[1];
  const nav=context.match(/<div class="line-section-nav" data-line-section-nav[^>]*>(.*?)<\/div>/s)[1];
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)">([^<]+)/g)].map(m=>m.slice(1)),expected.map((id,i)=>[id,labels[i]]),slug+' navigation order');
  assert.equal((html.match(/ data-line-section-nav /g)||[]).length,1,slug);
  assert.doesNotMatch(html,/class="anchor-nav line-anchor-nav"/);
  assert.equal((html.match(/<section class="section contact line-request" id="request">/g)||[]).length,1,slug);
 }
});
