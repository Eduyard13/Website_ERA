import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf','.mp4':'video/mp4','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8'};
function byteRange(header,size){
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);
 if(!match||(!match[1]&&!match[2])||!size)return null;
 let start,end;
 if(!match[1]){
  const length=Number(match[2]);if(!length)return null;
  start=Math.max(0,size-length);end=size-1;
 }else{
  start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;
 }
 return start>=size||start>end?null:{start,end};
}
export function createStaticServer({root,basePath=''}){
 root=resolve(root);
 return createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){
   res.writeHead(405,{Allow:'GET, HEAD'});return res.end();
  }
  try{
   let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(basePath){
    if(pathname!==basePath&&!pathname.startsWith(basePath+'/'))throw new Error('Not found');
    pathname=pathname.slice(basePath.length)||'/';
   }
   let file=resolve(root,'.'+pathname);
   if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
   let info=await stat(file);
   if(info.isDirectory()){file+='/index.html';info=await stat(file);}
   if(!info.isFile())throw new Error('Not found');
   const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Content-Length':info.size,'X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
   let range;
   if(req.headers.range&&req.method==='GET'){
    range=byteRange(req.headers.range,info.size);
    if(!range){res.writeHead(416,{'Content-Range':'bytes */'+info.size,'Content-Length':0});return res.end();}
    headers['Content-Range']=`bytes ${range.start}-${range.end}/${info.size}`;
    headers['Content-Length']=range.end-range.start+1;
   }
   res.writeHead(range?206:200,headers);
   if(req.method==='HEAD')return res.end();
   const stream=createReadStream(file,range||undefined);
   stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{
   const body=await readFile(resolve(root,'404.html')).catch(()=>Buffer.from('Not found'));
   res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Content-Length':body.length});
   res.end(req.method==='HEAD'?undefined:body);
  }
 });
}
