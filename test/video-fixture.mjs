// Isolated browser fixture. A generated test clip never enters public/ or Git.
import {mkdir,writeFile,copyFile,readdir,symlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {render,product,basePath} from '../scripts/build.mjs';
import {media} from '../content/catalog.mjs';
import {equipmentVideos} from '../content/equipment-videos.mjs';
import {createStaticServer} from '../scripts/static-server.mjs';
const [fixtureRoot,clip]=process.argv.slice(2);
if(!fixtureRoot||!clip)throw new Error('Pass an isolated temporary root and a test clip');
await mkdir(resolve(fixtureRoot,'assets/videos'),{recursive:true});
for(const entry of await readdir('public',{withFileTypes:true})){
 if(entry.isFile())await symlink(resolve('public',entry.name),resolve(fixtureRoot,entry.name));
}
for(const name of await readdir('public/assets')){
 if(name!=='videos')await symlink(resolve('public/assets',name),resolve(fixtureRoot,'assets',name));
}
await copyFile(clip,resolve(fixtureRoot,'assets/videos/__player-test.mp4'));
await copyFile('dist/404.html',resolve(fixtureRoot,'404.html'));
media.push({...equipmentVideos[0],ready:true,file:'videos/__player-test.mp4',source:'Синтетический ролик для проверки плеера; не материал ЭРА.',product,productTitle:'Предварительный измельчитель',durationLabel:'0:08',hasAudio:true});
for(const path of [product,'/media','/catalog/equipment/vintovoy-press']){
 const dir=resolve(fixtureRoot,'.'+path);await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,'index.html'),render(path));
}
const server=createStaticServer({root:fixtureRoot,basePath});
server.listen(0,'127.0.0.1',()=>console.log('FIXTURE:http://127.0.0.1:'+server.address().port+basePath));
process.on('SIGTERM',()=>{server.closeAllConnections();server.close(()=>process.exit(0));});
