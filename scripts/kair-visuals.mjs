const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const paths={flow:'M4 7h5v5H4zM15 12h5v5h-5zM9 9h9m0 0-3-3m3 3-3 3M6 12v6h9',shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',screen:'M3 4h18v13H3zM8 21h8m-4-4v4M6 12l3-3 3 3 5-5',cycle:'M4 10a8 8 0 0 1 14-5l2 2m0-5v5h-5M20 14a8 8 0 0 1-14 5l-2-2m0 5v-5h5',water:'M12 2C9 7 5 10 5 15a7 7 0 0 0 14 0c0-5-4-8-7-13ZM9 16c0 2 1 3 3 3',nodes:'M9 9h6v6H9zM2 2h4v4H2zM18 2h4v4h-4zM2 18h4v4H2zM18 18h4v4h-4zM6 6l3 3m6 0 3-3M6 18l3-3m6 0 3 3'};
export const kairIcon=name=>`<svg class="ka-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${paths[name]||paths.flow}" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const benefitIcons={
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z M8 12l3 3 5-6"/>',
 chart:'<path d="M3 3v18h18M7 16l5-6 4 3 5-7M17 6h4v4"/>',
 coins:'<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 1.7 2.7 3 6 3 1 0 2-.1 3-.4M3 11v5c0 1.7 2.7 3 6 3"/><ellipse cx="16" cy="13" rx="5" ry="2.5"/><path d="M11 13v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5"/>',
 network:'<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
};
export const kairBenefitIcon=name=>`<svg class="ka-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${benefitIcons[name]}</svg>`;

export function kairLogicGraphic(mode){
 const values=[['Исходные данные',mode.signal,'screen'],['Проверка или выбор',mode.decision,'cycle'],['Предусмотренное действие',mode.action,'nodes'],['Работа со сменой',mode.information,'shield']];
 return `<figure class="ka-logic-graphic" data-artwork-slot="kair-logic-${mode.id}"><figcaption>${escape(mode.scope)}</figcaption><ol>${values.map(([label,text,icon],i)=>`<li><span class="ka-logic-step">0${i+1}</span>${kairIcon(icon)}<span>${label}</span><strong>${escape(text)}</strong></li>`).join('')}</ol><p>${escape(mode.text)}</p></figure>`;
}
export function kairProcessGraphic(map){
 return `<figure class="ka-process-graphic" data-artwork-slot="kair-process-${map.id}"><ol class="ka-process-route">${map.steps.map(([title,text],i)=>`<li><span>0${i+1}</span><strong>${title}</strong><p>${text}</p></li>`).join('')}</ol>${map.water?`<div class="ka-water-map" data-artwork-slot="kair-water-circuits"><h4>Разные задачи — отдельные водные маршруты</h4><div class="ka-water-route"><span>Отделённая рабочая жидкость</span><b aria-hidden="true">→</b><strong>Возврат на предыдущие участки</strong></div><div class="ka-water-route"><span>Стоки → очистка → бак возврата</span><b aria-hidden="true">→</b><strong>Основная мойка</strong></div><div class="ka-water-route"><span>Чистая вода из резервуара</span><b aria-hidden="true">→</b><strong>Ополаскивание</strong></div><p>Подпитка восполняет фактические потери. Состояние среды, температура, уровень и расход рассматриваются отдельно.</p></div>`:''}<figcaption>${escape(map.note)}</figcaption></figure>`;
}
