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
 const tabs=[...home.querySelectorAll('[data-market-tab]')];
 function selectTab(tab){
  for(const button of tabs){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;home.querySelector('#'+button.getAttribute('aria-controls')).hidden=!selected;}
 }
 for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',e=>{
   const next=e.key==='ArrowRight'?(index+1)%tabs.length:e.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;
   if(next==null)return;e.preventDefault();selectTab(tabs[next]);tabs[next].focus();
  });
 }
 initializeEconomics(home.querySelector('[data-economics]'));
}
