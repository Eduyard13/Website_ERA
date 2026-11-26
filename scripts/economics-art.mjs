import geography from '../content/home-market-geography.json' with {type:'json'};

const paths={
 layers:'M2 8l10-5 10 5-10 5-10-5Zm0 4 10 5 10-5M2 16l10 5 10-5',
 granules:'<circle cx="12" cy="6" r="3"/><circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/>',
 factory:'M2 21h20V10l-6 3V9l-6 4V9L5 12V4H2v17Zm4-4h2m3 0h2m3 0h2',
 coins:'M20 6c0 2-3.6 3.5-8 3.5S4 8 4 6s3.6-3.5 8-3.5S20 4 20 6ZM4 6v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V6M4 11v5c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v-5',
 growth:'M3 20h19M5 19v-6h3v6m3 0V9h3v10m3 0V4h3v15',
 diamond:'M2 9l4-5h12l4 5-10 12L2 9Zm0 0h20M8 9l4 12 4-12M8 9l4-5 4 5',
 calendar:'M4 5h16a2 2 0 0 1 2 2v13H2V7a2 2 0 0 1 2-2Zm-2 5h20M7 2v5m10-5v5',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 percent:'M5 20 19 4M7 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm10 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 globe:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0ZM3 12h18M12 3c-4 5-4 13 0 18m0-18c4 5 4 13 0 18',
 people:'M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 22v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3m1-18a4 4 0 0 1 0 7m1 3c2 0 3 2 3 5',
 power:'m13 2-9 12h7l-1 8 10-12h-7l1-8Z',
 water:'M12 2c-3 5-7 8.5-7 13a7 7 0 1 0 14 0c0-4.5-4-8-7-13Zm-4 13c0 2 1 3 3 3',
 lab:'M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8',
 truck:'M2 4h13v13H2V4Zm13 6h4l3 4v3h-7M6 21a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm13 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z',
 gear:'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
 box:'m2 7 10-5 10 5v10l-10 5-10-5V7Zm0 0 10 5 10-5m-10 5v10',
 film:'M4 6h14c2 0 2 2 2 4v5H7m-3-9c-3 0-3 9 0 9s3-9 0-9Zm2 1v12h15v-4',
 pipes:'M3 13 12 4h8c2 0 3 3 1 5l-9 10H4c-2 0-3-4-1-6Zm0 0h9c2 0 2 5 0 6m0-6 8-9',
 bag:'M6 5h12l3 16H3L6 5Zm3 3V5a3 3 0 0 1 6 0v3',
 recycle:'m8 7 3-5 3 5m-3-5 6 10m1-3-1 3-3-1m6 3 2 4h-6m6 0H10m3 3-3-3 3-2m-6 4H2l3-6m-3 6 6-11m-4 2 4-2 1 4',
 handshake:'m2 9 5-5 5 2 5-2 5 5-4 8-3 3-5-1-6-6m3 1 4-4 6 5m-7 2 3 3',
 shield:'M12 2 3 6v6c0 4 4 8 9 10 5-2 9-6 9-10V6l-9-4Zm-4 10 3 3 5-5',
 arrow:'M3 12h17m-6-6 6 6-6 6',
};
export function icon(name){
 const drawing=paths[name]??paths.layers;
 return `<svg class="ec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing.startsWith('<')?drawing:`<path d="${drawing}"/>`}</svg>`;
}
export function eraMedallion(caption=''){
 return `<div class="ec-medallion"><img src="/assets/favicon.svg" width="52" height="52" alt=""><b>ЭРА</b>${caption?`<small>${caption}</small>`:''}</div>`;
}
export function ribbon(){
 const lines=Array.from({length:17},(_,i)=>`<path d="M-12 ${53+i*4} C 180 ${136+i*3}, 295 ${17+i*3}, 452 ${60+i*3} S 650 ${141+i*4}, 812 ${53+i*3} S 1068 ${-16+i*6}, 1212 ${9+i*4}" opacity="${(1-i*.052).toFixed(2)}"/>`);
 return `<svg class="ec-ribbon" viewBox="0 0 1200 140" preserveAspectRatio="none" fill="none" stroke="currentColor" aria-hidden="true">${lines.join('')}</svg>`;
}
export function factoryArt(){
 return `<svg class="ec-factory-svg" viewBox="0 0 580 155" fill="none" stroke="currentColor" aria-hidden="true">
  <path fill="currentColor" fill-opacity=".09" d="M20 127V94l67-26 66 18v41h22V82l91-29 94 20v54h21V100l84-24 94 28v23Z"/>
  <g stroke-width="1.2"><path d="M20 127V94l67-26 66 18v41m-133-33 68 15 65-23m-65 23v18m87 0V82l91-29 94 20v54M175 82l92 16 93-25m-93 25v29m114 0v-27l84-24 94 28v23m-178-27 84 16 94-12m-94 12v11M7 127h565M35 135h520M68 142h449M220 66V31h12v32m57-6V19h13v41m15 4V29h9v37m-98-22h73m-67-12h57"/>
  <path d="M33 105v15m16-12v13m16-10v10m40-14v14m15-18v18m15-21v21m54-33v31m15-28v28m16-26v26m16-24v24m16-21v21m34-24v24m16-28v28m16-33v33m16-35v35m53-11v13m18-10v10m18-7v7m36-7v7m17-10v10m17-13v13m17-16v16"/></g>
 </svg>`;
}
export function networkArt(){
 return `<div class="ec-network-art" aria-hidden="true"><svg class="ec-network-map" viewBox="${geography.viewBox.join(' ')}">
  <g class="ec-map-land">${Object.values(geography.districts).map(({path})=>`<path d="${path}"/>`).join('')}</g>
  <g class="ec-map-links" fill="none"><path d="M158 441Q249 327 324 449T521 414Q629 246 748 391T926 340"/><path d="M158 441Q366 176 521 414M324 449Q629 290 926 340"/></g>
  <g class="ec-map-points">${[[158,441],[324,449],[521,414],[748,391],[926,340]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g>
 </svg>${factoryArt()}</div>`;
}
