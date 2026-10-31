import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {routes,product,basePath} from '../scripts/build.mjs';
test('Все внутренние ссылки, изображения и якоря ведут к существующим ресурсам',async()=>{
 for(const route of new Set(routes)){
  const file=resolve('dist','.'+route,'index.html');const html=await readFile(file,'utf8');
  for(const [,link] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(mailto:|tel:|https?:)/.test(link))continue;
   const parsed=new URL(link,'https://test.invalid'+route);let pathname=link.startsWith('#')?'':parsed.pathname;const hash=parsed.hash.slice(1);
   if(pathname && basePath){assert.ok(pathname.startsWith(basePath+'/'),`Missing base path: ${link}`);pathname=pathname.slice(basePath.length);}
   const target=pathname?resolve('dist','.'+pathname):file;
   const info=await stat(target);const destination=info.isDirectory()?target+'/index.html':target;
   assert.ok((await stat(destination)).isFile(),`${route}: ${link}`);
   if(hash)assert.ok((await readFile(destination,'utf8')).includes(`id="${hash}"`),`${route}: ${link}`);
  }
 }
});
test('Данные карточки различают сырьё и расчётные характеристики',async()=>{
 const html=await readFile('dist'+product+'/index.html','utf8');
 assert.match(html,/Плёнки, пакеты и биг-бэги<\/th><td>1 500–3 000 кг\/ч/);
 assert.match(html,/Другие полимерные отходы<\/th><td>3 000–7 000 кг\/ч/);
 assert.match(html,/Расчётная потребляемая мощность/);
 assert.match(html,/это не замер/);
 assert.match(html,/Ширина указана при открытой боковой щеке/);
});
test('Реестр содержит 12 уникальных узлов, линии расширяются через данные, медиа имеют реальные файлы',async()=>{
 const {nodes,lines,media}=await import('../content/catalog.mjs');
 assert.equal(nodes.length,12);assert.equal(new Set(nodes.map(n=>n.path)).size,12);
 assert.equal(lines.filter(l=>l.enabled).length,3);
 assert.equal(lines.filter(l=>l.group==='Сепарация').length,3);
 assert.equal(lines.filter(l=>l.group==='Мойка').length,1);
 assert.equal(nodes.filter(n=>n.status==='source-checked').length,1);
 for(const m of media){assert.ok(routes.includes(m.product.split('#')[0]));await stat('dist/assets/'+m.file);}
 const html=await readFile('dist/media/index.html','utf8');
 assert.ok(html.includes(`data-image="${basePath}/assets/assembly.webp"`));
 assert.ok(html.includes(`data-product="${basePath}${product}"`));
});
test('Адаптивные изображения и презентационные переходы учитывают путь публикации',async()=>{
 const html=await readFile('dist/index.html','utf8');
 for(const [,candidates] of html.matchAll(/srcset="([^"]+)"/g)){
  for(const candidate of candidates.split(',')){
   const url=candidate.trim().split(/\s+/)[0];
   assert.ok(url.startsWith(basePath+'/assets/'),`Missing base in srcset: ${url}`);
   await stat('dist'+url.slice(basePath.length));
  }
 }
 assert.match(html,/Полный цикл переработки плёнки:/);
 assert.match(html,/очистить, переработать, использовать снова/);
 assert.match(html,/href="#solution"/);
 assert.match(html,/href="#discuss"/);
 assert.ok(html.includes('mailto:edkom.office@mail.ru'));
 assert.ok(!html.includes('eduard@ros-um.ru'));
 assert.ok(!html.includes('data-node'));
 assert.ok(!html.includes('Материалы готовятся'));
});
