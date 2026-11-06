import {calculateMaterialBalance} from './material-balance-model.js';

const controls=document.querySelector('[data-contaminant-controls]');
if(controls){
 const buttons=[...controls.querySelectorAll('[data-contaminant]')];
 const rows=[...document.querySelectorAll('[data-contaminant-row]')];
 const select=button=>{
  for(const other of buttons)other.setAttribute('aria-pressed',String(other===button));
  for(const row of rows)row.hidden=row.dataset.contaminantRow!==button.dataset.contaminant;
 };
 controls.hidden=false;select(buttons[0]);
 for(const [index,button] of buttons.entries()){
  button.addEventListener('click',()=>select(button));
  button.addEventListener('keydown',event=>{
   const direction={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
   if(!direction&&!['Home','End'].includes(event.key))return;
   event.preventDefault();
   const next=event.key==='Home'?buttons[0]:event.key==='End'?buttons.at(-1):buttons[(index+direction+buttons.length)%buttons.length];
   next.focus();select(next);
  });
 }
}

const balance=document.querySelector('[data-material-balance]');
if(balance){
 const range=balance.querySelector('[data-balance-range]');
 const number=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n);
 const update=()=>{
  const r=calculateMaterialBalance(range.value);
  balance.querySelector('[data-balance-contamination]').value=r.contamination+'%';
  balance.querySelector('[data-balance-polymer]').textContent=number(r.polymer);
  balance.querySelector('[data-balance-inclusions]').textContent=number(r.inclusions);
  balance.querySelector('[data-balance-polymer-bar]').style.width=(100-r.contamination)+'%';
  balance.querySelector('[data-balance-inclusions-bar]').style.width=r.contamination+'%';
  const point=balance.querySelector('[data-balance-point]');
  point.style.left=(r.contamination*2)+'%';point.style.top=((1500-r.polymer)/1500*100)+'%';
  range.setAttribute('aria-valuetext',`${r.contamination}%: полимер ${number(r.polymer)} кг/ч, включения ${number(r.inclusions)} кг/ч`);
 };
 range.disabled=false;range.addEventListener('input',update);update();
}
