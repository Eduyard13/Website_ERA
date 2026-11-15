import {readLibraryState,filterLibraryDocuments,libraryStateUrl,selectionSummary,zipLimitBytes} from './document-library-model.js';
const root=document.querySelector('[data-document-library]');
if(root){
 const data=JSON.parse(document.querySelector('#document-library-data').textContent),form=root.querySelector('#document-filters'),home=new URL(root.querySelector('[data-library-home]').href),appBase=new URL('../',home),routeCategory=root.dataset.routeCategory;
 const options={category:routeCategory,objects:data.objects,categories:data.categories.map(c=>c.id)};
 let state=readLibraryState(location.search,options),selecting=false,archiveController=null,searchTimer,viewerPromise;
 const selected=new Set(),documents=new Map(data.documents.map(d=>[d.id,d])),cards=new Map([...root.querySelectorAll('[data-library-document]')].map(card=>[card.dataset.libraryDocument,card]));
 const summary=root.querySelector('[data-selection-summary]'),archiveStatus=root.querySelector('[data-archive-status]'),selectedFiles=root.querySelector('[data-selected-files]'),archiveButton=root.querySelector('[data-download-selected]');
 const size=bytes=>(bytes/1_000_000).toLocaleString('ru-RU',{maximumFractionDigits:1})+' МБ';
 const fileUrl=d=>new URL(d.file,home).href;
 const asset=path=>{const url=new URL(path,import.meta.url);url.search=new URL(import.meta.url).search;return url.href;};
 const relatedUrl=path=>new URL(path.replace(/^\//,''),appBase).href;
 function syncForm(){
  form.elements.q.value=state.q;form.elements.category.value=state.category;form.elements.objectType.value=state.objectType;form.elements.sort.value=state.sort;
  for(const option of form.elements.product.options){const hide=!!option.value&&!!state.objectType&&option.dataset.objectType!==state.objectType;option.hidden=hide;option.disabled=hide;}
  const product=data.objects.find(o=>o.slug===state.product&&(!state.objectType||o.type===state.objectType));form.elements.product.value=product?product.type+':'+product.slug:'';
 }
 function updateSelection(){
  const result=selectionSummary(data.documents,selected),busy=!!archiveController;
  summary.textContent=result.selected.length?'Выбрано: '+result.selected.length+' · '+size(result.bytes):'Документы не выбраны';
  archiveButton.disabled=!result.selected.length||busy;root.querySelector('[data-select-mode]').disabled=busy;root.querySelector('[data-clear-selected]').disabled=busy;
  for(const input of root.querySelectorAll('[data-select-document]')){input.checked=selected.has(input.dataset.selectDocument);input.disabled=busy;}
  root.querySelector('[data-cancel-archive]').hidden=!busy;
  if(result.overLimit){archiveStatus.textContent='Лимит архива — '+size(zipLimitBytes)+'. Выделение сохранено. Скачайте PDF отдельно по ссылкам ниже.';showSeparateLinks(result.selected);}else if(!busy){selectedFiles.hidden=true;selectedFiles.replaceChildren();if(!archiveStatus.dataset.error)archiveStatus.textContent='';}
 }
 function showSeparateLinks(entries){selectedFiles.replaceChildren();for(const d of entries){const li=document.createElement('li'),a=document.createElement('a');a.href=fileUrl(d);a.download=d.downloadName;a.textContent=d.title+' · '+size(d.bytes);li.append(a);selectedFiles.append(li);}selectedFiles.hidden=false;}
 function apply({writeUrl=true}={}){
  syncForm();const found=filterLibraryDocuments(data.documents,state),ids=new Set(found.map(d=>d.id)),category=data.categories.find(c=>c.id===state.category),object=data.objects.find(o=>o.slug===state.product&&(!state.objectType||o.type===state.objectType));
  for(const [id,card] of cards)card.hidden=!ids.has(id);
  const grid=root.querySelector('.dl-document-grid');for(const d of found)grid.append(cards.get(d.id));
  const publicCount=found.filter(d=>d.access==='public').length,requested=found.length-publicCount;
  root.querySelector('#document-result').textContent='Документов: '+publicCount+(requested?' · По запросу: '+requested:'');
  root.querySelector('[data-library-heading]').textContent=object?'Документы: '+object.title:category?.title||'Документы для вашей задачи.';
  const objectLink=root.querySelector('[data-library-object-link]');objectLink.hidden=!object;
  if(object){objectLink.href=relatedUrl(object.path);objectLink.textContent=object.type==='line'?'К линии ↗':object.type==='node'?'К оборудованию ↗':'О проекте ↗';}
  for(const link of root.querySelectorAll('[data-library-category]')){const id=link.dataset.libraryCategory;link.href=libraryStateUrl(new URL(id+'/',home),{...state,category:id},{category:id}).href;link.classList.toggle('is-current',state.category===id);if(state.category===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  const empty=root.querySelector('#document-empty'),unpublished=category&&!data.documents.some(d=>d.category===category.id);empty.hidden=found.length>0;
  root.querySelector('[data-library-empty-label]').textContent=unpublished?'КАТЕГОРИЯ ПОДГОТОВЛЕНА':'ПОИСК ПО БИБЛИОТЕКЕ';
  root.querySelector('[data-library-empty-title]').textContent=unpublished?'Материалы готовятся':'Документы по этим условиям не найдены';
  root.querySelector('[data-library-empty-copy]').textContent=unpublished?category.detail:'Измените запрос, выберите другой объект или сбросьте фильтры.';
  const request=root.querySelector('[data-library-empty-request]'),topic='Документация: '+(object?.title||category?.title||'оборудование ЭРА');request.href=relatedUrl('/contacts')+'?topic='+encodeURIComponent(topic)+'#project-form';
  root.querySelector('[data-library-clear]').hidden=!!unpublished;
  if(writeUrl)history.replaceState(null,'',libraryStateUrl(location.href,state,{category:routeCategory}));
 }
 function reset(){clearTimeout(searchTimer);state={q:'',category:routeCategory,objectType:'',product:'',sort:'name'};apply();}
 form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(searchTimer);state.q=form.elements.q.value;apply();});
 form.addEventListener('input',event=>{if(event.target.name==='q'){clearTimeout(searchTimer);state.q=event.target.value;searchTimer=setTimeout(apply,160);}});
 form.addEventListener('change',event=>{
  clearTimeout(searchTimer);const key=event.target.name;
  if(key==='category'){const category=event.target.value;location.href=libraryStateUrl(new URL(category?category+'/':'',home),{...state,category},{category}).href;return;}
  if(key==='objectType'){state.objectType=event.target.value;if(state.product&&!data.objects.some(o=>o.slug===state.product&&(!state.objectType||o.type===state.objectType)))state.product='';}
  if(key==='product'){const [type,slug]=event.target.value.split(':');state.product=slug||'';if(slug)state.objectType=type;}
  if(key==='sort')state.sort=event.target.value;if(key==='q')state.q=event.target.value;apply();
 });
 form.addEventListener('reset',event=>{event.preventDefault();reset();});root.querySelector('[data-library-clear]').addEventListener('click',reset);
 window.addEventListener('popstate',()=>{state=readLibraryState(location.search,options);apply({writeUrl:false});});
 root.querySelector('.dl-view-controls').hidden=false;
 for(const button of root.querySelectorAll('[data-library-view]'))button.addEventListener('click',()=>{root.dataset.view=button.dataset.libraryView;for(const b of root.querySelectorAll('[data-library-view]'))b.setAttribute('aria-pressed',String(b===button));});
 root.querySelector('[data-select-mode]').addEventListener('click',event=>{selecting=!selecting;event.currentTarget.setAttribute('aria-pressed',String(selecting));event.currentTarget.textContent=selecting?'Завершить выбор':'Выбрать несколько';root.querySelector('.dl-selection').hidden=!selecting;for(const label of root.querySelectorAll('.dl-select'))label.hidden=!selecting;updateSelection();});
 root.addEventListener('change',event=>{if(event.target.matches('[data-select-document]')){const id=event.target.dataset.selectDocument;if(event.target.checked)selected.add(id);else selected.delete(id);delete archiveStatus.dataset.error;updateSelection();}});
 root.querySelector('[data-clear-selected]').addEventListener('click',()=>{selected.clear();archiveStatus.textContent='';delete archiveStatus.dataset.error;updateSelection();});
 root.querySelector('[data-cancel-archive]').addEventListener('click',()=>archiveController?.abort());
 archiveButton.addEventListener('click',async()=>{
  if(archiveController)return;const selection=selectionSummary(data.documents,selected);if(!selection.selected.length)return;if(selection.overLimit){updateSelection();return;}
  const controller=new AbortController();archiveController=controller;delete archiveStatus.dataset.error;updateSelection();archiveStatus.textContent='Подготовка архива…';
  try{
   const {zipSync}=await import(asset('./vendor/fflate.js'));if(controller.signal.aborted)throw new DOMException('Aborted','AbortError');
   const entries={};let bytes=0;
   for(const [index,d] of selection.selected.entries()){
    archiveStatus.textContent='Загрузка PDF '+(index+1)+' из '+selection.selected.length+'…';const response=await fetch(fileUrl(d),{signal:controller.signal});if(!response.ok)throw new Error('PDF unavailable');
    const buffer=new Uint8Array(await response.arrayBuffer());bytes+=buffer.length;if(buffer.length!==d.bytes||bytes>zipLimitBytes||new TextDecoder().decode(buffer.subarray(0,5))!=='%PDF-')throw new Error('PDF verification failed');
    const filename=(d.id+' — '+d.downloadName).replace(/[\\/:*?"<>|\x00-\x1f]/g,'_');entries[filename]=[buffer,{level:0}];
   }
   if(controller.signal.aborted)throw new DOMException('Aborted','AbortError');archiveStatus.textContent='Сборка архива…';
   const blob=new Blob([zipSync(entries,{level:0})],{type:'application/zip'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ЭРА — Документация.zip';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30_000);archiveStatus.textContent='Архив скачан. Оригинальные PDF сохранены без изменений.';archiveStatus.dataset.error='keep';
  }catch(error){archiveStatus.textContent=error.name==='AbortError'?'Подготовка архива отменена. Выделение сохранено.':'Не удалось подготовить архив. Выделение сохранено; скачайте документы отдельно.';archiveStatus.dataset.error='true';showSeparateLinks(selection.selected);
  }finally{archiveController=null;updateSelection();if(archiveStatus.dataset.error==='true')showSeparateLinks(selection.selected);}
 });
 root.addEventListener('click',async event=>{
  const link=event.target.closest('[data-pdf-open]');if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const entry=documents.get(link.dataset.pdfOpen);if(!entry||entry.access!=='public')return;event.preventDefault();
  try{viewerPromise??=import(asset('./pdf-viewer.js')).catch(error=>{viewerPromise=null;throw error;});const viewer=await viewerPromise;await viewer.openDocument({document:entry,fileUrl:link.href,opener:link});}
  catch{link.removeAttribute('data-pdf-open');link.textContent='Открыть исходный PDF ↗';root.querySelector('#document-result').textContent='Просмотрщик недоступен. Нажмите «Открыть исходный PDF» или скачайте файл.';link.focus();}
 });
 for(const img of root.querySelectorAll('.dl-cover img'))img.addEventListener('error',()=>{img.hidden=true;img.nextElementSibling.hidden=false;});
 window.addEventListener('pagehide',()=>{clearTimeout(searchTimer);archiveController?.abort();});apply();
}
