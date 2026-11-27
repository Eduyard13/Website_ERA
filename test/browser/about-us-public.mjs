// Smoke-check the actual published company page in Chrome, without extra packages or screenshots.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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
assert.match(html,/about-us\.css\?v=[a-f0-9]{12}/,'Published company release');
const hero=html.match(/<section[^>]*id="about-us-intro"[\s\S]*?<\/section>/)[0];
assert.doesNotMatch(hero,/BEIER|1998|150\+|500\+|55 000/);
assert.ok(html.includes('Венрай (Venray)')&&html.includes('Челябинск'));
assert.doesNotMatch(html,/Фотография будет добавлена|Имя и фамилия|Предварительное название роли/);
for(const asset of ['assets/css/pages/about/about-us.css','assets/js/components/media-viewer.js','assets/about/projects/chelyabinsk-2021.webp','assets/about/projects/chelyabinsk-2021-768.webp']){
 const resource=await fetch(base+'/'+asset,{cache:'no-store'});assert.equal(resource.status,200,asset);
 assert.ok(!resource.headers.get('content-type')?.includes('text/html'),asset+' MIME');
 if(asset.endsWith('.webp')){const bytes=new Uint8Array(await resource.arrayBuffer());assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(new TextDecoder().decode(bytes.slice(8,12)),'WEBP');}
}
const portraitAssets=[{"destination": "public/assets/about/team/01-engineering.webp", "sha256": "5e3081f2701446a476af4b030724e6dfd9ed19457a4e3526aa4479657ac3726b"}, {"destination": "public/assets/about/team/01-engineering-600.webp", "sha256": "f97635abcaa56e4e9acf6e2f0aa325eee817fedb6aa5de9450866eef9a7be368"}, {"destination": "public/assets/about/team/02-commercial.webp", "sha256": "555f3ef3120334a7c26099cbe52346a9ff7bd63d4added6450769b4b2358790e"}, {"destination": "public/assets/about/team/02-commercial-600.webp", "sha256": "0595627d0cfd9847cd5488923fe3700096b47e830efb2cdefd0315b00e2713f6"}, {"destination": "public/assets/about/team/03-integration.webp", "sha256": "924acd6fdc7d0b4804c7f03d8db11ef2811d28ca6bddf485d1fa1c5abfec494b"}, {"destination": "public/assets/about/team/03-integration-600.webp", "sha256": "cf0ea86f24e9a00b1cd5091f31013b3bb11376964d29bcc25665e89deb2cf521"}];
for(const asset of portraitAssets){
 const r=await fetch(base+'/'+asset.destination.replace('public/',''),{cache:'no-store'});assert.equal(r.status,200,asset.destination);assert.equal(r.headers.get('content-type')?.split(';')[0],'image/webp');
 assert.equal(createHash('sha256').update(new Uint8Array(await r.arrayBuffer())).digest('hex'),asset.sha256);
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
 const snapshot=()=>evaluate(`(()=>{const r=document.querySelector('.about-us-page');return {overflow:document.documentElement.scrollWidth>innerWidth,sections:[...r.querySelectorAll('section')].map(s=>s.id),facts:r.querySelectorAll('.au-company-facts>div').length,profiles:r.querySelectorAll('[data-team-member]').length,ready:r.querySelectorAll('[data-profile-state="ready"]').length,portraitImages:r.querySelectorAll('#team .au-portrait img').length,projectGrids:r.querySelectorAll('.au-projects-grid').length,projectBoxes:[...r.querySelectorAll('.au-projects-grid>.au-project')].map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,trailingSpace:b.bottom-e.lastElementChild.getBoundingClientRect().bottom};}),teamBoxes:[...r.querySelectorAll('.au-team-card')].map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};}),previewRatios:[...r.querySelectorAll('.au-project-gallery>.au-gallery-item:first-child img')].map(i=>{const b=i.getBoundingClientRect();return Math.abs(b.width/b.height-i.naturalWidth/i.naturalHeight);}),cards:r.querySelectorAll('.au-engineering-card').length,projects:r.querySelectorAll('.au-project').length,rail:document.querySelectorAll('.page-progress-rail a').length,brokenImages:[...r.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth||!i.alt).map(i=>i.src)}})()`);
 await command('Page.enable');await command('Runtime.enable');
 for(const width of [320,375,390,600,768,1024,1200,1280,1440,1920]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url});
  await wait(`document.readyState==='complete'&&document.querySelector('.page-progress-rail a')`);
  await evaluate(`Promise.all([...document.querySelectorAll('.about-us-page img')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))`);
  const state=await snapshot();assert.ok(!state.overflow,'Responsive overflow at '+width);
  assert.deepEqual(state.sections,sections);assert.equal(state.facts,3);assert.equal(state.profiles,3);assert.equal(state.ready,3);assert.equal(state.portraitImages,3);assert.equal(state.projectGrids,1);assert.equal(state.cards,4);assert.equal(state.projects,2);assert.equal(state.rail,8);assert.deepEqual(state.brokenImages,[]);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('.au-production-gallery img')).every(i=>getComputedStyle(i).objectFit==='cover'&&Math.abs(i.getBoundingClientRect().height-i.closest('.media-open').getBoundingClientRect().height)<1)`),true,'Production previews fill their frames');
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('#team .au-portrait')).every(p=>Math.abs(p.getBoundingClientRect().width/p.getBoundingClientRect().height-.8)<.005)`),true,'Equal portrait ratios');
  const [first,second]=state.projectBoxes;assert.equal(state.projectBoxes.length,2);
  assert.ok(Math.abs(first.width-second.width)<1,'Equal project widths');
  if(width>=1024){assert.ok(Math.abs(first.y-second.y)<1&&first.x<second.x,'Two project columns');}
  else{assert.ok(Math.abs(first.x-second.x)<1&&second.y>=first.y+first.height,'Stacked project order');}
  assert.ok(state.projectBoxes.every(b=>b.trailingSpace<=30),'No stretched project cards');
  assert.ok(state.previewRatios.every(d=>d<.02),'Natural main photograph proportions');
  assert.equal(state.teamBoxes.length,3);assert.ok(state.teamBoxes.every(b=>b.width>0&&b.height>0));
  if(width>=1200){
   assert.ok(state.teamBoxes.every(b=>Math.abs(b.y-state.teamBoxes[0].y)<1),'Three team columns');
   assert.ok(state.teamBoxes.every(b=>Math.abs(b.width-state.teamBoxes[0].width)<1&&Math.abs(b.height-state.teamBoxes[0].height)<1),'Equal team cards');
  }else for(let i=1;i<state.teamBoxes.length;i++)assert.ok(state.teamBoxes[i].y>=state.teamBoxes[i-1].y+state.teamBoxes[i-1].height,'Stacked horizontal profiles');
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('#team .au-team-card')).every(c=>{const p=c.querySelector('.au-portrait').getBoundingClientRect(),t=c.querySelector('.au-team-copy').getBoundingClientRect();return p.width<=150&&p.right<t.left&&Math.abs(p.top-t.top)<1&&c.scrollWidth<=c.clientWidth&&Array.from(c.querySelectorAll('h3,p')).every(e=>e.scrollWidth<=e.clientWidth+1);})`),true,'Compact photographs on the left and uncut text on the right');
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('#team img')).every(i=>i.getAttribute('sizes')==='(max-width: 479px) 76px, (max-width: 767px) 100px, (max-width: 1199px) 128px, clamp(100px, 8.3vw, 128px)')`),true,'Responsive team sizes');
 }
 const details=await evaluate(`(()=>{const r=document.querySelector('.about-us-page'),p=r.querySelector('#production-base');return {headings:[...r.querySelectorAll('.au-team-card h3')].map(e=>e.textContent),teamOrder:[...r.querySelectorAll('[data-team-member]')].map(e=>e.dataset.teamMember),teamPhotos:[...r.querySelectorAll('#team .au-portrait img')].map(i=>i.getAttribute('src').split('/').at(-1)),locations:[...r.querySelectorAll('.au-team-location')].map(e=>e.textContent),externalLinks:[...p.querySelectorAll('a[href^="https:"]')].map(e=>e.href),projectCounts:[...r.querySelectorAll('.au-project-gallery')].map(g=>g.querySelectorAll('[data-media]').length),projectMediaBeforeCopy:[...r.querySelectorAll('.au-project')].every(c=>!!(c.querySelector('.au-project-gallery').compareDocumentPosition(c.querySelector('.au-project-copy'))&Node.DOCUMENT_POSITION_FOLLOWING)),inlineFrames:r.querySelectorAll('iframe').length};})()`);
 assert.deepEqual(details.headings,['Инженерно-технологическое направление','Коммерческое развитие и партнерство','Производственная интеграция']);
 assert.deepEqual(details.teamOrder,['engineering','development','coordination']);assert.deepEqual(details.teamPhotos,['01-engineering.webp','02-commercial.webp','03-integration.webp']);
 assert.deepEqual(details.locations,['Производственная площадка · Китай','Внедрение проектов · Россия']);assert.deepEqual(details.externalLinks,['https://en.beierpm.com/vr/']);
 assert.deepEqual(details.projectCounts,[3,1]);assert.equal(details.projectMediaBeforeCopy,true);assert.equal(details.inlineFrames,0);
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
 if(process.env.ERA_VERIFY_FACTORY_TOUR==='1'){
  const tour=await fetch('https://en.beierpm.com/vr/',{signal:AbortSignal.timeout(25000)});assert.equal(tour.status,200,'Manufacturer virtual tour page');
  assert.ok((await tour.text()).includes('720yun.com'),'Official tour contains its panorama provider');
  await command('Runtime.evaluate',{expression:"document.querySelector('.au-tour-link').click()",userGesture:true});let target;
  for(let i=0;i<75;i++){const all=await command('Target.getTargets');target=all.targetInfos.find(t=>t.type==='page'&&t.url.startsWith('https://en.beierpm.com/vr/'));if(target)break;await delay(200);}
  assert.ok(target,'Virtual tour opens in a separate tab');await command('Target.closeTarget',{targetId:target.targetId});
  console.log('::notice title=Virtual tour link verified::Official VR URL returned HTTP 200, contains the panorama provider and opened in its own browser tab.');
 }
 assert.deepEqual(errors,[],'Published company browser errors');
 console.log('::notice title=Published company page verified::ERA-only hero, one BEIER virtual tour, full production collage, three Venray views, one Chelyabinsk photo and three approved direction portraits, natural project photos, 15 complete images and 6 verified portrait WebP assets, 8 navigation anchors, 10 responsive widths, compact horizontal profiles, isolated galleries, single-photo controls, Escape, focus restoration and project CTA passed on the actual public site. '+url);
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
