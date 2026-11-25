import {filmSeparationMedia} from '../content/film-separation.mjs';
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
function photo([key,title,description],index){
 const m=filmSeparationMedia[key],{width,height}=imageSize(new URL('../public/assets/'+m.file,import.meta.url)),small=imageSize(new URL('../public/assets/'+m.thumbnail,import.meta.url));
 const source={...m,title:title+' · '+m.topic,caption:m.title};
 const sizes=index===0?'(max-width: 760px) 92vw, 90vw':index<3?'(max-width: 760px) 92vw, 45vw':'(max-width: 600px) 92vw, (max-width: 1000px) 45vw, 30vw';
 return '<figure class="line-image dry-album-card" data-dry-album-photo="'+key+'" data-media-group="dry-separation-album" '+mediaAttributes(source)+'><a class="media-open" href="/assets/'+m.file+'" aria-label="Увеличить: '+escape(title)+'"><img src="/assets/'+m.file+'"'+(small.width<width?' srcset="/assets/'+m.thumbnail+' '+small.width+'w, /assets/'+m.file+' '+width+'w" sizes="'+sizes+'"':'')+' width="'+width+'" height="'+height+'" alt="'+escape(m.title)+'" loading="lazy" decoding="async"><span class="dry-album-country">'+escape(m.topic)+'</span><span class="dry-album-zoom">'+expand+'</span></a><figcaption><span class="dry-album-index">'+String(index+1).padStart(2,'0')+'</span><div><h3>'+escape(title)+'</h3><p>'+escape(description)+'</p></div></figcaption></figure>';
}
export function renderDryPhotoAlbum(){
 return '<section class="section line-soft dry-photo-album" id="photos" data-dry-photo-album><div class="line-section-heading"><div><p class="eyebrow">ОБОРУДОВАНИЕ В РАБОТЕ</p><h2>Реальные площадки.<br>Масштаб. Детали.</h2></div><p>Фотографии с реальных производственных площадок и этапов испытаний в Китае и Нидерландах. Сборка, ключевые узлы, работа с плёночным сырьём и размещение оборудования сухой сепарации.<span class="dry-album-hint">Нажмите на изображение, чтобы открыть его крупно.</span></p></div><div class="dry-album-grid">'+dryPhotoAlbum.map(photo).join('')+'</div><div class="dry-album-more"><div class="dry-album-more-icon">'+galleryIcon+'</div><div class="dry-album-more-copy"><p class="eyebrow">ФОТО И ВИДЕО</p><h3>Больше фото и видео</h3><p>Подробные материалы по оборудованию, рабочим площадкам и ключевым узлам.</p></div><a class="dry-album-more-link" href="/media/">Перейти в фото- и видеогалерею <span aria-hidden="true">↗</span></a></div></section>';
}
