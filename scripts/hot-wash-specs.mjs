import {hotWashSpecification} from '../content/hot-film-washing.mjs';
import {formatLineNumber as fmt,lineMetric,linePowerData,linePowerTotals} from '../content/line-engineering.mjs';
import {lineSpecIcon as icon,lineSpecMetric as metric,lineSpecFact as fact,lineSpecStaff as staff} from './base-specs.mjs';
import {escapeHtml} from './hot-wash-media.mjs';

const groups=[
 [1,12,'Подготовка и подача'],[13,19,'Мокрая обработка'],[20,29,'Выдача продукции'],
 [30,35,'Водооборот и управление'],[36,37,'Проектное размещение']
];
const sourceParameters={
 16:'Остаточная влажность 0,8% в проектной спецификации. До 3% по паспорту отдельного исполнения на согласованном материале и режиме.',
 26:'Обезвоживание до 5–7% и капсуляция («термодеструкция» в проектной спецификации) для указанного исполнения.'
};
const periods=[[24,'За сутки','24 ч'],[720,'За 30 суток','720 ч'],[8760,'За год','8 760 ч']];

function renderSpecification(powers,totals){
 const powerByPosition=new Map(powers.map(row=>[row.position,row]));
 const bodies=groups.map(([first,last,title])=>`<tbody>
  <tr class="line-power-group"><th scope="rowgroup" colspan="8">${title}</th></tr>
  ${hotWashSpecification.slice(first-1,last).map(({position,name,quantity,characteristic})=>{
   const power=powerByPosition.get(position);
   const number=String(position).padStart(2,'0');
   const control=position===37
    ? `<a class="text-link" href="#placement" aria-label="Позиция 37, размещение цеха">${number}</a>`
    : `<button type="button" data-hotwash-select="${position}" aria-label="Показать позицию ${position} на схеме">${number}</button>`;
   const values=[power?.installed_unit_kw,power?.installed_total_kw,power?.calculated_unit_kw,power?.calculated_total_kw];
   return `<tr data-hotwash-position="${position}"${power?` data-power-position="${position}"`:''}>
    <td>${control}</td><th scope="row">${escapeHtml(name)}</th><td>${escapeHtml(characteristic)}${sourceParameters[position]?`<small>${sourceParameters[position]}</small>`:''}</td><td>${quantity}</td>
    ${values.map(value=>`<td class="line-power-number">${value==null?'—':fmt(value)}</td>`).join('')}
   </tr>`;
  }).join('')}
 </tbody>`).join('');
 return `<details class="line-more line-power-details" data-keep-open>
  <summary><span class="base-spec-summary-icon">${icon('list')}</span><span class="base-spec-summary-copy"><strong>Техническая спецификация</strong><small>37 проектных позиций · параметры оборудования · электрическая ведомость</small></span></summary>
  <div class="base-spec-details-body">
   <p class="line-note">Выберите позиции 1–36 для подсветки на схеме. Позиция 36 — вилочный погрузчик, 37 — помещение цеха. Границы поставки определяет спецификация.</p>
   <div class="table-wrap line-power-scroll hw-table-scroll" role="region" aria-label="Техническая спецификация и электрическая ведомость" tabindex="0">
    <table class="line-power-table hw-spec-table">
     <caption>Проектная спецификация и электрическая ведомость. «—» означает, что значение отдельно не указано.</caption>
     <colgroup span="4"></colgroup><colgroup span="2"></colgroup><colgroup span="2"></colgroup>
     <thead><tr><th scope="col" rowspan="2">Поз.</th><th scope="col" rowspan="2">Оборудование</th><th scope="col" rowspan="2">Основные параметры</th><th scope="col" rowspan="2">Кол.</th><th scope="colgroup" colspan="2">Установленная</th><th scope="colgroup" colspan="2">Расчётная, 70%</th></tr>
      <tr><th scope="col">кВт/ед.</th><th scope="col">Всего, кВт</th><th scope="col">кВт/ед.</th><th scope="col">Всего, кВт</th></tr></thead>
     ${bodies}
     <tfoot><tr><th scope="row" colspan="4">Всего по линии</th><td>—</td><td>${fmt(totals.installed,true)}</td><td>—</td><td>${fmt(totals.calculated,true)}</td></tr></tfoot>
    </table>
   </div>
   <p class="line-note">В проектной ведомости установлено 55 кВт на измельчитель и 22 кВт на центрифугу. Расчётная мощность двух измельчителей — 77 кВт, трёх центрифуг — 46,2 кВт. В паспортах отдельных исполнений указано 77,5 и 37,6 кВт на узел соответственно.</p>
  </div>
 </details>`;
}

function operatingFacts(data){
 return [
  ['bunkers','2 × 4,7 <small>м³</small>','Бункеры-накопители'],
  ['mills','2 ветки','Мокрое измельчение','Ветки работают поочерёдно'],
  ['flotators','2 флотатора','700–1 200 кг/ч на отдельный узел'],
  ['centrifuges','3 центрифуги','1 000 кг/ч на отдельный узел'],
  ['bale','700 <small>кг</small>','Масса тюка по проекту'],
  ['routes','3 формы','Тюки, капсулят или гранула'],
  ['water','20 <small>м³</small>','Резервуар чистой воды'],
  ['treatment','25 <small>м³/ч</small>','Очистка стоков','Ёмкость комплекса 4 м³'],
  ['clean-water','20 <small>м³</small>','Бак очищенных стоков'],
  ['positions',hotWashSpecification.length+' позиций','Проектная спецификация'],
  ['conveyors',`${data.groups.belt.quantity} + ${data.groups.screw.quantity}`,'Ленточные и шнековые транспортёры'],
  ['space','2 244 <small>м²</small>','Площадь цеха по проекту','Высота 9 м'],
  ['operation','24/7','Расчётный режим работы']
 ].map(args=>fact(...args)).join('');
}

export function renderHotWashSpecs(line){
 const data=linePowerData[line.slug];
 const totals=linePowerTotals(line.slug),load=fmt(data.load_factor*100);
 const input=lineMetric(line,['Входной поток'],'кг/ч').value;
 const granuleRate=Number(lineMetric(line,['Выпуск гранулы'],'кг/ч').value);
 return `<div class="base-specs" data-hotwash-specs>
  <div class="base-spec-heading"><p class="eyebrow">ПРОИЗВОДИТЕЛЬНОСТЬ И РЕСУРСЫ · HOT-WASH</p><h2>Производственные характеристики</h2><p>Параметры подачи подготовленной плёнки и выпуска по выбранному маршруту.</p></div>
  <div class="base-spec-kpis">
   ${metric('input','до '+input,'кг/ч','Подготовленная плёнка','Проектная подача')}
   ${metric('output',granuleRate,'кг/ч','Полиэтиленовая гранула','Номинал одного гранулятора')}
   ${metric('power',fmt(totals.installed,true),'кВт','Установленная мощность','По сводной ведомости')}
   ${metric('gauge',fmt(totals.calculated,true),'кВт','Расчётная мощность',load+'% установленной мощности')}
  </div>
  <div class="base-spec-output era-indigo-surface"><p class="eyebrow">ПРОИЗВОДСТВЕННЫЙ ПОТЕНЦИАЛ</p><h3>Выпуск гранулы одним гранулятором</h3>
   <dl>${periods.map(([hours,label,duration])=>`<div data-base-output-hours="${hours}"><dt>${label} · ${duration}</dt><dd>${fmt(granuleRate*hours/1000)} <small>т</small></dd></div>`).join('')}</dl>
   <p>Расчёт по номиналу ${fmt(granuleRate)} кг/ч при работе без остановок. Фактический выпуск зависит от состава и влажности плёнки, потерь и рабочего режима.</p>
  </div>
  <div class="line-routing hw-scaling"><div class="line-routing-main"><p class="eyebrow">МАСШТАБИРОВАНИЕ</p><h3>Две сухие линии → одна мойка → два гранулятора</h3><p>До 1,5 т/ч гранулы при достаточной подаче, подтверждённой пропускной способности и установке второго гранулятора. Материальный баланс проверяют с учётом влажности, потерь, простоев и требований покупателя. Электрическую мощность для расширенной комплектации рассчитывают отдельно.</p></div></div>
  <div class="base-spec-lower">
   <div class="base-spec-efficiency"><h3 class="eyebrow">ЭНЕРГЕТИЧЕСКИЕ РЕСУРСЫ</h3><div class="base-spec-energy-grid">
    ${fact('energy-output',fmt(totals.calculated*1000/granuleRate,true)+' <small>кВт·ч/т</small>','На тонну номинального выпуска гранулы')}
    ${periods.map(([hours,label])=>fact('energy-'+hours,fmt(totals.calculated*hours/1000,true)+' <small>МВт·ч</small>',label)).join('')}
   </div><p class="base-spec-note">Условные значения при сводной нагрузке ${fmt(totals.calculated,true)} кВт и номинальном выпуске ${fmt(granuleRate)} кг/ч. Ведомость учитывает обе ветки резки, водооборот и все три маршрута выдачи. Фактическое потребление измеряют в выбранном режиме.</p></div>
   <div class="base-spec-staff"><h3 class="eyebrow">ПЕРСОНАЛ</h3><div class="base-spec-staff-total"><div><strong>3</strong><span>человека в смену</span></div><div class="base-spec-people" aria-hidden="true">${icon('person').repeat(3)}</div></div>
    <div class="base-spec-staff-roles">${staff(1,'Оператор','Управление линией через КАИР и контроль технологического процесса.')}${staff(2,'Водителя погрузчика','Подача тюков, перемещение готовой продукции и биг-бэгов.')}</div>
   </div>
  </div>
  <div class="base-spec-facts" aria-label="Дополнительные характеристики">${operatingFacts(data)}</div>
  ${renderSpecification(data.rows,totals)}
 </div>`;
}
