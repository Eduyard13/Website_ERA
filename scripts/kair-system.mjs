import kairBenefits from '../content/kair-benefits.json' with {type:'json'};
import {projectRequestHref} from './contact.mjs';
import {kairBenefitIcon} from './kair-visuals.mjs';
import {renderKairStage2,renderKairContact} from './kair-stage2.mjs';

const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<span aria-hidden="true">↗</span>';
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const kairSections=[
 ['kair-value','Польза'],
 ['kair-logic','Принцип работы'],
 ['kair-scenarios','Сценарии','ka-section-soft'],
 ['kair-process','Оборудование'],
 ['kair-screens','Интерфейс','ka-section-soft'],
 ['kair-functions','Функции','ka-section-soft'],
 ['kair-hardware','Оснащение'],
 ['kair-project','Эффективность','ka-section-soft'],
];

function renderBenefits(){
 const {kicker,title,lead,cards,hook,hookText}=kairBenefits;
 return `<div class="ka-value-heading"><p class="eyebrow">${escape(kicker)}</p><h2>${escape(title).replace('. ','.<br>')}</h2><p class="ka-value-lead">${escape(lead)}</p></div>
  <div class="ka-value-grid">${cards.map(({icon,title,text,accent})=>`<article class="ka-value-card${accent?' ka-value-accent':''}">${kairBenefitIcon(icon)}<h3>${escape(title)}</h3><p>${escape(text)}</p></article>`).join('')}</div>
  <div class="ka-value-hook"><h3>${escape(hook)}</h3><p>${escape(hookText)}</p></div>`;
}

export function renderKairSystem(){
 const contact=projectRequestHref('Запрос ЭРА: система управления КАИР');
 const content={'kair-value':renderBenefits(),...renderKairStage2()};
 return `<div class="story kair-system" data-kair-system>
  <nav class="ka-outline" data-kair-section-nav aria-label="Разделы страницы КАИР">
   <div class="ka-outline-track">${kairSections.map(([id,label])=>`<a href="#${id}">${label}</a>`).join('')}</div>
  </nav>
 <section class="ka-hero era-indigo-surface" data-page-progress-label="Система управления КАИР">
  <div class="ka-hero-copy">
   <p class="ka-hero-kicker">Контроль производства — свобода для роста.</p>
   <h1>Вы развиваете бизнес. <span>КАИР управляет линией.</span></h1>
   <p class="story-lead">Сохранённые ресурсы превращаются в прибыль предприятия, а время владельца — в новые возможности для компании.</p>
   <div class="actions">${button('Посмотреть экраны','#kair-screens')}${button('Обсудить систему',contact,true)}</div>
   <div class="ka-hero-tags"><span>На базе Siemens</span><span>Сепарация и мойка</span><span>По комплектации линии</span></div>
  </div>
  <img class="ka-hero-art" data-artwork-slot="kair-overview" src="/assets/kair/hero-line-control.webp"
   srcset="/assets/kair/hero-line-control-768.webp 768w, /assets/kair/hero-line-control.webp 1536w"
   sizes="(min-width:1785px) 1160px, (min-width:1024px) 65vw, (min-width:840px) 840px, 100vw"
   width="1536" height="1024" alt="Панель КАИР в цехе показывает загрузку, параметры, режимы, работу узлов, защитную реакцию и информацию для оператора"
   fetchpriority="high" decoding="async">
 </section>
 ${kairSections.map(([id,label,style=''])=>`<section class="ka-section${style?' '+style:''}" id="${id}" data-page-progress-label="${label}">${content[id]}</section>`).join('\n ')}
 <section class="ka-section ka-section-soft ka-contact-section" id="kair-contact" data-page-progress-label="Обсуждение проекта">
  ${renderKairContact(contact)}
 </section>
 </div>`;
}
