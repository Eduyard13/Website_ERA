(()=>{
'use strict';
const dialog=document.querySelector('#project-request');
const forms=[...document.querySelectorAll('[data-request-form]')];
const states=new Map();
let opener=null;
const cleanTopic=value=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,200);
const sizeLabel=bytes=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(bytes/1_000_000)+' МБ';
// Keep the gateway payload to a single attachment field. Bundle several originals
// into a standard, uncompressed UTF-8 ZIP, keeping their bytes intact.
const encoder=new TextEncoder();
const crcTable=Uint32Array.from({length:256},(_,value)=>{let crc=value;for(let bit=0;bit<8;bit++)crc=(crc&1)?0xedb88320^(crc>>>1):crc>>>1;return crc>>>0;});
const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
function zipEntries(files){
 const used=new Set();
 return files.map((file,index)=>{
  const base=(file.name.split(/[\\/]/).at(-1)||'файл-'+(index+1)).replace(/[\u0000-\u001f<>:"|?*]/g,'_');
  let name=base,number=2;
  while(used.has(name)){const dot=base.lastIndexOf('.'),suffix=' ('+number+')';number++;name=(dot>0?base.slice(0,dot):base)+suffix+(dot>0?base.slice(dot):'');}
  used.add(name);return {file,name:encoder.encode(name)};
 });
}
const transferSize=files=>files.length<2?files.reduce((sum,file)=>sum+file.size,0):22+zipEntries(files).reduce((sum,entry)=>sum+entry.file.size+76+2*entry.name.length,0);
async function bundleFiles(files){
 const local=[],central=[];let offset=0,centralSize=0;
 for(const {file,name} of zipEntries(files)){
  const data=new Uint8Array(await file.arrayBuffer()),crc=crc32(data);
  const header=new Uint8Array(30+name.length),view=new DataView(header.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint16(12,0x21,true);
  view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,name.length,true);header.set(name,30);
  local.push(header,data);
  const record=new Uint8Array(46+name.length),directory=new DataView(record.buffer);
  directory.setUint32(0,0x02014b50,true);directory.setUint16(4,20,true);directory.setUint16(6,20,true);directory.setUint16(8,0x800,true);directory.setUint16(14,0x21,true);
  directory.setUint32(16,crc,true);directory.setUint32(20,data.length,true);directory.setUint32(24,data.length,true);directory.setUint16(28,name.length,true);directory.setUint32(42,offset,true);record.set(name,46);
  central.push(record);centralSize+=record.length;offset+=header.length+data.length;
 }
 const end=new Uint8Array(22),view=new DataView(end.buffer);
 view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);view.setUint16(10,files.length,true);view.setUint32(12,centralSize,true);view.setUint32(16,offset,true);
 return new File([...local,...central,end],'Материалы_ЭРА.zip',{type:'application/zip'});
}
for(const form of forms){
 const input=form.querySelector('[data-request-files]');
 const list=form.querySelector('[data-request-file-list]');
 const status=form.querySelector('[data-request-file-status]');
 const error=form.querySelector('[data-request-error]');
 const submit=form.querySelector('[data-request-submit]');
 const drop=form.querySelector('[data-request-drop]');
 const limit=Number(form.dataset.maxBytes);
 const state={files:[],sending:false,submitHTML:submit.innerHTML};states.set(form,state);input.multiple=true;input.tabIndex=-1;
 const pick=form.querySelector('[data-request-pick]');pick.hidden=false;pick.addEventListener('click',()=>input.click());
 const showError=text=>{error.textContent=text;error.hidden=!text;};
 const synchronise=()=>{
  const transfer=new DataTransfer();for(const file of state.files)transfer.items.add(file);input.files=transfer.files;
  list.replaceChildren();
  for(const [index,file] of state.files.entries()){
   const item=document.createElement('li'),info=document.createElement('span'),name=document.createElement('span'),size=document.createElement('small'),remove=document.createElement('button');
   name.textContent=file.name;size.textContent=sizeLabel(file.size);info.append(name,size);
   remove.type='button';remove.textContent='Убрать';remove.setAttribute('aria-label','Убрать файл '+file.name);
   remove.addEventListener('click',()=>{state.files.splice(index,1);synchronise();showError('');});
   item.append(info,remove);list.append(item);
  }
  status.textContent=state.files.length?`Файлов: ${state.files.length} · ${sizeLabel(transferSize(state.files))} из 5 МБ${state.files.length>1?' · отправятся одним архивом':''}`:'';
 };
 state.synchronise=synchronise;
 const addFiles=files=>{
  const all=[...state.files];
  for(const file of files){
   const supported=/^(image\/|video\/|application\/pdf$)/i.test(file.type)||/\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|tiff?|svg|mp4|mov|webm|avi|mkv|m4v|mpe?g|3gp|pdf)$/i.test(file.name);
   if(!supported){showError('Для вложений выберите фото, видео или PDF. Другие материалы можно передать ссылкой.');synchronise();return;}
   if(!all.some(existing=>existing.name===file.name&&existing.size===file.size&&existing.lastModified===file.lastModified))all.push(file);
  }
  if(transferSize(all)>limit){showError('Общий размер вложений превышает 5 МБ. Уберите крупные файлы или добавьте ссылку на них.');synchronise();return;}
  state.files=all;synchronise();showError('');
 };
 input.addEventListener('change',()=>addFiles([...input.files]));
 for(const eventName of ['dragenter','dragover'])drop.addEventListener(eventName,event=>{event.preventDefault();drop.classList.add('is-dragging');});
 drop.addEventListener('dragleave',event=>{if(!drop.contains(event.relatedTarget))drop.classList.remove('is-dragging');});
 drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('is-dragging');addFiles([...event.dataTransfer.files]);});
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(state.sending){event.preventDefault();return;}
  const message=form.querySelector('[name="Задача"]');
  if(!message.value.trim()){event.preventDefault();showError('Опишите, пожалуйста, вашу задачу.');message.focus();return;}
  const files=[...input.files];
  if(transferSize(files)>limit){showError('Общий размер вложений превышает 5 МБ. Добавьте крупные материалы ссылкой.');error.focus();return;}
  const topic=cleanTopic(form.querySelector('[data-request-topic]').value);
  form.querySelector('[data-request-topic]').value=topic;
  form.querySelector('[name="_subject"]').value='Заявка с сайта ЭРА'+(topic?' — '+topic.slice(0,120):'');
  form.querySelector('[data-request-source]').value=location.origin+location.pathname;
  form.querySelector('[data-request-manifest]').value=files.map(file=>file.name+' — '+sizeLabel(file.size)).join('\n');
  showError('');state.sending=true;submit.disabled=true;submit.textContent='Отправляем…';form.setAttribute('aria-busy','true');
  try{
   if(files.length>1){const transfer=new DataTransfer();transfer.items.add(await bundleFiles(files));input.files=transfer.files;}
   HTMLFormElement.prototype.submit.call(form);
  }catch{
   state.sending=false;submit.disabled=false;submit.innerHTML=state.submitHTML;form.removeAttribute('aria-busy');synchronise();
   showError('Не удалось подготовить вложения. Выберите файлы ещё раз или передайте их ссылкой.');error.focus();
  }
  // Native multipart POST preserves binary files and the provider's spam check.
  // Success is shown only after the provider returns to its configured next URL.
 });
 form.dataset.requestReady='true';
}
function setContext(form,topic,source){
 const value=cleanTopic(topic);
 if(value)form.querySelector('[data-request-topic]').value=value;
 form.querySelector('[data-request-source]').value=source||location.origin+location.pathname;
}
function restore(){
 if(dialog?.open)return;
 document.body.classList.remove('request-open');document.body.style.removeProperty('--request-scroll-gap');
 if(!document.querySelector('dialog[open]')){
  const target=opener?.isConnected&&opener.getClientRects().length?opener:document.querySelector('[data-menu-toggle]');target?.focus({preventScroll:true});
 }
}
function close(){if(dialog?.open){dialog.close();restore();}}
if(dialog){
 dialog.querySelector('[data-request-close]').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',restore);
 let outsideStart=false;
 const outside=event=>{const r=dialog.getBoundingClientRect();return event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',event=>{outsideStart=event.target===dialog&&outside(event);});
 dialog.addEventListener('click',event=>{if(outsideStart&&event.target===dialog&&outside(event))close();outsideStart=false;});
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const focusable=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([type=hidden]),textarea')].filter(e=>e.getClientRects().length&&e.tabIndex>=0);
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 });
}
document.addEventListener('click',event=>{
 const link=event.target.closest('a[data-project-request]');
 if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
 const url=new URL(link.href);
 if(url.origin!==location.origin)return;
 const form=dialog?.querySelector('[data-request-form]')||document.querySelector('[data-request-form]');
 if(!form)return;
 event.preventDefault();setContext(form,url.searchParams.get('topic'),location.origin+location.pathname);
 if(dialog){
  opener=link;if(!dialog.open){document.body.style.setProperty('--request-scroll-gap',Math.max(0,innerWidth-document.documentElement.clientWidth)+'px');document.body.classList.add('request-open');dialog.showModal();}
  form.querySelector('[name="Имя"]').focus({preventScroll:true});
 }else{form.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});form.querySelector('[name="Имя"]').focus({preventScroll:true});}
});
const inline=document.querySelector('#project-form [data-request-form]');
if(inline)setContext(inline,new URL(location.href).searchParams.get('topic'));
window.addEventListener('pageshow',()=>{
 for(const [form,state] of states){state.sending=false;form.removeAttribute('aria-busy');const button=form.querySelector('[data-request-submit]');button.disabled=false;button.innerHTML=state.submitHTML;state.synchronise();}
 if(dialog&&!dialog.open)document.body.classList.remove('request-open');
});
})();
