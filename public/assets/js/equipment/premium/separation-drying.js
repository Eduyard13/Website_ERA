const root=document.querySelector('#line03-construction');
if(root){
 const select=root.querySelector('[data-diagram-select]');
 for(const button of document.querySelectorAll('[data-separation03-select]'))button.addEventListener('click',()=>{
  select.value=button.dataset.separation03Select;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#composition').scrollIntoView({block:'start',behavior:'instant'});
  select.focus({preventScroll:true});
 });
}

const chart=document.querySelector('[data-premium-process-map] .premium-chart');
if(chart){
 const upstream=chart.querySelector('.premium-upstream');
 const svg=chart.querySelector('.premium-routes');
 const bypass=chart.querySelector('.premium-bypass');
 const nodes=[...chart.querySelectorAll('[data-premium-node],[data-premium-stream]')];
 const paths=[...svg.querySelectorAll('[data-premium-route]')];

 // Leave a gap where independent utility lines pass over a material route.
 function rise(x,from,to,crossings){
  let path='';
  for(const y of crossings.filter(y=>y<from-4&&y>to+4).sort((a,b)=>b-a)){
   path+=`V${y+4}M${x} ${y-4}`;
  }
  return path+`V${to}`;
 }

 let frame=0;
 function layout(){
  frame=0;
  const {left,top,width,height}=chart.getBoundingClientRect();
  if(!width||!height)return;
  const box=Object.fromEntries(nodes.map(node=>{
   const r=node.getBoundingClientRect();
   return [node.dataset.premiumNode??node.dataset.premiumStream,{
    l:r.left-left,r:r.right-left,t:r.top-top,b:r.bottom-top,x:r.left-left+r.width/2,y:r.top-top+r.height/2
   }];
  }));
  const {prep,opener,ballistic1,dryer,ballistic2,sorting,rotor,accumulation,press,solids,dust,condensate,fractions,mix}=box;
  const stacked=getComputedStyle(upstream).gridTemplateColumns.trim().split(/\s+/).length===1;
  const between=(a,b)=>stacked?`M${a.x} ${a.b+3}V${b.t-3}`:`M${a.r+4} ${a.y}H${b.l-4}`;
  const commands={
   'prep-opener':between(prep,opener),
   'opener-ballistic1':between(opener,ballistic1),
   'ballistic1-dryer':between(ballistic1,dryer),
   'dryer-ballistic2':between(dryer,ballistic2),
   'sorting-rotor':between(sorting,rotor),
   'accumulation-press':between(accumulation,press)
  };

  if(stacked){
   const outside=width-4,feedY=(ballistic2.y+ballistic2.t)/2,sortY=(sorting.y+sorting.t)/2;
   const mixLane=accumulation.l-8,rotorExit=rotor.b+8;
   Object.assign(commands,{
    'ballistic2-sorting':`M${ballistic2.r} ${feedY}H${outside}V${sortY}H${sorting.r}`,
    'sorting-fractions':`M${sorting.r} ${sorting.y}H${sorting.r+8}V${fractions.y}H${fractions.r}`,
    'rotor-mix':`M${rotor.x} ${rotor.b}V${rotorExit}H${mixLane}V${mix.y}H${mix.l}`
   });
  }else{
   const topBus=prep.b+10,lowerBus=solids.b+8,returnY=solids.b+19,bypassY=sorting.t-14;
   const right=width-3,leftLane=3,curve=10;
   const sortExit=(sorting.x+sorting.r)/2,groupX=fractions.l-9,fractionLane=groupX-9;
   const solidExit=(sorting.l+sorting.x)/2,rotorExit=rotor.x;
   const solidTopIn=(solids.x+solids.r)/2,solidBottomIn=(solids.l+solids.x)/2;
   const dryerSolids=dryer.x-10,air=dryer.x+13,airLane=prep.b+22;
   const dustLane=(accumulation.r+press.l)/2;
   Object.assign(commands,{
    'ballistic2-sorting':`M${ballistic2.r} ${ballistic2.y}H${right-curve}Q${right} ${ballistic2.y} ${right} ${ballistic2.y+curve}V${returnY-curve}Q${right} ${returnY} ${right-curve} ${returnY}H${leftLane+curve}Q${leftLane} ${returnY} ${leftLane} ${returnY+curve}V${sorting.y-curve}Q${leftLane} ${sorting.y} ${leftLane+curve} ${sorting.y}H${sorting.l-4}`,
    'sorting-fractions':`M${sortExit} ${sorting.t}V${bypassY}H${fractionLane}V${fractions.y}H${groupX}`,
    'rotor-mix':`M${rotor.r+4} ${mix.y}H${mix.l}`,
    'ballistic1-solids':`M${ballistic1.x} ${ballistic1.b}V${topBus}`,
    'dryer-solids':`M${dryerSolids} ${dryer.b}V${topBus}`,
    'ballistic2-solids':`M${ballistic2.x} ${ballistic2.b}V${topBus}`,
    'solids-header':`M${ballistic2.x} ${topBus}H${Math.min(ballistic1.x,solidTopIn)}H${solidTopIn}V${solids.t}`,
    'dryer-condensate':`M${air} ${dryer.b}V${topBus-4}M${air} ${topBus+4}V${airLane}H${condensate.x}V${condensate.t}`,
    'sorting-solids':`M${solidExit} ${sorting.t}`+rise(solidExit,sorting.t,lowerBus,[returnY]),
    'rotor-solids':`M${rotorExit} ${rotor.t}`+rise(rotorExit,rotor.t,lowerBus,[returnY,bypassY]),
    'solids-footer':`M${solidExit} ${lowerBus}H${rotorExit}H${solidBottomIn}V${solids.b}`,
    'mix-dust':`M${mix.r} ${mix.y}H${dustLane}`+rise(dustLane,mix.y,lowerBus,[accumulation.y,returnY])+`H${dust.x}V${dust.b}`
   });
   bypass.style.left=(sortExit+fractionLane)/2+'px';
   bypass.style.top=bypassY+'px';
  }
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  for(const path of paths)path.setAttribute('d',commands[path.dataset.premiumRoute]??'');
  chart.dataset.premiumFlowReady='true';
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(layout);}
 const observer=new ResizeObserver(schedule);
 observer.observe(chart);
 nodes.forEach(node=>observer.observe(node));
 schedule();
}
