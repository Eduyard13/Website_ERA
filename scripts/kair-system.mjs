import kairBenefits from '../content/kair-benefits.json' with {type:'json'};
import {kairSystem,kairGroups,kairFunctions,kairLogicModes,kairHardware,kairBusinessBenefits,kairProcessMaps} from '../content/kair-system.mjs';
import {kairScenarios} from '../content/kair-scenarios.mjs';
import {siteContacts} from '../content/contact.mjs';
import {projectRequestHref} from './contact.mjs';
import {kairMonitor} from './kair.mjs';
import {kairIcon,kairBenefitIcon,kairLogicGraphic,kairProcessGraphic} from './kair-visuals.mjs';

const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<span aria-hidden="true">↗</span>';
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const scopeLabel={both:'Сепарация и мойка',separation:'Сепарация',washing:'Мойка',equipment:'Автоматика узла'};
const heading=(title,text)=>`<div class="ka-section-heading"><div><p class="eyebrow">КАИР</p><h2>${title}</h2></div>${text?`<p>${text}</p>`:''}</div>`;
function functionCard(f){return `<article class="ka-function" data-kair-function data-function-id="${f.id}" data-scope="${f.scope}" data-group="${f.group}" data-source-codes="${f.codes.join(' ')}" data-search="${escape([f.title,f.text,f.detail].join(' ').toLocaleLowerCase('ru-RU'))}"><div class="ka-function-tags"><span>${scopeLabel[f.scope]}</span>${f.level==='project'?'<span>По исполнению</span>':f.level==='local'?'<span>Собственный цикл узла</span>':''}</div><h4>${f.title}</h4><p>${f.text}</p>${f.detail?`<p class="ka-function-detail">${f.detail}</p>`:''}</article>`;}
function scenarioCard(s){return `<details class="ka-scenario" data-keep-open data-kair-scenario="${s.number}"><summary><span class="ka-scenario-topline">${scopeLabel[s.scope]}</span><h3>${s.title}</h3><span class="ka-scenario-benefit">${s.benefit}</span><span class="ka-scenario-open">Как это работает <span aria-hidden="true">+</span></span></summary><div class="ka-scenario-content" data-artwork-slot="kair-scenario-${String(s.number).padStart(2,'0')}"><div><h4>Ситуация</h4><p>${s.situation}</p></div><div><h4>Действие системы и персонала</h4><p>${s.action}</p></div>${s.note?`<p class="ka-scenario-note">${s.note}</p>`:''}</div></details>`;}
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
 const content={
  'kair-value':renderBenefits(),
  'kair-logic':`${heading('Интеллект —<br>в согласованных действиях.','Контролируемый параметр, заданный алгоритм и предусмотренная реакция связываются в понятную рабочую логику.')}<div class="ka-tabs-block" data-kair-tabs><div class="ka-tabs" role="tablist" aria-label="Примеры логики КАИР">${kairLogicModes.map((m,i)=>`<button type="button" role="tab" id="ka-logic-tab-${m.id}" aria-controls="ka-logic-${m.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-ka-tab>${m.label}</button>`).join('')}</div>${kairLogicModes.map((m,i)=>`<div id="ka-logic-${m.id}" role="tabpanel" aria-labelledby="ka-logic-tab-${m.id}"${i?' hidden':''}>${kairLogicGraphic(m)}</div>`).join('')}</div><p class="ka-note">Показана схема принципа работы. Уставки, фактические последовательности приводов и порядок восстановления закрепляются для конкретного оборудования.</p>`,
  'kair-scenarios':`${heading('Ситуации,<br>знакомые производству.','Типовые сценарии объясняют, как функции могут помогать в работе. Реакции и доступные возможности согласуются по комплектации.')}<div class="ka-scenario-grid">${kairScenarios.filter(s=>s.featured).map(scenarioCard).join('')}</div><details class="ka-more-scenarios" data-keep-open><summary>Ещё ${kairScenarios.filter(s=>!s.featured).length} практических ситуаций</summary><div class="ka-scenario-grid">${kairScenarios.filter(s=>!s.featured).map(scenarioCard).join('')}</div></details>`,
  'kair-process':`${heading('Отдельные механизмы.<br>Общий производственный маршрут.','Система увязывается с оборудованием, местной автоматикой и работой смены. Набор сигналов и команд определяется проектом.')}<div class="ka-tabs-block" data-kair-tabs><div class="ka-tabs" role="tablist" aria-label="Управление по линии">${kairProcessMaps.map((m,i)=>`<button type="button" role="tab" id="ka-process-tab-${m.id}" aria-controls="ka-process-${m.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-ka-tab>${m.label}</button>`).join('')}</div>${kairProcessMaps.map((m,i)=>`<div class="ka-process-panel" id="ka-process-${m.id}" role="tabpanel" aria-labelledby="ka-process-tab-${m.id}"${i?' hidden':''}><div><h3>${m.title}</h3><p>${m.intro}</p></div>${kairProcessGraphic(m)}<a class="text-link" href="${m.link}">${m.linkText} ${arrow}</a></div>`).join('')}</div>`,
  'kair-screens':`${heading('Настоящие экраны.<br>Реальная система управления.','Фотографии интерфейса КАИР на оборудовании. Листайте вручную или откройте оригиналы на весь экран.')}<div class="ka-screen-layout"><div><h3>Линия и отдельный узел — в поле зрения.</h3><p>Обзор механизмов, состояние приводов и настройки процесса помогают оператору работать с конкретным участком.</p><ul><li>Общий экран оборудования и сигналы</li><li>Управление показанными приводами и направлениями</li><li>Настройки скоростей и доступные параметры</li><li>Экраны роторного узла и всей линии</li></ul><p class="ka-note">Состав экранов и доступных команд определяется исполнением. Память режимов и журнал входят в состав функций соответствующего исполнения линии.</p><a class="text-link" href="#kair-scenarios">Как это помогает в работе ${arrow}</a></div>${kairMonitor()}</div>`,
  'kair-functions':`${heading('Функции —<br>по задачам вашей линии.',kairSystem.scopeNote)}<form class="ka-function-controls" data-kair-function-form role="search"><label for="ka-function-search">Найти функцию<input id="ka-function-search" type="search" name="q" placeholder="Например: журнал, реверс или дозирование" data-kair-function-search></label><div class="ka-scope-controls" role="group" aria-label="Функции по составу оборудования">${[['all','Все'],['separation','Сепарация'],['washing','Мойка'],['equipment','Автоматика узлов']].map(([id,title],i)=>`<button type="button" data-kair-scope="${id}" aria-pressed="${i===0}">${title}</button>`).join('')}</div><button type="reset" class="ka-reset">Сбросить</button></form><p class="ka-function-result" data-kair-function-result role="status" aria-live="polite">${kairFunctions.length} описаний в ${kairGroups.length} группах</p><div class="ka-function-groups">${kairGroups.map((g,i)=>`<details class="ka-function-group" id="kair-functions-${g.id}" data-keep-open data-kair-function-group="${g.id}"${i===0?' open':''}><summary>${kairIcon(g.icon)}<span><strong>${g.title}</strong><span>${g.text}</span></span><b data-kair-group-count>${kairFunctions.filter(f=>f.group===g.id).length}</b></summary><div class="ka-function-grid">${kairFunctions.filter(f=>f.group===g.id).map(functionCard).join('')}</div></details>`).join('')}</div><p class="ka-empty" data-kair-function-empty hidden>По этим условиям ничего не найдено. Измените запрос или сбросьте фильтры.</p><p class="ka-note">Функции мойки уточняются по актуальному исполнению и карте сигналов. Собственные циклы пресса, рамы и гранулятора показаны отдельно от функций общего управления.</p><noscript><p class="ka-note">Все группы доступны ниже. Для поиска и фильтров включите JavaScript.</p></noscript>`,
  'kair-hardware':`${heading('Из чего складывается<br>контроль оборудования.','Датчики шума, вибрации и перегрузки контролируют состояние оборудования. pH-контроль и дозаторы управляют моющей средой.')}<div class="ka-hardware-grid">${kairHardware.map(([title,value,text])=>`<article><span>${title}</span><h3>${value}</h3><p>${text}</p></article>`).join('')}</div>`,
  'kair-project':`
  ${heading('КАИР работает на<br>рентабельность вашего бизнеса.','Автоматизированная система искусственного интеллекта КАИР сохраняет рабочее время, сокращает расходы и освобождает ресурсы для развития предприятия.')}
  <div class="ka-business-grid">${kairBusinessBenefits.map(b=>`<article class="ka-business-card">${kairIcon(b.icon)}<h3>${b.title}</h3><p>${b.text}</p></article>`).join('')}</div>
 `,
 };
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
  <div class="ka-business-result era-indigo-surface">
   <div>
    <h3>КАИР. <span>Согласованная работа вашей линии.</span></h3>
    <p>Связывает оборудование в общий процесс, сохраняет подобранные режимы, реагирует на контролируемые отклонения и даёт доступ к состоянию линии вне цеха.</p>
   </div>
   <div class="ka-business-contact">
    ${button('Связаться с нами',contact)}
    <a class="text-link" href="/economics">Экономика проекта ${arrow}</a>
    <a href="${escape(siteContacts.phoneHref)}">${escape(siteContacts.phone)}</a>
    <a href="mailto:${escape(siteContacts.email)}">${escape(siteContacts.email)}</a>
   </div>
  </div>
 </section>
 </div>`;
}
