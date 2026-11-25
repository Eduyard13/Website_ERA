import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3269/Website_ERA').replace(/\/$/,'');
const url=base+'/catalog/lines/separatsiya-01/?v='+(process.env.ERA_BUILD_COMMIT||'preview')+'#placement';
const assembly=JSON.parse(await readFile(new URL('../content/base-engineering-views.json',import.meta.url),'utf8'));
const projections=JSON.parse(await readFile(new URL('../content/line-dimensions-assets.json',import.meta.url),'utf8'))['separatsiya-01'];
const page=await fetch(url,{cache:'no-store'});
assert.equal(page.status,200,url);
const html=await page.text();
assert.match(html,/data-base-engineering-center data-engineering-group="overview" data-engineering-view="overall"/);
assert.match(html,/<span data-engineering-count>01 \/ 04<\/span>/);
const placement=html.match(/<section[^>]* id="placement">([\s\S]*?)<\/section>/)[1];
assert.doesNotMatch(placement,/<a\b|\s(?:href|target|download|data-pdf-open)=|pec-document|PDF ·/i);
const hall={
 file:'assets/lines/separatsiya-02/engineering-center/industrial-hall.webp',bytes:172134,
 sha256:'ec6c3f15b61ac8306584421bad36de3db84b04f55a93dd939df0daf1f23de7c3'
};
const variants=[
 ...assembly.views.flatMap(view=>['thumb','display','full'].map(kind=>({...view[kind],file:'assets/lines/separatsiya-01/engineering-center/'+view[kind].file}))),
 ...projections.map(view=>({...view,file:'assets/'+view.file})),
 ...assembly.drawingThumbnails.map(view=>({...view,file:'assets/'+view.file})),hall
];
const files=[...new Map(variants.map(file=>[file.file,file])).values()];
assert.equal(files.length,24);
const A4=JSON.parse(html.match(/<script type="application\/json" id="line-document-data">(.*?)<\/script>/s)[1]).find(doc=>doc.id==='separatsiya-01-dimensions');
assert.equal(A4.format,'A4');assert.equal(A4.pages,1);assert.equal(A4.bytes,172617);
assert.equal(A4.sha256,'db8a8883361184e9c6ac84cc1dc85e5d50128a233c232c15cda7b903de461211');
async function verifyFile({file,bytes,sha256},mime){
 const response=await fetch(base+'/'+file,{cache:'no-store',signal:AbortSignal.timeout(25000)});
 assert.equal(response.status,200,file);
 assert.equal(response.headers.get('content-type')?.split(';')[0],mime,file);
 const buffer=Buffer.from(await response.arrayBuffer());
 assert.equal(buffer.length,bytes,file);
 assert.equal(createHash('sha256').update(buffer).digest('hex'),sha256,file);
}
for(let start=0;start<files.length;start+=6)await Promise.all(files.slice(start,start+6).map(v=>verifyFile(v,'image/webp')));
await verifyFile({...A4,file:'documents/'+A4.file},'application/pdf');
await verifyFile({...assembly.source,bytes:3249278},'application/pdf');
const documentation=html.match(/<section[^>]* id="documents">([\s\S]*?)<\/section>/)[1];
const library=await fetch(base+'/documents/drawings/?objectType=line&product=separatsiya-01',{cache:'no-store'});
assert.equal(library.status,200);
for(const markup of [documentation,await library.text()]){
 assert.ok(markup.includes('data-pdf-open="'+A4.id+'"'));
 assert.ok(markup.includes(A4.file+'" download="'));
}

const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
assert.ok(binary,'Chrome executable');
const profile=await mkdtemp(join(tmpdir(),'era-base-center-'));
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
 const requests=new Map(),errors=[],badResponses=[],imageRequests=new Map();
 let id=0;
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  if(message.method==='Network.responseReceived'){
   const {status,url}=message.params.response;
   if(status>=400&&url.startsWith(base+'/'))badResponses.push({status,url});
  }
  if(message.method==='Fetch.requestPaused'){
   void command('Fetch.failRequest',{requestId:message.params.requestId,errorReason:'Aborted'}).catch(error=>errors.push(error.message));
  }
  if(message.method==='Network.requestWillBeSent'){
   const {request,loaderId}=message.params;
   if(/\/lines\/separatsiya-01\/(?:engineering-center|dimensions)\//.test(request.url)){
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
  const event={key,code,windowsVirtualKeyCode:{Escape:27,Enter:13,' ':32,ArrowRight:39,Home:36,End:35}[key]};
  const text=key==='Enter'?'\r':key===' '?' ':'';
  await command('Input.dispatchKeyEvent',{...event,type:text?'keyDown':'rawKeyDown',text,unmodifiedText:text});
  await command('Input.dispatchKeyEvent',{...event,type:'keyUp'});
 };
 const touch=(type,points=[])=>command('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y],id)=>({x,y,id}))});
 const viewportCenter=()=>evaluate(`(()=>{const r=${find('.pec-viewport')}.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];})()`);
 await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
 await command('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('era-map-consent-v1','deny')"});
 await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const measure=()=>evaluate(`(()=>{
  const stage=${find('#base-engineering-stage')}.getBoundingClientRect();
  return [stage.top-${find('[data-base-engineering-center]')}.getBoundingClientRect().top,stage.height];
 })()`);
 const getStyles=()=>evaluate(`(()=>{
  const r=${find('[data-base-engineering-center]')}, backdrop=getComputedStyle(r,'::before'),panel=getComputedStyle(r.querySelector('.pec-panel'));
  const stage=getComputedStyle(r.querySelector('.pec-stage')),image=getComputedStyle(r.querySelector('.pec-image'));
  return {backdrop:backdrop.backgroundImage,mask:backdrop.maskImage,panel:panel.backgroundColor,blur:panel.backdropFilter,
   field:stage.backgroundImage,fieldColor:stage.backgroundColor,isolation:stage.isolation,blend:image.mixBlendMode};
 })()`);
 const noDocuments=()=>evaluate(`!${find('[data-base-engineering-center]')}.querySelector('a,[href],[download],[target],[data-pdf-open],.pec-documents,.pec-document-actions')`);
 async function screenshot(width,kind){
  const out=process.env.ERA_BASE_ENGINEERING_SCREENSHOTS;
  if(!out||width===768||width===320)return;
  const wholeViewport=kind==='fullscreen'||kind.startsWith('navigation-');
  const clip=wholeViewport?null:await evaluate(`(()=>{
   const root=${find('[data-base-engineering-center]')};
   if(!document.querySelector('#base-qa-hide-fixed')){
    const css=document.createElement('style');css.id='base-qa-hide-fixed';
    css.textContent='.site-header,[data-context-navigation],.quick-contact,.page-progress-rail{visibility:hidden!important}';
    document.head.append(css);
   }
   const r=root.getBoundingClientRect();
   return {x:r.left,y:r.top+scrollY,width:r.width,height:r.height,scale:1};
  })()`);
  const capture=await command('Page.captureScreenshot',wholeViewport?{format:'png'}:{format:'png',captureBeyondViewport:true,clip});
  await mkdir(out,{recursive:true});
  await writeFile(join(out,`base-engineering-${kind}-${width}.png`),Buffer.from(capture.data,'base64'));
 }
 const sets={
  overview:assembly.views.filter(view=>view.group==='overview').map(view=>view.id),
  detail:assembly.views.filter(view=>view.group==='detail').map(view=>view.id),
  drawings:projections.map(view=>view.id)
 };
 const views=new Map([...assembly.views,...projections].map(view=>[view.id,view]));
 const activeButton=id=>find(`[data-engineering-frame="${id}"]`);
 const initialFiles=new Set(['overall-display.webp',...sets.overview.map(id=>id+'-thumb.webp')]);
 async function openPdf(opener){
  await evaluate(opener+'.click()');
  await wait(`document.querySelector('#pdf-viewer')?.open&&document.querySelector('[data-pdf-status]').textContent==='Страница 1 из 1'`);
  assert.ok(await evaluate("document.querySelector('[data-pdf-canvas]').width>150"));
  await key('Escape');await wait("!document.querySelector('#pdf-viewer').open");
 }
 for(const width of [1440,768,390,320]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<=390});
  await command('Emulation.setTouchEmulationEnabled',{enabled:width===390,maxTouchPoints:2});
  const navigation=await command('Page.navigate',{url:url.replace('#placement','&width='+width+'#placement')});
  assert.ok(navigation.loaderId&&!navigation.errorText,JSON.stringify(navigation));
  await wait(`!!${find('[data-engineering-ready="true"]')}`);
  await evaluate('document.fonts.ready.then(()=>true)');
  await evaluate(find('.pec-stage')+".scrollIntoView({block:'center',behavior:'instant'})");
  await decoded('overall');
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
  assert.ok(early.includes('overall-display.webp'),`Initial engineering view was requested at ${width} px`);
  assert.deepEqual(early.filter(name=>!initialFiles.has(name)),[],`Lazy initial engineering assets at ${width} px`);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),true);
  assert.equal(await evaluate(`
   [...document.querySelectorAll('#placement .pec-metrics dd')].every(value=>{
    const text=document.createRange();text.selectNodeContents(value);
    return text.getBoundingClientRect().right<=value.getBoundingClientRect().right+1;
   })`),true,`Metrics fit at ${width} px`);
  await screenshot(width,'overview');
  const stage=await measure();
  for(const [group,ids] of Object.entries(sets)){
   await click(`[data-engineering-tab="${group}"]`);
   assert.equal(await noDocuments(),true,group);
   for(const [i,id] of ids.entries()){
    await click(`[data-engineering-frame="${id}"]`);await decoded(id);
    assert.equal(await evaluate(find('[data-engineering-count]')+'.textContent'),String(i+1).padStart(2,'0')+' / '+String(ids.length).padStart(2,'0'));
    assert.equal(await evaluate(find('[data-engineering-step="-1"]')+'.disabled'),i===0);
    assert.equal(await evaluate(find('[data-engineering-step="1"]')+'.disabled'),i===ids.length-1);
    const frame=await evaluate(`(()=>{
     const image=${find('[data-engineering-image]')},thumb=${activeButton(id)};
     const strip=thumb.closest('[data-engineering-strip]').getBoundingClientRect(),box=thumb.getBoundingClientRect();
     return {dimensions:[image.naturalWidth,image.naturalHeight],attributes:['width','height'].map(name=>Number(image.getAttribute(name))),fit:getComputedStyle(image).objectFit,
      full:thumb.dataset.engineeringFull,
      label:${find('[data-engineering-title]')}.textContent,alt:image.alt,pressed:thumb.getAttribute('aria-pressed'),
      visible:box.left>=strip.left-2&&box.right<=strip.right+2};
    })()`);
    const view=views.get(id), variant=view.display??view, label=view.title??view.label;
    assert.deepEqual(frame.dimensions,[variant.width,variant.height],id);
    assert.deepEqual(frame.attributes,frame.dimensions,id);
    assert.equal(frame.fit,'contain',id);
    assert.equal(frame.label,label,id);
    assert.equal(frame.alt,label,id);
    assert.equal(frame.pressed,'true',id);
    assert.ok(frame.visible,`${id} scrolled into view at ${width} px`);
    const fullFile=view.full?'lines/separatsiya-01/engineering-center/'+view.full.file:view.file;
    assert.equal(new URL(frame.full,base).href,base+'/assets/'+fullFile,id);
    assert.deepEqual(await measure(),stage);
    if(width===1440&&id==='sorting-deck')await screenshot(width,'detail');
   }
  }
  const drawings=await getStyles();
  assert.match(drawings.field,/radial-gradient/);
  assert.notEqual(drawings.field,visual.field);
  assert.equal(drawings.blend,'multiply');
  await screenshot(width,'drawings');
  // Drawings open in the same image viewer. The original PDF opens from documentation.
  await click('.pec-image-open');
  await wait(`${find('[data-engineering-dialog]')}.open`);
  assert.equal(await evaluate("document.querySelector('#pdf-viewer').open"),false);
  assert.match(await evaluate(find('[data-engineering-image]')+'.getAttribute("src")'),/\/drawings\/side\.webp$/);
  assert.equal((await getStyles()).blend,'normal');
  assert.equal(await noDocuments(),true);
  await key('Escape');await wait(`!${find('[data-engineering-dialog]')}.open&&document.activeElement===${find('.pec-image-open')}`);
  const drawingOpener='document.querySelector(\'#documents [data-pdf-open="separatsiya-01-dimensions"]\')';
  await openPdf(drawingOpener);
  await click('[data-engineering-tab="overview"]');await decoded('feed-area');
  await evaluate(find('[data-engineering-frame="feed-area"]')+'.focus()');
  await key('Home');await decoded('overall');
  await key('End');await decoded('feed-area');
  await key('Home');await decoded('overall');
  await evaluate(find('[data-engineering-tab="overview"]')+'.focus()');
  await key('ArrowRight');await decoded('support-frame');
  await key('End');await decoded('side');
  await key('Home');await decoded('overall');
  await click('.pec-next');await decoded('central-module');
  await click('.pec-prev');await decoded('overall');
  if(width===390){
   await evaluate(find('.pec-stage')+".scrollIntoView({block:'center',behavior:'instant'})");
   let [x,y]=await viewportCenter();
   await touch('touchStart',[[x+65,y]]);
   for(const distance of [25,70,130])await touch('touchMove',[[x+65-distance,y]]);
   await touch('touchEnd');await decoded('central-module');
   [x,y]=await viewportCenter();
   const scrollBefore=await evaluate('scrollY');
   await touch('touchStart',[[x,y+55]]);
   for(const distance of [25,50,100])await touch('touchMove',[[x,y+55-distance]]);
   await touch('touchEnd');
   await wait(`scrollY>${scrollBefore}+5`);
   await decoded('central-module');
   await click('.pec-prev');await decoded('overall');
  }
  if(width===1440){
   await evaluate(`${activeButton('left-area')}.click();${activeButton('feed-area')}.click()`);
   await decoded('feed-area');
   await click('[data-engineering-frame="overall"]');await decoded('overall');
   await command('Fetch.enable',{patterns:[{urlPattern:'*overall-full.webp',requestStage:'Request'}]});
  }
  await evaluate(find('.pec-expand')+'.focus()');
  if(width===390)await key(' ','Space');else await key('Enter');
  if(width===1440){
   await wait(`${find('[data-engineering-dialog]')}.open&&!${find('[data-engineering-error]')}.hidden`);
   await command('Fetch.disable');
   await click('[data-engineering-retry]');
  }
  await wait(`${find('[data-engineering-dialog]')}.open&&${find('[data-engineering-image]')}.src.endsWith('/overall-full.webp')&&${find('[data-engineering-image]')}.naturalWidth===${views.get('overall').full.width}`);
  assert.equal(await noDocuments(),true);
  assert.equal(await evaluate("document.body.style.overflow"),'hidden');
  const fullscreen=await getStyles();
  assert.equal(fullscreen.field,'none');
  assert.equal(fullscreen.fieldColor,'rgb(253, 253, 252)');
  assert.equal(fullscreen.blend,'normal');
  await click('[data-engineering-scale-by=".5"]');
  assert.equal(await evaluate(find('[data-engineering-scale]')+'.textContent'),'150%');
  if(width===1440)await screenshot(width,'fullscreen');
  await click('[data-engineering-reset]');
  assert.equal(await evaluate(find('[data-engineering-scale]')+'.textContent'),'100%');
  if(width===390){
   const [x,y]=await viewportCenter();
   await touch('touchStart',[[x-22,y],[x+22,y]]);
   await touch('touchMove',[[x-45,y],[x+45,y]]);
   await touch('touchMove',[[x-71,y],[x+71,y]]);
   await touch('touchEnd');
   await wait(`parseInt(${find('[data-engineering-scale]')}.textContent)>170`);
   await click('[data-engineering-reset]');
  }
  await evaluate(find('[data-engineering-viewport]')+'.focus()');
  await key('ArrowRight');await decoded('central-module');
  await key('Escape');await wait(`!${find('[data-engineering-dialog]')}.open&&document.activeElement===${find('.pec-expand')}`);
  assert.notEqual(await evaluate("document.body.style.overflow"),'hidden');
  await click('[data-engineering-frame="overall"]');await decoded('overall');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),true);
  console.log(`All 11 views, dimensions and fullscreen verified at ${width} px`);
 }
 const sections=['purpose','raw-materials','composition','process','quality','kair','specs','placement','photos','documents','request','equipment'];
 const lineSlugs=['separatsiya-01','separatsiya-02','separatsiya-03','moyka-plenki'];
 function activeSection(id,expectHash=true){
  return `(()=>{
   const context=document.querySelector('[data-context-navigation]'),header=document.querySelector('.site-header');
   const menu=context?.querySelector('[data-line-section-nav]'),target=document.getElementById(${JSON.stringify(id)});
   const current=menu?.querySelector('a[aria-current="location"]');
   if(!current||!target||current.hash!=='#${id}'||(${expectHash}&&location.hash!=='#${id}'))return false;
   const h=header.getBoundingClientRect(),bar=context.getBoundingClientRect(),section=target.getBoundingClientRect();
   const row=menu.getBoundingClientRect(),link=current.getBoundingClientRect();
   return getComputedStyle(context).position==='sticky'&&Math.abs(bar.top-h.bottom)<=2&&
    section.top>=bar.bottom-1&&section.top<=bar.bottom+85&&link.left>=row.left-2&&link.right<=row.right+2;
  })()`;
 }
 for(const width of [1440,768,390,320]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<=390});
  for(const slug of lineSlugs){
   const route=base+'/catalog/lines/'+slug+'/?v='+(process.env.ERA_BUILD_COMMIT||'preview')+'&nav='+width+'#placement';
   const navigation=await command('Page.navigate',{url:route});
   assert.ok(navigation.loaderId&&!navigation.errorText,route);
   await wait(activeSection('placement'));
   assert.equal(await evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1'),true,slug+' at '+width);
   assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-line-section-nav] a')].map(link=>link.hash.slice(1))`),sections);
   if(width<=390)assert.ok(await evaluate(`(()=>{const row=document.querySelector('[data-line-section-nav]');return row.scrollWidth>row.clientWidth})()`));
   await screenshot(width,'navigation-'+slug);
   for(const id of sections){
    const link=`document.querySelector('[data-line-section-nav] a[href="#${id}"]')`;
    if(id==='specs'){
     await evaluate(link+'.focus()');
     await key('Enter');
    }else await evaluate(link+'.click()');
    await wait(activeSection(id));
   }
   await evaluate("document.getElementById('photos').scrollIntoView({block:'start',behavior:'instant'})");
   await wait(activeSection('photos',false));
   assert.equal(await evaluate('location.hash'),'#equipment');
  }
  console.log(`All 12 sticky section links on four lines verified at ${width} px`);
 }
 const libraryPage=await command('Page.navigate',{url:library.url});
 assert.ok(libraryPage.loaderId&&!libraryPage.errorText);
 const libraryOpener=`document.querySelector('[data-library-document="${A4.id}"] [data-pdf-open]')`;
 await wait(`!!${libraryOpener}&&!!document.querySelector('.dl-view-controls:not([hidden])')`);
 await openPdf(libraryOpener);

 await command('Emulation.setScriptExecutionDisabled',{value:true});
 const fallback=await command('Page.navigate',{url:url.replace('#placement','&fallback=1#placement')});
 assert.ok(fallback.loaderId&&!fallback.errorText);
 await wait(`!!${find('[data-base-engineering-center]')}`);
 await evaluate(find('.pec-stage')+".scrollIntoView({block:'center',behavior:'instant'})");
 await decoded('overall');
 assert.equal(await noDocuments(),true);
 assert.equal(await evaluate(`!${find('[data-base-engineering-center]')}.hasAttribute('data-engineering-ready')&&[...${find('[data-base-engineering-center]')}.querySelectorAll('button')].every(button=>!button.getClientRects().length)`),true);
 assert.ok(await evaluate(`!!document.querySelector('#documents [data-library-document="${A4.id}"] [download]')`));
 assert.deepEqual(errors,[],'Public BASE engineering center runtime errors');
 assert.deepEqual(badResponses,[],'Published page HTTP errors');
 console.log('::notice title=Published BASE engineering center and line navigation verified::11 views, 24 WebP SHA-256 checks, original A4, lazy loading, retry, swipe, pinch, fullscreen and zoom. All 12 sticky section links work on all four lines at 1440, 768, 390 and 320 px. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
