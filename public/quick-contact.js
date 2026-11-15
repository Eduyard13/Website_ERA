(()=>{
 'use strict';
 const root=document.getElementById('quick-contact');if(!root)return;
 const panel=root.querySelector('#quick-contact-panel'),toggle=root.querySelector('[data-quick-contact-toggle]');
 const mobile=matchMedia('(max-width:767px)');let open=false,returnFromRequest=false;
 function close(restore=false){open=false;panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть быструю связь');if(restore&&!root.hidden)toggle.focus({preventScroll:true});}
 function sync(){
  const field=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
  const blocked=!!document.querySelector('dialog[open]')||!!document.fullscreenElement||(mobile.matches&&field);
  if(blocked)close();root.hidden=blocked;root.inert=blocked;
 }
 toggle.addEventListener('click',()=>{
  if(open){close();return;}
  sync();if(root.hidden)return;open=true;panel.hidden=false;toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Закрыть быструю связь');panel.querySelector('a[href]')?.focus({preventScroll:true});
 });
 root.querySelector('[data-quick-contact-close]').addEventListener('click',()=>close(true));
 root.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link)return;
  returnFromRequest=link.hasAttribute('data-project-request')&&!!document.getElementById('project-request');close();
 });
 document.addEventListener('pointerdown',event=>{if(open&&!root.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(open&&event.key==='Escape'){event.preventDefault();close(true);}});
 document.addEventListener('close',()=>{requestAnimationFrame(()=>{sync();if(returnFromRequest&&!document.querySelector('dialog[open]')){returnFromRequest=false;toggle.focus({preventScroll:true});}});},true);
 new MutationObserver(records=>{
  if(records.some(record=>record.type==='attributes'&&record.target.matches('dialog')||record.type==='childList'&&[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&(node.matches('dialog')||node.querySelector('dialog')))))sync();
 }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('focusin',sync);document.addEventListener('focusout',()=>requestAnimationFrame(sync));
 addEventListener('fullscreenchange',sync);addEventListener('resize',sync);addEventListener('pageshow',()=>{close();sync();});window.visualViewport?.addEventListener('resize',sync);
 sync();
})();
