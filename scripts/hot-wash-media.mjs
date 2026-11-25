import {hotWashMedia} from '../content/hot-film-washing.mjs';
import {mediaAttributes} from './media.mjs';

export const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const previewWidths={'raw-film-02':240,'product-bale':320,'product-capsulate':320,'product-granule':320};

export function hotWashPicture(key,{
 title=hotWashMedia[key].title, caption=title, className='', group='',
 sizes='(min-width:1101px) 31vw, (min-width:801px) 47vw, calc(100vw - 40px)'
}={}){
 const m=hotWashMedia[key];
 const smallWidth=previewWidths[key]??m.smallWidth;
 const smallFile=previewWidths[key]?m.file.replace(/\.webp$/,`-${smallWidth}w.webp`):m.smallFile;
 const srcset=smallWidth<m.width
  ? ` srcset="/assets/${smallFile} ${smallWidth}w, /assets/${m.file} ${m.width}w" sizes="${sizes}"`
  : '';
 return `<figure class="line-image line-image--${m.type}${className?' '+className:''}"${group?` data-media-group="${group}"`:''} ${mediaAttributes({...m,title})}>
  <a class="media-open" href="/assets/${m.file}" aria-label="Увеличить: ${escapeHtml(title)}"><img src="/assets/${m.file}"${srcset} width="${m.width}" height="${m.height}" alt="${escapeHtml(title)}" loading="lazy" decoding="async"><span class="line-image-zoom" aria-hidden="true">⤢</span></a>
  ${caption?`<figcaption>${escapeHtml(caption)}</figcaption>`:''}
 </figure>`;
}
