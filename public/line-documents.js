const data=document.querySelector('#line-document-data');
const entries=data?JSON.parse(data.textContent):[];
let viewer;
for(const link of document.querySelectorAll('.film-line--full [data-pdf-open]')){
 link.addEventListener('click',async event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const entry=entries.find(d=>d.id===link.dataset.pdfOpen);
  if(!entry||!document.querySelector('#pdf-viewer')?.showModal)return;
  event.preventDefault();
  try{
   const url=new URL('./pdf-viewer.js',import.meta.url);url.search=new URL(import.meta.url).search;
   viewer??=import(url.href).catch(error=>{viewer=null;throw error;});
   await (await viewer).openDocument({document:entry,fileUrl:link.href,opener:link});
  }catch{location.assign(link.href);}
 });
}
for(const root of document.querySelectorAll('[data-line-dimensions]')){
 const tabs=[...root.querySelectorAll('[data-dimension-tab]')];
 function activate(tab,focus=false){
  tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;root.querySelector('#'+t.getAttribute('aria-controls')).hidden=!active;});
  if(focus)tab.focus({preventScroll:true});
 }
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>activate(tab));
  tab.addEventListener('keydown',event=>{
   const next=event.key==='ArrowRight'?(i+1)%tabs.length:event.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
   if(next===null)return;event.preventDefault();activate(tabs[next],true);
  });
 });
 root.dataset.dimensionsReady='true';
}
