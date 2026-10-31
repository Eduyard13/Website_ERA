import {currencyCodes,moscowDay,shortDay,validateRates} from './fx-core.js';
const bar=document.querySelector('[data-fx-bar]');
if(bar){
 const key='era-cbr-rates-v1',date=bar.querySelector('[data-fx-date]'),status=bar.querySelector('[data-fx-status]');
 const formatter=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
 let current=null,inFlight=false,offline=false,lastDay=moscowDay();
 const setStatus=text=>{if(status.textContent!==text)status.textContent=text;};
 function render(){
  if(!current)return;
  const today=moscowDay(),isToday=current.requestedDate===today;
  bar.dataset.state=!isToday?'stale':offline?'cached':'live';
  date.dateTime=current.requestedDate;
  date.textContent=(isToday?'на ':'данные за ')+shortDay(current.requestedDate);
  for(const code of currencyCodes)bar.querySelector(`[data-fx-value="${code}"]`).textContent=formatter.format(current.rates[code].rate)+' ₽';
  const checked=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date(current.fetchedAt));
  const since='Действуют с '+shortDay(current.effectiveDate);
  status.title=`${since}. Проверены ${shortDay(moscowDay(new Date(current.fetchedAt)))} в ${checked} МСК. Рубли за одну единицу валюты.`;
  setStatus(!isToday?'Ожидаем обновление · ₽ за 1':offline?'Сохранённые курсы · ₽ за 1':current.effectiveDate!==current.requestedDate?since+' · ₽ за 1':`Проверено ${checked} МСК · ₽ за 1`);
 }
 try{const saved=localStorage.getItem(key);if(saved){current=validateRates(JSON.parse(saved));offline=true;render();}}catch{}
 async function refresh(){
  if(inFlight)return;inFlight=true;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const url=new URL(bar.dataset.fxFeed);url.searchParams.set('v',String(Math.floor(Date.now()/60000)));
   const response=await fetch(url,{cache:'no-store',signal:controller.signal,credentials:'omit'});
   if(!response.ok)throw new Error('Rates unavailable');
   current=validateRates(await response.json());offline=false;
   try{localStorage.setItem(key,JSON.stringify(current));}catch{}
   render();
  }catch{
   offline=true;
   if(current)render();
   else{bar.dataset.state='unavailable';date.textContent='Курсы недоступны';date.removeAttribute('datetime');setStatus('Повторим автоматически');}
  }finally{clearTimeout(timeout);inFlight=false;}
 }
 const header=bar.closest('.site-header');
 if(header&&'ResizeObserver' in window)new ResizeObserver(()=>document.documentElement.style.setProperty('--site-header-space',header.getBoundingClientRect().height+'px')).observe(header);
 document.addEventListener('click',event=>{if(!bar.contains(event.target))bar.querySelector('.fx-details').open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')bar.querySelector('.fx-details').open=false;});
 refresh();
 setInterval(()=>{if(!document.hidden)refresh();},15*60*1000);
 setInterval(()=>{if(moscowDay()!==lastDay){lastDay=moscowDay();refresh();}if(current)render();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(current)render();refresh();}});
 window.addEventListener('online',refresh);
}
