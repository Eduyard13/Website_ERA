/* Native disclosures work without JS; enhancement adds tabs and function discovery. */
const root=document.querySelector('[data-kair-system]');
if(root){
 for(const group of root.querySelectorAll('[data-kair-tabs]')){
  const tabs=[...group.querySelectorAll('[data-ka-tab]')];
  const select=(tab,focus=false)=>{
   for(const item of tabs){
    const active=item===tab;
    item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;
    const panel=group.querySelector('#'+item.getAttribute('aria-controls'));
    if(panel)panel.hidden=!active;
   }
   if(focus)tab.focus();
  };
  for(const tab of tabs){
   tab.addEventListener('click',()=>select(tab));
   tab.addEventListener('keydown',event=>{
    let index=tabs.indexOf(tab);
    if(event.key==='ArrowRight')index=(index+1)%tabs.length;
    else if(event.key==='ArrowLeft')index=(index+tabs.length-1)%tabs.length;
    else if(event.key==='Home')index=0;
    else if(event.key==='End')index=tabs.length-1;
    else return;
    event.preventDefault();select(tabs[index],true);
   });
  }
 }
 const form=root.querySelector('[data-kair-function-form]');
 const input=form.querySelector('[data-kair-function-search]');
 const controls=[...form.querySelectorAll('[data-kair-scope]')];
 const groups=[...root.querySelectorAll('[data-kair-function-group]')];
 const cards=[...root.querySelectorAll('[data-kair-function]')];
 const result=root.querySelector('[data-kair-function-result]');
 const empty=root.querySelector('[data-kair-function-empty]');
 const normalise=value=>value.toLocaleLowerCase('ru-RU').replaceAll('ё','е').trim();
 let scope='all',selectedGroup=null;
 function update(){
  const words=normalise(input.value).split(/\s+/).filter(Boolean);
  const filtering=words.length>0||scope!=='all'||selectedGroup!==null;
  let count=0,groupCount=0;
  for(const card of cards){
   const text=normalise(card.dataset.search);
   const scopeMatch=scope==='all'||card.dataset.scope===scope||card.dataset.scope==='both'&&scope!=='equipment';
   const visible=scopeMatch&&(!selectedGroup||card.dataset.group===selectedGroup)&&words.every(word=>text.includes(word));
   card.hidden=!visible;if(visible)count++;
  }
  for(const group of groups){
   const visible=[...group.querySelectorAll('[data-kair-function]')].filter(card=>!card.hidden).length;
   group.hidden=visible===0;
   group.querySelector('[data-kair-group-count]').textContent=String(visible);
   if(visible){groupCount++;if(filtering)group.open=true;}
  }
  for(const control of controls)control.setAttribute('aria-pressed',String(control.dataset.kairScope===scope));
  const selectedTitle=selectedGroup?groups.find(g=>g.dataset.kairFunctionGroup===selectedGroup)?.querySelector('summary strong').textContent:'';
  result.textContent=filtering?`Найдено: ${count} из ${cards.length}${selectedTitle?' · '+selectedTitle:''}`:`${count} описаний в ${groupCount} группах`;
  empty.hidden=count!==0;
 }
 input.addEventListener('input',()=>{selectedGroup=null;update();});
 form.addEventListener('submit',event=>event.preventDefault());
 for(const control of controls)control.addEventListener('click',()=>{scope=control.dataset.kairScope;selectedGroup=null;update();});
 form.addEventListener('reset',()=>{
  input.value='';scope='all';selectedGroup=null;
  for(const group of groups)group.open=group.dataset.kairFunctionGroup==='process';
  update();
 });
 for(const link of root.querySelectorAll('[data-kair-group-link]'))link.addEventListener('click',()=>{
  input.value='';scope='all';selectedGroup=link.dataset.kairGroupLink;update();
 });
 // Open a deep-linked function group without changing the visitor's other controls.
 const openLinkedGroup=()=>{
  const id=location.hash.slice(1);
  const linked=groups.find(group=>group.id===id);
  if(linked){if(linked.hidden){scope='all';selectedGroup=null;input.value='';update();}linked.open=true;}
 };
 window.addEventListener('hashchange',openLinkedGroup);
 update();openLinkedGroup();root.dataset.ready='true';
}
