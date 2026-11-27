import {readFileSync} from 'node:fs';
import approved from '../../../content/kair/kair-stage2.json' with {type:'json'};
import {kairSlides,kairPresentation} from '../../../content/kair/kair.mjs';
import {kairFunctions,kairGroups,kairLogicModes} from '../../../content/kair/kair-system.mjs';
import {kairScenarios} from '../../../content/kair/kair-scenarios.mjs';
import {siteContacts} from '../../../content/pages/contacts/contact.mjs';
import {kairMonitor} from './kair.mjs';
import {kairIcon,kairBenefitIcon} from './kair-visuals.mjs';

export const kairShowcaseIds=['kair-01','kair-25','kair-26','kair-27','kair-28','kair-22','kair-24'];
const showcase=kairShowcaseIds.map(id=>kairSlides.find(slide=>slide.id===id));
const scopeLabel={both:'Сепарация и мойка',separation:'Сепарация',washing:'Мойка',equipment:'Автоматика узла'};
const sourceScenarios=new Map(kairScenarios.map(scenario=>[scenario.number,scenario]));
const sourceFunctions=new Map(kairFunctions.map(item=>[item.id,item]));
const groupIcons={process:'flow',protection:'shield',visibility:'screen',washing:'cycle',water:'water',local:'stack'};
const iconArrow=direction=>`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${direction==='prev'?'M19 12H5m6-6-6 6 6 6':'M5 12h14m-6-6 6 6-6 6'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const escape=text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const heading=(label,title,lead)=>`<div class="ka-stage-heading">
 <p class="eyebrow">КАИР${label?' / '+label:''}</p><h2>${title}</h2><p class="ka-stage-lead">${lead}</p>
</div>`;
const tab=(id,panel,active,copy,extra='')=>`<button type="button" role="tab" id="${id}" aria-controls="${panel}" aria-selected="${active}" tabindex="${active?0:-1}" data-ka-tab${extra}>${copy}</button>`;
const panel=(id,tabId,active,copy,extra='')=>`<div id="${id}" class="ka-panel" role="tabpanel" aria-labelledby="${tabId}"${active?'':' data-ka-inactive'}${extra}>${copy}</div>`;
const choice=(icon,label,sub='')=>`${kairIcon(icon)}<span><strong>${escape(label)}</strong>${sub?`<small>${escape(sub)}</small>`:''}</span>`;
const pager=(size,previous,next,dots=false)=>`<div class="ka-pager" data-ka-pager>
 <button type="button" data-ka-prev>${iconArrow('prev')}${previous}</button>
 <span class="ka-pager-count"><span data-ka-count aria-live="polite">1 из ${size}</span>${dots?`<span class="ka-pager-dots" aria-hidden="true">${Array.from({length:size},(_,index)=>`<i${index===0?' data-current':''}></i>`).join('')}</span>`:''}</span>
 <button type="button" data-ka-next>${next}${iconArrow('next')}</button>
</div>`;

function logic(){
 const stages=[['Данные','sensor'],['Алгоритм','controller'],['Действие','nodes'],['Контроль','screen']];
 return `${heading('ПРИНЦИП РАБОТЫ','От сигнала — к действию.','КАИР получает данные от оборудования, обрабатывает их по заданным алгоритмам и согласовывает работу производственных механизмов.')}
 <div class="ka-control-intro"><h3>Познакомьтесь с возможностями КАИР</h3><p>Выберите один из четырёх примеров работы системы.</p></div>
 <div data-kair-tabs>
  <div class="ka-choices ka-logic-choices" role="tablist" aria-label="Примеры работы КАИР">${approved.logic.map((mode,i)=>tab(
   'ka-logic-tab-'+mode.id,'ka-logic-'+mode.id,i===0,choice(mode.icon,mode.label,mode.sub))).join('')}</div>
  ${approved.logic.map((mode,i)=>{
   const source=kairLogicModes.find(example=>example.id===mode.id);
   return panel('ka-logic-'+mode.id,'ka-logic-tab-'+mode.id,i===0,`<div class="ka-logic-diagram" data-artwork-slot="kair-logic-${mode.id}" data-source-codes="${source.codes.join(' ')}">
    <p class="ka-technical-label">${escape(source.scope)}</p><h3>${escape(mode.title)}</h3>
    <ol class="ka-signal-stages">${mode.steps.map(([title,text],step)=>`<li>
     ${kairIcon(stages[step][1])}<span class="ka-technical-label">${stages[step][0]}</span><h4>${escape(title)}</h4><p>${escape(text)}</p>
    </li>`).join('')}</ol>
    <p class="ka-technical">${escape(source.text)}</p>
   </div><aside class="ka-stage-result"><h4>Что получает предприятие</h4><p>${escape(mode.benefit)}</p></aside>`);
  }).join('')}
  ${pager(4,'Назад','Следующий пример',true)}
 </div>`;
}

const scenarioNames=[
 'Вечер с семьёй','Ночная смена','Причины остановки','Знакомое сырьё','Сырьё после дождя','Стук измельчителя',
 'Отклонение в баллистике','Твёрдое включение','Сгусток плёнки','Остановка участка','Износ инструмента','Передача смены',
 'Обслуживание ветки','Подача порошка','Моющая среда','Температура мойки','Самоочистка центрифуг','Вывод включений',
 'Возврат жидкости','Подпитка водой','Мойка и ополаскивание','Отдельная партия','Продукция под заказ','Температура шкафов',
];
function scenarioCase(scenario,active){
 const s=sourceScenarios.get(scenario.number);
 return panel('ka-scenario-'+s.number,'ka-scenario-tab-'+s.number,active,`<div class="ka-case-heading">
  <span>${scopeLabel[s.scope]}</span><h3>${escape(scenario.title)}</h3><p>${escape(s.situation)}</p>
 </div>
 <div class="ka-case-compare">
  <article>${kairIcon('controls')}<h4>Без возможностей КАИР</h4><p>${escape(scenario.before)}</p></article>
  <article>${kairIcon('controller')}<h4>С системой КАИР</h4><p>${escape(s.action)}</p></article>
 </div>
 <aside class="ka-stage-result"><h4>${escape(scenario.hook)}</h4><p>${escape(s.benefit)}</p></aside>
 ${s.note?`<p class="ka-technical ka-case-note">${escape(s.note)}</p>`:''}`,
 ` data-kair-scenario="${s.number}" data-scope="${s.scope}" data-artwork-slot="kair-scenario-${String(s.number).padStart(2,'0')}"`);
}
function scenarios(){
 const icons=['screen','shield','stack','controls','cycle','water'];
 return `${heading('ПРАКТИЧЕСКИЕ СИТУАЦИИ','Одна ситуация. Два подхода.','24 практические ситуации — узнайте, как КАИР помогает решать задачи вашего предприятия.')}
 <div data-kair-tabs>
  <div class="ka-choices ka-case-categories" role="tablist" aria-label="Темы практических ситуаций">${approved.scenarioGroups.map(([id,label],i)=>tab(
   'ka-case-category-tab-'+id,'ka-case-category-'+id,i===0,choice(icons[i],label))).join('')}</div>
  ${approved.scenarioGroups.map(([id,label],i)=>{
   const cases=approved.scenarios.filter(s=>s.group===id);
   return panel('ka-case-category-'+id,'ka-case-category-tab-'+id,i===0,`<div data-kair-tabs>
    <div class="ka-case-options" role="tablist" aria-label="${escape(label)}">${cases.map((s,j)=>tab(
     'ka-scenario-tab-'+s.number,'ka-scenario-'+s.number,j===0,escape(scenarioNames[s.number-1]))).join('')}</div>
    ${cases.map((s,j)=>scenarioCase(s,j===0)).join('')}
    ${pager(cases.length,'Предыдущая','Следующая ситуация')}
   </div>`);
  }).join('')}
 </div>`;
}

function process(){
 const stationIcons=['flow','stack','cycle','nodes'];
 return `<div class="ka-route-intro">
 ${heading('СВЯЗЬ С ОБОРУДОВАНИЕМ','Как КАИР связывает оборудование в единый маршрут.','Система согласует переходы между участками линии, связывает сигналы и делает работу комплекса понятной для оператора и технолога.')}
 <ul><li>${kairIcon('flow')} Маршрут материала</li><li>${kairIcon('sensor')} Сигналы и переходы</li><li>${kairIcon('nodes')} Согласованная работа узлов</li></ul>
 </div>
 <p class="ka-select-note">Выберите пример линии, чтобы увидеть логику связанного маршрута.</p>
 <div data-kair-tabs>
  <div class="ka-choices ka-route-options" role="tablist" aria-label="Примеры производственных линий">${approved.process.map((map,i)=>tab(
   'ka-process-tab-'+map.id,'ka-process-'+map.id,i===0,choice(i===0?'flow':'water',map.label))).join('')}</div>
  ${approved.process.map((map,i)=>panel('ka-process-'+map.id,'ka-process-tab-'+map.id,i===0,`<div class="ka-material-route" data-artwork-slot="kair-process-${map.id}">
   <h3>${escape(map.title)}</h3>
   <ol class="ka-route-stations">${map.steps.map(([title,physical,kair],step)=>`<li>
    <div class="ka-station-icon">${kairIcon(stationIcons[step])}<span>${String(step+1).padStart(2,'0')}</span></div>
    <h4>${escape(title)}</h4><p>${escape(physical)}</p><p class="ka-station-role"><strong>КАИР</strong> ${escape(kair)}</p>
   </li>`).join('')}</ol>
   <div class="ka-route-coordinator"><div>${kairIcon('controller')}<strong>КАИР координирует маршрут, а не отдельный узел</strong></div></div>
   <ul class="ka-route-outcomes">${['Согласованность участков','Предсказуемость движения материала','Понятная логика для смены'].map(text=>`<li><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.4"/><path d="m7.4 12 3.2 3.2 6.2-6.2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${text}</span></li>`).join('')}</ul>
   ${map.water?`<div class="ka-water-circuits" data-artwork-slot="kair-water-circuits">
    <h4>Разные задачи — отдельные водные маршруты</h4>
    <ul><li>${kairIcon('cycle')}<span><strong>Возврат рабочей жидкости</strong>Шнеки и центрифуги отделяют жидкость. Локальные контуры возвращают её на предыдущие участки.</span></li>
     <li>${kairIcon('water')}<span><strong>Очистка и бак</strong>Стоки → очистка → бак возврата → основная мойка.</span></li>
     <li>${kairIcon('water')}<span><strong>Ополаскивание</strong>Чистая вода из резервуара → второй флотатор → ополаскивание.</span></li>
     <li>${kairIcon('controls')}<span><strong>Подпитка</strong>${escape(map.water[3][1])}. Состояние среды, температура, уровень и расход рассматриваются отдельно.</span></li></ul>
   </div>`:''}
  </div>`)).join('')}
 </div>`;
}

function stationBody(screen){
 return `<div class="ka-station-window">
  <div class="ka-station-plane" data-ka-station-plane>
   <img class="ka-station-photo" src="/assets/kair/operator-workplace.webp"
    srcset="/assets/kair/operator-workplace-960.webp 960w, /assets/kair/operator-workplace.webp 1824w"
    sizes="(max-width:1000px) 150vw, 100vw" width="1824" height="862" alt="" loading="lazy" decoding="async">
   <div class="ka-station-display">${screen}</div>
  </div>
 </div>
 <div class="ka-studio-name">${kairIcon('screen')}<strong>Интерфейс КАИР</strong><span>Реальные экраны на оборудовании</span></div>`;
}

function screens(){
 const points=[['screen','Общий экран линии и сигналы'],['controller','Управление приводами и направлениями'],
  ['controls','Настройки скоростей и доступные параметры'],['stack','Экраны отдельных узлов и всей линии']];
 return `<div class="ka-studio">
  <div class="ka-studio-copy">
   ${heading('','Настоящие экраны.<span>Реальная система управления.</span>','Интерфейс КАИР показывает линию и отдельные узлы в поле зрения оператора. Состояние приводов, доступные команды и настройки процесса отображаются на реальных экранах оборудования.')}
   <ul>${points.map(([icon,text])=>`<li><span>${kairIcon(icon)}</span>${text}</li>`).join('')}</ul>
   <p class="ka-technical">Состав экранов и доступных команд определяется исполнением линии.</p>
  </div>
  ${kairMonitor(showcase,{...kairPresentation,autoplay:false,compact:true,transitionMs:160,renderBody:stationBody})}
 </div>`;
}

const groupPositions={process:'top-left',protection:'top-right',visibility:'middle-right',washing:'bottom-right',water:'bottom-left',local:'middle-left'};
function functionOrbit(){
 return `<div class="ka-orbit-map">
  <svg class="ka-orbits" viewBox="0 0 600 480" preserveAspectRatio="none" aria-hidden="true">
   <defs><linearGradient id="ka-orbit-gold" x2="0" y2="1"><stop stop-color="#f4d58b"/><stop offset=".45" stop-color="#a97c2d"/><stop offset="1" stop-color="#e1bd6c"/></linearGradient></defs>
   <ellipse cx="300" cy="240" rx="187" ry="181" fill="none" stroke="url(#ka-orbit-gold)" stroke-width="3"/>
   <ellipse cx="300" cy="240" rx="212" ry="207" fill="none" stroke="#bb994e" stroke-opacity=".3"/>
   <ellipse cx="300" cy="240" rx="151" ry="150" fill="none" stroke="#b18a45" stroke-opacity=".27" stroke-dasharray="2 7"/>
   <g fill="none" stroke-linecap="round">
    <path data-ka-orbit="process" d="M135 84 300 240"/><path data-ka-orbit="protection" d="M465 84 300 240"/>
    <path data-ka-orbit="visibility" d="M508 240H300"/><path data-ka-orbit="washing" d="M465 396 300 240"/>
    <path data-ka-orbit="water" d="M135 396 300 240"/><path data-ka-orbit="local" d="M92 240H300"/>
   </g>
   <g fill="#d3a855"><circle cx="164" cy="112" r="4"/><circle cx="436" cy="112" r="4"/><circle cx="484" cy="240" r="4"/>
    <circle cx="436" cy="368" r="4"/><circle cx="164" cy="368" r="4"/><circle cx="116" cy="240" r="4"/></g>
  </svg>
  <div class="ka-orbit-core">${kairIcon('controller')}<strong>КАИР</strong><span>Единая система<br>управления</span></div>
  <div class="ka-orbit-tabs" role="tablist" aria-label="Функциональные направления">
   ${approved.functions.map(group=>tab('ka-function-tab-'+group.id,'kair-functions-'+group.id,group.id==='protection',
    choice(groupIcons[group.id],group.title,group.lead),` class="ka-orbit-${groupPositions[group.id]}" data-ka-direction="${group.id}"`)).join('')}
  </div>
 </div>`;
}

function functionRow(item){
 const f=sourceFunctions.get(item.id);
 return `<article class="ka-function-row" data-kair-function data-function-id="${f.id}" data-scope="${f.scope}" data-group="${f.group}" data-source-codes="${f.codes.join(' ')}">
  ${kairIcon(groupIcons[f.group])}<div><h4>${escape(item.title)}</h4><p class="ka-function-summary">${escape(item.summary)}</p></div>
 </article>`;
}
function functions(){
 return `<div class="ka-architecture-heading">
  ${heading('ФУНКЦИОНАЛЬНАЯ АРХИТЕКТУРА','Шесть направлений. Единая система управления.','29 функциональных возможностей для согласованной работы производственного комплекса.')}
  <dl><div>${kairIcon('stack')}<dd>29</dd><dt>функциональных возможностей</dt></div><div>${kairIcon('nodes')}<dd>6</dd><dt>направлений управления</dt></div></dl>
 </div>
 <div class="ka-architecture" data-kair-tabs data-ka-architecture data-direction="protection">
  ${functionOrbit()}
  <div class="ka-function-panels">${approved.functions.map(group=>panel('kair-functions-'+group.id,'ka-function-tab-'+group.id,group.id==='protection',
   `<div class="ka-function-direction">${kairIcon(groupIcons[group.id])}<div><h3>${escape(group.title)}</h3><p>${escape(kairGroups.find(item=>item.id===group.id).text)}</p></div></div>
   <div class="ka-function-rows">${group.items.map(functionRow).join('')}</div>
   <aside class="ka-function-result"><h4>Результат для предприятия</h4><p>${escape(group.result)}</p></aside>`,` data-kair-function-group="${group.id}"`)).join('')}</div>
 </div>`;
}

function hardware(){
 const types=['volume','sensor','load','water','camera','temperature'];
 const notes={
  'pH и дозирование':'Измерение pH и подача реагентов выполняются разными устройствами. Состав средств контроля и подачи определяется исполнением.',
 };
 return `${heading('ТЕХНИЧЕСКОЕ ОСНАЩЕНИЕ','Точность измерений. Интеллект управления.','Промышленная электроника, измерительные приборы и исполнительные механизмы объединены в систему контроля технологического процесса.')}
 <div class="ka-hardware-frame"><div class="ka-hardware-showcase">
  <div class="ka-hardware-core">
   <p class="ka-technical-label">Промышленная основа</p>
   ${approved.hardware.slice(0,2).map(([title,text],i)=>`<article data-kair-hardware>${kairIcon(i===0?'controller':'screen')}<div><h3>${escape(title)}</h3><p>${escape(text)}</p></div></article>`).join('')}
   <figure><img src="/assets/kair/08.webp" width="1440" height="1080" alt="Панель оператора Siemens SIMATIC HMI на оборудовании ЭРА" loading="lazy" decoding="async"><figcaption>Реальная панель оператора на оборудовании</figcaption></figure>
  </div>
  <div class="ka-hardware-instruments">${approved.hardware.slice(2).map(([title,text],i)=>`<article data-kair-hardware>
   ${kairIcon(types[i])}<h3>${escape(title)}</h3><p>${escape(text)}</p>${notes[title]?`<p class="ka-technical">${escape(notes[title])}</p>`:''}
  </article>`).join('')}</div>
 </div>
 <div class="ka-hardware-footer">
  <ol><li>${kairIcon('sensor')}Измерение</li><li>${kairIcon('controller')}Обработка</li><li>${kairIcon('nodes')}Управление</li></ol>
  <p>От точности сигнала — к точности управления.</p>
 </div></div>`;
}

const graph=readFileSync(new URL('../../../content/kair/kair-efficiency.svg',import.meta.url),'utf8').trim();
function efficiency(){
 const icons=['clock','shield','coins','eye'];
 return `<div class="ka-efficiency-layout">
  <div class="ka-efficiency-main">
   ${heading('ЭФФЕКТИВНОСТЬ БИЗНЕСА','Интеллект производства.<br><span>Капитал вашего бизнеса.</span>','Ценность автоматизации измеряется не количеством функций, а тем, что она помогает сохранить и приумножить.')}
   <figure class="ka-graph" data-ka-graph role="img" aria-label="Схематичная иллюстрация экономического потенциала">${graph}</figure>
  </div>
  <div class="ka-efficiency-benefits">${approved.benefits.map(([label,title,text],i)=>`<article>${kairBenefitIcon(icons[i])}<div>
   <span>${escape(label)}</span><h3>${escape(title)}</h3><p>${escape(text)}${i===2?' Согласование операций помогает оптимизировать трудозатраты.':i===3?' Возможности наблюдения определяются конфигурацией.':''}</p>
  </div></article>`).join('')}</div>
 </div>
 <aside class="ka-efficiency-finale"><h3>Производство работает. Вы развиваете бизнес.</h3><p>КАИР помогает превратить технологическое преимущество в экономическое.</p></aside>`;
}

export function renderKairStage2(){
 return {
  'kair-logic':logic(),'kair-scenarios':scenarios(),'kair-process':process(),'kair-screens':screens(),
  'kair-functions':functions(),'kair-hardware':hardware(),'kair-project':efficiency(),
 };
}

export function renderKairContact(contactHref){
 const c=approved.contact;
 return `<div class="ka-project-contact">
  <div class="ka-project-contact-copy">
   <p class="eyebrow">${escape(c.kicker)}</p>
   <h2>${escape(c.title)} <span>${escape(c.accent)}</span></h2>
   <p class="ka-project-contact-lead">${escape(c.lead)}</p><p>${escape(c.body)}</p>
   <a class="button" href="${escape(contactHref)}">${escape(c.cta)}<span aria-hidden="true">↗</span></a>
   <div class="ka-project-contact-links"><a href="${escape(siteContacts.phoneHref)}">${escape(siteContacts.phone)}</a>
    <a href="mailto:${escape(siteContacts.email)}">${escape(siteContacts.email)}</a></div>
  </div>
  <figure class="ka-project-contact-art"><div class="ka-contact-plate"><picture><source media="(max-width:767px)" srcset="/assets/kair/business-contact-960.webp">
   <img src="/assets/kair/business-contact.webp" srcset="/assets/kair/business-contact-960.webp 960w, /assets/kair/business-contact.webp 1671w" sizes="(max-width:1150px) 100vw, 62vw" width="1671" height="941" alt="Иллюстрация рабочего места руководителя с панорамой промышленной площадки" loading="lazy" decoding="async">
  </picture><span class="ka-contact-screen-label">${escape(c.screenLabel)}</span></div></figure>
 </div>`;
}
