document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('details[open]').forEach(details=>details.open=false);});
document.addEventListener('click',event=>{document.querySelectorAll('details[open]:not(.document-folder)').forEach(details=>{if(!details.contains(event.target))details.open=false;});});

// One deterministic texture per page; the CSS gradient remains available without canvas or JavaScript.
function initEraIndigoGrain(){
 const canvas=document.createElement('canvas');
 canvas.width=336;canvas.height=224;
 const context=canvas.getContext('2d');
 if(!context)return;
 const noise=context.createImageData(canvas.width,canvas.height);
 let seed=1947;
 for(let pixel=0;pixel<noise.data.length;pixel+=4){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const value=seed>>>24;
  noise.data[pixel]=value;noise.data[pixel+1]=value;noise.data[pixel+2]=value;noise.data[pixel+3]=255;
 }
 context.putImageData(noise,0,0);
 document.documentElement.style.setProperty('--era-indigo-grain',`url("${canvas.toDataURL('image/png')}")`);
}
initEraIndigoGrain();
