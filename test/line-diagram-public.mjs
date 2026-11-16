// A real mouse-hover smoke check for the deployed diagram. No packages or screenshots.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3056').replace(/\/$/,'');
const url=base+'/catalog/lines/separatsiya-02/#line02-construction';
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify the published diagram hover');
const profile=await mkdtemp(join(tmpdir(),'era-line-browser-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 let port;
 for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 if(!port)throw new Error('Chrome debugging endpoint did not start');
 const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(),page=pages.find(p=>p.type==='page');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map(),exceptions=[];
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params.exceptionDetails.text);
  const request=pending.get(message.id);if(!request)return;pending.delete(message.id);clearTimeout(request.timer);
  if(message.error)request.reject(new Error(message.error.message));else request.resolve(message.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method));},15000);
  pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
 };
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Published diagram condition failed: '+expression);};
 await command('Page.enable');await command('Runtime.enable');
 await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const navigation=await command('Page.navigate',{url});if(navigation.errorText)throw new Error(navigation.errorText);
 await wait('document.readyState==="complete"&&document.querySelector("#line02-construction[data-line-callouts=vector-1][data-monitor-ready=true]")');
 const geometry=await evaluate(`(()=>{const root=document.querySelector('#line02-construction'),svg=root.querySelector('svg'),m=svg.getScreenCTM();let maximum=0;for(const pin of root.querySelectorAll('button[data-callout]')){const path=root.querySelector('[data-line-leader="'+pin.dataset.callout+'"]'),start=path.getPointAtLength(0),point=new DOMPoint(start.x,start.y).matrixTransform(m),r=pin.getBoundingClientRect();maximum=Math.max(maximum,Math.hypot(point.x-r.left-r.width/2,point.y-r.top-r.height/2));}return {pins:root.querySelectorAll('button[data-callout]').length,leaders:root.querySelectorAll('[data-line-leader]').length,maximum};})()`);
 if(geometry.pins!==28||geometry.leaders!==28||geometry.maximum>1)throw new Error('Published callout geometry is misaligned: '+JSON.stringify(geometry));
 const image=await evaluate(`(async()=>{const path=document.querySelector('#line02-construction svg image').href.baseVal,r=await fetch(path,{cache:'reload'}),buffer=await r.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',buffer);return {status:r.status,type:r.headers.get('content-type'),bytes:buffer.byteLength,sha256:[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')};})()`);
 if(image.status!==200||!image.type.includes('image/webp')||image.sha256!=='a1adfaac6f64e0b43113543ed1816f2ab63090753717bf792e1a3da646daed66')throw new Error('Published source WebP failed HTTP/SHA verification');
 await evaluate(`window.__eraDiagramClicks=0;document.querySelector('#line02-construction').addEventListener('click',()=>window.__eraDiagramClicks++);true`);
 const checked=[];
 for(const key of ['04','13','17','20','27-loading','27-unloading']){
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:2,y:2});
  await evaluate(`document.querySelector('#line02-construction button[data-callout="${key}"]').scrollIntoView({block:'center',behavior:'instant'});true`);
  await delay(120);
  const point=await evaluate(`(()=>{const r=document.querySelector('#line02-construction button[data-callout="${key}"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  await wait(`(()=>{const root=document.querySelector('#line02-construction'),pin=root.querySelector('button[data-callout="${key}"]'),tip=root.querySelector('[role=tooltip]');return !tip.hidden&&root.dataset.selectedCallout==='${key}'&&tip.querySelector('[data-tip-description]').textContent===pin.dataset.tooltipDescription;})()`);
  const tip=await evaluate(`(()=>{const r=document.querySelector('#line02-construction [role=tooltip]'),b=r.getBoundingClientRect();return {title:r.querySelector('strong').textContent,text:r.querySelector('p').textContent,inside:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight};})()`);
  if(!tip.inside)throw new Error('Published tooltip exceeds viewport: '+key);
  if(key==='27-loading'&&!tip.text.includes('Подаёт тюки сырья'))throw new Error('Loading forklift tooltip is incorrect');
  if(key==='27-unloading'&&!tip.text.includes('Забирает готовые тюки'))throw new Error('Unloading forklift tooltip is incorrect');
  checked.push({callout:key,...tip});
 }
 if(await evaluate('window.__eraDiagramClicks')!==0)throw new Error('Hover verification unexpectedly used a click');
 if(exceptions.length)throw new Error('Published diagram JavaScript errors: '+exceptions.join('; '));
 console.log(JSON.stringify({url,geometry,image,hoveredWithoutClick:checked,screenshots:false},null,2));
 console.log('::notice title=Published diagram hover verified::Real Chrome mouse hover without clicks passed for 04, 13, 17, 20, 27-loading and 27-unloading. Both forklift texts, viewport bounds, 28 full SVG leaders and source WebP SHA are verified on the public page.');
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
