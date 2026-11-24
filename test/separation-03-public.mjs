// Actual published separation-03 page, original media, PDF and native browser interactions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {auditNativeDiagram,captureNativeDiagram,verifyNativeAsset} from './native-diagram-audit.mjs';
const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3161').replace(/\/$/,'');
const compositionPath=`/catalog/lines/separatsiya-03/?v=${process.env.ERA_BUILD_COMMIT||'preview'}#composition`;
const url=base+compositionPath;
const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200);
const html=await response.text();assert.ok(html.includes('data-separation03-line'));
const version=html.match(/separation-drying\.css\?v=([^"&]+)/)?.[1];assert.ok(version);
await verifyNativeAsset(base,html,'separatsiya-03','49c2dc8809257195269265638cee51ca2b400b5dac00dbf0d313a98e5a20b325');
const document=JSON.parse(html.match(/<script type="application\/json" id="line-document-data">(.*?)<\/script>/s)[1]).find(entry=>entry.id==='separatsiya-03-technical');
assert.equal(document.pages,28);assert.equal(document.bytes,5397658);assert.equal(document.sha256,'2b399241ee41e5a792d87ab051f1d764f65faa1071b27bc1950a75024a5b52f6');
const pdf=await fetch(base+'/documents/'+document.file,{cache:'no-store'});assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');
const bytes=Buffer.from(await pdf.arrayBuffer());assert.equal(bytes.length,document.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),document.sha256);
const manifest=JSON.parse(await readFile(new URL('../docs/separation-03-assets.json',import.meta.url),'utf8'));
const images=new Map(manifest.assets.flatMap(a=>[[a.file,a.sha256],[a.smallFile,a.smallSha256]]));
for(const [file,sha] of images){
 const r=await fetch(base+'/assets/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.equal(r.headers.get('content-type'),'image/webp');
 assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),sha,file);
}
for(const path of ['/catalog/lines/','/technology/','/documents/technical/','/media/','/catalog/lines/separatsiya-02/'])assert.equal((await fetch(base+path,{cache:'no-store'})).status,200,path);
for(const file of ['separation-drying.css','separation-drying.js']){const r=await fetch(base+'/'+file+'?v='+version,{cache:'no-store'});assert.equal(r.status,200,file);assert.ok(!r.headers.get('content-type').includes('text/html'));}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public separation-03 line');
const profile=await mkdtemp(join(tmpdir(),'era-separation-03-browser-'));
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
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method));},15000);
  pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public separation-03 line condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 await command('Page.enable');await command('Runtime.enable');
 await command('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('era-map-consent-v1','deny')"});
 const load=async path=>{await command('Page.navigate',{url:base+path});await wait(`document.readyState==='complete'`);};
 const root=()=>evaluate(`(()=>{const r=document.querySelector('#line03-construction');return {canvasBackground:getComputedStyle(r.querySelector('.diagram-canvas')).backgroundImage,sourceBlend:getComputedStyle(r.querySelector('.diagram-projection > svg')).mixBlendMode,ready:r.dataset.monitorReady,mode:r.dataset.diagramMode,pins:r.querySelectorAll('[data-callout]').length,options:r.querySelectorAll('[data-diagram-select] option').length,selected:r.querySelector('[data-detail-number]').textContent,overflow:document.documentElement.scrollWidth>innerWidth,fit:r.querySelector('[data-diagram-viewport]').scrollWidth<=r.querySelector('[data-diagram-viewport]').clientWidth+1,qualityRows:document.querySelectorAll('.line-quality-table tbody tr').length,spec:document.querySelectorAll('[data-separation03-position]').length,broken:[...document.querySelectorAll('main img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}})()`);
 for(const width of [1440,320,390,768,1024,1280,1920]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await load(compositionPath);await wait(`!!document.querySelector('#line03-construction[data-monitor-ready="true"]')`);
  await evaluate(`Promise.all([...document.querySelectorAll('main img')].map(i=>{i.loading='eager';return i.decode();}))`);
  const badges=await evaluate(`[...document.querySelectorAll('#line03-construction button.diagram-pin')].map(pin=>{const text=pin.querySelector('span'),style=getComputedStyle(text),size=text.getBoundingClientRect();return {expected:pin.dataset.part.padStart(2,'0'),actual:text.textContent.trim(),display:style.display,visibility:style.visibility,opacity:style.opacity,color:style.color,background:style.backgroundColor,width:size.width,height:size.height};})`);
  assert.equal(badges.length,42,'All 42 numbered buttons must exist');
  for(const badge of badges){
   assert.equal(badge.actual,badge.expected,'Native button numerals must match PDF positions');
   assert.equal(badge.display,'grid');assert.equal(badge.visibility,'visible');assert.equal(badge.opacity,'1');
   assert.ok(badge.width>=11&&badge.height>=11,'Native button size must be visible');
   assert.ok(!badge.color.includes('0, 0, 0, 0')&&!badge.background.includes('0, 0, 0, 0'));
  }
  if(width===1440&&process.env.ERA_PREMIUM_SCREENSHOT){
   await captureNativeDiagram(evaluate,command,'line03-construction',process.env.ERA_PREMIUM_SCREENSHOT);
  }
  let s=await root();assert.equal(s.mode,'fit');assert.equal(s.pins,42);assert.equal(s.options,37);assert.equal(s.qualityRows,5);assert.equal(s.spec,0);assert.ok(s.fit&&!s.overflow);assert.deepEqual(s.broken,[]);assert.ok(s.canvasBackground.includes('engineering-grid-02.svg'),'PREMIUM background asset');assert.equal(s.sourceBlend,'normal','opaque white source must blend over Engineering Grid 02');
  if(width===390||width===1440)await auditNativeDiagram(evaluate,'line03-construction',{count:42,branches:42});
  for(let number=1;number<=37;number++){
   await evaluate(`(()=>{const s=document.querySelector('[data-diagram-select]');s.value='${number}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   assert.equal((await root()).selected,String(number).padStart(2,'0'));
  }
  await click('[data-dimension-tab="top"]');assert.equal(await evaluate(`document.querySelector('#sd-dimension-view-top').hidden`),false);
 }
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await load(compositionPath);await wait(`!!document.querySelector('[data-monitor-ready]')`);
 // The sole native diagram and its permanent navigator replace the removed supplementary panels.
 assert.equal(await evaluate(`document.querySelectorAll('#composition .line-more,#composition [data-line-layout-views],#composition [role="tab"]').length`),0);
 await click('#line03-construction [data-architecture-part="33"]');assert.equal((await root()).selected,'33');
 await click('#line03-construction [data-architecture-part="37"]');assert.equal((await root()).selected,'37');
 await click('[data-dimension-tab="side"]');
 await click('[data-pdf-open="separatsiya-03-technical"]');
 await wait(`document.querySelector('[data-pdf-status]').textContent==='Страница 1 из 28'`);
 assert.ok(await evaluate(`document.querySelector('[data-pdf-canvas]').width>100`));
 await click('[data-pdf-next]');await wait(`document.querySelector('[data-pdf-status]').textContent==='Страница 2 из 28'`);
 await click('[data-pdf-close]');
 await load('/catalog/lines/?group=Сепарация');await wait(`!!document.querySelector('[data-catalog-ready]')`);
 assert.equal(await evaluate(`document.querySelectorAll('[data-line]:not([hidden])').length`),3);
 assert.equal(await evaluate(`document.querySelector('[data-line-id=separatsiya-03]').tagName`),'A');
 await click('[data-line-id="separatsiya-03"]');await wait(`!!document.querySelector('[data-context-ready]')`);
 await click('[data-context-back]');await wait(`!!document.querySelector('[data-catalog-ready]')`);
 assert.equal(await evaluate(`new URL(location.href).searchParams.get('group')`),'Сепарация');
 await load('/documents/technical/');assert.ok(await evaluate(`!!document.querySelector('[data-library-document="separatsiya-03-technical"]')`));
 assert.deepEqual(errors,[],'Published separation-03 console errors');
 console.log(`::notice title=Published separation 03 verified::42/42 badges, leaders and equipment contours at 390 and 1440 px, 37 monitor selections, 7 widths, ${images.size+1} WebP SHA-256 checks, original 28-page PDF (5397658 bytes and SHA-256), live PDF viewer, single diagram and navigator, dimensions, catalogue filter and Back passed. ${url}`);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
