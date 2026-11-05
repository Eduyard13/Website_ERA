// Financial-model extracts supplied in ERA_Website_Economics_Codex_2026-11-05.md.
// LSP v1 and KPP v20, working month; existing customer workshop, purchased transport.
export const curveProfiles = {
 separation:{referenceInput:1116,referenceOutput:558,totalYield:0.5,defaultGrossPrice:50000,fixedCashOpex:6859225.271887077,variableCashOpex:9429027.120415082,depreciation:645536.9479639059},
 full:{referenceInput:970.4347826086957,referenceOutput:558,totalYield:0.575,defaultGrossPrice:110000,fixedCashOpex:11648915.449213509,variableCashOpex:13281090.775100213,depreciation:1961047.8954266747},
};
export const economicsConfig = {
 asOf:'2026-11-05',availableHours:744,monthDays:31,outputRate:0.75,
 vatRate:0.22,taxRate:0.25,feedstockPrice:6000,activeSorters:4,
 modes:{
  separation:{...curveProfiles.separation,label:'Сепарация',product:'Очищенная плёнка в тюках',unitProduct:'Очищенная плёнка',staff:39,
   priceStages:[{price:40000,label:'40 ₽/кг',period:'Вариант чувствительности'},{price:45000,label:'45 ₽/кг',period:'Вариант чувствительности'},{price:50000,label:'50 ₽/кг',period:'Основная расчётная цена'}]},
  full:{...curveProfiles.full,label:'Полный цикл',product:'Высококачественная вторичная ПЭ-гранула',unitProduct:'Полиэтиленовая гранула',staff:54,
   priceStages:[{price:90000,label:'90 ₽/кг',period:'Первые 2 рабочих месяца'},{price:100000,label:'100 ₽/кг',period:'Базовый этап, 3–6-й месяц'},{price:110000,label:'110 ₽/кг',period:'Премиальный этап, с 7-го рабочего месяца'}]},
 },
 costs:[
  {id:'feedstock',label:'Входящее сырьё',description:'6 000 ₽ за входящую тонну без доставки. Базовая закупка без входящего НДС.',separation:6696000,full:5822608.70,color:'#242844'},
  {id:'payroll',label:'Производственный штат и взносы',description:'Производственный штат: 39 человек для сепарации, 54 для полного цикла. Четыре сортировщика в активной смене.',separation:4914922.76,full:7024238,color:'#414663'},
  {id:'electricity',label:'Электроэнергия',description:'Для полного цикла сохранён расход рабочего столбца финансовой модели при прежнем количестве часов.',separation:1614771.13,full:7675847.26,color:'#5a607d'},
  {id:'water',label:'Вода и водоотведение',description:'В самостоятельной сухой сепарации эта статья равна нулю.',separation:0,full:21854.26,color:'#737b8f'},
  {id:'reagents',label:'Моющие реагенты',description:'Реагенты полного цикла. В самостоятельную ЛСП мойка не включена.',separation:0,full:507780,color:'#8a96a2'},
  {id:'transport',label:'Транспорт',description:'Приобретённый транспорт, как в базовых версиях финансовых моделей.',separation:966737.17,full:950440.15,color:'#6c7879'},
  {id:'ppe',label:'СИЗ и питание',description:'Средства индивидуальной защиты и питание производственного персонала.',separation:596504.99,full:829195.75,color:'#92968a'},
  {id:'supplies',label:'Расходники и ЗИП',description:'Расходные материалы и запасные части оборудования.',separation:157496.34,full:686325.42,color:'#a9aa99'},
  {id:'office',label:'Офис и внешняя лаборатория',description:'Офисные расходы и услуги внешней лаборатории.',separation:64000,full:114000,color:'#b8ae98'},
  {id:'disposal',label:'Отсев, осадок и упаковка',description:'Обращение с отсевом и осадком, упаковка, доставка реагентов.',separation:1277820,full:1297716.70,color:'#aa9b83'},
  {id:'building',label:'Новая аренда и содержание здания',description:'Существующий цех с готовой инфраструктурой. Новая аренда и строительство в базу не включены.',separation:0,full:0,color:'#d2ccbf'},
 ],
 sources:[
  {title:'ЛСП · финансовая модель v1',file:'ERA_LSP_Dry_Separation_Finmodel.xlsx',sheets:'00_Итоги, 01_Вводные, 02_Производство, 05_Затраты и НДС'},
  {title:'КПП · финансовая модель v20',file:'ERA_KPP_Finmodel_PriceReview.xlsx',sheets:'23_Чистая прибыль, 26_Окупаемость, 28_Итоги'},
 ],
 disclosure:'Расчётные сценарии финансовых моделей ЭРА на 05.11.2026. Существующий цех клиента с готовой инфраструктурой; без новой аренды и строительства.',
 taxDisclosure:'Цена реализации — с НДС 22%. Экономика рассчитана по выручке без НДС, с амортизацией и налогом на прибыль 25%.',
 priceDisclosure:'Расчётная цена — допущение финансовой модели. Фактическая реализация зависит от приёмки качества и договорённостей с покупателем.',
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
