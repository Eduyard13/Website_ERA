import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3259/Website_ERA').replace(/\/$/,'');
const url=base+'/catalog/lines/separatsiya-02/?v='+(process.env.ERA_BUILD_COMMIT||'preview')+'#placement';
const assembly=JSON.parse(await readFile(new URL('../../content/lines/pro/pro-engineering-views.json',import.meta.url),'utf8'));
const projections=JSON.parse(await readFile(new URL('../../content/lines/pro/separatsiya-02-dimensions-assets.json',import.meta.url),'utf8'));
const page=await fetch(url,{cache:'no-store'});
assert.equal(page.status,200,url);
const html=await page.text();
assert.match(html,/data-pro-engineering-center data-engineering-group="overview" data-engineering-view="v01"/);
const placement=html.match(/<section[^>]* id="placement">([\s\S]*?)<\/section>/)[1];
assert.doesNotMatch(placement,/<a\b|\s(?:href|target|download|data-pdf-open)=|pec-document|PDF ·/i);
const hall={
 file:'assets/lines/separatsiya-02/engineering-center/industrial-hall.webp',bytes:172134,
 sha256:'ec6c3f15b61ac8306584421bad36de3db84b04f55a93dd939df0daf1f23de7c3'
};
const files=[
 ...assembly.views.flatMap(view=>['thumb','display','full'].map(kind=>({...view[kind],file:'assets/lines/separatsiya-02/engineering-center/'+view[kind].file}))),
 ...projections.views.map(view=>({...view,file:'assets/'+view.file}))
];
const A0=JSON.parse(html.match(/<script type="application\/json" id="line-document-data">(.*?)<\/script>/s)[1]).find(doc=>doc.id==='separatsiya-02-dimensions-a0');
assert.equal(A0.format,'A0');assert.equal(A0.pages,1);assert.equal(A0.bytes,2239107);
assert.equal(A0.sha256,'8557bce36e8963146ec9fd33d11295c4483e2e4d4106f19ae41e7c50c39f98d0');
async function verifyFile({file,bytes,sha256},mime){
 const response=await fetch(base+'/'+file,{cache:'no-store',signal:AbortSignal.timeout(25000)});
 assert.equal(response.status,200,file);
 assert.equal(response.headers.get('content-type')?.split(';')[0],mime,file);
 const buffer=Buffer.from(await response.arrayBuffer());
 assert.equal(buffer.length,bytes,file);
 assert.equal(createHash('sha256').update(buffer).digest('hex'),sha256,file);
}
for(let start=0;start<files.length;start+=6)await Promise.all(files.slice(start,start+6).map(v=>verifyFile(v,'image/webp')));
await verifyFile(hall,'image/webp');
await verifyFile({...A0,file:'documents/'+A0.file},'application/pdf');
const documentation=html.match(/<section[^>]* id="documents">([\s\S]*?)<\/section>/)[1];
const library=await fetch(base+'/documents/drawings/?objectType=line&product=separatsiya-02',{cache:'no-store'});
assert.equal(library.status,200);
for(const markup of [documentation,await library.text()]){
 assert.ok(markup.includes('data-pdf-open="'+A0.id+'"'));
 assert.ok(markup.includes(A0.file+'" download="'));
}

const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
assert.ok(binary,'Chrome executable');
const profile=await mkdtemp(join(tmpdir(),'era-pro-center-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 let port;
 for(let i=0;i<150;i++){
  try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}
  catch{await delay(100);}
 }
 assert.ok(port,'Chrome debugging endpoint');
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 const requests=new Map(),errors=[],imageRequests=new Map();
 let id=0;
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  if(message.method==='Network.requestWillBeSent'){
   const {request,loaderId}=message.params;
   if(request.url.includes('/engineering-center/views/')){
    if(!imageRequests.has(loaderId))imageRequests.set(loaderId,new Set());
    imageRequests.get(loaderId).add(new URL(request.url).pathname.split('/').at(-1));
   }
  }
  const pending=requests.get(message.id);
  if(!pending)return;
  requests.delete(message.id);clearTimeout(pending.timer);
  if(message.error)pending.reject(new Error(message.error.message));else pending.resolve(message.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id,timer=setTimeout(()=>{requests.delete(key);reject(new Error('CDP timeout: '+method));},15000);
  requests.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 async function evaluate(expression){
  const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
 }
 const find=selector=>`document.querySelector(${JSON.stringify('#placement '+selector)})`;
 const click=selector=>evaluate(find(selector)+'.click()');
 const wait=async condition=>{
  for(let i=0;i<230;i++){if(await evaluate(condition))return;await delay(100);}
  throw new Error('Engineering center condition failed: '+condition);
 };
 const decoded=async id=>wait(`(()=>{const i=${find('[data-engineering-image]')};return i.dataset.engineeringLoadedView===${JSON.stringify(id)}&&i.complete&&i.naturalWidth>0&&${find('[data-engineering-viewport]')}.getAttribute('aria-busy')!=='true'})()`);
 const key=async (key,code=key)=>{
  for(const type of ['keyDown','keyUp'])await command('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:{Escape:27,ArrowRight:39,Home:36}[key]});
 };
 await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
 await command('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('era-map-consent-v1','deny')"});
 await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const measure=()=>evaluate(`(()=>{const r=${find('#pro-engineering-stage')}.getBoundingClientRect();return [r.top+scrollY,r.height]})()`);
 const getStyles=()=>evaluate(`(()=>{
  const r=${find('[data-pro-engineering-center]')}, backdrop=getComputedStyle(r,'::before'),panel=getComputedStyle(r.querySelector('.pec-panel'));
  const stage=getComputedStyle(r.querySelector('.pec-stage')),image=getComputedStyle(r.querySelector('.pec-image'));
  return {backdrop:backdrop.backgroundImage,mask:backdrop.maskImage,panel:panel.backgroundColor,blur:panel.backdropFilter,
   field:stage.backgroundImage,fieldColor:stage.backgroundColor,isolation:stage.isolation,blend:image.mixBlendMode};
 })()`);
 const noDocuments=()=>evaluate(`!${find('[data-pro-engineering-center]')}.querySelector('a,[href],[download],[target],[data-pdf-open],.pec-documents,.pec-document-actions')`);
 async function screenshot(width,kind){
  const out=process.env.ERA_PRO_ENGINEERING_SCREENSHOTS;
  if(!out||width===768)return;
  const clip=await evaluate(`(()=>{
   const root=${find('[data-pro-engineering-center]')};
   if(!document.querySelector('#pro-qa-hide-fixed')){
    const css=document.createElement('style');css.id='pro-qa-hide-fixed';
    css.textContent='.site-header,[data-context-navigation],.quick-contact,.page-progress-rail{visibility:hidden!important}';
    document.head.append(css);
   }
   const r=root.getBoundingClientRect();
   return {x:r.left,y:r.top+scrollY,width:r.width,height:r.height,scale:1};
  })()`);
  const capture=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
  await mkdir(out,{recursive:true});
  await writeFile(join(out,`pro-engineering-${kind}-${width}.png`),Buffer.from(capture.data,'base64'));
 }
 const sets={
  overview:assembly.views.filter(view=>view.group==='overview').map(view=>view.id),
  detail:assembly.views.filter(view=>view.group==='detail').map(view=>view.id),
  drawings:projections.views.map(view=>view.id)
 };
 const initialFiles=new Set(['v01-display.webp',...sets.overview.map(id=>id+'-thumb.webp')]);
 for(const width of [1440,768,390]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width===390});
  const navigation=await command('Page.navigate',{url:url.replace('#placement','&width='+width+'#placement')});
  assert.ok(navigation.loaderId&&!navigation.errorText,JSON.stringify(navigation));
  await wait(`!!${find('[data-engineering-ready="true"]')}`);
  await evaluate(find('.pec-stage')+".scrollIntoView({block:'center',behavior:'instant'})");
  await decoded('v01');
  assert.equal(await noDocuments(),true);
  const visual=await getStyles();
  assert.ok(visual.backdrop.includes(base+'/'+hall.file),visual.backdrop);
  assert.doesNotMatch(visual.backdrop,/industrial-light\.svg/);
  const hallSize=await evaluate(`(async()=>{
   const background=new Image();background.src=${JSON.stringify(base+'/'+hall.file)};
   await background.decode();return [background.naturalWidth,background.naturalHeight];
  })()`);
  assert.deepEqual(hallSize,[1672,941]);
  assert.equal(visual.mask,'none');
  assert.match(visual.panel,/rgba\(250, 248, 244, 0\.89\)/);
  assert.equal(visual.blur,'blur(5px)');
  assert.equal(visual.isolation,'isolate');
  assert.match(visual.field,/radial-gradient/);
  assert.equal(visual.blend,'multiply');
  const early=[...(imageRequests.get(navigation.loaderId)||[])];
  assert.ok(early.includes('v01-display.webp'),`Initial engineering view was requested at ${width} px`);
  assert.deepEqual(early.filter(name=>!initialFiles.has(name)),[],`Lazy initial engineering assets at ${width} px`);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  const stage=await measure();
  for(const [group,ids] of Object.entries(sets)){
   await click(`[data-engineering-tab="${group}"]`);
   assert.equal(await noDocuments(),true,group);
   for(const [i,id] of ids.entries()){
    await click(`[data-engineering-frame="${id}"]`);await decoded(id);
    assert.equal(await evaluate(find('[data-engineering-count]')+'.textContent'),String(i+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0'));
    assert.equal(await evaluate(find('[data-engineering-step="-1"]')+'.disabled'),i===0);
    assert.equal(await evaluate(find('[data-engineering-step="1"]')+'.disabled'),i===ids.length-1);
    assert.equal(await evaluate(`getComputedStyle(${find('[data-engineering-image]')}).objectFit`),'contain');
    assert.deepEqual(await measure(),stage);
   }
  }
  const drawings=await getStyles();
  assert.match(drawings.field,/radial-gradient/);
  assert.notEqual(drawings.field,visual.field);
  assert.equal(drawings.blend,'multiply');
  await screenshot(width,'drawings');
  // The sheet itself opens in the same image viewer. The PDF opens from #documents.
  await click('.pec-image-open');
  await wait(`${find('[data-engineering-dialog]')}.open`);
  assert.equal(await evaluate("document.querySelector('#pdf-viewer').open"),false);
  assert.match(await evaluate(find('[data-engineering-image]')+'.getAttribute("src")'),/\/dimensions\/sheet\.webp$/);
  assert.equal((await getStyles()).blend,'normal');
  assert.equal(await noDocuments(),true);
  await key('Escape');await wait(`!${find('[data-engineering-dialog]')}.open&&document.activeElement===${find('.pec-image-open')}`);
  const drawingOpener='document.querySelector(\'#documents [data-pdf-open="separatsiya-02-dimensions-a0"]\')';
  await evaluate(drawingOpener+'.click()');
  await wait(`document.querySelector('#pdf-viewer')?.open&&document.querySelector('[data-pdf-status]').textContent==='Страница 1 из 1'`);
  assert.ok(await evaluate("document.querySelector('[data-pdf-canvas]').width>200"));
  await key('Escape');await wait("!document.querySelector('#pdf-viewer').open");
  await click('[data-engineering-tab="overview"]');await decoded('v09');
  await evaluate(find('[data-engineering-frame="v09"]')+'.focus()');
  await key('Home');await decoded('v01');
  await click('.pec-expand');
  await wait(`${find('[data-engineering-dialog]')}.open&&${find('[data-engineering-image]')}.src.endsWith('/v01-full.webp')`);
  assert.equal(await noDocuments(),true);
  const fullscreen=await getStyles();
  assert.equal(fullscreen.field,'none');
  assert.equal(fullscreen.fieldColor,'rgb(253, 253, 252)');
  assert.equal(fullscreen.blend,'normal');
  await click('[data-engineering-scale-by=".5"]');
  assert.equal(await evaluate(find('[data-engineering-scale]')+'.textContent'),'150%');
  await click('[data-engineering-reset]');
  assert.equal(await evaluate(find('[data-engineering-scale]')+'.textContent'),'100%');
  await evaluate(find('[data-engineering-viewport]')+'.focus()');
  await key('ArrowRight');await decoded('v02');
  await key('Escape');await wait(`!${find('[data-engineering-dialog]')}.open&&document.activeElement===${find('.pec-expand')}`);
  await click('[data-engineering-frame="v01"]');await decoded('v01');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await screenshot(width,'overview');
 }
 assert.deepEqual(errors,[],'Public PRO engineering center runtime errors');
 console.log('::notice title=Published PRO engineering center verified::20 views on desktop, tablet and mobile, 53 WebP SHA-256 checks, hall, glass and isolated engineering fields, no document controls in viewer, original A0 from documentation, navigation, fullscreen, zoom and Chrome console passed. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
