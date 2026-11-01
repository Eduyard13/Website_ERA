document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('details[open]').forEach(details=>details.open=false);});
document.addEventListener('click',event=>{document.querySelectorAll('details[open]:not(.document-folder)').forEach(details=>{if(!details.contains(event.target))details.open=false;});});
