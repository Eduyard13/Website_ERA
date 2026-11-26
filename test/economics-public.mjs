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
assert.match(html,/data-econ-value="monthNet">10,05 млн ₽/);
assert.match(html,/data-econ-value="yearNet">116,02 млн ₽/);
assert.match(html,/data-econ-value="payback">Индивидуальная оценка/);
assert.match(html,/data-econ-price="base" data-price-rub="90000" aria-pressed="true"/);
assert.doesNotMatch(html,/<button[^>]*data-econ-mode|data-econ-range|data-econ-number|data-market-source="spimex"/);
for(const source of ['ppi','plasticker','myceppi'])assert.ok(html.includes('data-market-source="'+source+'"'),'Published source '+source);
for(const asset of ['economics-page-controller.js','economics-page-state.js','economics-model.js','economics-payback.js','economics-page.css','assets/project-home/hero/feedstock_hero-880.webp','assets/lines/moyka-plenki/product-granule.webp','assets/economics/hero.webp','assets/economics/factory.webp']){
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
 const snapshot=()=>evaluate("(()=>{const r=document.querySelector('[data-economics-page]');return {mode:r.dataset.econMode,scenario:r.dataset.econScenario,values:Object.fromEntries([...r.querySelectorAll('[data-econ-value]')].map(e=>[e.dataset.econValue,e.textContent])),overflow:document.documentElement.scrollWidth>innerWidth,sections:r.querySelectorAll(':scope>section').length,presets:[...r.querySelectorAll('[data-price-rub]')].map(e=>Number(e.dataset.priceRub)),setSizes:[...r.querySelectorAll('[data-econ-network]')].map(e=>Number(e.dataset.econNetwork)),hook:[...r.querySelectorAll('.ec-value-flow figcaption strong')].map(e=>e.textContent),chart:r.querySelectorAll('.ec-bar-column').length,parts:[...r.querySelectorAll('.ec-allocation-track span')].map(el=>parseFloat(el.style.flexBasis)),networkTopic:r.querySelector('[data-economics-request=network]').href}})()");
 const ready="document.readyState==='complete'&&document.querySelector('[data-economics-page][data-economics-ready=true]')";
 const setWidth=width=>command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
 await command('Page.enable');await command('Runtime.enable');
 await setWidth(1440);
 await command('Page.navigate',{url});
 await wait(ready);
 let s=await snapshot();
 assert.equal(s.mode,'full');assert.equal(s.scenario,'base');assert.equal(s.sections,11);
 assert.deepEqual(s.presets,[80000,90000,100000,110000]);assert.deepEqual(s.setSizes,[1,2,3,5]);
 assert.equal(s.values.balanceInput,'1\u00a0500 кг/ч');assert.equal(s.values.balanceOutput,'750 кг/ч');assert.equal(s.values.balanceOther,'750 кг/ч');
 const controls=[['conservative','6,62','75,63','33,10','378,16'],['base','10,05','116,02','50,25','580,11'],
  ['development','13,48','156,41','67,40','782,05'],['premium','16,91','196,80','84,55','984,00']];
 for(const [price,month,year,networkMonth,networkYear] of controls){
  await click('[data-econ-price="'+price+'"]');
  await click('[data-econ-network="1"]');
  s=await snapshot();
  assert.equal(s.scenario,price);assert.equal(s.values.monthNet,month+' млн ₽');assert.equal(s.values.yearNet,year+' млн ₽');
  assert.equal(s.values.payback,'Индивидуальная оценка');assert.equal(s.values.output,'558 т');assert.equal(s.values.yearOutput,'6\u00a0570 т');
  assert.deepEqual(s.hook,['6 ₽/кг','90 ₽/кг']);assert.equal(s.chart,4);assert.equal(s.parts.length,3);
  assert.ok(Math.abs(s.parts.reduce((a,b)=>a+b,0)-100)<.001);
  await click('[data-econ-network="5"]');
  s=await snapshot();
  assert.equal(s.values.monthNet,month+' млн ₽');assert.equal(s.values.yearNet,year+' млн ₽');
  assert.equal(s.values.networkMonth,networkMonth+' млн ₽');assert.equal(s.values.networkYear,networkYear+' млн ₽');
  assert.equal(s.values.networkOutput,'2\u00a0790 т');assert.equal(s.values.networkYearOutput,'32\u00a0850 т');
  assert.equal(s.values.networkMargin,s.values.margin);
 }
 await evaluate("(()=>{const e=document.querySelector('[data-econ-network-price]');e.value='base';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await wait("document.querySelector('[data-econ-price=base]').getAttribute('aria-pressed')==='true'");
 for(const [period,input,output] of [['month','1\u00a0116 т','558 т'],['year','13\u00a0140 т','6\u00a0570 т'],['hour','1\u00a0500 кг/ч','750 кг/ч']]){
  await click('[data-econ-period="'+period+'"]');s=await snapshot();
  assert.equal(s.values.balanceInput,input);assert.equal(s.values.balanceOutput,output);assert.equal(s.values.balanceOther,output);
 }
 const topic=new URL(s.networkTopic).searchParams.get('topic');
 assert.ok(topic.includes('Полный цикл · 5 комплексов · 90 ₽/кг с НДС · загрузка 100% · выход 50%'));
 assert.ok(topic.includes('580,11 млн ₽/год')&&topic.length<=200);
 await click('[data-economics-request=network]');
 await wait("document.querySelector('#project-request').open");
 assert.equal(await evaluate("document.querySelector('#project-request [data-request-topic]').value"),topic);
 await click('[data-request-close]');
 for(const width of [360,390,768,1280,1440,1920]){
  await setWidth(width);
  await command('Page.navigate',{url:url+'#production-constructor'});
  await wait(ready);
  s=await snapshot();assert.ok(!s.overflow,'Published responsive layout '+width);
  assert.equal(s.sections,11);
 }
 assert.deepEqual(errors,[],'Published browser exceptions');
 console.log('::notice title=Published economics verified::Live full-cycle SSR, all prices, scenario figures, five-complex network, three balance periods, proportional allocation, request context and six viewport widths passed in Chrome. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
