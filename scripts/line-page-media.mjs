import {publicLibraryDocuments} from '../content/document-library.mjs';
import {libraryDocumentCard} from './documents.mjs';
import {mediaAttributes} from './media.mjs';
import {imageSize} from './image-size.mjs';

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const categoryOrder=['brochures','technical','drawings'];

export function lineCoverFiles(line){
 return {file:line.catalogCardFile||line.cardFile,smallFile:line.catalogCardSmallFile||line.cardSmallFile};
}

export function lineHeroImage(line){
 const {file,smallFile}=lineCoverFiles(line);
 const {width,height}=imageSize(new URL('../public/assets/'+file,import.meta.url));
 const smallWidth=imageSize(new URL('../public/assets/'+smallFile,import.meta.url)).width;
 const title=line.cardImageAlt||line.cardTitle;
 const caption='Проектная визуализация линии';
 const source=mediaAttributes({type:'visualization',topic:'Линия целиком',product:line.path,title,caption,file});
 return `<figure class="line-image line-image--visualization line-image--hero" data-hero-finish="titanium-gallery" data-line-catalog-cover ${source}>
  <a class="media-open" href="/assets/${file}" aria-label="Увеличить: ${escape(title)}"><img src="/assets/${file}" srcset="/assets/${smallFile} ${smallWidth}w, /assets/${file} ${width}w" sizes="(min-width:801px) 52vw, calc(100vw - 40px)" width="${width}" height="${height}" alt="${escape(title)}" fetchpriority="high" decoding="async"><span class="line-image-zoom" aria-hidden="true">⤢</span></a>
  <figcaption>${caption}</figcaption>
 </figure>`;
}

export function lineDocuments(line){
 return categoryOrder.flatMap(category=>publicLibraryDocuments.filter(document=>document.objectType==='line'&&document.objectSlug===line.slug&&document.category===category));
}

export function lineDocumentCards(documents){
 return `<div class="line-document-grid line-document-grid--complete">${documents.map(document=>libraryDocumentCard(document,{related:false})).join('')}</div>`;
}
