export const marketSources = [
 {id:'spimex',region:'russia',title:'Петербургская биржа',subtitle:'По сообщению Маркет Репорт, 26.10.2026',value:'более 52,60',unit:'₽/кг',material:'Плёнка ПВД · вторичное сырьё',kind:'Средняя цена состоявшихся торгов',period:'Январь–сентябрь 2026',publishedAt:'2026-10-26',checkedAt:'2026-11-17',href:'https://www.mrc.ru/news/424795-torgi-vtorichnimi-resursami-na-peterburgskoy-birzhe-previsili-8-tis.-tonn',source:'Маркет Репорт',note:'Условия НДС и качество лотов не раскрыты. Это вторичное сырьё, не гранула и не прямая оценка продукта ЭРА.'},
 {id:'ppi',region:'russia',title:'Пластинфо · ППИ-вСТ',subtitle:'Россия · вторичные стандартные термопласты',value:'Ежемесячный индекс',unit:'',material:'Вторичные ПВД и ПНД, включая плёночные марки',kind:'Отраслевой индекс',period:'Ряд с января 2019 года',publishedAt:null,checkedAt:'2026-11-17',href:'https://www.plastindex.ru/',source:'Пластинфо',note:'Показывает динамику рынка. Числовое значение индекса в расчётную цену ЭРА не подставляется.'},
 {id:'plasticker',region:'international',title:'plasticker',subtitle:'Rohstoffbörse · Германия',value:'Цены предложений',unit:'',material:'Гранула, дроблёнка и кипы — раздельные группы',kind:'Средние цены предложений',period:'Ежемесячные ряды',publishedAt:null,checkedAt:'2026-11-17',href:'https://plasticker.de/preise/preise_monat.php?group=gran',source:'plasticker',note:'Числовой ряд с однозначным периодом не подтверждён. Гранула не смешивается с дроблёнкой или кипами; предложения не равны сделкам.'},
 {id:'myceppi',region:'international',title:'myCEPPI / PlasticPortal',subtitle:'Центральная и Восточная Европа',value:950,primaryValue:1368,unit:'€/т',material:'rLDPE Film · вторичная плёночная гранула',kind:'Еженедельная рыночная оценка, с доставкой',period:'Неделя 40/2026 · публикация 03.11.2026',publishedAt:'2026-11-03',checkedAt:'2026-11-17',href:'https://www.plasticportal.eu/price-reports/2026/40',source:'PlasticPortal / myCEPPI',note:'Первичный LDPE Film — 1 368 €/т. Разные материалы; открытые отчёты публикуются с задержкой около пяти недель. В рубли не пересчитываются.'},
];

export const additionalMarketSources = [
 ['ЭТП РЭО','https://etp.reo.ru/analytics','Лоты и аналитика вторичных ресурсов; индекс гранулы не подтверждён.'],
 ['ICIS · Recycled PE','https://www.icis.com/compliance/reports/recycled-polyethylene-r-pe-report/','Профессиональные обзоры вторичного полиэтилена.'],
 ['Platts / S&P Global','https://www.spglobal.com/energy/en/pricing-benchmarks/assessments/chemicals/eu-recycled-ldpe-price-explained','Методология оценки европейского вторичного LDPE.'],
 ['Argus · Recycled Polymers','https://www.argusmedia.com/ru/solutions/products/argus-recycled-polymers','Отраслевые оценки и отчёты.'],
 ['Dalian Commodity Exchange','https://www.dce.com.cn/','Фьючерсы первичного LLDPE; не цена вторичной гранулы.'],
 ['The Plastics Exchange','https://www.theplasticsexchange.com/','Преимущественно первичные смолы.'],
];
