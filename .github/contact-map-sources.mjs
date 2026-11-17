import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {setTimeout as delay} from 'node:timers/promises';
const profile=await mkdtemp(join(tmpdir(),'era-embed-'));
const chrome=spawn('/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});let socket;
try{
 let port;for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 let id=0;const pending=new Map();socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}});
 const call=(method,params={},sessionId)=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 await call('Page.enable');await call('Page.navigate',{url:'https://www.beierrecycling.com/contact-us/'});await delay(15000);
 await call('Runtime.evaluate',{expression:"document.querySelector('iframe')?.scrollIntoView()"});await delay(15000);
 const tree=await call('Page.getFrameTree');const report={tree,documents:[]};
 const read=async item=>{
  const frame=item.frame;try{
   const world=await call('Page.createIsolatedWorld',{frameId:frame.id,worldName:'era-source-check'});
   const evaluated=await call('Runtime.evaluate',{contextId:world.result.executionContextId,expression:"JSON.stringify({url:location.href,title:document.title,text:document.body?.innerText.slice(0,16000),images:[...document.images].slice(0,30).map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth})),canvases:document.querySelectorAll('canvas').length,html:document.documentElement.outerHTML.slice(0,400000)})",returnByValue:true});
   report.documents.push({frameId:frame.id,...JSON.parse(evaluated.result.result.value)});
  }catch(error){report.documents.push({frameId:frame.id,error:String(error)});}
  for(const child of item.childFrames||[])await read(child);
 };
 await read(tree.result.frameTree);
 const all=await call('Target.getTargets');report.targets=all.result.targetInfos;
 for(const target of all.result.targetInfos.filter(t=>t.type==='iframe'&&t.url.includes('google.com/maps/embed'))){
  const attached=await call('Target.attachToTarget',{targetId:target.targetId,flatten:true});
  const result=await call('Runtime.evaluate',{expression:"JSON.stringify({url:location.href,title:document.title,text:document.body?.innerText.slice(0,12000),canvases:document.querySelectorAll('canvas').length,images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,src:i.currentSrc})),html:document.documentElement.outerHTML.slice(0,200000)})",returnByValue:true},attached.result.sessionId);
  report.documents.push(JSON.parse(result.result.result.value));
 }
 await writeFile('sources/google-in-frame.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.documents.map(({html,images,...d})=>({...d,images:images?.map(i=>({complete:i.complete,width:i.width,host:i.src.split('/')[2]}))})),null,2));
}finally{socket?.close();chrome.kill();}
