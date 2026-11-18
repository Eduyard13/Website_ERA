// Verify the deployed release itself, including actual Chrome filtering and unchanged WebP bytes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3141').replace(/\/$/,'');
const original=JSON.parse(await readFile(new URL('./fixtures/catalog-preserved.json',import.meta.url),'utf8'));
let version;
for(const [path,marker] of [['/catalog/','От отдельного узла до производственного комплекса.'],['/catalog/lines/','Технологические решения.'],['/catalog/equipment/','Оборудование для каждой стадии.']]){
 const r=await fetch(base+path,{cache:'no-store'});assert.equal(r.status,200,path);
 const html=await r.text();assert.ok(html.includes(marker),path);
 const release=html.match(/interactions\.js\?v=([^"&]+)/)?.[1];assert.ok(release);
 version??=release;assert.equal(release,version);
 if(path!=='/catalog/')assert.ok(html.includes('/catalog-branches.js?v='+version)&&html.includes('/catalog-branches.css?v='+version));
}
for(const file of ['catalog.css','catalog-branches.css','catalog-branches.js','catalog-filter-model.js','interactions.js']){
 const r=await fetch(`${base}/${file}?v=${version}`,{cache:'no-store'});assert.equal(r.status,200,file);
 assert.ok(!r.headers.get('content-type')?.includes('text/html'));
 if(file.endsWith('.js'))assert.ok(r.headers.get('content-type')?.includes('javascript'));
}
for(const [file,sha] of Object.entries(original.assets)){
 const r=await fetch(base+'/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.equal(r.headers.get('content-type'),'image/webp');
 assert.equal(createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),sha,file+' SHA-256');
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
assert.ok(binary,'Chrome is required');
const profile=await mkdtemp(join(tmpdir(),'era-catalog-browser-'));
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
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public catalogue condition failed: '+expression);};
 const load=async path=>{
  await command('Page.navigate',{url:base+path});
  await wait(`document.readyState==='complete'&&location.pathname.endsWith(${JSON.stringify(path.split('?')[0])})`);
  if(path.startsWith('/catalog/lines/')||path.startsWith('/catalog/equipment/'))await wait(`!!document.querySelector('[data-catalog-ready="true"]')`);
 };
 const clickButton=name=>evaluate(`([...document.querySelectorAll('.catalog-branch-filters button')].find(b=>b.textContent===${JSON.stringify(name)})).click()`);
 const count=kind=>evaluate(`document.querySelectorAll('[data-${kind}]:not([hidden])').length`);
 const active=()=>evaluate(`document.querySelector('[data-quick-filter] [aria-pressed="true"]').textContent`);
 await command('Page.enable');await command('Runtime.enable');
 const widths=[320,360,390,768,900,1024,1280,1440,1920];
 for(const width of widths){
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  for(const path of ['/catalog/','/catalog/lines/','/catalog/equipment/']){
   await load(path);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,path+' / '+width);
   if(path==='/catalog/'){
    await evaluate(`Promise.all([...document.querySelectorAll('.catalog-door img')].map(i=>{i.loading='eager';return i.decode();}))`);
    assert.equal(await evaluate(`document.querySelectorAll('.catalog-door').length`),2);
    assert.equal(await evaluate(`[...document.querySelectorAll('.catalog-door')].every(c=>{const i=c.querySelector('img').getBoundingClientRect(),t=c.querySelector('.catalog-exhibit-copy').getBoundingClientRect();return i.bottom<=t.top+1&&Math.abs(i.width/i.height-1.5)<.01;})`),true);
   }else{
    assert.equal(await count(path.includes('equipment')?'node':'line'),path.includes('equipment')?12:4);
    assert.equal(await evaluate(`document.querySelectorAll('.catalog-branch-nav [aria-current="page"]').length`),1);
    if(path.includes('lines')){
     assert.equal(await evaluate(`document.querySelector('.catalog-comparison').open`),false);
     await evaluate(`document.querySelector('.catalog-comparison summary').click()`);
     assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
     const comparison=await evaluate(`(()=>{
      const table=document.querySelector('[data-line-comparison] table');
      const headers=[...table.querySelectorAll('[data-comparison-line]')];
      const rows=[...table.tBodies[0].rows];
      const aligned=row=>{
       const cells=row.querySelectorAll('td');
       return cells.length===headers.length&&[...cells].every((cell,i)=>{
        const box=cell.getBoundingClientRect(),header=headers[i].getBoundingClientRect();
        return box.width>0&&box.left>=0&&box.right<=innerWidth+1&&Math.abs(box.left-header.left)<1&&Math.abs(box.width-header.width)<1&&cell.scrollWidth<=cell.clientWidth+1;
       });
      };
      return {lines:headers.map(header=>header.dataset.comparisonLine),rows:rows.length,fits:rows.every(aligned)};
     })()`);
     assert.deepEqual(comparison,{lines:['separatsiya-01','separatsiya-02','separatsiya-03'],rows:13,fits:true},`Comparison at ${width}px`);
    }
   }
  }
 }
 await load('/catalog/lines/?campaign=test&group=Сепарация');assert.equal(await count('line'),3);assert.equal(await active(),'Сепарация');
 await evaluate(`document.querySelector('.catalog-comparison summary').click()`);
 const table=await evaluate(`document.querySelector('.catalog-comparison table').textContent`);
 for(const value of ['225 кВт','402,67 кВт','639,77 кВт','157,5 кВт','281,87 кВт','447,84 кВт','5 × 4,7 м³','Дополнительная опция, по согласованию','Не входят в базовую комплектацию','2–10 дополнительно','56,2 × 43,4'])assert.ok(table.includes(value),value);
 await clickButton('Мойка');assert.equal(await count('line'),1);assert.equal(await active(),'Мойка');
 assert.equal(await evaluate(`document.querySelector('.catalog-comparison').hidden`),true);
 await clickButton('Все линии');assert.equal(await count('line'),4);assert.equal(await evaluate(`document.querySelector('.catalog-comparison').open`),true);
 assert.equal(await evaluate('location.search'),'?campaign=test');
 await load('/catalog/equipment/');
 for(const [name,n] of [['Все узлы',12],['Подготовка и подача',3],['Сухая сепарация',2],['Измельчение и мойка',2],['Обезвоживание',3],['Очистка стоков',1],['Фасовка',1]]){
  await clickButton(name);assert.equal(await count('node'),n,name);assert.equal(await active(),name);
 }
 await clickButton('Сбросить');
 await evaluate(`(()=>{const e=document.querySelector('[name=q]');e.value='флотатор';e.dispatchEvent(new Event('input',{bubbles:true}));})()`);assert.equal(await count('node'),1);
 await evaluate(`document.querySelector('[data-node]:not([hidden])').click()`);
 await wait(`!!document.querySelector('[data-context-back]')&&document.readyState==='complete'`);
 await command('Page.navigateToHistoryEntry',{entryId:(await command('Page.getNavigationHistory')).entries.at(-2).id});
 await wait(`!!document.querySelector('[data-catalog-ready]')`);assert.equal(await count('node'),1);
 await load('/catalog/equipment/?campaign=test&category=invalid&material=invalid&q=%20%20');assert.equal(await count('node'),12);assert.equal(await evaluate('location.search'),'?campaign=test');
 await evaluate(`history.replaceState({custom:'preserved'},'',location.href)`);
 await clickButton('Обезвоживание');assert.equal(await count('node'),3);assert.equal(await evaluate('history.state.custom'),'preserved');
 await clickButton('Сбросить');assert.equal(await count('node'),12);assert.equal(await evaluate('location.search'),'?campaign=test');
 assert.deepEqual(errors,[],'Catalog console errors');
 console.log(`::notice title=Published catalog verified::Release ${version}: all three catalogue routes and scoped resources return HTTP 200, 32 original WebP SHA-256 checks, ${widths.length} widths, 12/3/2/2/3/1/1 nodes, 4/3/1 lines, query normalization/reset/history state, detail Back, all three comparison columns and no document overflow passed in Chrome. ${base}/catalog/`);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
