import {filmSeparationMedia} from '../content/film-separation.mjs';
import {customerPhotos} from '../content/customer-photos.mjs';
import {equipmentAssets} from '../content/equipment-media.mjs';
import hotWashAlbum from '../content/hot-wash-album.json' with {type:'json'};
import {mediaAttributes} from './media.mjs';
import {imageSize} from './image-size.mjs';

// All three configurations share the same six genuine photographs from
// the PRO technical description, pp. 28–29. They illustrate the dry
// separation technology, not a claim that each configuration is installed.
export const dryPhotoAlbum=[
 ['netherlands-line','Общий вид линии','Размещение оборудования на производственной площадке.'],
 ['netherlands-rotor','Барабанный сепарационный узел','Крупный план оборудования сухой очистки.'],
 ['china-assembly','Сборка и испытания','Оборудование перед отгрузкой.'],
 ['china-ballistic','Баллистический сепаратор','Подающий конвейер и участок разделения материала.'],
 ['china-air-separation','Дисковая и воздушная сепарация','Плёнка в зоне разделения материала.'],
 ['netherlands-feed','Подача плёнки на линию','Работа с загрязнённым плёночным сырьём.']
];
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const expand='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6m0-6-7 7M10 20H4v-6m0 6 7-7"/></svg>';
const galleryIcon='<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="24" height="19" rx="2"/><path d="M7 20l6-6 4 4 3-3 7 7M9 28h20V10"/><circle cx="20" cy="11" r="2"/></svg>';
function photo([key,title,description],index,{m=filmSeparationMedia[key],label=m.topic,group='dry-separation-album',caption=m.title}={}){
 const {width,height}=m.width?m:imageSize(new URL('../public/assets/'+m.file,import.meta.url));
 const smallWidth=m.thumbnail?(m.smallWidth??imageSize(new URL('../public/assets/'+m.thumbnail,import.meta.url)).width):width;
 const source={...m,title:title+' · '+label,caption};
 const sizes=index===0?'(max-width: 760px) 92vw, 90vw':index<3?'(max-width: 760px) 92vw, 45vw':'(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw';
 return '<figure class="line-image dry-album-card" data-dry-album-photo="'+key+'" data-media-group="'+group+'" '+mediaAttributes(source)+'><a class="media-open" href="/assets/'+m.file+'" aria-label="Увеличить: '+escape(title)+'"><img src="/assets/'+m.file+'"'+(smallWidth<width?' srcset="/assets/'+m.thumbnail+' '+smallWidth+'w, /assets/'+m.file+' '+width+'w" sizes="'+sizes+'"':'')+' width="'+width+'" height="'+height+'" alt="'+escape(m.title)+'" loading="lazy" decoding="async"><span class="dry-album-country">'+escape(label)+'</span><span class="dry-album-zoom">'+expand+'</span></a><figcaption><span class="dry-album-index">'+String(index+1).padStart(2,'0')+'</span><div><h3>'+escape(title)+'</h3><p>'+escape(description)+'</p></div></figcaption></figure>';
}
function renderPhotoAlbum({eyebrow,heading,lead,photos,linkAttributes=''}){
 return '<section class="section line-soft dry-photo-album" id="photos" data-dry-photo-album><div class="line-section-heading"><div><p class="eyebrow">'+eyebrow+'</p><h2>'+heading+'</h2></div><p>'+lead+'<span class="dry-album-hint">Нажмите на изображение, чтобы открыть его крупно.</span></p></div><div class="dry-album-grid">'+photos+'</div><div class="dry-album-more"><div class="dry-album-more-icon">'+galleryIcon+'</div><div class="dry-album-more-copy"><p class="eyebrow">ФОТО И ВИДЕО</p><h3>Больше фото и видео</h3><p>Подробные материалы по оборудованию, рабочим площадкам и ключевым узлам.</p></div><a class="dry-album-more-link" href="/media/"'+linkAttributes+'>Перейти в фото- и видеогалерею <span aria-hidden="true">↗</span></a></div></section>';
}
export function renderDryPhotoAlbum(){
 return renderPhotoAlbum({
  eyebrow:'ОБОРУДОВАНИЕ В РАБОТЕ',
  heading:'Реальные площадки.<br>Масштаб. Детали.',
  lead:'Фотографии с реальных производственных площадок и этапов испытаний в Китае и Нидерландах. Сборка, ключевые узлы, работа с плёночным сырьём и размещение оборудования сухой сепарации.',
  photos:dryPhotoAlbum.map((item,index)=>photo(item,index)).join('')
 });
}

export function renderHotWashPhotoAlbum(){
 const photos=hotWashAlbum.map(({file,title,description,type},index)=>{
  const isFrame=type==='video-frame';
  const source=(isFrame?equipmentAssets:customerPhotos).find(item=>item.file===file);
  const m={...source,product:'/catalog/lines/moyka-plenki',smallWidth:source.thumbWidth};
  return photo([source.id,title,description],index,{
   m,label:isFrame?'Кадр из видео':'Фотография',caption:source.source,group:'hot-wash-album'
  });
 }).join('');
 return renderPhotoAlbum({
  eyebrow:'ОБОРУДОВАНИЕ В РАБОТЕ / HOT-WASH',
  heading:'От мокрого измельчения до готового продукта.',
  lead:'Производственные процессы, оборудование горячей мойки, обезвоживания и очистки рабочей жидкости.',
  photos,
  linkAttributes:' data-photo-gallery data-product="/catalog/lines/moyka-plenki"'
 });
}
