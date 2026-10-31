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
 const apply=()=>{let count=0;document.querySelectorAll('[data-line]').forEach(card=>{card.hidden=(!optional.checked&&card.dataset.optional==='true')||(group.value&&group.value!==card.dataset.group);if(!card.hidden)count++;});document.querySelector('#line-result').textContent=`Показано проектов комплектаций: ${count}. Согласованных к поставке: 0.`;updateUrl({group:group.value,optional:optional.checked?'1':''});};
 lineFilters.addEventListener('change',apply);lineFilters.querySelector('[data-line-reset]').addEventListener('click',()=>{group.value='';optional.checked=false;apply();});apply();
}
const mediaFilters=document.querySelector('#media-filters');
let activeType=params.get('type')||'all';
if(!['all','photo','video'].includes(activeType))activeType='all';
const viewer=document.querySelector('#media-viewer');
const entries=[...document.querySelectorAll('[data-media]')];let activeIndex=0,opener;
const visibleEntries=()=>entries.filter(e=>!e.hidden);
function showEntry(index){const items=visibleEntries();if(!items.length)return;activeIndex=(index+items.length)%items.length;const entry=items[activeIndex];const img=viewer.querySelector('#viewer-image');img.src=entry.dataset.image;img.alt=entry.dataset.title;viewer.querySelector('#viewer-title').textContent=entry.dataset.title;viewer.querySelector('#viewer-source').textContent=entry.dataset.source;viewer.querySelector('#viewer-product').href=entry.dataset.product;viewer.querySelectorAll('[data-next],[data-prev]').forEach(b=>b.disabled=items.length<2);}
entries.forEach(entry=>entry.querySelector('.media-open').addEventListener('click',event=>{event.preventDefault();opener=event.currentTarget;showEntry(visibleEntries().indexOf(entry));viewer.showModal();document.body.classList.add('viewer-open');viewer.querySelector('[data-close]').focus();}));
if(viewer){viewer.querySelector('[data-close]').addEventListener('click',()=>viewer.close());viewer.querySelector('[data-next]').addEventListener('click',()=>showEntry(activeIndex+1));viewer.querySelector('[data-prev]').addEventListener('click',()=>showEntry(activeIndex-1));viewer.addEventListener('click',event=>{if(event.target===viewer){const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();}});viewer.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();showEntry(activeIndex+1);}if(event.key==='ArrowLeft'){event.preventDefault();showEntry(activeIndex-1);}});viewer.addEventListener('close',()=>{document.body.classList.remove('viewer-open');viewer.querySelector('#viewer-image').removeAttribute('src');opener?.focus();});}
if(mediaFilters){
 mediaFilters.elements.product.value=params.get('product')||'';mediaFilters.elements.topic.value=params.get('topic')||'';
 const apply=()=>{let count=0;entries.forEach(entry=>{entry.hidden=!( (activeType==='all'||(activeType==='photo'?entry.dataset.type==='photo':entry.dataset.type==='video'))&&(!mediaFilters.elements.product.value||entry.dataset.product===mediaFilters.elements.product.value)&&(!mediaFilters.elements.topic.value||entry.dataset.topic===mediaFilters.elements.topic.value));if(!entry.hidden)count++;});document.querySelectorAll('[data-media-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mediaType===activeType)));document.querySelector('#media-result').textContent=`Материалов: ${count}`;document.querySelector('#media-empty').hidden=count>0;updateUrl({type:activeType==='all'?'':activeType,product:mediaFilters.elements.product.value,topic:mediaFilters.elements.topic.value});};
 document.querySelectorAll('[data-media-type]').forEach(b=>b.addEventListener('click',()=>{activeType=b.dataset.mediaType;apply();}));mediaFilters.addEventListener('submit',e=>e.preventDefault());mediaFilters.addEventListener('change',apply);mediaFilters.addEventListener('reset',()=>{activeType='all';setTimeout(apply,0);});apply();
}
