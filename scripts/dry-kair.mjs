// Shared KAIR presentation for the three dry-separation configurations.
// The approved chip is a native SVG, not a raster or third-party icon.
const chip='<svg class="dry-kair-chip" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="14" width="36" height="36" rx="7"/><rect x="21" y="21" width="22" height="22" rx="3"/>'+[21,32,43].map(x=>'<path d="M'+x+' 6 V14 M'+x+' 50 V58 M6 '+x+' H14 M50 '+x+' H58"/><circle cx="'+x+'" cy="4" r="2"/><circle cx="'+x+'" cy="60" r="2"/><circle cx="4" cy="'+x+'" r="2"/><circle cx="60" cy="'+x+'" r="2"/>').join('')+'<path d="M25 33 L30 38 L40 27"/></svg>';
const icons={
 automation:'<rect x="8" y="2" width="8" height="5" rx="1.5"/><rect x="2" y="17" width="8" height="5" rx="1.5"/><rect x="14" y="17" width="8" height="5" rx="1.5"/><path d="M12 7v5H6v5m6-5h6v5"/>',
 memory:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
 diagnostics:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
 protection:'<path d="M12 2 3 6v6c0 5 3 8 9 10 6-2 9-5 9-10V6l-9-4Z"/><path d="m8 12 3 3 5-6"/>',
 monitoring:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-5 0h10M5 12l4-4 3 3 3-5 4 4"/>',
 history:'<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2"/>'
};
const features=[
 ['automation','Автоматизация','Согласованное управление всеми узлами линии.'],
 ['memory','Память режимов','Сохранение настроек под поставщика, вид и партию сырья.'],
 ['diagnostics','Диагностика','Контроль вибрации, шума и нагрузки оборудования.'],
 ['protection','Защита оборудования','Предупреждение о перегрузках и защитная остановка.'],
 ['monitoring','Контроль 24/7','Удалённое наблюдение. Камеры 4К и мониторы 55″ — по согласованию.'],
 ['history','История событий','Журнал работы системы и действий оператора.']
];
const icon=key=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg>';
export function renderDryKair(){
 return '<div class="dry-kair era-indigo-surface" data-dry-kair>'+
 '<div class="dry-kair-brand">'+chip+'<div class="dry-kair-brand-copy"><span class="dry-kair-wordmark">КАИР</span><span class="dry-kair-subtitle">ИНТЕЛЛЕКТУАЛЬНАЯ СИСТЕМА УПРАВЛЕНИЯ</span></div><span class="dry-kair-siemens" aria-label="Управление на базе Siemens">SIEMENS</span></div>'+
 '<div class="dry-kair-layout"><div class="dry-kair-copy"><h2>Всё производство.<br><span>Под вашим контролем.</span></h2><p>Единая интеллектуальная система управления технологическими процессами, контроля состояния оборудования и удалённого наблюдения за производством.</p><a class="dry-kair-link" href="/automation"><span>Подробнее о КАИР</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 13 13 3M3 3h10v10"/></svg></a></div>'+
 '<div class="dry-kair-features" aria-label="Возможности КАИР">'+features.map(([key,title,description])=>'<article class="dry-kair-feature" data-dry-kair-feature="'+key+'">'+icon(key)+'<h3>'+title+'</h3><p>'+description+'</p></article>').join('')+'</div></div></div>';
}
