// Two self-contained review pages. No account, local server or external media is needed.
// The normal dist build remains complete and unchanged.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import registry from '../../content/shared/browser-assets.json' with {type:'json'};

const output=resolve(process.argv[2]||'/tmp/era-about-contacts-preview/export');
const base=(process.env.BASE_PATH||'').replace(/\/$/,'');
const origin='https://eduyard13.github.io/Website_ERA';
const files=new Map([['/about-us','about-us.html'],['/contacts','contacts.html']]);
const mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;');
function localPath(value){
 const url=new URL(value.replaceAll('&amp;','&'),'https://preview.invalid');
 if(url.origin!=='https://preview.invalid')return null;
 if(base&&url.pathname!==base&&!url.pathname.startsWith(base+'/'))return null;
 return {path:base?url.pathname.slice(base.length)||'/':url.pathname,search:url.search,hash:url.hash};
}
function inlineAsset(value){
 const item=localPath(value);if(!item)return value;
 const file=resolve('dist','.'+decodeURIComponent(item.path));
 if(!file.startsWith(resolve('dist')+'/')||!existsSync(file)||!mime[extname(file)])return value;
 return `data:${mime[extname(file)]};base64,${readFileSync(file).toString('base64')}`;
}
mkdirSync(output,{recursive:true});
for(const [route,name] of files){
 let html=readFileSync('dist'+route+'/index.html','utf8');
 if(!html.includes('data-request-preview'))throw Error('Build the preview before exporting a review page');
 html=html.replace(/<script\b[^>]*\bsrc="[^"]*"[^>]*><\/script>/g,'');
 html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,(_,href)=>{
  const item=localPath(href);if(!item)throw Error('Unexpected external stylesheet');
  const css=readFileSync(resolve('dist','.'+item.path),'utf8').replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(original,quote,url)=>{
   const asset=new URL(url,'https://preview.invalid'+href);
   return asset.origin==='https://preview.invalid'?`url("${inlineAsset(asset.pathname)}")`:original;
  });
  return '<style>'+css.replaceAll('</style','<\\/style')+'</style>';
 });
 html=html.replace(/\s+(?:srcset|sizes)="[^"]*"/g,'');
 html=html.replace(/\bsrc="([^"]+)"/g,(_,src)=>`src="${escape(inlineAsset(src))}"`);
 html=html.replace(/\bhref="([^"]+)"/g,(_,href)=>{
  if(href.startsWith('#'))return `href="${href}"`;
  const item=localPath(href);if(!item)return `href="${href}"`;
  if(item.path.startsWith('/assets/'))return `href="${escape(inlineAsset(href))}"`;
  const path=item.path.replace(/\/$/,'')||'/';
  const target=files.get(path)||origin+(path==='/'?'/':path);
  return `href="${escape(target+item.search+item.hash)}"`;
 });
 const scripts=['request.js','navigation.js','quick-contact.js','page-progress.js'].map(file=>
  '<script>'+readFileSync('dist/'+registry.paths[file],'utf8').replaceAll('</script','<\\/script')+'</script>').join('');
 html=html.replace(/<button\b[^>]*\bdata-request-submit[^>]*>/g,tag=>tag.includes(' disabled')?tag:tag.replace('data-request-submit','data-request-submit disabled'));
 html=html.replace('</body>',scripts+'</body>');
 writeFileSync(resolve(output,name),html);
 console.log(name+': '+Buffer.byteLength(html)+' bytes');
}
writeFileSync(resolve(output,'ПРОЧИТАЙТЕ.txt'),`ЭРА — макет «О нас» и «Контакты», 15.11.2026\n\nРаспакуйте ZIP и откройте about-us.html обычным браузером.\ncontacts.html — вторая страница; переходы между ними работают из меню и подвала.\nУстановка программ, подключение к GitHub Pages и интернет для этих двух макетов не нужны.\n\nВсе фотографии и стили встроены. Панель связи, меню и форма доступны для просмотра.\nФорма работает в режиме демонстрации: «Предпросмотр: заявка не отправлена».\nТелефон и email оставлены действующими; нажатие на них открывает приложение устройства.\nПрочие разделы меню ведут на действующий сайт; в этот компактный макет они не включены.\nКурсы валют в офлайн-макете не загружаются.\n\nЭто предварительная версия для визуального согласования. В production не опубликована.\nИмена, портреты, адрес и ссылки на видеоканалы/мессенджеры ждут данных владельца.\n`);
console.log('Standalone design preview: '+output);
