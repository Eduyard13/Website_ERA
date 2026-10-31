import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
await import('./build.mjs');
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{let p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(p!==root&&!p.startsWith(root+sep)){res.writeHead(403);return res.end();}if((await stat(p)).isDirectory())p+='/index.html';res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(await readFile(p));}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(root+'/404.html'));}}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('ERA server on port '+(process.env.PORT||3000)));
