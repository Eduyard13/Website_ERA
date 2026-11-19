// Check the published technology and homepage in Chrome without extra packages.
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
assert.match(html,/<h1>Из плёнки<br>\s*в плёнку<span>\.<\/span><\/h1>/);
assert.equal((html.match(/data-feedstock-type=/g)||[]).length,5);
assert.equal((html.match(/data-contaminant-row=/g)||[]).length,9);
assert.equal((html.match(/data-technology-application=/g)||[]).length,5);
for(const file of ['technology-final.css','technology-final.js','presentation-web.js','material-balance-model.js']){
 const r=await fetch(base+'/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.ok(!r.headers.get('content-type')?.includes('text/html'),file+' MIME');
}
for(const path of ['catalog/lines/separatsiya-01/','catalog/lines/separatsiya-02/','catalog/lines/separatsiya-03/','catalog/lines/moyka-plenki/','catalog/equipment/rotornyy-raspushitel/','catalog/equipment/plenochnyy-flotator/','documents/brochures/era-separatsiya-02-overview.pdf']){
 assert.equal((await fetch(base+'/'+path,{method:'HEAD',cache:'no-store'})).status,200,path);
}
const images=[{"file":"technology/applications/film.webp","sha256":"4b504ccd3188e58ab77521a632a02a0d1bc9c4484c02b799957a340a63712c32"},{"file":"technology/applications/film-600.webp","sha256":"8fc5e1d45d7533bd5689e694d6f96fdd20a4407b428aa33156d75fb51d24cdee"},{"file":"technology/applications/pipes.webp","sha256":"83438f5baf4826151152c1ea0fc43461e8755405a52ecf1d5a29290605a4e538"},{"file":"technology/applications/pipes-600.webp","sha256":"8c50b55b96a3c3a10b19b660e0915709102f46bb3a33d34e3f91ff1bdced31d5"},{"file":"technology/applications/containers.webp","sha256":"551e1a6bbfb08312524870f817ad9ebcead9be4c92e2f49d437066380473778b"},{"file":"technology/applications/containers-600.webp","sha256":"18cee34f8d927f83d9bb1e8ef99641b9dbd7c736eeb306e3c1c0fce59cb1c9e8"},{"file":"technology/applications/pyrolysis.webp","sha256":"5b20a154e34b675646d5bb9d05dad2deea5c18c82d50ca3888836850f7ea8326"},{"file":"technology/applications/pyrolysis-600.webp","sha256":"1f3d17853387481eeb72111ce310ed094797f6181f2f7a84583aafc73237cb8d"},{"file":"technology/applications/energy.webp","sha256":"c837e6fef53a3a4f4cbdc4943695fd7923b448259399512eee2d42f494c535d2"},{"file":"technology/applications/energy-600.webp","sha256":"72d086fbdc10b26a63fede3ebb5047ae01253070093db591afaeaef6a83dfa3d"}];
images.push(
 {file:'lines/separatsiya-01/catalog-cover.webp',sha256:'6c287c05cb55dcf7f05153e94ad18ff02c791d19c9e48de5a878d00bc3ae427b'},
 {file:'lines/moyka-plenki/catalog-cover-detailed.webp',sha256:'93ee722f324e163ab3cb5eac4df3546083393e0a9e7a080a3e7ff462769a6a80'},
);
for(const image of images){
 const r=await fetch(base+'/assets/'+image.file,{cache:'no-store'});assert.equal(r.status,200,image.file);assert.equal(r.headers.get('content-type'),'image/webp');
 const bytes=Buffer.from(await r.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256,image.file+' SHA-256');
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public technology');
const profile=await mkdtemp(join(tmpdir(),'era-technology-browser-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const chromeClosed=new Promise(resolve=>chrome.once('close',resolve));
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
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public Chrome condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const snapshot=()=>evaluate(`(()=>{
  const root=document.querySelector('[data-technology-final]');
  const elements=selector=>[...root.querySelectorAll(selector)];
  const visible=selector=>elements(selector).filter(e=>!e.closest('details:not([open])')&&e.checkVisibility());
  return {
   sections:elements(':scope>section').map(e=>e.id),
   h1:elements('h1').length,rail:document.querySelectorAll('.page-progress-rail a').length,
   feedstock:elements('[data-feedstock-type]').length,visibleRows:visible('[data-contaminant-row]').length,
   outputs:elements('[data-technology-output]').length,applications:visible('[data-technology-application]').length,
   lines:elements('[data-technology-line]').map(e=>e.dataset.technologyLine),
   renders:elements('.tf-line-render img').map(e=>e.getAttribute('src').split('/assets/')[1]),
   kair:elements('[data-kair-slide]').length,washing:elements('[data-washing-configuration]').length,
   overflow:document.documentElement.scrollWidth>innerWidth,
   broken:elements('img[src]').filter(i=>!i.complete||!i.naturalWidth||!i.alt).map(i=>i.src),
   quality:root.querySelector('#granule-quality').textContent,
  };
 })()`);
 const load=async fragment=>{
  await command('Page.navigate',{url:url+(fragment||'')});
  await wait(`document.readyState==='complete'&&document.querySelector('[data-balance-range]:not([disabled])')&&document.querySelector('.page-progress-rail a')`);
 };
 const balance=()=>evaluate(`(()=>{const r=document.querySelector('[data-material-balance]');return {polymer:r.querySelector('[data-balance-polymer]').textContent,inclusions:r.querySelector('[data-balance-inclusions]').textContent,value:r.querySelector('[data-balance-range]').value,min:r.querySelector('[data-balance-range]').min,max:r.querySelector('[data-balance-range]').max,step:r.querySelector('[data-balance-range]').step,overflow:r.scrollWidth>r.clientWidth+2}})()`);
 const amount=text=>Number(text.replace(/\s/g,''));
 const expected=['technology-intro','raw-material','contaminants','solution','dry-separation','hot-washing','granulation','products','granule-quality','applications','control-story','technology-next'];
 await command('Page.enable');await command('Runtime.enable');
 await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const widths=[320,360,390,768,1024,1280,1440];
 for(const width of widths){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await load();
  await evaluate(`Promise.all([...document.querySelectorAll('[data-technology-final] img[src]')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))`);
  const s=await snapshot();
  assert.deepEqual(s.sections,expected);
  assert.equal(s.h1,1);assert.equal(s.rail,expected.length);assert.equal(s.feedstock,5);assert.equal(s.visibleRows,9);
  assert.equal(s.outputs,3);assert.equal(s.applications,3);assert.equal(s.washing,2);assert.equal(s.kair,23);
  assert.deepEqual(s.lines,['separatsiya-01','separatsiya-02','separatsiya-03','moyka-plenki']);
  assert.deepEqual(s.renders,['lines/separatsiya-01/catalog-cover.webp','lines/moyka-plenki/catalog-cover-detailed.webp']);
  assert.ok(!s.overflow,'Layout '+width);assert.deepEqual(s.broken,[]);
  for(const value of ['0,8–1,2','190 °C / 2,16 кг','30–70','ppm','30–70 г/т','0,003–0,007%','1–2%'])assert.ok(s.quality.includes(value),value);
  await click('.tf-outline a[href="#products"]');
  await wait(`document.querySelector('.tf-outline a[aria-current="location"]')?.hash==='#products'`);
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
 console.log(`::notice title=Published technology verified::12 sections, 9 contamination cards, 4 catalogue links, 3 products, 23 KAIR photos, 12 approved WebP SHA-256 checks, ${widths.length} widths, sticky navigation, balance, anchors and the request passed. ${url}`);

 const homeSections=['hero','problem','feedstocks','process','strengths','products','market','business','integration','equipment','kair','contact'];
 const mapSelection=()=>evaluate(`(()=>{
  const record=document.querySelector('[data-market-record]:not([hidden])');
  return {
   name:record.querySelector('[data-market-name]').textContent,
   volume:record.querySelector('[data-market-volume]').textContent.replace(/\\s+/g,' '),
   active:document.querySelector('[data-market-feature][aria-pressed="true"]').dataset.marketFeature,
  };
 })()`);
 for(const width of [390,1440]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:940,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url:base+'/#russia-market'});
  await wait(`document.readyState==='complete' && document.querySelector('[data-market-map][data-market-ready="true"]') && document.querySelector('.page-progress-rail a')`);
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[data-home-block]'),e=>e.dataset.homeBlock)`),homeSections);
  assert.equal(await evaluate(`document.querySelectorAll('.page-progress-rail a').length`),homeSections.length);
  assert.deepEqual(await evaluate(`[document.querySelectorAll('[data-market-districts] path.market-district-area').length,document.querySelectorAll('[data-market-regions] .market-pin').length]`),[8,10]);
  assert.deepEqual(await mapSelection(),{name:'Центральный ФО',volume:'1 350 720 т/год',active:'central'});
  const brokenImages=await evaluate(`Promise.all([...document.querySelectorAll('[data-resource-home] img[src]')].map(async i=>{
   i.loading='eager';try{await i.decode();}catch{return i.src;}return i.alt&&i.naturalWidth?null:i.src;
  })).then(results=>results.filter(Boolean))`);
  assert.deepEqual(brokenImages,[]);
  await evaluate('document.fonts.ready.then(()=>true)');
  const hero=await evaluate(`(()=>{
   const root=document.querySelector('#resource');
   const box=root.getBoundingClientRect();
   const copy=root.querySelector('.resource-hero-copy').getBoundingClientRect();
   const image=root.querySelector('.resource-hero-grid > img[data-media-slot="heroHook"]');
   const quote=root.querySelector('.resource-hero-subtitle');
   const art=image.getBoundingClientRect();
   const range=document.createRange();
   range.selectNodeContents(quote);
   return {
    title:root.querySelector('h1').innerText.replace(/\\s+/g,' '),
    subtitle:quote.textContent,
    italicLine:getComputedStyle(quote).fontStyle==='italic'&&range.getClientRects().length===1,
    faces:[...document.fonts].filter(font=>font.family==='IBM Plex Sans'&&font.status==='loaded').length,
    artwork:image.src.endsWith('/polymers-cycle.webp')&&image.naturalWidth>0,
    mask:getComputedStyle(image).maskImage!=='none',
    below:art.top>=copy.bottom,
    fullHeight:Math.abs(art.top-box.top)<1&&Math.abs(art.height-box.height)<1&&art.left+art.width/2>box.left+box.width/2,
   };
  })()`);
  assert.equal(hero.title,'От нефти к полимерам. От полимеров — снова к нефти.');
  assert.equal(hero.subtitle,'Отходы одного цикла — сырьё для следующего.');
  assert.equal(hero.faces,2);
  assert.ok(hero.italicLine&&hero.artwork&&hero.mask&&(width<1024?hero.below:hero.fullHeight),'Homepage hero at '+width);
  await click('[data-market-mode="regions"]');
  await evaluate(`(()=>{const select=document.querySelector('[data-market-select="regions"]');select.value='moscow';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  assert.deepEqual(await mapSelection(),{name:'Москва',volume:'441 833 т/год',active:'moscow'});
  await evaluate(`document.querySelector('[data-market-feature="moscow-oblast"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
  assert.deepEqual(await mapSelection(),{name:'Московская область',volume:'302 796 т/год',active:'moscow-oblast'});
  await click('[data-market-mode="districts"]');
  assert.deepEqual(await mapSelection(),{name:'Центральный ФО',volume:'1 350 720 т/год',active:'central'});
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'Homepage overflow at '+width);
 }
 assert.deepEqual(errors,[],'Homepage console errors');
 console.log(`::notice title=Published homepage verified::New two-part heading and artwork, 12 sections and live map at 390 and 1440 px. ${base}/`);
}finally{
 socket?.close();
 chrome.kill('SIGTERM');
 await chromeClosed;
 await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
