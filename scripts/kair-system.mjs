import {kairSystem,kairGroups,kairFunctions,kairLogicModes,kairHardware,kairBusinessBenefits,kairProcessMaps} from '../content/kair-system.mjs';
import {kairScenarios} from '../content/kair-scenarios.mjs';
import {siteContacts} from '../content/contact.mjs';
import {projectRequestHref} from './contact.mjs';
import {kairMonitor} from './kair.mjs';
import {kairIcon,kairLogicGraphic,kairProcessGraphic} from './kair-visuals.mjs';

const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrow='<span aria-hidden="true">↗</span>';
const button=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const scopeLabel={both:'Сепарация и мойка',separation:'Сепарация',washing:'Мойка',equipment:'Автоматика узла'};
const heading=(title,text)=>`<div class="ka-section-heading"><div><p class="eyebrow">КАИР</p><h2>${title}</h2></div>${text?`<p>${text}</p>`:''}</div>`;
function functionCard(f){return `<article class="ka-function" data-kair-function data-function-id="${f.id}" data-scope="${f.scope}" data-group="${f.group}" data-source-codes="${f.codes.join(' ')}" data-search="${escape([f.title,f.text,f.detail].join(' ').toLocaleLowerCase('ru-RU'))}"><div class="ka-function-tags"><span>${scopeLabel[f.scope]}</span>${f.level==='project'?'<span>По исполнению</span>':f.level==='local'?'<span>Собственный цикл узла</span>':''}</div><h4>${f.title}</h4><p>${f.text}</p>${f.detail?`<p class="ka-function-detail">${f.detail}</p>`:''}</article>`;}
function scenarioCard(s){return `<details class="ka-scenario" data-keep-open data-kair-scenario="${s.number}"><summary><span class="ka-scenario-topline">${scopeLabel[s.scope]}</span><h3>${s.title}</h3><span class="ka-scenario-benefit">${s.benefit}</span><span class="ka-scenario-open">Как это работает <span aria-hidden="true">+</span></span></summary><div class="ka-scenario-content" data-artwork-slot="kair-scenario-${String(s.number).padStart(2,'0')}"><div><h4>Ситуация</h4><p>${s.situation}</p></div><div><h4>Действие системы и персонала</h4><p>${s.action}</p></div>${s.note?`<p class="ka-scenario-note">${s.note}</p>`:''}</div></details>`;}
export function renderKairSystem(){
 const contact=projectRequestHref('Запрос ЭРА: система управления КАИР');
 return `<div class="story kair-system" data-kair-system>
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
 <nav class="ka-outline" aria-label="Разделы страницы КАИР"><a href="#kair-value">Польза</a><a href="#kair-screens">Реальные экраны</a><a href="#kair-logic">Логика действий</a><a href="#kair-functions">Функции</a><a href="#kair-process">Связь с оборудованием</a><a href="#kair-scenarios">Практические ситуации</a><a href="#kair-hardware">Оснащение</a><a href="#kair-project">Выгода для бизнеса</a></nav>

 <section class="ka-section" id="kair-value">${heading('Видеть процесс.<br>Сохранять рабочее время.','Контроль линии связывается с задачами владельца, технолога и смены: понимать состояние, повторять настройки и готовить нужное действие.')}<div class="ka-value-grid">${kairGroups.map(g=>`<a class="ka-value-card" href="#kair-functions-${g.id}" data-kair-group-link="${g.id}">${kairIcon(g.icon)}<h3>${g.title}</h3><p>${g.text}</p><span>Посмотреть функции ${arrow}</span></a>`).join('')}</div></section>

 <section class="ka-section ka-section-soft" id="kair-screens">${heading('Настоящие экраны.<br>Реальная система управления.','Фотографии интерфейса КАИР на оборудовании. Листайте вручную или откройте оригиналы на весь экран.')}<div class="ka-screen-layout"><div><h3>Линия и отдельный узел — в поле зрения.</h3><p>Обзор механизмов, состояние приводов и настройки процесса помогают оператору работать с конкретным участком.</p><ul><li>Общий экран оборудования и сигналы</li><li>Управление показанными приводами и направлениями</li><li>Настройки скоростей и доступные параметры</li><li>Экраны роторного узла и всей линии</li></ul><p class="ka-note">Состав экранов и доступных команд определяется исполнением. Память режимов и журнал входят в состав функций соответствующего исполнения линии.</p><a class="text-link" href="#kair-scenarios">Как это помогает в работе ${arrow}</a></div>${kairMonitor()}</div></section>

 <section class="ka-section" id="kair-logic">${heading('Интеллект —<br>в согласованных действиях.','Контролируемый параметр, заданный алгоритм и предусмотренная реакция связываются в понятную рабочую логику.')}<div class="ka-tabs-block" data-kair-tabs><div class="ka-tabs" role="tablist" aria-label="Примеры логики КАИР">${kairLogicModes.map((m,i)=>`<button type="button" role="tab" id="ka-logic-tab-${m.id}" aria-controls="ka-logic-${m.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-ka-tab>${m.label}</button>`).join('')}</div>${kairLogicModes.map((m,i)=>`<div id="ka-logic-${m.id}" role="tabpanel" aria-labelledby="ka-logic-tab-${m.id}"${i?' hidden':''}>${kairLogicGraphic(m)}</div>`).join('')}</div><p class="ka-note">Показана схема принципа работы. Уставки, фактические последовательности приводов и порядок восстановления закрепляются для конкретного оборудования.</p></section>

 <section class="ka-section ka-section-soft" id="kair-functions">${heading('Функции —<br>по задачам вашей линии.',kairSystem.scopeNote)}<form class="ka-function-controls" data-kair-function-form role="search"><label for="ka-function-search">Найти функцию<input id="ka-function-search" type="search" name="q" placeholder="Например: журнал, реверс или дозирование" data-kair-function-search></label><div class="ka-scope-controls" role="group" aria-label="Функции по составу оборудования">${[['all','Все'],['separation','Сепарация'],['washing','Мойка'],['equipment','Автоматика узлов']].map(([id,title],i)=>`<button type="button" data-kair-scope="${id}" aria-pressed="${i===0}">${title}</button>`).join('')}</div><button type="reset" class="ka-reset">Сбросить</button></form><p class="ka-function-result" data-kair-function-result role="status" aria-live="polite">${kairFunctions.length} описаний в ${kairGroups.length} группах</p><div class="ka-function-groups">${kairGroups.map((g,i)=>`<details class="ka-function-group" id="kair-functions-${g.id}" data-keep-open data-kair-function-group="${g.id}"${i===0?' open':''}><summary>${kairIcon(g.icon)}<span><strong>${g.title}</strong><span>${g.text}</span></span><b data-kair-group-count>${kairFunctions.filter(f=>f.group===g.id).length}</b></summary><div class="ka-function-grid">${kairFunctions.filter(f=>f.group===g.id).map(functionCard).join('')}</div></details>`).join('')}</div><p class="ka-empty" data-kair-function-empty hidden>По этим условиям ничего не найдено. Измените запрос или сбросьте фильтры.</p><p class="ka-note">Функции мойки уточняются по актуальному исполнению и карте сигналов. Собственные циклы пресса, рамы и гранулятора показаны отдельно от функций общего управления.</p><noscript><p class="ka-note">Все группы доступны ниже. Для поиска и фильтров включите JavaScript.</p></noscript></section>

 <section class="ka-section" id="kair-process">${heading('Отдельные механизмы.<br>Общий производственный маршрут.','Система увязывается с оборудованием, местной автоматикой и работой смены. Набор сигналов и команд определяется проектом.')}<div class="ka-tabs-block" data-kair-tabs><div class="ka-tabs" role="tablist" aria-label="Управление по линии">${kairProcessMaps.map((m,i)=>`<button type="button" role="tab" id="ka-process-tab-${m.id}" aria-controls="ka-process-${m.id}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-ka-tab>${m.label}</button>`).join('')}</div>${kairProcessMaps.map((m,i)=>`<div class="ka-process-panel" id="ka-process-${m.id}" role="tabpanel" aria-labelledby="ka-process-tab-${m.id}"${i?' hidden':''}><div><h3>${m.title}</h3><p>${m.intro}</p></div>${kairProcessGraphic(m)}<a class="text-link" href="${m.link}">${m.linkText} ${arrow}</a></div>`).join('')}</div></section>

 <section class="ka-section ka-section-soft" id="kair-scenarios">${heading('Ситуации,<br>знакомые производству.','Типовые сценарии объясняют, как функции могут помогать в работе. Реакции и доступные возможности согласуются по комплектации.')}<div class="ka-scenario-grid">${kairScenarios.filter(s=>s.featured).map(scenarioCard).join('')}</div><details class="ka-more-scenarios" data-keep-open><summary>Ещё ${kairScenarios.filter(s=>!s.featured).length} практических ситуаций</summary><div class="ka-scenario-grid">${kairScenarios.filter(s=>!s.featured).map(scenarioCard).join('')}</div></details></section>

 <section class="ka-section" id="kair-hardware">${heading('Из чего складывается<br>контроль оборудования.','Датчики шума, вибрации и перегрузки контролируют состояние оборудования. pH-контроль и дозаторы управляют моющей средой.')}<div class="ka-hardware-grid">${kairHardware.map(([title,value,text])=>`<article><span>${title}</span><h3>${value}</h3><p>${text}</p></article>`).join('')}</div></section>

 <section class="ka-section ka-section-soft" id="kair-project">
  ${heading('КАИР работает на<br>рентабельность вашего бизнеса.','Автоматизированная система искусственного интеллекта КАИР сохраняет рабочее время, сокращает расходы и освобождает ресурсы для развития предприятия.')}
  <div class="ka-business-grid">${kairBusinessBenefits.map(b=>`<article class="ka-business-card">${kairIcon(b.icon)}<h3>${b.title}</h3><p>${b.text}</p></article>`).join('')}</div>
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
