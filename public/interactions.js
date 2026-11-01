import {countMedia,mediaCountLabels} from './media-counts.js';
// Filters persist in the URL, so Back restores the same selection.
const params=new URLSearchParams(location.search);
function updateUrl(values){const next=new URL(location.href);for(const [key,value] of Object.entries(values)){if(value)next.searchParams.set(key,value);else next.searchParams.delete(key);}history.replaceState(null,'',next);}
const catalog=document.querySelector('#catalog-filters');
if(catalog){
 const cards=[...document.querySelectorAll('[data-node]')];
 for(const key of ['q','category','material'])catalog.elements[key].value=params.get(key)||'';
 const apply=()=>{const q=catalog.elements.q.value.trim().toLocaleLowerCase('ru'),category=catalog.elements.category.value,material=catalog.elements.material.value;let count=0;
 cards.forEach(card=>{card.hidden=!(card.dataset.title.includes(q)&&(!category||card.dataset.category===category)&&(!material||card.dataset.materials.split('|').includes(material)));if(!card.hidden)count++;});
 document.querySelector('#catalog-result').textContent=`Найдено: ${count} из ${cards.length} узлов`;
 document.querySelector('#catalog-empty').hidden=count>0;updateUrl({q,category,material});};
 catalog.addEventListener('submit',e=>e.preventDefault());catalog.addEventListener('input',apply);catalog.addEventListener('change',apply);catalog.addEventListener('reset',()=>setTimeout(apply,0));apply();
}
const lineFilters=document.querySelector('#line-filters');
if(lineFilters){
 const group=lineFilters.querySelector('[name=group]'),optional=lineFilters.querySelector('[name=optional]');group.value=params.get('group')||'';optional.checked=params.get('optional')==='1';
 const apply=()=>{let count=0;document.querySelectorAll('[data-line]').forEach(card=>{card.hidden=(!optional.checked&&card.dataset.optional==='true')||(group.value&&group.value!==card.dataset.group);if(!card.hidden)count++;});document.querySelector('#line-result').textContent=`Комплектаций: ${count}`;updateUrl({group:group.value,optional:optional.checked?'1':''});};
 lineFilters.addEventListener('change',apply);lineFilters.querySelector('[data-line-reset]').addEventListener('click',()=>{group.value='';optional.checked=false;apply();});apply();
}
const mediaFilters=document.querySelector('#media-filters');
document.querySelectorAll('[data-photo-gallery]').forEach(link=>{const target=new URL(link.href);target.searchParams.set('product',link.dataset.product);link.href=target;});
const defaultMediaType=mediaFilters?.dataset.defaultType||'all';
let activeType=params.get('type')||defaultMediaType;
if(!['all','photo','video','scheme'].includes(activeType))activeType=defaultMediaType;
const entries=[...document.querySelectorAll('[data-media]')];
if(mediaFilters){
 mediaFilters.elements.product.value=params.get('product')||'';mediaFilters.elements.topic.value=params.get('topic')||'';
 const apply=()=>{let count=0;entries.forEach(entry=>{entry.hidden=!( (activeType==='all'||(activeType==='scheme'?['scheme','visualization'].includes(entry.dataset.type):activeType==='photo'?entry.dataset.type==='photo':entry.dataset.type==='video'))&&(!mediaFilters.elements.product.value||entry.dataset.product===mediaFilters.elements.product.value)&&(!mediaFilters.elements.topic.value||entry.dataset.topic===mediaFilters.elements.topic.value));if(!entry.hidden)count++;});document.querySelectorAll('[data-media-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mediaType===activeType)));document.querySelector('#media-result').textContent=mediaCountLabels(countMedia(entries.filter(e=>!e.hidden).map(e=>({type:e.dataset.type,file:e.dataset.image||e.dataset.video})))).map(({label,count})=>`${label}: ${count}`).join(' · ')||'Ничего не найдено';document.querySelector('#media-empty').hidden=count>0;document.querySelectorAll('[data-album]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.product===mediaFilters.elements.product.value&&activeType==='photo')));updateUrl({type:activeType===defaultMediaType?'':activeType,product:mediaFilters.elements.product.value,topic:mediaFilters.elements.topic.value});};
 document.querySelectorAll('[data-media-type]').forEach(b=>b.addEventListener('click',()=>{activeType=b.dataset.mediaType;apply();}));mediaFilters.addEventListener('submit',e=>e.preventDefault());mediaFilters.addEventListener('change',apply);mediaFilters.addEventListener('reset',()=>{activeType=defaultMediaType;setTimeout(apply,0);});document.querySelectorAll('[data-album]').forEach(b=>b.addEventListener('click',()=>{mediaFilters.elements.product.value=b.dataset.product;mediaFilters.elements.topic.value='';activeType='photo';apply();document.querySelector('#gallery-results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}));apply();
}
const documentsForm=document.querySelector('#document-filters');
if(documentsForm){
 const cards=[...document.querySelectorAll('[data-document]')];
 for(const key of ['q','product','kind'])documentsForm.elements[key].value=params.get(key)||'';
 const apply=()=>{const q=documentsForm.elements.q.value.trim().toLocaleLowerCase('ru'),product=documentsForm.elements.product.value,kind=documentsForm.elements.kind.value;let count=0;
  cards.forEach(card=>{card.hidden=!(card.dataset.title.includes(q)&&(!product||card.dataset.product===product)&&(!kind||card.dataset.kind===kind));if(!card.hidden)count++;});
  document.querySelectorAll('[data-document-folder]').forEach(folder=>{const found=[...folder.querySelectorAll('[data-document]')].filter(card=>!card.hidden).length;folder.hidden=found===0;folder.querySelector('[data-folder-count]').textContent=found;if(found&&(q||product||kind))folder.open=true;});
  document.querySelector('#document-result').textContent=`Документов: ${count} из ${cards.length}`;
  document.querySelector('#document-empty').hidden=count>0;updateUrl({q,product,kind});
 };
 documentsForm.addEventListener('submit',e=>e.preventDefault());documentsForm.addEventListener('input',apply);documentsForm.addEventListener('change',apply);documentsForm.addEventListener('reset',()=>setTimeout(apply,0));apply();
}
