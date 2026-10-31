import {createStaticServer} from './static-server.mjs';
const {basePath}=await import('./build.mjs');
const port=Number(process.env.PORT||3000);
createStaticServer({root:'dist',basePath}).listen(port,'0.0.0.0',()=>console.log('ERA server on port '+port));
