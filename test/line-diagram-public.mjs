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
const chrome=spawn(binary,['--headless=new','--window-size=1440,1000','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
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
 await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const scenario of scenarios){
 const {selector}=scenario,url=base+'/catalog/lines/'+scenario.slug+'/'+selector;
 const navigation=await command('Page.navigate',{url});if(navigation.errorText)throw new Error(navigation.errorText);
 await wait(`document.readyState==="complete"&&document.querySelector("${selector}[data-line-callouts=vector-1][data-monitor-ready=true]")`);
 await evaluate('document.fonts.ready.then(()=>true)');
 const presentation=await evaluate(String.raw`(async()=>{const root=document.querySelector('${selector}'),canvas=root.querySelector('.diagram-canvas'),css=[...document.querySelectorAll('link[rel=stylesheet]')].find(e=>e.href.includes('/line-monitor.css?')),architecture=[...document.querySelectorAll('link[rel=stylesheet]')].find(e=>e.href.includes('/dry-architecture.css?')),script=[...document.scripts].find(e=>e.src.includes('/line-monitor.js?')),response=await fetch(script.src,{cache:'reload'}),source=await response.text(),helper=source.match(/from '(\.\/line-callout-layout\.mjs\?v=[^']+)'/),module=helper&&await fetch(new URL(helper[1],script.src),{cache:'reload'});return {background:getComputedStyle(canvas).backgroundColor,grid:getComputedStyle(canvas).backgroundImage,css:css.href,architecture:architecture?.href,script:script.src,helper:helper?.[1],helperStatus:module?.status,helperType:module?.headers.get('content-type'),navigation:root.querySelectorAll('[data-architecture-part]').length};})()`);
 const revision=new URL(presentation.css).searchParams.get('v');
 if(presentation.background!=='rgb(231, 239, 248)'||!presentation.grid.includes('engineering-grid-02.svg')||!presentation.architecture||!revision?.endsWith('-callouts-3')||!new URL(presentation.script).searchParams.get('v')||!presentation.helper?.endsWith('v='+revision)||presentation.helperStatus!==200||!presentation.helperType?.includes('javascript')||presentation.navigation!==(scenario.slug==='separatsiya-01'?11:27))throw new Error('Published Engineering Grid 02 or synchronized navigator missing: '+JSON.stringify(presentation));
 const geometry=await evaluate(`(()=>{const root=document.querySelector('${selector}'),svg=root.querySelector('svg'),m=svg.getScreenCTM();let maximum=0;for(const pin of root.querySelectorAll('button[data-callout]')){const path=root.querySelector('[data-line-leader="'+pin.dataset.callout+'"]'),start=path.getPointAtLength(0),point=new DOMPoint(start.x,start.y).matrixTransform(m),r=pin.getBoundingClientRect();maximum=Math.max(maximum,Math.hypot(point.x-r.left-r.width/2,point.y-r.top-r.height/2));}return {pins:root.querySelectorAll('button[data-callout]').length,leaders:root.querySelectorAll('[data-line-leader]').length,maximum};})()`);
 if(geometry.pins!==scenario.count||geometry.leaders!==scenario.count||geometry.maximum>1)throw new Error('Published callout geometry is misaligned: '+JSON.stringify(geometry));
 const image=await evaluate(`(async()=>{const path=document.querySelector('${selector} svg image').href.baseVal,r=await fetch(path,{cache:'reload'}),buffer=await r.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',buffer);return {status:r.status,type:r.headers.get('content-type'),bytes:buffer.byteLength,sha256:[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')};})()`);
 if(image.status!==200||!image.type.includes('image/webp')||image.sha256!==scenario.sha256)throw new Error('Published source WebP failed HTTP/SHA verification');
 if(scenario.slug==='separatsiya-02'){
  await wait(`document.querySelector('.pro-flow-grid')?.dataset.proFlowReady==='true'`);
  const result=await evaluate(`(()=>{const p=document.querySelector('#process'),map=p.querySelector('[data-pro-process-map]'),nodes=[...map.querySelectorAll('[data-pro-flow-node]')],heights=[...p.querySelectorAll('.base-process-stages>li')].map(x=>x.getBoundingClientRect().height);return {visible:map.getBoundingClientRect().height>0,nodes:nodes.length,press:nodes.filter(x=>x.dataset.proFlowNode==='press').length,outcomes:map.querySelectorAll('[data-pro-flow-outcome]').length,old:p.querySelectorAll('details,img').length,route:map.querySelectorAll('[data-pro-route]').length,equal:Math.max(...heights)-Math.min(...heights)<1.5,fit:map.scrollWidth<=map.clientWidth+1,edges:getComputedStyle(map.querySelector('.pro-flow-edges')).display};})()`);
  if(!result.visible||result.nodes!==12||result.press!==1||result.outcomes!==3||result.old||result.route!==16||!result.equal||!result.fit||result.edges==='none')throw new Error('PRO native process validation failed '+JSON.stringify(result));
  // Test rendered text runs, not just the outer map's dimensions. No clipping is accepted.
  for(const width of [1640,1440,1366,1280,1024,768,560,390,320]){
   await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
   await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
   const layout=await evaluate(`(()=>{const p=document.querySelector('#process'),map=p.querySelector('[data-pro-process-map]'),cards=[...map.querySelectorAll('[data-pro-flow-node],[data-pro-flow-outcome]')],errors=[];for(const card of cards){const outer=card.getBoundingClientRect(),key=card.dataset.proFlowNode||card.dataset.proFlowOutcome;for(const el of card.querySelectorAll('h4,p,span,.base-process-icon')){const rect=el.getBoundingClientRect();if(rect.left<outer.left-1||rect.right>outer.right+1||rect.top<outer.top-1||rect.bottom>outer.bottom+1)errors.push(key+': element '+el.tagName);const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){if(!walk.currentNode.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(walk.currentNode);for(const r of range.getClientRects()){if(r.left<outer.left+2||r.right>outer.right-2||r.top<outer.top+2||r.bottom>outer.bottom-2)errors.push(key+': '+walk.currentNode.textContent.slice(0,60));}}}}const tiles=cards.filter(card=>card.classList.contains('pro-flow-tile'));const bottomGaps=tiles.map(card=>Math.round(card.getBoundingClientRect().bottom-card.querySelector('p').getBoundingClientRect().bottom));const grid=map.querySelector('.pro-flow-grid');return {errors,bottomGaps,ready:grid.dataset.proFlowReady,fit:map.scrollWidth<=map.clientWidth+1,title:p.querySelectorAll('.base-process-stages h3')[2].textContent,correct:map.textContent.includes('Вакуумный высос из бокса')&&!p.textContent.toLowerCase().includes('отсос'),icon:map.querySelector('.pro-flow-prep .base-process-icon').getBoundingClientRect().width};})()`);
   if(layout.errors.length||!layout.fit||layout.title!=='Закрытый сортировочный бокс'||!layout.correct||layout.icon<45||layout.bottomGaps.some(g=>g<3||g>22)||(width>=1320&&layout.ready!=='true'))throw new Error('PRO text overflow, excess gap or artwork at '+width+': '+JSON.stringify(layout));
  }
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
  console.log('PRO native process: all 12 nodes, 16 connectors, terminology, artwork and individual text bounds verified at 9 widths');
 }
 if(scenario.slug==='separatsiya-01'){
  const processCheck=await evaluate(`(()=>{
   const p=document.querySelector('#process'),map=p.querySelector('[data-base-process-map]'),steps=[...map.querySelectorAll('[data-base-flow-step]')],branches=[...map.querySelectorAll('[data-base-flow-branch]')],outcomes=[...map.querySelectorAll('[data-base-flow-outcome]')];
   const stageCards=[...p.querySelectorAll('.base-process-stages>li')],heights=stageCards.map(x=>x.getBoundingClientRect().height),film=map.querySelector('.base-product-film'),filmRect=film?.getBoundingClientRect(),product=map.querySelector('.base-flow-outcome--product');return {stageTitle:stageCards[3]?.querySelector('h3')?.textContent,stageCount:stageCards.length,equalHeight:Math.max(...heights)-Math.min(...heights)<1.5,filmVisible:!!filmRect&&filmRect.width>20&&filmRect.height>20,oldStripes:getComputedStyle(product,'::after').content!=='none'&&getComputedStyle(product,'::after').content!=='normal',steps:steps.map(x=>x.dataset.baseFlowStep),branches:branches.length,outcomes:outcomes.length,visible:map.getBoundingClientRect().height>0,old:p.querySelectorAll('details,img').length,flow:map.scrollWidth<=map.clientWidth+1,desktop:steps.every((x,i)=>!i||x.getBoundingClientRect().left>steps[i-1].getBoundingClientRect().left),connectors:getComputedStyle(map.querySelector('.base-flow-connectors')).display};
  })()`);
  if(JSON.stringify(processCheck.steps)!==JSON.stringify(['01–02','03','05','06','Выход'])||processCheck.branches!==2||processCheck.outcomes!==3||!processCheck.visible||processCheck.old||!processCheck.flow||!processCheck.desktop||processCheck.connectors==='none'||processCheck.stageTitle!=='Интенсивная очистка'||processCheck.stageCount!==6||!processCheck.equalHeight||!processCheck.filmVisible||processCheck.oldStripes)throw new Error('BASE native process map failed desktop validation: '+JSON.stringify(processCheck));
  const hero=await evaluate(`(async()=>{const figure=document.querySelector('[data-line-catalog-cover]'),img=figure.querySelector('img');await img.decode();const r=await fetch(img.src,{cache:'reload'}),bytes=await r.arrayBuffer(),hash=await crypto.subtle.digest('SHA-256',bytes);return {status:r.status,type:r.headers.get('content-type'),width:img.getAttribute('width'),height:img.getAttribute('height'),product:figure.dataset.product,sha256:[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('')};})()`);
  if(hero.status!==200||!hero.type.includes('image/webp')||hero.width!=='1536'||hero.height!=='1024'||!hero.product.endsWith('/catalog/lines/separatsiya-01')||hero.sha256!=='cfd24d8922bd4cd1c4b7fdc3ab9951942aa48a62ec4278881c476f2ace27d418')throw new Error('Published mini-line hero is incorrect: '+JSON.stringify(hero));
 }
 await evaluate(`window.__eraDiagramClicks=0;document.querySelector('${selector}').addEventListener('click',()=>window.__eraDiagramClicks++);true`);
 const checked=[];
 for(const key of scenario.keys){
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:2,y:2});
  await evaluate(`document.querySelector('${selector} button[data-callout="${key}"]').scrollIntoView({block:'center',behavior:'instant'});true`);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
  const pinPoint=`(()=>{const pin=document.querySelector('${selector} button[data-callout="${key}"]'),r=pin.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return pin.contains(document.elementFromPoint(x,y))?{x,y}:null;})()`;
  await wait(pinPoint);
  const point=await evaluate(pinPoint);
  if(!point)throw new Error('Published callout moved before hover: '+key);
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
 const sidebarSelection=scenario.slug==='separatsiya-01'?'06':'11';
 const sidebar=await evaluate(`(()=>{
  const root=document.querySelector('${selector}'),row=root.querySelector('[data-architecture-part="${Number(sidebarSelection)}"]');row.click();
  return {selected:root.querySelector('[data-diagram-select]').value,activeRow:row.getAttribute('aria-pressed'),activePin:root.querySelector('button[data-part="${Number(sidebarSelection)}"]').getAttribute('aria-pressed'),detail:root.querySelector('[data-detail-number]').textContent.trim(),description:root.querySelector('[data-detail-description]').textContent};
 })()`);
 if(sidebar.selected!==String(Number(sidebarSelection))||sidebar.activeRow!=='true'||sidebar.activePin!=='true'||sidebar.detail!==sidebarSelection||!sidebar.description)throw new Error('Sidebar-to-scheme synchronization failed: '+JSON.stringify(sidebar));
 const sourceSelection=scenario.slug==='separatsiya-01'?'03':'04';
 const diagramClick=await evaluate(`(()=>{
  const root=document.querySelector('${selector}'),pin=root.querySelector('button[data-part="${Number(sourceSelection)}"]');pin.click();
  const row=root.querySelector('[data-architecture-part="${Number(sourceSelection)}"]');
  return {selected:root.querySelector('[data-diagram-select]').value,activeRow:row?.getAttribute('aria-pressed'),activePin:pin.getAttribute('aria-pressed'),detail:root.querySelector('[data-detail-number]').textContent.trim()};
 })()`);
 if(diagramClick.selected!==String(Number(sourceSelection))||diagramClick.activeRow!=='true'||diagramClick.activePin!=='true'||diagramClick.detail!==sourceSelection)throw new Error('Scheme-to-sidebar synchronization failed: '+JSON.stringify(diagramClick));
 if(exceptions.length)throw new Error('Published diagram JavaScript errors: '+exceptions.join('; '));
 console.log(JSON.stringify({url,geometry,image,presentation,hoveredWithoutClick:checked,screenshots:false},null,2));
 if(scenario.slug==='separatsiya-02')console.log('::notice title=Published diagram hover verified::Real Chrome mouse hover without clicks passed for 04, 08, 09, 13, 15, 17, 20, 27-loading and 27-unloading. Engineering Grid 02 background, synchronized sidebar, callouts-3 CSS/JS, clear tooltip placement, both forklift texts, 28 full SVG leaders and source WebP SHA are verified on the public page.');
 console.log('::notice title=Published '+scenario.slug+' verified::'+scenario.count+' native callouts, clear hover tooltips, callouts-3 assets and the source WebP SHA verified on '+url);
 }
}finally{
 socket?.close();chrome.kill('SIGTERM');await delay(250);await rm(profile,{recursive:true,force:true});
}
