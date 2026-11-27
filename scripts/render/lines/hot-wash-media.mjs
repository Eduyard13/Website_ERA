import {hotWashMedia} from '../../../content/lines/hot-wash/hot-film-washing.mjs';
import rawAssets from '../../../content/lines/hot-wash/hot-wash-raw-assets.json' with {type:'json'};
import {mediaAttributes} from '../shared/media.mjs';

export const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const previewWidths={'raw-film-02':240,'product-bale':320,'product-capsulate':320,'product-granule':320};
const rawAssetRoot='lines/moyka-plenki/raw-prepared/';
export const hotWashRawMedia=Object.fromEntries(rawAssets.map(({key,title,files})=>{
 const variants=files.map(({file,width,height})=>({file:rawAssetRoot+file,width,height})).sort((a,b)=>a.width-b.width);
 return [key,{...variants.at(-1),variants,title,type:'visualization',topic:'Входное сырьё',
  product:'/catalog/lines/moyka-plenki',caption:'Иллюстрация материала'}];
}));

function imageSources(key,m){
 if(m.variants)return m.variants;
 const smallWidth=previewWidths[key]??m.smallWidth;
 const smallFile=previewWidths[key]?m.file.replace(/\.webp$/,`-${smallWidth}w.webp`):m.smallFile;
 return smallWidth<m.width?[{file:smallFile,width:smallWidth},m]:[];
}

export function hotWashPicture(key,options={}){
 const m=hotWashRawMedia[key]??hotWashMedia[key];
 const {
  title=m.title,caption=title,className='',group='',
  sizes='(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)'
 }=options;
 const sources=imageSources(key,m);
 const srcset=sources.length?` srcset="${sources.map(({file,width})=>`/assets/${file} ${width}w`).join(', ')}" sizes="${sizes}"`:'';
 return `<figure class="line-image line-image--${m.type}${className?' '+className:''}"${group?` data-media-group="${group}"`:''} ${mediaAttributes({...m,title})}>
  <a class="media-open" href="/assets/${m.file}" aria-label="Увеличить: ${escapeHtml(title)}"><img src="/assets/${m.file}"${srcset} width="${m.width}" height="${m.height}" alt="${escapeHtml(title)}" loading="lazy" decoding="async"><span class="line-image-zoom" aria-hidden="true">⤢</span></a>
  ${caption?`<figcaption>${escapeHtml(caption)}</figcaption>`:''}
 </figure>`;
}
