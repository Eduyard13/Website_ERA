import {initializeEconomics} from './economics-controller.js';

const home=document.querySelector('[data-commercial-home]');
if(home){
 const technologyAnchors=new Set(['raw-title','raw-cleaning-title','solution-title','output-title','control-title','launch-title','detail-title','dry-separation','hot-washing','granulation']);
 const restoreTechnologyAnchor=()=>{
  let fragment='';try{fragment=decodeURIComponent(location.hash.slice(1));}catch{}
  if(technologyAnchors.has(fragment)&&!document.getElementById(fragment)){
   const target=new URL(home.querySelector('[data-technology-page]').href);target.hash=fragment;location.replace(target);
  }
 };
 restoreTechnologyAnchor();
 window.addEventListener('hashchange',restoreTechnologyAnchor);
 window.addEventListener('pageshow',restoreTechnologyAnchor);
 initializeEconomics(home);
}
