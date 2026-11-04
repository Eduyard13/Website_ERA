// Initial public examples supplied in ERA_Homepage_Codex_Brief.md, 04.11.2026.
// These are assumptions for exploring a project, not measured operating costs.
export const economicsConfig = {
 baseInput:720, inputRate:1.5, availableHours:720, baseHours:480,
 separationYield:0.5, granulationYield:0.9, taxRate:0.2,
 modes:{
  separation:{label:'Сепарация',product:'Очищенная плёнка в тюках',shortProduct:'плёнки',salePrice:45000},
  full:{label:'Полный цикл',product:'Вторичная ПЭ-гранула',shortProduct:'гранулы',salePrice:75000},
 },
 costs:[
  {id:'feedstock',label:'Заготовка сырья',description:'Закупка и заготовка поступающего сырья.',kind:'variable',separation:4374000,full:4374000,color:'#242844'},
  {id:'electricity',label:'Электроэнергия',description:'Условные расходы на электроэнергию всех стадий выбранного сценария.',kind:'variable',separation:1800000,full:2916000,color:'#414663'},
  {id:'payroll',label:'ФОТ со взносами',description:'Оплата труда и взносы. В примере постоянные затраты на каждый комплект.',kind:'fixed',separation:1500000,full:2430000,color:'#5a607d'},
  {id:'supplies',label:'Расходники',description:'Расходные материалы, связанные с объёмом переработки.',kind:'variable',separation:630000,full:1458000,color:'#747b94'},
  {id:'washing',label:'Вода, нагрев, реагенты и стоки',description:'Условные затраты мойки и очистки рабочей жидкости; в сухой сепарации равны нулю.',kind:'variable',separation:0,full:1944000,color:'#8c93a6'},
  {id:'logistics',label:'Логистика и обращение с отсевом',description:'Перемещение сырья и продукции, обращение с отделёнными включениями.',kind:'variable',separation:2196000,full:1701000,color:'#a2a7b6'},
  {id:'maintenance',label:'Ремонт и обслуживание',description:'Ремонт, запасные части и техническое обслуживание каждого комплекта.',kind:'fixed',separation:600000,full:1458000,color:'#b4b9c5'},
  {id:'depreciation',label:'Амортизация',description:'Расход в модели прибыли. Капитальные вложения и денежный поток рассчитываются отдельно.',kind:'fixed',separation:400000,full:1215000,color:'#bcb5a7'},
  {id:'overheads',label:'Площадка и накладные',description:'Площадка и условные накладные затраты на каждый комплект.',kind:'fixed',separation:200000,full:729000,color:'#d2ccbf'},
 ],
 sources:[
  {title:'Техническое описание линии ЭРА, стр. 2 и 22',href:'/documents/technical/era-separatsiya-01-technical-description.pdf',note:'Для представленной комплектации: 1,5 т/ч входа и 0,75 т/ч очищенной плёнки при засоре около 50%.'},
 ],
 disclosure:'Демонстрационный расчёт. Цена, загрузка, выход и затраты заданы условно.',
};

export const marketContext = {
 year:2025,totalWasteMillionTonnes:46.4,householdShare:0.63,
 title:'Все ТКО, образованные в России за 2025 год',
 source:'Росприроднадзор',
 href:'https://rpn.gov.ru/press/news/rosprirodnadzor_sformiroval_ofitsialnuyu_statistiku_ob_obrashchenii_s_otkhodami_v_2025_godu/',
 checkedAt:'2026-11-04',
};

const offer=(id,category,supplier,title,price,href,extra={})=>({
 id,category,supplier,title,price,href,from:true,checkedAt:'2026-11-04',
 region:'Не указан',minimum:'Не указана',vat:'Не указан',delivery:'Не указана',
 sku:'Не указан',mfi:'Не указан',application:'Не указано',packaging:'Не указана',
 priceDate:'Не указана',polymer:category==='ldpe'?'ПВД / LDPE':category==='hdpe'?'ПНД / HDPE':'Состав уточняется',
 color:'Не указан',rawSource:'Не указан',note:'',...extra,
});
export const marketOffers = [
 offer('kupi-stretch','film','Купи-отходов','Чистые отходы стрейча в кипах',22,'https://kupi-othodov.ru/catalog/othody-strejch-plenki/otkhody-pervichnoj-strejch-plenki',{region:'Москва',rawSource:'Чистые отходы стрейч-плёнки',note:'Полимерный состав стрейча необходимо подтвердить.'}),
 offer('kupi-mix','film','Купи-отходов','Микс ПВД и стрейча в кипах',26,'https://kupi-othodov.ru/catalog/othody-pvd/othody-miks-pvd-i-strejcha',{region:'Москва',rawSource:'Микс плёночных отходов',polymer:'ПВД + стрейч, состав уточняется'}),
 offer('ekology-ldpe','film','Экология','Молочная магазинная ПВД-плёнка в кипах',62,'https://ekologyk.ru/plastik-optom',{region:'Курск',priceMax:65,from:false,polymer:'ПВД по описанию продавца',color:'Молочный',rawSource:'Условно чистая магазинная плёнка'}),
 offer('ekology-stretch','film','Экология','Магазинный стрейч в кипах',65,'https://ekologyk.ru/plastik-optom',{region:'Курск',priceMax:68,from:false,rawSource:'Магазинная стрейч-плёнка',note:'Полимерный состав стрейча необходимо подтвердить.'}),
 offer('vtx-ldpe-black','ldpe','ВТХ','ПВД под чёрный закрас',45,'https://vtxm.ru/polimery',{color:'Под чёрный закрас'}),
 offer('vtx-ldpe-standard','ldpe','ВТХ','ПВД цветная / 1-й прозрачный',55,'https://vtxm.ru/polimery',{color:'Цветная / прозрачная',note:'Наименования сортов приведены по прайсу продавца.'}),
 offer('vtx-ldpe-clear','ldpe','ВТХ','ПВД высший прозрачный',65,'https://vtxm.ru/polimery',{color:'Прозрачный',note:'Сорт по классификации продавца.'}),
 offer('alfa-stretch','ldpe','Альфа','Гранула из стрейч-плёнки',70,'https://alfagranula.ru/',{region:'Санкт-Петербург и ЛО',vat:'С НДС',priceDate:'Август 2026',polymer:'ПВД по описанию продавца',rawSource:'Стрейч-плёнка',note:'Состав LDPE / LLDPE не подтверждён; наименование сохранено по описанию продавца.'}),
 offer('polihim-color','ldpe','Полихимтрейд','ПВД цветная',75,'https://plenkas.ru/prodazha-syrya/',{color:'Цветная'}),
 offer('polihim-clear','ldpe','Полихимтрейд','ПВД прозрачная',80,'https://plenkas.ru/prodazha-syrya/',{color:'Прозрачный'}),
 offer('polihim-stretch','ldpe','Полихимтрейд','Гранула из стрейч-плёнки',80,'https://plenkas.ru/prodazha-syrya/',{polymer:'ПВД по описанию продавца',rawSource:'Стрейч-плёнка',note:'Состав LDPE / LLDPE необходимо подтвердить.'}),
 offer('soyuz-ldpe','ldpe','Союз-Полимер','ПВД из производственной обрези с печатью',80,'https://ptk-sp.ru/vtorichnaya-pvd-granula',{from:false,vat:'С НДС',delivery:'Самовывоз',packaging:'Мешки по 25 кг',rawSource:'Собственная обрезь с печатью и производственный брак'}),
 offer('vtorplast-clear','ldpe','Вторпласт','ПВД прозрачная',90,'https://vtorplastpro.ru/catalog/vtorichnaya-granula-pvd-prozrachnyij/',{color:'Прозрачный',packaging:'900 кг–1 т',vat:'Поставщик работает с НДС; включение в цену уточняется'}),
 offer('vtorplast-mix','ldpe','Вторпласт','ПВД цветной микс',110,'https://vtorplastpro.ru/',{color:'Цветной микс',vat:'Поставщик работает с НДС; включение в цену уточняется'}),
 offer('vtx-hdpe-black','hdpe','ВТХ','ПНД под чёрный закрас',50,'https://vtxm.ru/polimery',{from:false,color:'Под чёрный закрас'}),
 offer('vtx-hdpe-color','hdpe','ВТХ','ПНД цветная',55,'https://vtxm.ru/polimery',{color:'Цветная'}),
 offer('vtx-hdpe-clear','hdpe','ВТХ','ПНД 1-й прозрачный',60,'https://vtxm.ru/polimery',{color:'Прозрачный',note:'Сорт по классификации продавца.'}),
 offer('vtx-hdpe-top','hdpe','ВТХ','ПНД высший прозрачный',70,'https://vtxm.ru/polimery',{color:'Прозрачный',note:'Сорт по классификации продавца.'}),
 offer('vtorplast-hdpe-blue','hdpe','Вторпласт','ПНД тёмно-синий',90,'https://vtorplastpro.ru/',{color:'Тёмно-синий',vat:'Поставщик работает с НДС; включение в цену уточняется'}),
 offer('vtorplast-hdpe-black','hdpe','Вторпласт','ПНД чёрный микс',95,'https://vtorplastpro.ru/',{color:'Чёрный микс',vat:'Поставщик работает с НДС; включение в цену уточняется'}),
];
