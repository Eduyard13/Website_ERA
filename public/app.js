const toggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('#mobile-nav');
toggle?.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!expanded));menu.hidden=expanded;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('details[open]').forEach(d=>d.open=false);if(!menu.hidden){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}}});
document.addEventListener('click',e=>{document.querySelectorAll('details[open]:not(.document-folder)').forEach(d=>{if(!d.contains(e.target))d.open=false;});});
