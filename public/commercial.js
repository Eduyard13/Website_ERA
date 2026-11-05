import {initializeEconomics} from './economics-controller.js';
import {initialEconomicsState,changeEconomicsSelection,calculateEconomics} from './economics-model.js';
import {renderMarketPrice} from './economics-view.js';

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
 const market=home.querySelector('[data-market-widget]');
 let marketState=initialEconomicsState(),granuleTab='ldpe';
 const tabs=[...market.querySelectorAll('[data-market-tab]')];
 function selectTab(tab){
  for(const button of tabs){const selected=button===tab;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;market.querySelector('#'+button.getAttribute('aria-controls')).hidden=!selected;}
  if(tab.dataset.marketTab!=='film')granuleTab=tab.dataset.marketTab;
 }
 function updateMarket(){
  const result=calculateEconomics(marketState);market.dataset.marketMode=marketState.mode;
  market.querySelectorAll('button[data-market-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.marketMode===marketState.mode)));
  market.querySelector('[data-market-model]').innerHTML=renderMarketPrice(result);
  for(const tab of tabs)tab.hidden=marketState.mode==='separation'?tab.dataset.marketTab!=='film':tab.dataset.marketTab==='film';
  selectTab(tabs.find(tab=>tab.dataset.marketTab===(marketState.mode==='separation'?'film':granuleTab)));
  market.querySelector('[data-market-status]').textContent=`${result.mode.product}: ${result.grossPrice/1000} рублей за килограмм с НДС 22%.`;
 }
 market.addEventListener('click',event=>{
  const mode=event.target.closest('button[data-market-mode]'),price=event.target.closest('[data-market-price]');
  if(mode){marketState=changeEconomicsSelection(marketState,{mode:mode.dataset.marketMode});updateMarket();}
  if(price){marketState.salePrices[marketState.mode]=Number(price.dataset.marketPrice);updateMarket();market.querySelector(`[data-market-price="${price.dataset.marketPrice}"]`).focus();}
 });
 for(const tab of tabs){
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',e=>{
   const visible=tabs.filter(button=>!button.hidden),index=visible.indexOf(tab);
   const next=e.key==='ArrowRight'?(index+1)%visible.length:e.key==='ArrowLeft'?(index+visible.length-1)%visible.length:e.key==='Home'?0:e.key==='End'?visible.length-1:null;
   if(next==null)return;e.preventDefault();selectTab(visible[next]);visible[next].focus();
  });
 }
 updateMarket();
 initializeEconomics(home.querySelector('[data-economics]'));
}
