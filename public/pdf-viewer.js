const dialog=document.querySelector('#pdf-viewer');
const find=selector=>dialog.querySelector(selector);
let active=false,session=0,renderNumber=0,loading=null,pdf=null,renderTask=null,currentPage=null,opener=null;
let pageNumber=1,scale=1,fit=true,pdfModulePromise;
const pageInput=find('[data-pdf-page]'),stage=find('[data-pdf-stage]'),canvas=find('[data-pdf-canvas]'),status=find('[data-pdf-status]');
const asset=path=>{const url=new URL(path,import.meta.url);url.search=new URL(import.meta.url).search;return url.href;};
function message(text,error=false){status.textContent=text;status.classList.toggle('is-error',error);}
function controls(){find('[data-pdf-prev]').disabled=!pdf||pageNumber<=1;find('[data-pdf-next]').disabled=!pdf||pageNumber>=pdf.numPages;pageInput.disabled=!pdf;pageInput.value=pageNumber;pageInput.max=pdf?.numPages||1;find('[data-pdf-pages]').textContent='/ '+(pdf?.numPages||'—');for(const b of dialog.querySelectorAll('.pdf-zoom button'))b.disabled=!pdf;}
async function renderPage(){
 if(!active||!pdf)return;
 const token=session,renderId=++renderNumber,document=pdf,oldTask=renderTask;renderTask=null;
 oldTask?.cancel();if(oldTask)await oldTask.promise.catch(()=>{});
 if(!active||session!==token||renderId!==renderNumber)return;
 currentPage?.cleanup();currentPage=null;message('Загрузка страницы '+pageNumber+'…');controls();
 try{
  const page=await document.getPage(pageNumber);
  if(!active||session!==token||renderId!==renderNumber){page.cleanup();return;}
  currentPage=page;const natural=page.getViewport({scale:1}),padding=innerWidth<768?24:40;
  if(fit)scale=Math.max(.15,Math.min(3,(stage.clientWidth-padding)/natural.width));
  const viewport=page.getViewport({scale}),ratio=Math.min(devicePixelRatio||1,2,Math.sqrt(16_000_000/(viewport.width*viewport.height)));
  canvas.width=Math.max(1,Math.floor(viewport.width*ratio));canvas.height=Math.max(1,Math.floor(viewport.height*ratio));canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
  canvas.setAttribute('aria-label','Страница '+pageNumber+' из '+document.numPages);canvas.hidden=false;
  const task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null});renderTask=task;
  await task.promise;
  if(active&&session===token&&renderId===renderNumber){message('Страница '+pageNumber+' из '+document.numPages);find('[data-pdf-scale]').textContent=Math.round(scale*100)+'%';renderTask=null;}
 }catch(error){if(active&&session===token&&renderId===renderNumber&&error.name!=='RenderingCancelledException'){canvas.hidden=true;message('Не удалось отобразить страницу. Скачайте PDF или откройте исходный файл по ссылке ниже.',true);}}
}
function release(){
 if(!active)return;active=false;session++;renderNumber++;renderTask?.cancel();renderTask=null;
 const task=loading;loading=null;pdf=null;currentPage=null;
 if(task)Promise.resolve(task.destroy()).catch(()=>{});
 canvas.width=1;canvas.height=1;canvas.hidden=true;document.body.classList.remove('pdf-open');document.body.style.removeProperty('--pdf-scroll-gap');
 if(!document.querySelector('dialog[open]')&&opener?.isConnected)opener.focus({preventScroll:true});controls();
}
function close(){if(dialog.open)dialog.close();release();}
export async function openDocument({document:entry,fileUrl,opener:source}){
 if(active)close();active=true;const token=++session;opener=source;pageNumber=1;scale=1;fit=true;
 find('#pdf-title').textContent=entry.title;const download=find('[data-pdf-download]'),original=find('[data-pdf-original]');download.href=fileUrl;download.download=entry.downloadName;original.href=fileUrl;
 message('Загрузка документа…');canvas.hidden=true;controls();
 document.body.style.setProperty('--pdf-scroll-gap',Math.max(0,innerWidth-document.documentElement.clientWidth)+'px');document.body.classList.add('pdf-open');dialog.showModal();find('[data-pdf-close]').focus({preventScroll:true});
 try{
  pdfModulePromise??=import(asset('./vendor/pdfjs/pdf.mjs')).catch(error=>{pdfModulePromise=null;throw error;});
  const module=await pdfModulePromise;if(!active||session!==token)return;
  module.GlobalWorkerOptions.workerSrc=asset('./vendor/pdfjs/pdf.worker.mjs');
  const task=module.getDocument({url:fileUrl,cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href,isEvalSupported:false,enableXfa:false});loading=task;
  task.onProgress=({loaded,total})=>{if(active&&session===token&&!pdf)message(total?'Загрузка документа: '+Math.min(100,Math.round(loaded/total*100))+'%':'Загрузка документа…');};
  const loaded=await task.promise;if(!active||session!==token){await task.destroy();return;}
  pdf=loaded;controls();await renderPage();
 }catch(error){if(active&&session===token){canvas.hidden=true;message('Не удалось открыть PDF. Скачайте документ или откройте исходный файл по ссылке ниже.',true);controls();}}
}
function go(value){if(!pdf)return;const next=Math.max(1,Math.min(pdf.numPages,Number.isFinite(value)?Math.trunc(value):pageNumber));if(next===pageNumber){pageInput.value=pageNumber;return;}pageNumber=next;stage.scrollTop=0;renderPage();}
find('[data-pdf-prev]').addEventListener('click',()=>go(pageNumber-1));find('[data-pdf-next]').addEventListener('click',()=>go(pageNumber+1));pageInput.addEventListener('change',()=>go(Number(pageInput.value)));pageInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();go(Number(pageInput.value));}});
find('[data-pdf-zoom-in]').addEventListener('click',()=>{fit=false;scale=Math.min(3,scale*1.2);renderPage();});find('[data-pdf-zoom-out]').addEventListener('click',()=>{fit=false;scale=Math.max(.15,scale/1.2);renderPage();});find('[data-pdf-fit]').addEventListener('click',()=>{fit=true;renderPage();});find('[data-pdf-reset]').addEventListener('click',()=>{fit=false;scale=1;renderPage();});
find('[data-pdf-close]').addEventListener('click',close);dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',release);
let outsideStart=false;const outside=event=>{const rect=dialog.getBoundingClientRect();return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;};dialog.addEventListener('pointerdown',event=>{outsideStart=event.target===dialog&&outside(event);});dialog.addEventListener('click',event=>{if(outsideStart&&event.target===dialog&&outside(event))close();outsideStart=false;});
dialog.addEventListener('keydown',event=>{
 if(event.key==='Tab'){
  const targets=[...dialog.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled)')].filter(e=>e.getClientRects().length),first=targets[0],last=targets.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,textarea,select,[contenteditable=true]')){if(event.key==='ArrowRight'){event.preventDefault();go(pageNumber+1);}if(event.key==='ArrowLeft'){event.preventDefault();go(pageNumber-1);}}
});
let lastWidth=0,resizeTimer;new ResizeObserver(()=>{if(active&&fit&&pdf&&stage.clientWidth!==lastWidth){lastWidth=stage.clientWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(renderPage,120);}}).observe(stage);
window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close();release();clearTimeout(resizeTimer);});
