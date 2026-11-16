// A real mouse-hover smoke check for the deployed diagram. No packages or screenshots.
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3056').replace(/\/$/,'');
const scenarios=[
 {slug:'separatsiya-02',selector:'#line02-construction',count:28,sha256:'a1adfaac6f64e0b43113543ed1816f2ab63090753717bf792e1a3da646daed66',keys:['04','08','09','13','15','17','20','27-loading','27-unloading']},
 {slug:'separatsiya-01',selector:'#line01-construction',count:11,sha256:'5c1fcf25051d6fa96b2bbe9d6a8a1e096a698bdc73c0e62ecd34b3abac243ab3',keys:['01','02','03','04','05','06','07','08','09','10','11']},
];
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
 for(const scenario of scenarios){
 const {selector}=scenario,url=base+'/catalog/lines/'+scenario.slug+'/'+selector;
 const navigation=await command('Page.navigate',{url});if(navigation.errorText)throw new Error(navigation.errorText);
 await wait(`document.readyState==="complete"&&document.querySelector("${selector}[data-line-callouts=vector-1][data-monitor-ready=true]")`);
 const presentation=await evaluate(String.raw`(async()=>{const root=document.querySelector('${selector}'),canvas=root.querySelector('.diagram-canvas'),css=[...document.querySelectorAll('link[rel=stylesheet]')].find(e=>e.href.includes('/line-monitor.css?')),script=[...document.scripts].find(e=>e.src.includes('/line-monitor.js?')),response=await fetch(script.src,{cache:'reload'}),source=await response.text(),helper=source.match(/from '(\.\/line-callout-layout\.mjs\?v=[^']+)'/),module=helper&&await fetch(new URL(helper[1],script.src),{cache:'reload'});return {background:getComputedStyle(canvas).backgroundColor,grid:getComputedStyle(canvas).backgroundImage,css:css.href,script:script.src,helper:helper?.[1],helperStatus:module?.status,helperType:module?.headers.get('content-type')};})()`);
 const revision=new URL(presentation.css).searchParams.get('v');
 if(presentation.background!=='rgb(228, 233, 237)'||!presentation.grid.includes('linear-gradient')||!revision?.endsWith('-callouts-3')||new URL(presentation.script).searchParams.get('v')!==revision||!presentation.helper?.endsWith('v='+revision)||presentation.helperStatus!==200||!presentation.helperType?.includes('javascript'))throw new Error('Published titanium background or versioned module is missing: '+JSON.stringify(presentation));
 const geometry=await evaluate(`(()=>{const root=document.querySelector('${selector}'),svg=root.querySelector('svg'),m=svg.getScreenCTM();let maximum=0;for(const pin of root.querySelectorAll('button[data-callout]')){const path=root.querySelector('[data-line-leader="'+pin.dataset.callout+'"]'),start=path.getPointAtLength(0),point=new DOMPoint(start.x,start.y).matrixTransform(m),r=pin.getBoundingClientRect();maximum=Math.max(maximum,Math.hypot(point.x-r.left-r.width/2,point.y-r.top-r.height/2));}return {pins:root.querySelectorAll('button[data-callout]').length,leaders:root.querySelectorAll('[data-line-leader]').length,maximum};})()`);
 if(geometry.pins!==scenario.count||geometry.leaders!==scenario.count||geometry.maximum>1)throw new Error('Published callout geometry is misaligned: '+JSON.stringify(geometry));
 const image=await evaluate(`(async()=>{const path=document.querySelector('${selector} svg image').href.baseVal,r=await fetch(path,{cache:'reload'}),buffer=await r.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',buffer);return {status:r.status,type:r.headers.get('content-type'),bytes:buffer.byteLength,sha256:[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')};})()`);
 if(image.status!==200||!image.type.includes('image/webp')||image.sha256!==scenario.sha256)throw new Error('Published source WebP failed HTTP/SHA verification');
 if(scenario.slug==='separatsiya-01'){
  const hero=await evaluate(`(async()=>{const figure=document.querySelector('[data-hero-finish=titanium-gallery-mini]'),img=figure.querySelector('img');await img.decode();const r=await fetch(img.src,{cache:'reload'}),bytes=await r.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',bytes);return {status:r.status,type:r.headers.get('content-type'),width:img.getAttribute('width'),height:img.getAttribute('height'),product:figure.dataset.product,sha256:[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')};})()`);
  if(hero.status!==200||!hero.type.includes('image/webp')||hero.width!=='1500'||hero.height!=='1010'||!hero.product.endsWith('/catalog/lines/separatsiya-01')||hero.sha256!=='74adba4fd4eb002e6e0afcff47738ec9a3b77b2acb209ba5f7a46f3d11392191')throw new Error('Published mini-line hero is incorrect: '+JSON.stringify(hero));
 }
 await evaluate(`window.__eraDiagramClicks=0;document.querySelector('${selector}').addEventListener('click',()=>window.__eraDiagramClicks++);true`);
 const checked=[];
 for(const key of scenario.keys){
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:2,y:2});
  await evaluate(`document.querySelector('${selector} button[data-callout="${key}"]').scrollIntoView({block:'center',behavior:'instant'});true`);
  await delay(120);
  const point=await evaluate(`(()=>{const r=document.querySelector('${selector} button[data-callout="${key}"]').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
  await wait(`(()=>{const root=document.querySelector('${selector}'),pin=root.querySelector('button[data-callout="${key}"]'),tip=root.querySelector('[role=tooltip]');return !tip.hidden&&root.dataset.selectedCallout==='${key}'&&tip.querySelector('[data-tip-description]').textContent===pin.dataset.tooltipDescription;})()`);
  const tip=await evaluate(`(()=>{
   const root=document.querySelector('${selector}'),r=root.querySelector('[role=tooltip]'),b=r.getBoundingClientRect(),drawing=root.querySelector('[data-diagram-viewport]'),panel=root.querySelector('.diagram-details').getBoundingClientRect();
   const overlaps=a=>b.left<a.right&&b.right>a.left&&b.top<a.bottom&&b.bottom>a.top;
   let clear=true;
   if(r.dataset.placement==='dock')clear=!overlaps(drawing.getBoundingClientRect())&&b.left>=panel.left&&b.right<=panel.right&&b.top>=panel.top&&b.bottom<=panel.bottom;
   else if(r.dataset.placement==='floating'){
    const image=root.querySelector('svg image').getBoundingClientRect(),[cw,ch,encoded]=root.dataset.calloutMask.split(','),columns=Number(cw),rows=Number(ch),bits=atob(encoded);
    const x0=Math.max(0,Math.floor((b.left-image.left)/image.width*columns)),x1=Math.min(columns,Math.ceil((b.right-image.left)/image.width*columns)),y0=Math.max(0,Math.floor((b.top-image.top)/image.height*rows)),y1=Math.min(rows,Math.ceil((b.bottom-image.top)/image.height*rows));
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*columns+x;if((bits.charCodeAt(i>>3)>>(i&7))&1)clear=false;}
    if([...root.querySelectorAll('button[data-callout]')].some(pin=>overlaps(pin.getBoundingClientRect())))clear=false;
    for(const guide of root.querySelectorAll('[data-active=true] [data-line-leader]')){const length=guide.getTotalLength(),matrix=guide.getScreenCTM();for(let i=0;i<=100;i++){const q=guide.getPointAtLength(length*i/100),p=new DOMPoint(q.x,q.y).matrixTransform(matrix);if(p.x>=b.left&&p.x<=b.right&&p.y>=b.top&&p.y<=b.bottom)clear=false;}}
   }else clear=false;
   return {title:r.querySelector('strong').textContent,text:r.querySelector('p').textContent,placement:r.dataset.placement,clear,inside:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight};
  })()`);
  if(!tip.clear||(tip.placement==='floating'&&!tip.inside))throw new Error('Published tooltip obscures equipment, callouts or leaders: '+key+' '+JSON.stringify(tip));
  if(key==='27-loading'&&!tip.text.includes('Подаёт тюки сырья'))throw new Error('Loading forklift tooltip is incorrect');
  if(key==='27-unloading'&&!tip.text.includes('Забирает готовые тюки'))throw new Error('Unloading forklift tooltip is incorrect');
  checked.push({callout:key,...tip});
 }
 if(await evaluate('window.__eraDiagramClicks')!==0)throw new Error('Hover verification unexpectedly used a click');
 if(exceptions.length)throw new Error('Published diagram JavaScript errors: '+exceptions.join('; '));
 console.log(JSON.stringify({url,geometry,image,presentation,hoveredWithoutClick:checked,screenshots:false},null,2));
 if(scenario.slug==='separatsiya-02')console.log('::notice title=Published diagram hover verified::Real Chrome mouse hover without clicks passed for 04, 08, 09, 13, 15, 17, 20, 27-loading and 27-unloading. Titanium background, callouts-3 CSS/JS, clear tooltip placement, both forklift texts, 28 full SVG leaders and source WebP SHA are verified on the public page.');
 console.log('::notice title=Published '+scenario.slug+' verified::'+scenario.count+' native callouts, clear hover tooltips, callouts-3 assets and the source WebP SHA verified on '+url);
 }
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
