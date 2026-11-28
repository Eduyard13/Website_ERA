import assert from 'node:assert/strict';
import {copyFile,mkdir,mkdtemp,readFile,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';

test('Browser revisions follow transitive changes and preserve unrelated and legal URLs',async t=>{
 const root=await mkdtemp(join(tmpdir(),'era-browser-assets-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const entry='assets/js/core/app.js';
 const child='assets/js/shared/child.mjs';
 const dependency='assets/js/shared/dependency.mjs';
 const independent='assets/js/core/independent.js';
 const style='assets/css/core/style.css';
 const assets={[entry]:"import {x} from '../shared/child.mjs';\nexport const y=x;",
  [child]:"export {x} from './dependency.mjs';",[dependency]:'export const x=1;',
  [independent]:'export const z=1;',[style]:'body { color: red; }\n'};
 const registry={paths:{'app.js':entry,'child.mjs':child,'dependency.mjs':dependency,
  'independent.js':independent,'style.css':style},dynamic:{},legacyLegal:{'style.css':'0.47.0'},
  legacyDependencies:[]};
 async function put(path,content){
  const target=join(root,path);
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,content);
 }
 for(const [path,source] of Object.entries(assets)){
  await put('public/'+path,source);
  await put('dist/'+path,source);
 }
 await put('content/shared/browser-assets.json',JSON.stringify(registry));
 await copyFile(new URL('../../package.json',import.meta.url),join(root,'package.json'));
 const compiler=join(root,'scripts/build/browser-assets.mjs');
 await mkdir(dirname(compiler),{recursive:true});
 await copyFile(new URL('../../scripts/build/browser-assets.mjs',import.meta.url),compiler);
 await symlink(new URL('../../node_modules/',import.meta.url),join(root,'node_modules'),'dir');
 const before=await import(pathToFileURL(compiler).href+'?before');
 await put('public/'+dependency,'export const x=2;');
 const after=await import(pathToFileURL(compiler).href+'?after');
 assert.notEqual(before.assetRevision(entry),after.assetRevision(entry));
 assert.notEqual(before.assetRevision(child),after.assetRevision(child));
 assert.equal(before.assetRevision(independent),after.assetRevision(independent));
 assert.equal(before.assetRevision(style),after.assetRevision(style));
 await after.writeBrowserAssets(join(root,'dist'));
 const app=await readFile(join(root,'dist',entry),'utf8');
 assert.ok(app.includes('../shared/child.mjs?v='+after.assetRevision(child)));
 const stylesheet='<link rel="stylesheet" href="/style.css?v=0.47.0">';
 assert.equal(after.publicMarkup(stylesheet,'',true),stylesheet);
 const project=after.publicMarkup(stylesheet,'/Website_ERA',false);
 assert.ok(project.includes('/Website_ERA/'+style+'?v='+after.assetRevision(style)));
});
