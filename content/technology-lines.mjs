// Source: the owner's three-page dry separation overview uploaded 06.11.2026.
// The five bunkers, sorting platform and automatic press identify line 02.
export const drySeparationOverview={
 linePath:'/catalog/lines/separatsiya-02',
 number:'02',
 title:'Линия сухой сепарации плёнок и пакетов',
 subtitle:'С сортировкой и автоматическим прессом',
 description:'Очищает полигонные, сельскохозяйственные и упаковочные плёнки от песка, грунта, камней, стекла, металла и растительных остатков.',
 features:['Без воды','Управление КАИР на базе Siemens'],
 image:'technology/separation/line.webp',
 smallImage:'technology/separation/line-768.webp',
 imageDimensions:[1600,1077],
 comparisons:[['before','До сепарации','Плёнка с посторонними включениями до сухой сепарации'],['after','После сухой очистки','Очищенная плёнка после сухой сепарации']],
 metrics:[
  {value:'1 500',unit:'кг/ч',label:'Входной поток',note:'Вместе с загрязнениями',page:1},
  {value:'750',unit:'кг/ч',label:'Очищенная плёнка',note:'При среднем засоре 50%',page:1},
  {value:'402,67',unit:'кВт',label:'Установленная мощность',page:3},
  {value:'281,87',unit:'кВт',label:'Средняя потребляемая',note:'70% от установленной',page:3},
  {value:'5',unit:'бункеров',label:'Раздельное накопление',note:'Четыре фракции и основной микс',page:1},
  {value:'45 × 18',unit:'м',label:'Размещение линии',note:'810 м² · высота помещения 9 м',page:3},
 ],
 output:'Очищенная плёнка в раздельных тюках — для продажи переработчикам или собственной горячей мойки.',
 document:{
  title:'Визитка линии сухой сепарации плёнок и пакетов',
  file:'brochures/era-separatsiya-02-overview.pdf',
  pages:3,bytes:4022808,
  sha256:'80876c22af16480aafa298b7a0630b26c2a88a9341d577867300a49e7b58a068',
  downloadName:'ЭРА — Визитка линии сухой сепарации плёнок и пакетов.pdf',
 },
};

// The owner's current configuration instruction: granulation is a process stage
// within the washing line, with supply without it for an existing granulator.
export const washingConfigurations=[
 {id:'with-granulator',title:'Мойка с гранулятором',text:'Гранулятор уже установлен в линии горячей мойки. После очистки и обезвоживания плёнка поступает на гранулирование в общем технологическом процессе.'},
 {id:'existing-granulator',title:'Мойка под вашу грануляцию',text:'Если на предприятии уже есть грануляция, линию мойки изготовим без гранулятора. Подготовленную плёнку вы перерабатываете на своём оборудовании.'},
];
