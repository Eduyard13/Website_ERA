import {miniFilmSeparationMedia as base} from '../content/mini-film-separation.mjs';
import {separation03Media as premium} from '../content/separation-03.mjs';
import {mediaAttributes} from './media.mjs';
import {imageSize} from './image-size.mjs';

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const pairs=[
 {id:'01',title:'Плёночное сырьё с посторонними включениями',before:base.before,after:base.after,
  beforeTitle:'Плёнка с посторонними включениями',beforeText:'Исходный материал до сухой сепарации.',
  afterTitle:'Очищенная плёночная фракция',afterText:'Результат после сухой сепарации.'},
 {id:'02',title:'Загрязнённая плёнка крупным планом',before:premium['product-before'],after:premium['product-after'],
  beforeTitle:'Сырьё перед очисткой',beforeText:'Смесь плёнки с посторонними включениями.',
  afterTitle:'Плёнка после сухой очистки',afterText:'Пример материала после отделения примесей.'}
];
function card(m,state,title,description){
 const {width,height}=imageSize(new URL('../public/assets/'+m.file,import.meta.url));
 const after=state==='after';
 return '<figure class="line-image line-image--photo dry-product-photo" data-dry-product-state="'+state+'" data-media-group="dry-product-results" '+mediaAttributes(m)+'><a class="media-open" href="/assets/'+m.file+'" aria-label="Увеличить: '+esc(title)+'"><img src="/assets/'+m.file+'" width="'+width+'" height="'+height+'" alt="'+esc(title)+'" loading="lazy" decoding="async"><span class="dry-product-badge">'+(after?'ПОСЛЕ СУХОЙ ОЧИСТКИ':'ДО ОЧИСТКИ')+'</span><span class="line-image-zoom" aria-hidden="true">⤢</span></a><figcaption><strong>'+esc(title)+'</strong><span>'+esc(description)+'</span></figcaption></figure>';
}
const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.5 12 3 3 6-6"/></svg>';
export function renderDryProductCollage(){
 return '<div class="dry-product-showcase" data-dry-product-showcase><div class="line-section-heading"><div><p class="eyebrow">ГОТОВАЯ ПРОДУКЦИЯ</p><h2>Плёнка после<br>сухой очистки.</h2></div><p>На выходе — очищенная плёночная фракция с заметно сниженным содержанием посторонних включений. Материал можно направить на дальнейшую мойку или реализовать переработчику при соответствии требованиям покупателя.</p></div>'+
 '<div class="dry-product-collage" aria-label="Два примера плёнки до и после сухой очистки">'+pairs.map(p=>'<div class="dry-product-pair" data-dry-product-pair="'+p.id+'"><div class="dry-product-pair-heading"><span>ПРИМЕР '+p.id+'</span><h3>'+esc(p.title)+'</h3></div><div class="dry-product-pair-grid">'+card(p.before,'before',p.beforeTitle,p.beforeText)+'<span class="dry-product-arrow" aria-hidden="true">→</span>'+card(p.after,'after',p.afterTitle,p.afterText)+'</div></div>').join('')+'</div>'+
 '<div class="dry-product-benefits era-indigo-surface"><div><p class="eyebrow">РЕЗУЛЬТАТ ТЕХНОЛОГИИ</p><h3>Что получает клиент на выходе</h3></div><ul>'+['Снижение доли посторонних включений','Визуально более чистая плёночная фракция','Подготовка материала к дальнейшей мойке','Возможность реализации очищенного сырья'].map(s=>'<li>'+check+'<span>'+s+'</span></li>').join('')+'</ul></div>'+
 '<p class="dry-product-photo-note">Фотографии из технических описаний ЭРА — примеры сухой очистки. Фактические показатели зависят от состава, загрязнённости и влажности исходного сырья, комплектации и режима работы линии; качество конкретной партии подтверждается испытаниями.</p></div>';
}
