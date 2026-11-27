// Prices are RUB/t. Costs exclude recoverable VAT. Full-cycle costs combine monthly charges
// and operating rates per hour or per tonne. Separation retains the LSP v1 budget split.
const referenceMonthHours=744;
const vatRate=0.22;
const transportBudget=989145.85295-(84-78.23)*4064.41/(1+vatRate);
const transportMonthlyShare=0.7;
const mealCost=390*1.308;

export const economicsConfig = {
 asOf:'2026-11-05', marketAsOf:'2026-11-17',
 monthDays:31, yearDays:365, hoursPerDay:24, monthsPerYear:12, referenceMonthHours,
 vatRate, taxRate:0.25, feedstockPrice:6000, activeSorters:4, networkSizes:[1,2,3,5],
 materialGuides:{contamination:[30,40], polymerLoss:[5,7]},
 modes:{
  separation:{
   inputRate:1.5, outputRate:.75, defaultGrossPrice:45000, otherFixedCashOpex:1944302.5118870772,
   depreciation:645536.9479639059, equipmentCost:null, label:'Сепарация',
   product:'Очищенная плёнка в тюках', unitProduct:'Очищенная плёнка', staff:39,
   priceStages:[
    {id:'conservative',price:40000,period:'Консервативная'},
    {id:'base',period:'Базовая цена'},
    {id:'premium',price:50000,period:'Повышенная'},
   ],
  },
  full:{
   inputRate:1.5, outputRate:.75, defaultGrossPrice:90000, minimumPriceStep:10000,
   estimate:{asOf:'2026-11-27',region:'Ярославская область'},
   depreciation:1961047.8954266747, equipmentCost:null, label:'Полный цикл',
   product:'Высококачественная вторичная ПЭ-гранула', unitProduct:'Полиэтиленовая гранула', staff:54,
   priceStages:[
    {id:'conservative',price:80000,period:'Консервативный',description:'Сценарий при сниженной цене реализации.',icon:'granules'},
    {id:'base',period:'Базовый',description:'Основной сценарий финансовой модели.',icon:'factory'},
    {id:'development',price:100000,period:'Развитие',description:'Подтверждённое качество и постоянные покупатели.',icon:'growth'},
    {id:'premium',price:110000,period:'Премиальный',description:'Потенциал верхнего ценового сегмента.',icon:'diamond'},
   ],
  },
 },
 costs:[
  {id:'feedstock',label:'Входящее сырьё',description:'Закупка входящей смеси без доставки и входящего НДС.',color:'#242844'},
  {id:'payroll',label:'Производственный штат и взносы',description:'Фонд оплаты труда и страховые взносы.',fixed:true,separation:4914922.76,color:'#414663',
   full:{monthly:6185218.929006086,description:'Производственный штат, сменные доплаты и страховые взносы.'}},
  {id:'electricity',label:'Электроэнергия',description:'Рабочий столбец финансовой модели. Поправка тарифа применяется к исходной сумме.',rateMultiplier:1,separation:1614771.13,color:'#5a607d',
   full:{monthly:1400*1215+1400*2380,hourly:1339.87*3.47,description:'Часовой расход активной энергии, месячная оплата мощности и содержания сети.'}},
  {id:'water',label:'Вода и водоотведение',description:'В самостоятельной сухой сепарации эта статья равна нулю.',separation:0,color:'#737b8f',
   full:{hourly:39.68/24,perOutputTonne:0.6*(39.68+30),description:'Технологическая вода и стоки, бытовая вода в сменах.'}},
  {id:'reagents',label:'Моющие реагенты',description:'Реагенты полного цикла. В самостоятельную ЛСП мойка не включена.',separation:0,color:'#8a96a2',
   full:{hourly:100000/referenceMonthHours,perOutputTonne:900,description:'Реагенты для мойки и резерв на очистку стоков.'}},
  {id:'transport',label:'Транспорт',description:'Приобретённый транспорт, как в базовых версиях финансовых моделей.',separation:966737.17,color:'#6c7879',
   full:{monthly:transportBudget*transportMonthlyShare,hourly:transportBudget*(1-transportMonthlyShare)/referenceMonthHours,description:'Собственный парк. 70% бюджета начисляется ежемесячно, 30% по часам.'}},
  {id:'ppe',label:'СИЗ и питание',description:'Средства индивидуальной защиты и питание производственного персонала.',separation:596504.99,color:'#92968a',
   full:{monthly:256631.83333333334+88*mealCost,hourly:930*mealCost/referenceMonthHours,description:'Средства защиты, дневное питание и питание по сменам.'}},
  {id:'supplies',label:'Расходники и ЗИП',description:'Расходные материалы и запасные части оборудования.',separation:157496.34,color:'#a9aa99',
   full:{monthly:686325.4220146013,description:'Месячный бюджет готовности оборудования.'}},
  {id:'office',label:'Офис и внешняя лаборатория',description:'Офисные расходы и услуги внешней лаборатории.',separation:64000,color:'#b8ae98',
   full:{monthly:114000,description:'Текущие расходы и услуги внешней лаборатории.'}},
  {id:'disposal',label:'Отсев, осадок и упаковка',description:'Обращение с отсевом и осадком, упаковка, доставка реагентов.',separation:1277820.0023021586,color:'#aa9b83',
   full:{hourly:50000/referenceMonthHours,perOutputTonne:650,perResidueTonne:0.6*(0.9*3400+0.1*4300),description:'Вывоз и обработка расчётной доли отсева, упаковка гранулы и доставка реагентов.'}},
  {id:'building',label:'Новая аренда и содержание здания',description:'Существующий цех с готовой инфраструктурой. Новая аренда и строительство в базу не включены.',fixed:true,separation:0,color:'#d2ccbf',
   full:{monthly:0}},
 ],
 sources:[
  {mode:'separation',title:'ЛСП · финансовая модель v1',file:'ERA_LSP_Dry_Separation_Finmodel.xlsx',sheets:'00_Итоги, 01_Вводные, 02_Производство, 05_Затраты и НДС'},
  {mode:'full',title:'КПП · финансовая модель v20',file:'ERA_KPP_Finmodel_PriceReview.xlsx',sheets:'23_Чистая прибыль, 26_Окупаемость, 28_Итоги'},
 ],
 disclosure:'Расчётные сценарии финансовых моделей ЭРА на 05.11.2026. Существующий цех клиента с готовой инфраструктурой; без новой аренды и строительства.',
 get taxDisclosure(){return `Цена реализации — с НДС ${this.vatRate*100}%. Экономика рассчитана по выручке без НДС, с амортизацией и налогом на прибыль ${this.taxRate*100}%.`;},
 priceDisclosure:'Расчётная цена — допущение финансовой модели. Фактическая реализация зависит от приёмки качества и договорённостей с покупателем.',
};

export function scenarioPrices(mode){
 return mode.priceStages.map(stage=>({
  ...stage,
  price:stage.id==='base'?mode.defaultGrossPrice:stage.price,
 }));
}

export const marketContext = {
 year:2025,totalWasteMillionTonnes:46.4,householdShare:0.63,
 title:'Все ТКО, образованные в России за 2025 год',
 source:'Росприроднадзор',
 href:'https://rpn.gov.ru/press/news/rosprirodnadzor_sformiroval_ofitsialnuyu_statistiku_ob_obrashchenii_s_otkhodami_v_2025_godu/',
 checkedAt:'2026-11-04',
};

const offer=(id,category,supplier,title,price,href,extra={})=>({
 id,category,supplier,title,price,href,from:true,checkedAt:'2026-11-17',
 region:'Не указан',minimum:'Не указана',vat:'Не указан',delivery:'Не указана',
 sku:'Не указан',mfi:'Не указан',application:'Не указано',packaging:'Не указана',
 priceDate:'Не указана',polymer:category==='ldpe'?'ПВД / LDPE':category==='hdpe'?'ПНД / HDPE':'Состав уточняется',
 color:'Не указан',rawSource:'Не указан',note:'',...extra,
});
export const marketOffers = [
 offer('kupi-stretch','film','Купи-отходов','Чистые отходы стрейча в кипах',22,'https://kupi-othodov.ru/catalog/othody-strejch-plenki/otkhody-pervichnoj-strejch-plenki',{region:'Москва',rawSource:'Чистые отходы стрейч-плёнки',note:'Полимерный состав стрейча необходимо подтвердить.'}),
 offer('kupi-mix','film','Купи-отходов','Микс ПВД и стрейча в кипах',26,'https://kupi-othodov.ru/catalog/othody-pvd/othody-miks-pvd-i-strejcha',{region:'Москва',rawSource:'Микс плёночных отходов',polymer:'ПВД + стрейч, состав уточняется'}),
 offer('ekology-ldpe','film','ЭкоЛогика','Молочная магазинная ПВД-плёнка в кипах',62,'https://ekologyk.ru/plastik-optom',{region:'Курск',priceMax:65,from:false,polymer:'ПВД по описанию продавца',color:'Молочный',rawSource:'Условно чистая магазинная плёнка'}),
 offer('ekology-stretch','film','ЭкоЛогика','Магазинный стрейч в кипах',65,'https://ekologyk.ru/plastik-optom',{region:'Курск',priceMax:68,from:false,rawSource:'Магазинная стрейч-плёнка',note:'Полимерный состав стрейча необходимо подтвердить.'}),
 offer('vtx-ldpe-black','ldpe','ВТХ','ПВД под чёрный закрас',45,'https://vtxm.ru/polimery',{color:'Под чёрный закрас'}),
 offer('vtx-ldpe-standard','ldpe','ВТХ','ПВД цветная / 1-й прозрачный',55,'https://vtxm.ru/polimery',{color:'Цветная / прозрачная',note:'Наименования сортов приведены по прайсу продавца.'}),
 offer('vtx-ldpe-clear','ldpe','ВТХ','ПВД высший прозрачный',65,'https://vtxm.ru/polimery',{color:'Прозрачный',note:'Сорт по классификации продавца.'}),
 offer('alfa-stretch','ldpe','Альфа','Гранула из стрейч-плёнки',74,'https://alfagranula.ru/',{region:'Санкт-Петербург и ЛО',vat:'С НДС',priceDate:'Ноябрь 2026',polymer:'ПВД по описанию продавца',rawSource:'Стрейч-плёнка',note:'Состав LDPE / LLDPE не подтверждён; наименование сохранено по описанию продавца.'}),
 offer('polihim-color','ldpe','Полихимтрейд','ПВД цветная',75,'https://plenkas.ru/prodazha-syrya/',{color:'Цветная'}),
 offer('polihim-clear','ldpe','Полихимтрейд','ПВД прозрачная',80,'https://plenkas.ru/prodazha-syrya/',{color:'Прозрачный'}),
 offer('polihim-stretch','ldpe','Полихимтрейд','Гранула из стрейч-плёнки',80,'https://plenkas.ru/prodazha-syrya/',{polymer:'ПВД по описанию продавца',rawSource:'Стрейч-плёнка',note:'Состав LDPE / LLDPE необходимо подтвердить.'}),
 offer('soyuz-ldpe','ldpe','Союз-Полимер','ПВД из производственной обрези с печатью',80,'https://ptk-sp.ru/vtorichnaya-pvd-granula',{from:false,vat:'С НДС',delivery:'Самовывоз',packaging:'Мешки по 25 кг',rawSource:'Собственная обрезь с печатью и производственный брак',mfi:'0,85–0,90; отдельный образец 1,17–1,22 г/10 мин, 190 °C / 2,16 кг',color:'Серо-болотный микс',note:'Не полигонное сырьё. Массовый остаток включений в ppm не опубликован.'}),
 offer('vtorplast-clear','ldpe','Вторпласт · прайс','ПВД прозрачный, исходник — плёнка',85,'https://www.vtorplastpro.ru/price/',{priceMax:90,from:true,color:'Прозрачный',vat:'С НДС',delivery:'Самовывоз',priceDate:'15.11.2026',mfi:'0,4–0,6 г/10 мин; условия измерения в прайсе не приведены',note:'ПТР отличается от целевого диапазона ЭРА; ppm не опубликован.'}),
 offer('vtorplast-mix','ldpe','Вторпласт · прайс','ПВД цветной микс',65,'https://www.vtorplastpro.ru/price/',{priceMax:70,from:true,color:'Цветной микс',vat:'С НДС',delivery:'Самовывоз',priceDate:'15.11.2026',mfi:'0,4–0,6 г/10 мин; условия измерения не приведены',note:'Отдельный прайс, не каталожная цена. Ppm не опубликован.'}),
 offer('vtx-hdpe-black','hdpe','ВТХ','ПНД под чёрный закрас',50,'https://vtxm.ru/polimery',{from:false,color:'Под чёрный закрас'}),
 offer('vtx-hdpe-color','hdpe','ВТХ','ПНД цветная',55,'https://vtxm.ru/polimery',{color:'Цветная'}),
 offer('vtx-hdpe-clear','hdpe','ВТХ','ПНД 1-й прозрачный',60,'https://vtxm.ru/polimery',{color:'Прозрачный',note:'Сорт по классификации продавца.'}),
 offer('vtx-hdpe-top','hdpe','ВТХ','ПНД высший прозрачный',70,'https://vtxm.ru/polimery',{color:'Прозрачный',note:'Сорт по классификации продавца.'}),
 offer('vtorplast-hdpe-blue','hdpe','Вторпласт · прайс','ПНД светлый микс',90,'https://www.vtorplastpro.ru/price/',{priceMax:95,color:'Светлый микс',vat:'С НДС',delivery:'Самовывоз',priceDate:'15.11.2026'}),
 offer('vtorplast-hdpe-black','hdpe','Вторпласт · прайс','ПНД тёмный микс',85,'https://www.vtorplastpro.ru/price/',{priceMax:90,color:'Тёмный микс',vat:'С НДС',delivery:'Самовывоз',priceDate:'15.11.2026'}),
 offer('vtorplast-catalog','ldpe','Вторпласт · каталог','ПВД серый с ПТР 1–1,25',110,'https://www.vtorplastpro.ru/catalog/vtorichnaya-polimernaya-granula-pvd/',{mfi:'1–1,25 г/10 мин; условия измерения не приведены',note:'Цена от в каталоге, не средняя по маркам. Включение НДС в это число не подтверждено; ppm не опубликован.'}),
 offer('vtorplast-caramel','ldpe','Вторпласт · прайс','ПВД карамель, спецзаказ',90,'https://www.vtorplastpro.ru/price/',{priceMax:95,color:'Карамель',vat:'С НДС',delivery:'Самовывоз',priceDate:'15.11.2026',mfi:'0,4–0,6 г/10 мин; условия измерения не приведены'}),
];
