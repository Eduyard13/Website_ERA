// Smoke-check the actual published economics in Chrome, without extra packages or screenshots.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3000/Website_ERA').replace(/\/$/,'');
const url=base+'/economics/';
const response=await fetch(url,{cache:'no-store'});
assert.equal(response.status,200,'Published economics HTTP status');
const html=await response.text();
assert.ok(html.includes('Экономика вашего производства.'),'Published economics heading');
assert.match(html,/data-econ-mode="full" data-econ-locked-mode="full"/);
assert.match(html,/data-value="profitMillions">10,70</);
assert.match(html,/data-value="yearNetMillions">123,73</);
assert.match(html,/data-value="paybackFigure">6,5–8,2</);
assert.match(html,/aria-valuenow="90" value="90" data-econ-price/);
assert.doesNotMatch(html,/<button[^>]*data-econ-mode|45 ₽\/кг для плёнки|data-market-source="spimex"/);
for(const source of ['ppi','plasticker','myceppi'])assert.ok(html.includes('data-market-source="'+source+'"'),'Published source '+source);
for(const asset of ['economics-page-controller.js','economics-page-state.js','economics-model.js','economics-payback.js','economics-page.css','assets/project-home/hero/feedstock_hero-880.webp','assets/presentation/granules.webp']){
 const resource=await fetch(base+'/'+asset,{cache:'no-store'});
 assert.equal(resource.status,200,'Published resource '+asset);
 assert.ok(!resource.headers.get('content-type')?.includes('text/html'),'Asset MIME '+asset);
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public economics');
const profile=await mkdtemp(join(tmpdir(),'era-economics-browser-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 let port;
 for(let i=0;i<150;i++){
  try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(port>0)break;}catch{}
  await delay(100);
 }
 assert.ok(port,'Chrome debugging endpoint');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  const request=pending.get(message.id);if(!request)return;pending.delete(message.id);clearTimeout(request.timer);
  if(message.error)request.reject(new Error(message.error.message));else request.resolve(message.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method));},15000);
  pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public economics condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const snapshot=()=>evaluate(`(()=>{const r=document.querySelector('[data-economics-page]');return {mode:r.dataset.econMode,lockedMode:r.dataset.econLockedMode,month:r.dataset.econState,year:r.dataset.econYearState,values:Object.fromEntries([...r.querySelectorAll('[data-value]')].map(e=>[e.dataset.value,e.textContent])),range:{min:Number(r.querySelector('[data-econ-range]').min),value:Number(r.querySelector('[data-econ-range]').value)},overflow:document.documentElement.scrollWidth>innerWidth,tableOverflow:r.querySelector('.ec-financial-table').scrollWidth>r.querySelector('.ec-financial-table').clientWidth+1,sections:r.querySelectorAll('.ec-section').length,modes:r.querySelectorAll('button[data-econ-mode]').length,presets:[...r.querySelectorAll('[data-econ-preset]')].map(e=>Number(e.dataset.econPreset)),hook:[...r.querySelectorAll('.ec-value-flow figcaption strong')].map(e=>e.textContent),basis:r.querySelector('[data-hero-basis]').textContent,request:r.querySelector('[data-economics-request]').href}})()`);
 const amount=text=>Number(text.replace(/\s/g,'').replace(',','.'));
 const verifyBoundary=async()=>{
  await evaluate(`(()=>{const e=document.querySelector('[data-econ-range]');e.value=e.min;e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await wait(`document.querySelector('[data-value="yearNetMillions"]').textContent==='0,00'`);
  const s=await snapshot();assert.equal(s.month,'profit');assert.equal(s.year,'profit');assert.ok(s.range.min>0);assert.ok(amount(s.values.profitMillions)>=0);assert.equal(s.values.yearNetMillions,'0,00');assert.ok(!s.overflow&&!s.tableOverflow);
 };
 await command('Page.enable');await command('Runtime.enable');
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await command('Page.navigate',{url});
 await wait(`document.readyState==='complete'&&document.querySelector('[data-economics-page][data-economics-ready="true"]')`);
 let s=await snapshot();
 assert.equal(s.mode,'full');assert.equal(s.lockedMode,'full');
 assert.equal(s.values.profitMillions,'10,70');assert.equal(s.values.yearNetMillions,'123,73');
 assert.equal(s.values.yearOutput,'6 570 т');assert.equal(s.values.output,'558 т');assert.equal(s.values.yield,'57,50%');
 assert.equal(s.sections,11);assert.equal(s.modes,0);assert.deepEqual(s.presets,[80000,90000,100000,110000]);
 assert.match(s.basis,/Базовый сценарий: 1 комплект · 100% загрузка .* 90 ₽\/кг с НДС\. Выпуск до 558 т\/мес\./);
 const controls=[[80000,'7,27','83,34','9,0–11,2 мес.'],[90000,'10,70','123,73','6,5–8,2 мес.'],[100000,'14,13','164,12','5,1–6,4 мес.'],[110000,'17,57','204,51','4,2–5,3 мес.']];
 for(const [price,month,year,payback] of controls){
  await click('[data-econ-preset="'+price+'"]');
  await evaluate(`(()=>{const e=document.querySelector('[data-econ-range]');e.value=100;e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await wait(`document.querySelector('[data-value="profitMillions"]').textContent===${JSON.stringify(month)}&&document.querySelector('[data-value="yearNetMillions"]').textContent===${JSON.stringify(year)}`);
  s=await snapshot();assert.equal(s.mode,'full');assert.equal(s.values.paybackLabel,payback);
  assert.deepEqual(s.hook,['6 ₽/кг','90 ₽/кг']);assert.ok(!s.overflow&&!s.tableOverflow);
  await verifyBoundary();
 }
 await click('[data-econ-reset]');await wait(`document.querySelector('[data-value="profitMillions"]').textContent==='10,70'`);
 s=await snapshot();assert.equal(s.mode,'full');assert.equal(s.values.grossPrice,'90 ₽/кг');assert.equal(s.range.value,100);
 await click('[data-econ-lines="3"]');await wait(`document.querySelector('[data-value="yearNetMillions"]').textContent==='371,20'`);
 await evaluate(`(()=>{const e=document.querySelector('[data-econ-price]');e.value='99,5';e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await wait(`document.querySelector('[data-value="grossPrice"]').textContent==='99,50 ₽/кг'`);
 s=await snapshot();assert.equal(s.values.paybackLabel,'Индивидуальная оценка');
 const topic=new URL(s.request).searchParams.get('topic');assert.ok(topic.includes('Полный цикл')&&topic.includes('/год')&&topic.includes('99,50')&&topic.includes('3 компл.'));assert.ok(topic.length<=200);
 await evaluate(`(()=>{const e=document.querySelector('[data-econ-number]');e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await wait(`document.querySelector('[data-value="yearNetMillions"]').textContent==='0,00'`);
 s=await snapshot();assert.equal(s.month,'profit');assert.equal(s.year,'profit');
 for(const width of [360,390,768,1280,1440,1920]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url:url+'#production-constructor'});
  await wait(`document.readyState==='complete'&&document.querySelector('[data-economics-page][data-economics-ready="true"]')`);
  await verifyBoundary();s=await snapshot();assert.ok(!s.overflow&&!s.tableOverflow,'Published responsive layout '+width);
 }
 assert.deepEqual(errors,[],'Published browser console errors');
 console.log('::notice title=Published economics verified::Actual public HTML and assets, Full-cycle SSR, 4 granule prices, monthly and annual profits, payback, static 6/90 hook, break-even floor, 3 sets, custom price, request context, reset and six responsive widths passed in Chrome. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
