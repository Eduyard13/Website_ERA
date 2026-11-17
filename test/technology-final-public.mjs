// Smoke-check the actual published technology in Chrome, without extra packages or screenshots.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3081').replace(/\/$/,'');
const url=base+'/technology/';
const response=await fetch(url,{cache:'no-store'});
assert.equal(response.status,200,'Published technology HTTP status');
const html=await response.text();
assert.ok(html.includes('data-technology-final'),'The new technology page is published');
assert.ok(html.includes('Технология переработки плёнки — от загрязнённого сырья до готовой продукции.'));
assert.equal((html.match(/data-feedstock-type/g)||[]).length,9);
assert.equal((html.match(/data-contaminant-row=/g)||[]).length,9);
assert.equal((html.match(/data-technology-application=/g)||[]).length,5);
for(const file of ['technology-final.css','technology-final.js','presentation-web.js','material-balance-model.js']){
 const r=await fetch(base+'/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.ok(!r.headers.get('content-type')?.includes('text/html'),file+' MIME');
}
const images=[{"file":"technology/applications/film.webp","sha256":"4b504ccd3188e58ab77521a632a02a0d1bc9c4484c02b799957a340a63712c32"},{"file":"technology/applications/film-600.webp","sha256":"8fc5e1d45d7533bd5689e694d6f96fdd20a4407b428aa33156d75fb51d24cdee"},{"file":"technology/applications/pipes.webp","sha256":"83438f5baf4826151152c1ea0fc43461e8755405a52ecf1d5a29290605a4e538"},{"file":"technology/applications/pipes-600.webp","sha256":"8c50b55b96a3c3a10b19b660e0915709102f46bb3a33d34e3f91ff1bdced31d5"},{"file":"technology/applications/containers.webp","sha256":"551e1a6bbfb08312524870f817ad9ebcead9be4c92e2f49d437066380473778b"},{"file":"technology/applications/containers-600.webp","sha256":"18cee34f8d927f83d9bb1e8ef99641b9dbd7c736eeb306e3c1c0fce59cb1c9e8"},{"file":"technology/applications/pyrolysis.webp","sha256":"5b20a154e34b675646d5bb9d05dad2deea5c18c82d50ca3888836850f7ea8326"},{"file":"technology/applications/pyrolysis-600.webp","sha256":"1f3d17853387481eeb72111ce310ed094797f6181f2f7a84583aafc73237cb8d"},{"file":"technology/applications/energy.webp","sha256":"c837e6fef53a3a4f4cbdc4943695fd7923b448259399512eee2d42f494c535d2"},{"file":"technology/applications/energy-600.webp","sha256":"72d086fbdc10b26a63fede3ebb5047ae01253070093db591afaeaef6a83dfa3d"}];
for(const image of images){
 const r=await fetch(base+'/assets/'+image.file,{cache:'no-store'});assert.equal(r.status,200,image.file);assert.equal(r.headers.get('content-type'),'image/webp');
 const bytes=Buffer.from(await r.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256,image.file+' SHA-256');
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public technology');
const profile=await mkdtemp(join(tmpdir(),'era-technology-browser-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 let port;
 for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
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
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method));},30000);
  pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public technology condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const snapshot=()=>evaluate(`(()=>{const r=document.querySelector('[data-technology-final]');return {sections:[...r.children].filter(e=>e.tagName==='SECTION').map(e=>e.id),h1:r.querySelectorAll('h1').length,rail:document.querySelectorAll('.page-progress-rail a').length,feedstock:r.querySelectorAll('[data-feedstock-type]').length,rows:r.querySelectorAll('[data-contaminant-row]').length,visibleRows:[...r.querySelectorAll('[data-contaminant-row]')].filter(e=>e.getClientRects().length).length,outputs:r.querySelectorAll('[data-technology-output]').length,applications:r.querySelectorAll('[data-technology-application]').length,line:r.querySelectorAll('[data-technology-line]').length,washing:r.querySelectorAll('[data-washing-configuration]').length,granulationLinks:r.querySelectorAll('#granulation a').length,overflow:document.documentElement.scrollWidth>innerWidth,broken:[...r.querySelectorAll('img[src]')].filter(i=>!i.complete||!i.naturalWidth||!i.alt).map(i=>i.src),quality:r.querySelector('#granule-quality').textContent}})()`);
 const load=async fragment=>{
  await command('Page.navigate',{url:url+(fragment||'')});
  await wait(`document.readyState==='complete'&&document.querySelector('[data-balance-range]:not([disabled])')&&document.querySelector('.page-progress-rail a')`);
 };
 const balance=()=>evaluate(`(()=>{const r=document.querySelector('[data-material-balance]');return {polymer:r.querySelector('[data-balance-polymer]').textContent,inclusions:r.querySelector('[data-balance-inclusions]').textContent,value:r.querySelector('[data-balance-range]').value,min:r.querySelector('[data-balance-range]').min,max:r.querySelector('[data-balance-range]').max,step:r.querySelector('[data-balance-range]').step,overflow:r.scrollWidth>r.clientWidth+2}})()`);
 const amount=text=>Number(text.replace(/\s/g,''));
 const expected=['technology-intro','raw-material','solution','dry-separation','hot-washing','granulation','products','applications','standalone-equipment','technology-next'];
 await command('Page.enable');await command('Runtime.enable');
 for(const width of [320,360,390,768,1024,1440]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await load();
  await evaluate(`Promise.all([...document.querySelectorAll('[data-technology-final] img[src]')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))`);
  const s=await snapshot();assert.deepEqual(s.sections,expected);assert.equal(s.h1,1);assert.equal(s.rail,10);assert.equal(s.feedstock,9);assert.equal(s.rows,9);assert.equal(s.visibleRows,9);assert.equal(s.outputs,3);assert.equal(s.applications,5);assert.equal(s.line,1);assert.equal(s.washing,2);assert.equal(s.granulationLinks,0);assert.ok(!s.overflow,'Layout '+width);assert.deepEqual(s.broken,[]);
  for(const value of ['0,8–1,2','190 °C / 2,16 кг','30–70','ppm','30–70 г/т','0,003–0,007%'])assert.ok(s.quality.includes(value),value);
  await load('#material-balance');
  await wait(`document.querySelector('#material-balance').getClientRects().length>0`);
  for(const [value,polymer,inclusions] of [[0,1500,0],[20,1200,300],[50,750,750]]){
   await evaluate(`(()=>{const e=document.querySelector('[data-balance-range]');e.value=${value};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
   const b=await balance();assert.equal(amount(b.polymer),polymer);assert.equal(amount(b.inclusions),inclusions);assert.equal(b.min,'0');assert.equal(b.max,'50');assert.equal(b.step,'5');assert.ok(!b.overflow);
  }
 }
 await evaluate(`document.querySelector('[data-balance-range]').focus()`);
 await command('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
 await command('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37});
 const keyboard=await balance();assert.equal(keyboard.value,'45');assert.equal(amount(keyboard.polymer),825);
 for(const fragment of ['#control-title','#about-era','#granule-quality']){
  await load(fragment);await wait(`(()=>{const e=document.querySelector(${JSON.stringify(fragment)});const r=e.getBoundingClientRect();return e.getClientRects().length>0&&r.top>=0&&r.top<innerHeight;})()`);
 }
 assert.equal(await evaluate(`document.querySelector('[data-kair]').dataset.autoplay`),'false');
 await click('#discuss [data-project-request]');await wait(`document.querySelector('#project-request').open`);
 await evaluate(`document.querySelector('#project-request').close()`);
 assert.deepEqual(errors,[],'Technology console errors');
 console.log('::notice title=Published technology verified::Actual public HTML, 10 sections, 9 feedstock types and visible cleaning rows, 3 stages and products, target quality, 5 application illustrations and 10 WebP SHA-256 checks, 6 viewport widths, material balance at 0/20/50%, keyboard, deep links and project request passed in Chrome. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
