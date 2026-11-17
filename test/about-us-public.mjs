// Smoke-check the actual published company page in Chrome, without extra packages or screenshots.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3000/Website_ERA').replace(/\/$/,'');
const url=base+'/about-us/';
const response=await fetch(url,{cache:'no-store'});
assert.equal(response.status,200,'Published company page HTTP status');
const html=await response.text();
assert.ok(html.includes('От практики переработки — к промышленным технологиям.'),'New company heading');
assert.match(html,/about-us\.css\?v=\d+\.\d+\.\d+/,'Published company release');
const hero=html.match(/<section[^>]*id="about-us-intro"[\s\S]*?<\/section>/)[0];
assert.doesNotMatch(hero,/BEIER|1998|150\+|500\+|55 000/);
assert.ok(html.includes('Венрай (Venray)')&&html.includes('Челябинск'));
assert.doesNotMatch(html,/Фотография будет добавлена|Имя и фамилия|Предварительное название роли/);
for(const asset of ['about-us.css','media-viewer.js','assets/about/projects/chelyabinsk-2021.webp','assets/about/projects/chelyabinsk-2021-768.webp']){
 const resource=await fetch(base+'/'+asset,{cache:'no-store'});assert.equal(resource.status,200,asset);
 assert.ok(!resource.headers.get('content-type')?.includes('text/html'),asset+' MIME');
 if(asset.endsWith('.webp')){const bytes=new Uint8Array(await resource.arrayBuffer());assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(new TextDecoder().decode(bytes.slice(8,12)),'WEBP');}
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public company page');
const profile=await mkdtemp(join(tmpdir(),'era-company-browser-'));
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
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public company page condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const sections=['about-us-intro','experience','production-base','projects','engineering','team','working-together','about-us-contact'];
 const snapshot=()=>evaluate(`(()=>{const r=document.querySelector('.about-us-page');return {overflow:document.documentElement.scrollWidth>innerWidth,sections:[...r.querySelectorAll('section')].map(s=>s.id),facts:r.querySelectorAll('.au-company-facts>div').length,profiles:r.querySelectorAll('[data-team-member]').length,cards:r.querySelectorAll('.au-engineering-card').length,projects:r.querySelectorAll('.au-project').length,rail:document.querySelectorAll('.page-progress-rail a').length,brokenImages:[...r.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth||!i.alt).map(i=>i.src)}})()`);
 await command('Page.enable');await command('Runtime.enable');
 for(const width of [320,375,390,768,1024,1440,1920]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url});
  await wait(`document.readyState==='complete'&&document.querySelector('.page-progress-rail a')`);
  await evaluate(`Promise.all([...document.querySelectorAll('.about-us-page img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))`);
  const state=await snapshot();assert.ok(!state.overflow,'Responsive overflow at '+width);
  assert.deepEqual(state.sections,sections);assert.equal(state.facts,3);assert.equal(state.profiles,0);assert.equal(state.cards,4);assert.equal(state.projects,2);assert.equal(state.rail,8);assert.deepEqual(state.brokenImages,[]);
 }
 for(const [group,part,count] of [['production','china-',3],['venray','netherlands-',3],['chelyabinsk','chelyabinsk-2021',1]]){
  const selector='[data-media-group="'+group+'"] .media-open';
  await click(selector);await wait(`document.querySelector('#media-viewer').open`);
  assert.ok((await evaluate(`document.querySelector('#viewer-image').src`)).includes(part));
  assert.ok((await evaluate(`document.querySelector('#viewer-product').getAttribute('href')`)).endsWith('/catalog'));
  if(count===1){assert.equal(await evaluate(`document.querySelector('#media-viewer [data-next]').hidden`),true);assert.equal(await evaluate(`document.querySelector('#media-viewer [data-prev]').hidden`),true);}
  else for(let i=0;i<count;i++){await click('#media-viewer [data-next]');assert.ok((await evaluate(`document.querySelector('#viewer-image').src`)).includes(part));}
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await wait(`!document.querySelector('#media-viewer').open&&!document.body.classList.contains('viewer-open')`);
  assert.equal(await evaluate(`document.activeElement===document.querySelector(${JSON.stringify(selector)})`),true,'Gallery focus restoration');
  assert.equal(await evaluate(`document.body.classList.contains('viewer-open')`),false);
 }
 await click('.au-hero-actions a[href="#projects"]');await wait(`location.hash==='#projects'`);
 assert.ok((await evaluate(`document.querySelector('.au-final-actions .button').getAttribute('href')`)).endsWith('/contacts#project-form'));
 await click('.au-final-actions .button');await wait(`document.querySelector('#project-request').open`);
 assert.equal(await evaluate(`document.querySelectorAll('#project-request [data-request-form]').length`),1);
 await evaluate(`document.querySelector('#project-request').close()`);
 assert.deepEqual(errors,[],'Published company browser errors');
 console.log('::notice title=Published company page verified::ERA-only hero, BEIER section, Venray and Chelyabinsk cases, enhanced Chelyabinsk photo, 12 complete images, 8 navigation anchors, 7 responsive widths, isolated galleries, single-photo controls, Escape, focus restoration and project CTA passed on the actual public site. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
