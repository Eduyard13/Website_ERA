import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const pages=[
['google-embed','https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3387.1186854646453!2d120.54503629999999!3d31.903372499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35b3de30aaecfbc9%3A0xc69270bb0704fe55!2sBei%27er%20Machinery!5e0!3m2!1sen!2sus!4v1656289004886!5m2!1sen!2sus'],
['google-place','https://www.google.com/maps?cid=14308622914688450133'],
['yandex-address','https://yandex.ru/maps/?text='+encodeURIComponent('张家港市经济技术开发区北二环路318号 Jiangsu BEIER Machinery')]
];
const profile=await mkdtemp(join(tmpdir(),'era-sources-'));
const chrome=spawn('/usr/bin/google-chrome',['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket;
try{
 let port;for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
 const call=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params}));});
 await call('Page.enable');
 const report=[];
 for(const [name,url] of pages){
  await call('Page.navigate',{url});await delay(18000);
  const result=await call('Runtime.evaluate',{expression:"JSON.stringify({url:location.href,title:document.title,text:document.body?.innerText.slice(0,14000),images:[...document.images].slice(0,35).map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth})),canvases:document.querySelectorAll('canvas').length,frames:document.querySelectorAll('iframe').length,html:document.documentElement.outerHTML.slice(0,400000)})",returnByValue:true});
  const data=JSON.parse(result.result.result.value);await writeFile('sources/'+name+'.json',JSON.stringify(data,null,2));delete data.html;delete data.images;report.push({name,...data});
 }
 console.log(JSON.stringify(report,null,2));await writeFile('sources/maps-report.json',JSON.stringify(report,null,2));
}finally{socket?.close();chrome.kill();}
