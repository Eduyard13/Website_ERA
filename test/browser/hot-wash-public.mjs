// Actual published hot-wash page, original media, PDF and native browser interactions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {auditNativeDiagram,captureNativeDiagram,verifyNativeAsset} from './native-diagram-audit.mjs';
const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3161').replace(/\/$/,'');
const compositionPath=`/catalog/lines/moyka-plenki/?v=${process.env.ERA_BUILD_COMMIT||'preview'}#composition`;
const url=base+compositionPath;
const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200);
const html=await response.text();assert.ok(html.includes('data-hot-wash-line'));
const version=html.match(/hot-film-washing\.css\?v=([^"&]+)/)?.[1];assert.ok(version);
await verifyNativeAsset(base,html,'moyka-plenki','db27ba0e04807449d36fadaf9035b1464a28fe7cfc0c263db82b22eaae65f142');
const document=JSON.parse(html.match(/<script type="application\/json" id="line-document-data">(.*?)<\/script>/s)[1]).find(entry=>entry.id==='moyka-plenki-technical');
assert.equal(document.pages,22);assert.equal(document.bytes,4430978);assert.equal(document.sha256,'5648714c2f667ddb9d2168803aac50faf927fedbecb5147deebb57b0186a704a');
const pdf=await fetch(base+'/documents/'+document.file,{cache:'no-store'});assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');
const bytes=Buffer.from(await pdf.arrayBuffer());assert.equal(bytes.length,document.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),document.sha256);
const manifest=JSON.parse(await readFile(new URL('../../docs/audits/moyka-plenki-assets.json',import.meta.url),'utf8'));
for(const asset of [...manifest.assets,...(manifest.catalogCardUpdate?.assets||[])])for(const [file,sha] of [[asset.file,asset.sha256],[asset.smallFile,asset.smallSha256]]){
 const r=await fetch(base+'/assets/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.equal(r.headers.get('content-type'),'image/webp');
 assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),sha,file);
}
const rawAssets=JSON.parse(await readFile(new URL('../../content/lines/hot-wash/hot-wash-raw-assets.json',import.meta.url),'utf8'));
const album=JSON.parse(await readFile(new URL('../../content/lines/hot-wash/hot-wash-album.json',import.meta.url),'utf8'));
const rawDirectory='/assets/lines/moyka-plenki/raw-prepared/';
for(const {files} of rawAssets){
 await Promise.all(files.map(async ({file,sha256})=>{
  const r=await fetch(base+rawDirectory+file+'?v='+version,{cache:'no-store'});
  assert.equal(r.status,200,file);assert.equal(r.headers.get('content-type'),'image/webp');
  assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),sha256,file);
 }));
}
for(const path of ['/catalog/lines/','/technology/','/documents/technical/','/media/'])assert.equal((await fetch(base+path,{cache:'no-store'})).status,200,path);
for(const slug of ['separatsiya-01','separatsiya-02','separatsiya-03']){
 const response=await fetch(base+'/catalog/lines/'+slug+'/?v='+version,{cache:'no-store'});
 assert.equal(response.status,200,slug);
 const raw=(await response.text()).match(/<section[^>]* id="raw-materials"[\s\S]*?<\/section>/)?.[0];
 assert.ok(raw,slug);
 assert.equal(/<summary>Как оборудование отделяет эти загрязнения<\/summary>/.test(raw),slug!=='separatsiya-02',slug);
}
for(const file of ['assets/css/equipment/hot-wash/hot-film-washing.css','assets/css/equipment/hot-wash/hot-wash-process.css','assets/js/equipment/hot-wash/hot-film-washing.js']){const r=await fetch(base+'/'+file+'?v='+version,{cache:'no-store'});assert.equal(r.status,200,file);assert.ok(!r.headers.get('content-type').includes('text/html'));}
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
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method));},60000);
  pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public hot-wash line condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 async function capturePresentation(width){
  const directory=process.env.ERA_HOT_WASH_PRESENTATION_SCREENSHOTS;
  if(!directory)return;
  await mkdir(directory,{recursive:true});
  await evaluate(`(async()=>{
   const style=document.createElement('style');style.id='hot-wash-capture-style';
   style.textContent='.site-header,.context-navigation,.quick-contact,.page-progress{visibility:hidden!important}';
   document.head.append(style);await document.fonts.ready;
  })()`);
  const blocks=[
   ['raw-categories','.hw-raw-origins'],['cycle','[data-hotwash-cycle]'],
   ['operations','[data-hotwash-operations]'],['quality','[data-hotwash-quality]'],
   ['expansion','[data-hotwash-expansion]'],['photos','#photos']
  ];
  async function capture([name,selector]){
   const clip=await evaluate(`(async()=>{
    const block=document.querySelector(${JSON.stringify(selector)});
    block.scrollIntoView({block:'start',behavior:'instant'});
    await Promise.all([...block.querySelectorAll('img')].map(image=>image.decode()));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const {top,height}=block.getBoundingClientRect();
    return {x:0,y:Math.max(0,Math.floor(top+scrollY)-8),height:Math.ceil(height)+8,width:innerWidth,scale:1};
   })()`);
   const {data}=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
   await writeFile(join(directory,`${width}-${name}.png`),Buffer.from(data,'base64'));
  }
  for(const block of blocks)await capture(block);
  await evaluate(`document.querySelector('#hot-wash-capture-style').remove()`);
 }
 await command('Page.enable');await command('Runtime.enable');
 await command('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('era-map-consent-v1','deny')"});
 const load=async path=>{await command('Page.navigate',{url:base+path});await wait(`document.readyState==='complete'`);};
 const root=()=>evaluate(`(()=>{const r=document.querySelector('#hotwash-construction');return {grid:getComputedStyle(r.querySelector('.diagram-canvas')).backgroundImage,sourceBlend:getComputedStyle(r.querySelector('.diagram-projection > svg')).mixBlendMode,navigation:r.querySelectorAll('[data-architecture-part]').length,unmappedLink:r.querySelector('.dry-architecture-item--link')?.getAttribute('href'),ready:r.dataset.monitorReady,mode:r.dataset.diagramMode,pins:r.querySelectorAll('[data-callout]').length,options:r.querySelectorAll('[data-diagram-select] option').length,selected:r.querySelector('[data-detail-number]').textContent,overflow:document.documentElement.scrollWidth>innerWidth,fit:r.querySelector('[data-diagram-viewport]').scrollWidth<=r.querySelector('[data-diagram-viewport]').clientWidth+1,products:document.querySelectorAll('.hw-product-grid>article').length,spec:document.querySelectorAll('[data-hotwash-position]').length,broken:[...document.querySelectorAll('main img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)}})()`);
 async function selectDrawing(id){
  await wait(`!!document.querySelector('[data-hot-wash-engineering-center][data-engineering-ready="true"]')`);
  await click('#placement [data-engineering-tab="drawings"]');
  await click(`#placement [data-engineering-frame="${id}"]`);
  await wait(`(()=>{const image=document.querySelector('#placement [data-engineering-loaded-view="${id}"]');
   return !!image?.complete&&image.naturalWidth>0&&document.querySelector('#placement [data-engineering-frame="${id}"]').getAttribute('aria-pressed')==='true';
  })()`);
 }
 for(const width of [320,375,390,768,1024,1280,1440,1920]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await load(compositionPath);await wait(`!!document.querySelector('#hotwash-construction[data-monitor-ready="true"]')`);
  await evaluate(`Promise.all([...document.querySelectorAll('main img')].map(i=>{i.loading='eager';return i.decode();}))`);
  const sharedBlocks=await evaluate(`(()=>{const r=document.querySelector('#request'),d=document.querySelector('[data-dry-document-editions]'),cards=[...d.querySelectorAll('[data-library-document]')],button=r.querySelector('.dry-request-action'),dialog=document.querySelector('#project-request');button.click();const result={opened:dialog.open,topic:dialog.querySelector('[data-request-topic]').value,source:dialog.querySelector('[data-request-source]').value,forms:r.querySelectorAll('form').length,steps:r.querySelectorAll('.dry-request-steps li').length,fit:r.scrollWidth<=r.clientWidth+1&&d.scrollWidth<=d.clientWidth+1,docs:cards.map(c=>c.dataset.libraryDocument),links:cards.every(c=>c.querySelector('.edition-open').href===c.querySelector('.edition-download').href&&c.querySelector('.edition-download').hasAttribute('download')),library:new URL(d.querySelector('.edition-library').href).searchParams.get('product')};dialog.querySelector('[data-request-close]').click();return {...result,closed:!dialog.open}})()`);
  assert.ok(sharedBlocks.opened&&sharedBlocks.closed&&sharedBlocks.fit&&sharedBlocks.links);
  assert.equal(sharedBlocks.topic,'Линия горячей мойки плёнок и пакетов');
  assert.ok(sharedBlocks.source.split('/').filter(Boolean).at(-1)==='moyka-plenki');
  assert.equal(sharedBlocks.forms,0);assert.equal(sharedBlocks.steps,3);
  assert.deepEqual(sharedBlocks.docs,['moyka-plenki-brochure','moyka-plenki-technical','moyka-plenki-dimensions']);assert.equal(sharedBlocks.library,'moyka-plenki');
  if(width===1440&&process.env.ERA_HOT_WASH_SCREENSHOT){
   await captureNativeDiagram(evaluate,command,'hotwash-construction',process.env.ERA_HOT_WASH_SCREENSHOT);
  }
  const s=await root();assert.equal(s.mode,'fit');assert.equal(s.pins,44);assert.equal(s.options,36);assert.equal(s.products,3);assert.equal(s.spec,37);assert.ok(s.fit&&!s.overflow);assert.deepEqual(s.broken,[]);assert.equal(s.navigation,36);assert.equal(s.unmappedLink,'#placement');assert.ok(s.grid.includes('engineering-grid-02.svg'));assert.equal(s.sourceBlend,'multiply');
  const presentation=await evaluate(`(()=>{
   const count=selector=>document.querySelectorAll(selector).length;
   const cards=[...document.querySelectorAll('[data-hotwash-stage]')].map(e=>e.getBoundingClientRect());
   const intersections=[...document.querySelectorAll('.hw-stage-next-desktop,.hw-stage-next-mobile')].filter(e=>{
    if(getComputedStyle(e).display==='none')return false;
    const a=e.getBoundingClientRect();
    return cards.some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1);
   }).length;
   return {sections:count('[data-hot-wash-line] > section'),nav:count('[data-line-section-nav] a'),
    stages:cards.length,intersections,routes:count('[data-hotwash-product]'),water:count('[data-hotwash-water]'),
    mapOverflow:document.querySelector('.hw-flow-map').scrollWidth>document.querySelector('.hw-flow-map').clientWidth,
    reagents:count('[data-hotwash-reagent]'),waste:count('[data-hotwash-waste]'),
    specs:count('#specs [data-hotwash-select]'),power:count('#specs [data-power-position]'),gallery:count('#photos [data-dry-album-photo]'),
    composition:count('#composition [data-hotwash-position]')};
  })()`);
  assert.deepEqual(presentation,{sections:13,nav:12,stages:10,intersections:0,routes:3,water:5,mapOverflow:false,reagents:2,waste:2,specs:36,power:32,gallery:6,composition:0},String(width));
  const rawLayout=await evaluate(`(()=>{
   const section=document.querySelector('#raw-materials'),prepared=section.querySelector('.hw-raw-photos'),categories=section.querySelector('.hw-raw-origins');
   const columns=node=>getComputedStyle(node).gridTemplateColumns.split(' ').length;
   const images=[...section.querySelectorAll('.media-open')];
   const cover=images.every(a=>{
    const box=a.getBoundingClientRect(),image=a.querySelector('img'),imgBox=image.getBoundingClientRect();
    return Math.abs(box.width/box.height-4/3)<.02&&getComputedStyle(image).objectFit==='cover'
     &&Math.abs(imgBox.width-box.width)<1&&Math.abs(imgBox.height-box.height)<1
     &&image.currentSrc.includes('/moyka-plenki/raw-prepared/')&&image.naturalWidth>0;
   });
   const removed=document.querySelectorAll('#raw-materials :is(details,table,.dry-raw-evidence), #kair img, #kair .line-note, #process details, #process .hw-process-archive, #quality details, #quality .line-note, #quality .hw-quality-metrics, #placement .hw-placement-grid, #specs .hw-scaling').length;
   const rows=[...categories.children].map(card=>[card,card.querySelector('figure'),card.querySelector('h3'),...card.querySelectorAll('dl>div')].map(e=>Math.round(e.getBoundingClientRect().top)));
   const aligned=rows.every((row,i)=>row.length===5&&rows.slice(0,i).every(other=>row[0]!==other[0]||row.every((y,j)=>Math.abs(y-other[j])<=1)));
   return {prepared:prepared.children.length,categories:categories.children.length,columns:[columns(prepared),columns(categories)],cover,removed,aligned};
  })()`);
  assert.deepEqual(rawLayout,{prepared:2,categories:3,columns:width<=760?[1,1]:width<=1100?[2,2]:[2,3],cover:true,removed:0,aligned:true},String(width));
  const revised=await evaluate(`(()=>{
   const find=selector=>document.querySelector(selector);
   const all=selector=>[...document.querySelectorAll(selector)];
   const columns=selector=>getComputedStyle(find(selector)).gridTemplateColumns.split(' ').length;
   const visible=node=>getComputedStyle(node).display!=='none';
   const panels=all('[data-hotwash-cycle],[data-hotwash-quality],[data-hotwash-expansion],[data-hotwash-operations]');
   const cycle=find('[data-hotwash-cycle]');
   return {
    panels:panels.length,
    fits:panels.every(panel=>panel.scrollWidth<=panel.clientWidth+1),
    cycle:[...cycle.querySelectorAll('.hw-cycle-grid h3')].map(node=>node.textContent),
    current:cycle.querySelector('.hw-cycle-grid [aria-current="step"] h3').textContent,
    operationColumns:columns('.hw-operations-grid'),
    operations:all('.hw-operations-grid li').length,
    accented:all('.hw-operation-accent').map(node=>node.dataset.hotwashOperation),
    quality:all('.hw-quality-value').map(node=>node.textContent),
    connectors:all('.hw-expansion-connector').filter(visible).length,
    granulators:all('.hw-expansion-rate').map(node=>node.textContent),
    remainingDetails:all('#specs details').length,
    album:all('#photos [data-dry-album-photo]').map(node=>new URL(node.dataset.image,location.href).pathname.split('/assets/')[1])
   };
  })()`);
  assert.deepEqual(revised,{
   panels:4,fits:true,cycle:['Сухая сепарация','Горячая мойка','Грануляция'],current:'Горячая мойка',
   operationColumns:width<=650?1:width<=1024?2:3,operations:9,accented:['04','09'],
   quality:['30–70ppm','1–2%','0,8–1,2г/10 мин'],connectors:2,granulators:['750 кг/ч','750 кг/ч'],
   remainingDetails:1,album:album.map(item=>item.file)
  },String(width));
  if(width===390||width===1440)await capturePresentation(width);
  if(width===390||width===1440)await auditNativeDiagram(evaluate,'hotwash-construction',{count:44,branches:47});
  for(let number=1;number<=36;number++){
   await evaluate(`(()=>{const s=document.querySelector('[data-diagram-select]');s.value='${number}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
   assert.equal((await root()).selected,String(number).padStart(2,'0'));
  }
  await selectDrawing('top');
 }
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await load(compositionPath);await wait(`!!document.querySelector('[data-monitor-ready]')`);
 async function verifyViewer(selector,paths){
  await click(selector);
  for(const [index,path] of paths.entries()){
   if(index)await click('#media-viewer [data-next]');
   await wait(`(()=>{const v=document.querySelector('#viewer-image');return document.querySelector('#media-viewer').open&&v.getAttribute('src')?.endsWith(${JSON.stringify(path)})&&v.complete&&v.naturalWidth>0;})()`);
  }
  await click('#media-viewer [data-close]');
  await wait(`!document.querySelector('#media-viewer').open&&!document.body.classList.contains('viewer-open')`);
 }
 const rawKeys=['raw-prepared-01','raw-prepared-02','raw-household','raw-agricultural','raw-stretch'];
 await verifyViewer('#raw-materials .media-open',rawKeys.map(key=>rawDirectory+key+'.webp'));
 await verifyViewer('#photos .media-open',album.map(({file})=>'/assets/'+file));
 const sidebarSelect=await evaluate(`(()=>{
   const root=document.querySelector('#hotwash-construction'),row=root.querySelector('[data-architecture-part="18"]');row.click();
   return {row:row.getAttribute('aria-pressed'),pin:root.querySelectorAll('button[data-part="18"][aria-pressed="true"]').length,selected:root.querySelector('[data-detail-number]').textContent};
 })()`);
 assert.deepEqual(sidebarSelect,{row:'true',pin:1,selected:'18'});
 // Keep the permanent navigator and its placement link; no redundant notes or tables below the monitor.
 assert.equal(await evaluate(`document.querySelectorAll('#composition > .line-note,#composition > details,#composition > noscript').length`),0);
 await click('#specs .line-power-details summary');
 assert.ok(await evaluate(`document.querySelector('#specs .line-power-details').open`));
 for(let position=1;position<=36;position++){
  await click(`#specs [data-hotwash-select="${position}"]`);
  assert.equal((await root()).selected,String(position).padStart(2,'0'));
 }
 assert.equal(await evaluate(`document.querySelector('#specs [data-hotwash-position="37"] a').getAttribute('href')`),'#placement');
 await click('#hotwash-construction [data-architecture-part="33"]');assert.equal((await root()).selected,'33');
 assert.ok(await evaluate(`document.querySelector('#hotwash-construction .dry-architecture-item--link').getAttribute('href')==='#placement'`));
 await selectDrawing('side');
 await click('[data-pdf-open="moyka-plenki-technical"]');
 await wait(`document.querySelector('[data-pdf-status]').textContent==='Страница 1 из 22'`);
 assert.ok(await evaluate(`document.querySelector('[data-pdf-canvas]').width>100`));
 await click('[data-pdf-next]');await wait(`document.querySelector('[data-pdf-status]').textContent==='Страница 2 из 22'`);
 await click('[data-pdf-close]');
 await click('#photos [data-photo-gallery]');
 await wait(`!!document.querySelector('[data-gallery-ready="true"]')&&document.querySelector('[name="product"]').value.endsWith('/catalog/lines/moyka-plenki')`);
 assert.equal(await evaluate(`document.querySelectorAll('[data-gallery-archive-grid] [data-gallery-item]').length`),22);
 await load('/catalog/lines/?group=Мойка');await wait(`!!document.querySelector('[data-catalog-ready]')`);
 assert.equal(await evaluate(`document.querySelectorAll('[data-line]:not([hidden])').length`),1);
 assert.equal(await evaluate(`document.querySelector('[data-line]:not([hidden])').tagName`),'A');
 await click('[data-line-id="moyka-plenki"]');await wait(`!!document.querySelector('[data-context-ready]')`);
 await click('[data-context-back]');await wait(`!!document.querySelector('[data-catalog-ready]')`);
 assert.equal(await evaluate(`new URL(location.href).searchParams.get('group')`),'Мойка');
 await load(compositionPath);await wait(`!!document.querySelector('[data-hotwash-cycle]')`);
 await click('.hw-cycle-grid a');
 await wait(`!!document.querySelector('[data-dry-raw="separatsiya-02"]')`);
 assert.equal(await evaluate(`!!document.querySelector('#raw-materials .dry-raw-details')`),false);
 await load(compositionPath);await wait(`!!document.querySelector('[data-hotwash-cycle]')`);
 await click('.hw-cycle-links a:last-child');await wait(`!!document.querySelector('[data-technology-line="moyka-plenki"]')`);
 assert.ok(await evaluate(`document.querySelector('[data-technology-line="moyka-plenki"]').href.endsWith('/catalog/lines/moyka-plenki')`));
 assert.deepEqual(errors,[],'Published hot-wash console errors');
 console.log(`::notice title=Published hot wash verified::Four new panels and nine operations, six approved gallery images and lightbox, five raw media cards and 15 WebP hashes, 10 material stages, 5 water routes, 37 specification rows, 8 widths, 44 equipment badges and 47 leader ends, original PDF and navigation passed. ${url}`);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
