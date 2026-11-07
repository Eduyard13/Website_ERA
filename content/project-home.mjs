// Approved Variant A «Ресурс», owner's brief of 07.11.2026.
export const resourceHero={
 kicker:'ЭРА / ПРОМЫШЛЕННАЯ ПЕРЕРАБОТКА ЗАГРЯЗНЁННЫХ ПЛЁНОК',
 title:'Там, где другие видят отходы, мы видим промышленный ресурс.',
 lead:'ЭРА разрабатывает технологические решения для переработки сильно загрязнённых полиэтиленовых плёнок: от сухой сепарации и получения подготовленного сырья до горячей мойки и выпуска вторичной ПЭ-гранулы в составе полного комплекса.',
 proof:'Входная засорённость сырья в испытаниях',
};
export const resourceContaminants=[
 {title:'Минеральные примеси',text:'Песок, земля и мелкие включения.',detail:'mineralDetail',icon:'mineral'},
 {title:'Органика',text:'Пищевые и растительные остатки.',detail:'organicDetail',icon:'organic'},
 {title:'Твёрдые включения',text:'Стекло, металл и посторонние материалы.',detail:'solidDetail',icon:'solid'},
 {title:'Влага',text:'Учитывается отдельно от засорённости.',icon:'moisture'},
];
export const resourceProcess=[
 {number:'01',title:'Раскрытие и подготовка',text:'Предварительное измельчение, раскрытие пакетов, разъединение слоёв и высвобождение включений.',image:'preshredder'},
 {number:'02',title:'Разделение и очистка',text:'Баллистическое разделение, распушение, сортировка, воздушные и механические методы очистки. В полном цикле — последующая горячая мойка и обезвоживание.',image:'separator'},
 {number:'03',title:'Подготовленный продукт',text:'После сухой сепарации — очищенная плёнка для реализации или дальнейшей переработки, в полной линии — тюки. С мойкой и грануляцией — вторичная ПЭ-гранула.'},
];
export const resourceRoutes=[
 {id:'separation',title:'Сухая сепарация',text:'Предварительная подготовка и удаление основной массы посторонних включений. Результат — очищенная плёночная фракция для реализации или последующей мойки; в расширенной комплектации — сортировка и прессование в тюки.',image:'filmProduct',label:'Линия сухой сепарации',href:'/catalog/lines/separatsiya-02'},
 {id:'full',title:'Полный цикл',text:'Сухая сепарация, горячая мойка, обезвоживание, сушка и гранулирование. Результат — вторичная полиэтиленовая гранула, характеристики которой определяются сырьём и выбранной технологией.',image:'pelletProduct',label:'Посмотреть полный цикл',href:'/technology#solution'},
];
export const resourceIntegrationSteps=['Изучение сырья','Подбор комплектации','Инженерная интеграция','Запуск и сопровождение — в согласованном объёме'];

// Fragment aliases retained for bookmarks to the former financial blocks.
export const legacyFinancialAnchors=["market-title", "market-tab-film", "market-tab-ldpe", "market-tab-hdpe", "market-panel-film", "market-panel-ldpe", "market-panel-hdpe", "economics-title", "econ-month-title", "econ-monthly-price", "econ-tonne-title", "econ-per-tonne-price", "econ-curve-title", "econ-curve-price", "econ-volume", "econ-volume-number", "econ-capacity"];
