import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {setTimeout as delay} from 'node:timers/promises';
await mkdir('sources',{recursive:true});
const googleEmbed="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3387.1186854646453!2d120.54503629999999!3d31.903372499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35b3de30aaecfbc9%3A0xc69270bb0704fe55!2sBei%27er%20Machinery!5e0!3m2!1sen!2sus!4v1656289004886!5m2!1sen!2sus";
const candidates={google:googleEmbed,yandex:'https://yandex.com/map-widget/v1/?ll=120.540729604582%2C31.905470488135485&pt=120.540729604582%2C31.905470488135485%2Cpm2rdm&z=17&l=sat'};
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><title>Map rendering verification</title><iframe title="Official map rendering check" src="'+candidates[req.url.slice(1)]+'" style="width:1100px;height:760px;border:0"></iframe>');});await new Promise(r=>server.listen(3434,'127.0.0.1',r));
const pages=[['google-more','https://www.google.com/maps?cid=14308622914688450133&t=k'],['yandex-corrected','https://yandex.com/maps/?ll=120.540729604582%2C31.905470488135485&pt=120.540729604582%2C31.905470488135485&z=18&l=sat'],['yandex-sat-widget','http://127.0.0.1:3434/yandex']];
const profile=await mkdtemp(join(tmpdir(),'era-pins-'));const chrome=spawn('/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});let socket;
try{
 let port;for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);pending.delete(m.id);}});
 const call=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>reject(Error(method+' timed out')),25000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
 const inspect=async sessionId=>{const r=await call('Runtime.evaluate',{expression:"JSON.stringify({url:location.href,title:document.title,text:document.body?.innerText.slice(0,20000),canvases:document.querySelectorAll('canvas').length,images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,src:i.currentSrc})),html:document.documentElement.outerHTML.slice(0,800000),state:window.APP_INITIALIZATION_STATE||null})",returnByValue:true},sessionId);return JSON.parse(r.result.value);};
 await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});const results=[];
 for(const [name,url] of pages){
  try{
   await call('Page.navigate',{url});await delay(13000);if(name==='google-more'){await call('Runtime.evaluate',{expression:"document.querySelector('[aria-label=\"Zoom in\"]')?.click()"});await delay(5000);}const data=await inspect();const frameDocs=[];
   const all=await call('Target.getTargets');for(const t of all.targetInfos.filter(t=>t.type==='iframe'&&/google|yandex/.test(t.url))){try{const a=await call('Target.attachToTarget',{targetId:t.targetId,flatten:true});frameDocs.push(await inspect(a.sessionId));}catch(error){frameDocs.push({url:t.url,error:String(error)});}}
   const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('sources/'+name+'.png',Buffer.from(shot.data,'base64'));await writeFile('sources/'+name+'.json',JSON.stringify({...data,frameDocs},null,2));
   const compact={name,url:data.url,title:data.title,text:data.text.slice(0,2500),frames:frameDocs.map(d=>({url:d.url,text:d.text?.slice(0,2500),canvases:d.canvases,decodedImages:d.images?.filter(i=>i.complete&&i.width).length,error:d.error}))};results.push(compact);console.log(JSON.stringify(compact));
  }catch(error){results.push({name,error:String(error)});console.log(name+': '+error);}
 }
 await writeFile('sources/report.json',JSON.stringify(results,null,2));
}finally{socket?.close();chrome.kill();server.close();}
