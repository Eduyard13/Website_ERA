// Actual public contacts acceptance, with Chrome and no screenshots or form submissions.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3091').replace(/\/$/,'');
const url=base+'/contacts/';
const response=await fetch(url,{cache:'no-store'});assert.equal(response.status,200);
const html=await response.text();
assert.ok(html.includes('От вашей задачи — к нашему решению.'));
assert.ok(html.includes('North 2nd Ring Road, 318, 215600.')&&html.includes('张家港市经济技术开发区北二环路318号'));
const version=html.match(/contact-premium\.css\?v=([\d.]+)/)?.[1];assert.ok(version);
assert.ok(html.includes('contact-maps.js?v='+version));assert.ok(!html.includes('/preview-only.js?'));
assert.equal((html.match(/data-request-form(?=[\s>])/g)||[]).length,1);
assert.equal((html.match(/<iframe\b/g)||[]).length,1,'Google iframe is present without JavaScript');
assert.ok(!html.includes('data-map-load'));
for(const [,href] of html.matchAll(/<a[^>]*href="([^"]+)"/g))if(href.startsWith('https:'))assert.ok(!/(^|\.)(beierpm|beierrecycling|beiermachinery)\.com$/.test(new URL(href).hostname));
for(const asset of ['contact-premium.css','contact-maps.js','assets/brands/vk-video.svg','assets/contacts/beier-zhangjiagang-factory.webp','assets/contacts/beier-zhangjiagang-factory-768.webp']){
 const r=await fetch(base+'/'+asset+'?v='+version,{cache:'no-store'});assert.equal(r.status,200,asset);
 assert.ok(!r.headers.get('content-type')?.includes('text/html'),asset+' MIME');
 if(asset.endsWith('.webp')){const b=new Uint8Array(await r.arrayBuffer());assert.equal(new TextDecoder().decode(b.slice(0,4)),'RIFF');assert.equal(new TextDecoder().decode(b.slice(8,12)),'WEBP');}
 if(asset.endsWith('.svg')){const svg=await r.text();assert.ok(svg.includes('#0077FF')&&svg.includes('#FF2B42')&&svg.includes('viewBox="0 0 72 72"'));}
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);assert.ok(binary,'Chrome required');
const profile=await mkdtemp(join(tmpdir(),'era-contact-browser-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 let port;for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port);const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);pending.delete(m.id);}}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error(method+' timeout'));},25000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const waitFor=async expression=>{for(let i=0;i<80;i++){if(await evaluate(expression))return;await delay(150);}throw Error('Browser condition: '+expression);};
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 // Provider availability is documented separately. These checks exercise the site's blocked-map behavior.
 await call('Network.setBlockedURLs',{urls:[base+'/api/request.php',...(process.env.ERA_VERIFY_MAP_PROVIDERS==='1'?[]:['https://www.google.com/maps/*','https://yandex.com/map-widget/*'])]});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await call('Page.navigate',{url});await waitFor('document.querySelector("[data-request-ready=true]")&&document.querySelector(".page-progress-rail a")');
 await evaluate('(async()=>{await Promise.all([...document.querySelectorAll("main img")].map(i=>{i.loading="eager";return i.decode().catch(()=>{});}));})()');
 for(const width of [320,360,375,390,768,1024,1280,1440,1920]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:false});await delay(160);
  const result=await evaluate(`(()=>({overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('main h1').length,anchors:document.querySelectorAll('.page-progress-rail a').length,photos:[...document.querySelectorAll('main img')].every(i=>i.complete&&i.naturalWidth>0),panels:[...document.querySelectorAll('.cp-direct,.cp-form-card,.cp-map,.cp-production-address,.cp-video-channel')].every(e=>e.scrollWidth<=e.clientWidth+1),fields:[...document.querySelectorAll('.cp-form-card input:not([type=hidden]):not([type=file]),.cp-form-card textarea')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)}))()`);
  assert.deepEqual(result,{overflow:false,h1:1,anchors:5,photos:true,panels:true,fields:true},'Contacts layout '+width);
 }
 assert.equal(await evaluate('document.querySelectorAll(".cp-map iframe").length'),1);
 const crop=await evaluate("(()=>{const p=document.querySelector('.cp-production-image'),m=document.querySelector('.cp-map'),i=p.querySelector('img'),f=p.querySelector('.cp-production-frame');return {fill:getComputedStyle(i).objectFit==='cover'&&Math.abs(i.getBoundingClientRect().height-f.getBoundingClientRect().height)<1,equal:Math.abs(p.getBoundingClientRect().height-m.getBoundingClientRect().height)<1,fullResolution:i.currentSrc.endsWith('/assets/contacts/beier-zhangjiagang-factory.webp'),sizes:(i.outerHTML.match(/\\bsizes=/g)||[]).length}})()");
 assert.deepEqual(crop,{fill:true,equal:true,fullResolution:true,sizes:1},'Full desktop cover and one sizes attribute');
 if(process.env.ERA_VERIFY_MAP_PROVIDERS==='1'){
  for(const provider of ['google','yandex']){
   await evaluate("document.querySelector('[data-map-select="+provider+"]').click();document.querySelector('.cp-map iframe').scrollIntoView({block:'center'})");
   let snapshot,session;
   const prefix=provider==='google'?'https://www.google.com/maps/embed':'https://yandex.com/map-widget/v1/';
   for(let i=0;i<80;i++){
    try{
     if(!session){
      const targets=await call('Target.getTargets');const target=targets.targetInfos.find(t=>t.type==='iframe'&&t.url.startsWith(prefix));
      if(target)session=(await call('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;
     }
     if(session){
      const r=await call('Runtime.evaluate',{expression:"({images:[...document.images].filter(i=>i.complete&&i.naturalWidth>16).length,google:document.documentElement.innerHTML.includes('14308622914688450133'),markers:document.querySelectorAll('.map-placemark').length})",returnByValue:true},session);
      snapshot=r.result?.value;
      if(snapshot?.images>=3&&(provider==='google'?snapshot.google:snapshot.markers>0))break;
     }
    }catch{session=null;}
    await delay(300);
   }
   assert.ok(snapshot?.images>=3&&(provider==='google'?snapshot.google:snapshot.markers>0),'Real '+provider+' map tiles and marker: '+JSON.stringify(snapshot));
   console.log('::notice title=Native '+provider+' map verified::Actual provider images and '+(provider==='google'?'the official BEIER object':'a visible custom placemark')+' rendered on '+url);
  }
 }
 for(let i=0;i<3;i++){
  await evaluate('document.querySelector("[data-map-select=yandex]").click()');
  assert.equal(await evaluate('document.querySelector("[data-map-select=yandex]").getAttribute("aria-pressed")'),'true');
  const target=new URL(await evaluate('document.querySelector("[data-map-external=yandex]").href'));
  assert.ok(target.searchParams.has('pt')&&!target.searchParams.has('text'));
  assert.equal(await evaluate('document.querySelectorAll(".cp-map iframe").length'),1);
  assert.ok((await evaluate('document.querySelector(".cp-map iframe").src')).startsWith('https://yandex.com/map-widget/v1/'));
  await evaluate('document.querySelector("[data-map-select=google]").click()');
  assert.equal(await evaluate('document.querySelectorAll(".cp-map iframe").length'),1);
 }
 await evaluate('document.querySelector(".cp-map iframe").dispatchEvent(new Event("error"))');
 assert.equal(await evaluate('document.querySelectorAll(".cp-map iframe").length'),0);
 assert.ok((await evaluate('document.querySelector("#contact-map-google [data-map-status]").textContent')).includes('Карта недоступна'));
 assert.equal(await evaluate('document.querySelector("[data-map-external=google]").href'),'https://www.google.com/maps?cid=14308622914688450133');
 assert.equal(await evaluate('document.querySelector(".cp-video-channel[data-video-channel=vkVideo]").tagName'),'DIV');
 assert.equal(await evaluate("[...document.images].filter(i=>i.src.endsWith('/assets/brands/vk-video.svg')).length"),2);
 await call('Page.navigate',{url:url+'?topic='+encodeURIComponent('Подбор линии <проект>')+'#project-form'});
 await waitFor('document.querySelector("[data-contact-optional]")?.open');
 assert.equal(await evaluate('document.querySelector("[data-request-topic]").value'),'Подбор линии <проект>');
 assert.equal(await evaluate('document.querySelectorAll("[data-request-form] script").length'),0);
 assert.deepEqual(errors,[]);
 console.log('::notice title=Published contacts verified::Version '+version+', 9 responsive widths, BEIER photo and official address, original VK Video mark, optional topic, automatic Google iframe and verified Yandex pin, repeated provider switching, blocked-map message and live external links passed. No forms submitted. '+url);
}finally{socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});}
