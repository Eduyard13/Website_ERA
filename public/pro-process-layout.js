// PRO process map only. Cards retain natural height, and the SVG tracks actual card bounds.
const grid=document.querySelector('#process [data-pro-process-map] .pro-flow-grid');
if(grid){
 const svg=grid.querySelector('.pro-flow-edges');
 const nodes=Object.fromEntries([...grid.querySelectorAll('[data-pro-flow-node]')].map(e=>[e.dataset.proFlowNode,e]));
 const paths=Object.fromEntries([...svg.querySelectorAll('[data-pro-route]')].map(e=>[e.dataset.proRoute,e]));
 const topKeys=['prep','ballistic','sorting','rotor','fifth','press','mix'];
 const secondKeys=['fractions','four','sorted'];
 let frame=0;
 function layout(){
  frame=0;
  if(getComputedStyle(svg).display==='none'){delete grid.dataset.proFlowReady;return;}
  const g=grid.getBoundingClientRect();
  if(!g.width||!g.height)return;
  const box=Object.fromEntries(Object.entries(nodes).map(([key,el])=>{
   const r=el.getBoundingClientRect();
   return [key,{l:r.left-g.left,r:r.right-g.left,t:r.top-g.top,b:r.bottom-g.top,w:r.width,h:r.height,x:r.left-g.left+r.width/2}];
  }));
  const {prep,ballistic,sorting,rotor,fifth,press,mix,fractions,four,sorted,solids,dust}=box;
  const y1=Math.max(...topKeys.map(k=>box[k].b)), y2=Math.max(...secondKeys.map(k=>box[k].b));
  const rowTop=Math.min(...topKeys.map(k=>box[k].t)), row2Top=fractions.t;
  const yMain=rowTop+Math.min(...topKeys.map(k=>box[k].h))*.56;
  const ySecond=row2Top+Math.min(...secondKeys.map(k=>box[k].h))*.56;
  const solidY=y1+17, dustY=y1+34, wasteY=y2+23;
  const sx=sorting.x, lx=prep.x, rx=press.l+press.w*.12;
  const solidX=solids.x, dustX=dust.x;
  const sortedX=(press.r+sorted.l)/2;
  const pressSideY=Math.min(press.b-10,Math.max(yMain+14,press.t+press.h*.78));
  const commands={
   'prep-ballistic': 'M'+prep.r+' '+yMain+'H'+ballistic.l,
   'ballistic-sorting':'M'+ballistic.r+' '+yMain+'H'+sorting.l,
   'sorting-rotor':'M'+sorting.r+' '+yMain+'H'+rotor.l,
   'rotor-fifth':'M'+rotor.r+' '+yMain+'H'+fifth.l,
   'fifth-press':'M'+fifth.r+' '+yMain+'H'+press.l,
   'press-mix':'M'+press.r+' '+yMain+'H'+mix.l,
   'sorting-fractions':'M'+sx+' '+sorting.b+'V'+fractions.t,
   'fractions-four':'M'+fractions.r+' '+ySecond+'H'+four.l,
   'four-press':'M'+four.r+' '+ySecond+'H'+(press.x-10)+'Q'+press.x+' '+ySecond+' '+press.x+' '+(ySecond-10)+'V'+press.b,
   'press-sorted':'M'+press.r+' '+pressSideY+'H'+sortedX+'V'+ySecond+'H'+sorted.l,
   'ballistic-solids':'M'+ballistic.x+' '+ballistic.b+'V'+solidY+'H'+lx+'V'+(wasteY-10)+'Q'+lx+' '+wasteY+' '+(lx+10)+' '+wasteY+'H'+(solidX-10)+'Q'+solidX+' '+wasteY+' '+solidX+' '+(wasteY+10)+'V'+solids.t,
   'sorting-solids':'M'+(sorting.l+sorting.w*.22)+' '+sorting.b+'V'+solidY+'H'+ballistic.x,
   'rotor-solids':'M'+(rotor.l+rotor.w*.23)+' '+rotor.b+'V'+solidY+'H'+(sx+7)+' M'+(sx-7)+' '+solidY+'H'+(sorting.l+sorting.w*.22),
   'rotor-dust':'M'+(rotor.l+rotor.w*.77)+' '+rotor.b+'V'+dustY+'H'+rx+'V'+(ySecond-7)+' M'+rx+' '+(ySecond+7)+'V'+(wasteY-10)+'Q'+rx+' '+wasteY+' '+(rx+10)+' '+wasteY+'H'+(dustX-10)+'Q'+dustX+' '+wasteY+' '+dustX+' '+(wasteY+10)+'V'+dust.t,
   'fifth-dust':'M'+fifth.x+' '+fifth.b+'V'+dustY+'H'+rx,
   'four-dust':'M'+four.x+' '+four.b+'V'+(wasteY-10)+'Q'+four.x+' '+wasteY+' '+(four.x+10)+' '+wasteY+'H'+rx
  };
  svg.setAttribute('viewBox','0 0 '+g.width+' '+g.height);
  for(const [key,d] of Object.entries(commands))paths[key].setAttribute('d',d);
  grid.dataset.proFlowReady='true';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout);}
 const observer=new ResizeObserver(schedule);
 observer.observe(grid);
 Object.values(nodes).forEach(node=>observer.observe(node));
 window.addEventListener('resize',schedule,{passive:true});
 document.fonts?.ready.then(schedule);
 schedule();
}
