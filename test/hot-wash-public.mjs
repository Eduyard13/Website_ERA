// Actual published hot-wash page, original media, PDF and native browser interactions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3161').replace(/\/$/,'');
const url=base+'/catalog/lines/moyka-plenki/';
const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200);
const html=await response.text();assert.ok(html.includes('data-hot-wash-line'));
const version=html.match(/hot-film-washing\.css\?v=([^"&]+)/)?.[1];assert.ok(version);
const document=JSON.parse(html.match(/<script type="application\/json" id="line-document-data">(.*?)<\/script>/s)[1])[0];
assert.equal(document.pages,22);assert.equal(document.bytes,4430978);assert.equal(document.sha256,'5648714c2f667ddb9d2168803aac50faf927fedbecb5147deebb57b0186a704a');
const pdf=await fetch(base+'/documents/'+document.file,{cache:'no-store'});assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');
const bytes=Buffer.from(await pdf.arrayBuffer());assert.equal(bytes.length,document.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),document.sha256);
const manifest=JSON.parse(await readFile(new URL('../docs/moyka-plenki-assets.json',import.meta.url),'utf8'));
for(const asset of manifest.assets)for(const [file,sha] of [[asset.file,asset.sha256],[asset.smallFile,asset.smallSha256]]){
 const r=await fetch(base+'/assets/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.equal(r.headers.get('content-type'),'image/webp');
 assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),sha,file);
}
for(const path of ['/catalog/lines/','/technology/','/documents/technical/','/media/','/catalog/lines/separatsiya-02/'])assert.equal((await fetch(base+path,{cache:'no-store'})).status,200,path);
for(const file of ['hot-film-washing.css','hot-film-washing.js']){const r=await fetch(base+'/'+file+'?v='+version,{cache:'no-store'});assert.equal(r.status,200,file);assert.ok(!r.headers.get('content-type').includes('text/html'));}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public hot-wash line');
const profile=await mkdtemp(join(tmpdir(),'era-hot-wash-browser-'));
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
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public hot-wash line condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 await command('Page.enable');await command('Runtime.enable');
 const load=async path=>{await command('Page.navigate',{url:base+path});await wait(`document.readyState==='complete'`);};
 const root=()=>evaluate(`(()=>{const r=document.querySelector('#hotwash-construction');return {ready:r.dataset.monitorReady,mode:r.dataset.diagramMode,pins:r.querySelectorAll('[data-callout]').length,options:r.querySelectorAll('[data-diagram-select] option').length,selected:r.querySelector('[data-detail-number]').textContent,overflow:document.documentElement.scrollWidth>innerWidth,fit:r.querySelector('[data-diagram-viewport]').scrollWidth<=r.querySelector('[data-diagram-viewport]').clientWidth+1,products:document.querySelectorAll('.hw-product-grid>article').length,spec:document.querySelectorAll('[data-hotwash-position]').length,broken:[...document.querySelectorAll('main img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}})()`);
 for(const width of [320,390,768,1024,1280,1440,1920]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await load('/catalog/lines/moyka-plenki/');await wait(`!!document.querySelector('#hotwash-construction[data-monitor-ready="true"]')`);
  await evaluate(`Promise.all([...document.querySelectorAll('main img')].map(i=>{i.loading='eager';return i.decode();}))`);
  let s=await root();assert.equal(s.mode,'fit');assert.equal(s.pins,44);assert.equal(s.options,36);assert.equal(s.products,3);assert.equal(s.spec,37);assert.ok(s.fit&&!s.overflow);assert.deepEqual(s.broken,[]);
  for(let number=1;number<=36;number++){
   await evaluate(`(()=>{const s=document.querySelector('[data-diagram-select]');s.value='${number}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   assert.equal((await root()).selected,String(number).padStart(2,'0'));
  }
  await click('[data-dimension-tab="top"]');assert.equal(await evaluate(`document.querySelector('#hot-dimension-view-top').hidden`),false);
 }
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await load('/catalog/lines/moyka-plenki/');await wait(`!!document.querySelector('[data-monitor-ready]')`);
 const callouts=await evaluate(`[...document.querySelectorAll('#hotwash-construction [data-callout]')].map(p=>({id:p.dataset.callout,number:p.dataset.part}))`);
 for(const c of callouts){
  await evaluate(`(()=>{const p=document.querySelector('[data-callout="${c.id}"]');p.focus();p.click();})()`);
  assert.equal((await root()).selected,c.number.padStart(2,'0'));
  assert.equal(await evaluate(`document.querySelector('#hotwash-construction').dataset.selectedCallout`),c.id);
 }
 // The specification uses the same selection owner, and position 37 is a real placement link.
 await evaluate(`document.querySelector('.hw-specification').closest('details').open=true`);
 await click('[data-hotwash-select="33"]');assert.equal((await root()).selected,'33');
 assert.ok(await evaluate(`document.querySelector('[data-hotwash-position="37"] a').getAttribute('href')==='#placement'`));
 await click('[data-dimension-tab="workshop"]');
 await click('[data-pdf-open="moyka-plenki-technical"]');
 await wait(`document.querySelector('[data-pdf-status]').textContent==='Страница 1 из 22'`);
 assert.ok(await evaluate(`document.querySelector('[data-pdf-canvas]').width>100`));
 await click('[data-pdf-next]');await wait(`document.querySelector('[data-pdf-status]').textContent==='Страница 2 из 22'`);
 await click('[data-pdf-close]');
 await load('/catalog/lines/?group=Мойка');await wait(`!!document.querySelector('[data-catalog-ready]')`);
 assert.equal(await evaluate(`document.querySelectorAll('[data-line]:not([hidden])').length`),1);
 assert.equal(await evaluate(`document.querySelector('[data-line]:not([hidden])').tagName`),'A');
 await click('[data-line-id="moyka-plenki"]');await wait(`!!document.querySelector('[data-context-ready]')`);
 await click('[data-context-back]');await wait(`!!document.querySelector('[data-catalog-ready]')`);
 assert.equal(await evaluate(`new URL(location.href).searchParams.get('group')`),'Мойка');
 await load('/technology/');await wait(`!!document.querySelector('[data-technology-line="moyka-plenki"]')`);
 assert.ok(await evaluate(`document.querySelector('[data-technology-line="moyka-plenki"]').href.endsWith('/catalog/lines/moyka-plenki')`));
 assert.deepEqual(errors,[],'Published hot-wash console errors');
 console.log(`::notice title=Published hot wash verified::Release ${version}, 37 source positions, 36 monitor selections and 44 printed badges, 7 widths, 44 original WebP SHA-256 checks, original 22-page PDF (4430978 bytes and SHA-256), live PDF viewer, specification, dimensions, technology link and wash-filter Back passed. ${url}`);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
