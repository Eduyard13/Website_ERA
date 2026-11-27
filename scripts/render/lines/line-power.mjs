import {dryFilmOutputLabels,formatLineNumber,lineMetric,linePowerData,linePowerTotals} from '../../../content/lines/shared/line-engineering.mjs';

const groupLabels={equipment:'Основные узлы',belt:'Ленточные транспортёры',screw:'Шнековые транспортёры'};
const periodLabels={1:'1 час',24:'1 сутки',720:'30 суток',8760:'365 суток'};
const tableHeaders=['Поз.','Оборудование и размеры','Кол.','кВт/ед.','Всего, кВт','кВт/ед.','Всего, кВт'];
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function rowName(name){
 // The schedule records L/W in metres and includes the source area. Preserve every dimension.
 return name.replace(/L(\d[\d,]*)м?\s*[xх]\s*W(\d[\d,]*)м?\s*=\s*(\d[\d,]*)\s*м2/gu,'· $1 × $2 м · $3 м²')
  .replaceAll('Рама - наполнитель','Рама-наполнитель').replaceAll('Рольганг двух поточный','Рольганг двухпоточный');
}

function powerCells(row){
 const values=[row.installed_unit_kw,row.installed_total_kw,row.calculated_unit_kw,row.calculated_total_kw];
 return values.map(value=>`<td class="line-power-number">${value===null?'—':formatLineNumber(value)}</td>`).join('');
}

function powerTable(data,totals){
 const sections=Object.entries(data.groups).map(([group,subtotal])=>{
  const rows=data.rows.filter(row=>row.group===group);
  return `<tbody data-power-group="${group}">
   <tr class="line-power-group"><th scope="rowgroup" colspan="7">${groupLabels[group]}</th></tr>
   ${rows.map(row=>`<tr data-power-position="${row.position}"><td>${row.position}</td><th scope="row">${escape(rowName(row.name))}</th><td>${row.quantity}</td>${powerCells(row)}</tr>`).join('')}
   <tr class="line-power-subtotal"><th scope="row" colspan="2">Итого по группе</th><td>${subtotal.quantity}</td><td>—</td><td>${formatLineNumber(subtotal.installed_kw)}</td><td>—</td><td>${formatLineNumber(subtotal.calculated_kw)}</td></tr>
  </tbody>`;
 }).join('');
 return `<div class="table-wrap line-power-scroll" role="region" aria-label="Электрическая ведомость по позициям" tabindex="0">
  <table class="line-power-table line-power-components">
   <caption>Электрическая ведомость комплектации</caption>
   <colgroup span="3"></colgroup><colgroup span="2"></colgroup><colgroup span="2"></colgroup>
   <thead><tr>${tableHeaders.slice(0,3).map(label=>`<th scope="col" rowspan="2">${label}</th>`).join('')}<th scope="colgroup" colspan="2">Установленная</th><th scope="colgroup" colspan="2">Расчётная</th></tr>
   <tr>${tableHeaders.slice(3).map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead>
   ${sections}
   <tfoot><tr><th scope="row" colspan="3">Всего по линии</th><td>—</td><td>${formatLineNumber(totals.installed)}</td><td>—</td><td>${formatLineNumber(totals.calculated)}</td></tr></tfoot>
  </table></div>`;
}

export function linePower(line, {note=''}={}){
 const data=linePowerData[line.slug];
 const totals=linePowerTotals(line.slug);
 const energyRows=data.periods.map(({hours})=>{
  const energy=totals.calculated*hours;
  const displayed=hours===1?`${formatLineNumber(energy,true)} кВт·ч`:`${formatLineNumber(energy/1000,true)} МВт·ч`;
  return `<tr data-energy-hours="${hours}"><th scope="row">${periodLabels[hours]}</th><td>${formatLineNumber(hours)}</td><td>${displayed}</td></tr>`;
 }).join('');
 return `<div class="line-power-overview" data-line-power="${line.slug}">
  <div class="line-input-band line-power-kpis">
   <div><strong>${formatLineNumber(totals.installed,line.slug==='moyka-plenki')} <small>кВт</small></strong><span>Установленная мощность</span></div>
   <div><strong>${formatLineNumber(totals.calculated)} <small>кВт</small></strong><span>Расчётная потребляемая мощность</span></div>
   <p>Расчётная нагрузка — ${formatLineNumber(data.load_factor*100)}% установленной мощности. Фактическое потребление зависит от режима работы.</p>
  </div>
  <details class="line-more line-power-details" data-keep-open>
   <summary>Электрическая ведомость · состав мощности</summary>
   <div>${powerTable(data,totals)}${note?`<p class="line-note">${escape(note)}</p>`:''}
    <div class="table-wrap"><table class="line-power-energy"><caption>Расчётный расход электроэнергии</caption>
     <thead><tr><th scope="col">Период</th><th scope="col">Работа, ч</th><th scope="col">Энергия</th></tr></thead><tbody>${energyRows}</tbody>
    </table></div>
    <p class="line-note">Расход электроэнергии = ${formatLineNumber(totals.calculated)} кВт × часы работы. В расчёте принята непрерывная работа.</p>
   </div>
  </details>
 </div>`;
}

export function dryLineProduction(line,{note=''}={}){
 const readRate=labels=>Number(lineMetric(line,labels,'кг/ч').value.replace(/\s/g,''));
 const input=readRate(['Входной поток']);
 const output=readRate(dryFilmOutputLabels);
 const rows=Object.entries(periodLabels).map(([hours,label])=>`<tr><th scope="row">${label}</th><td>${formatLineNumber(Number(hours))}</td><td>${formatLineNumber(input*hours/1000)}</td><td>${formatLineNumber(output*hours/1000)}</td></tr>`).join('');
 const {calculated}=linePowerTotals(line.slug);
 const specific=calculated*1000;
 return `<details class="line-more" data-keep-open>
  <summary>Расчёт выпуска по периодам</summary>
  <div><div class="table-wrap"><table class="line-production-table"><caption>Непрерывная работа при засорённости около 50%</caption>
   <thead><tr><th scope="col">Период</th><th scope="col">Работа, ч</th><th scope="col">Сырьё, т</th><th scope="col">Очищенная плёнка, т</th></tr></thead><tbody>${rows}</tbody>
  </table></div><p class="line-note">Удельный расчётный расход — ${formatLineNumber(specific/input)} кВт·ч на тонну сырья и ${formatLineNumber(specific/output)} кВт·ч на тонну очищенной плёнки.</p>${note?`<p class="line-note">${escape(note)}</p>`:''}</div>
 </details>`;
}
