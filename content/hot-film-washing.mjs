import assets from './hot-wash-assets.json' with {type:'json'};
import specification from './hot-wash-specification.json' with {type:'json'};
import power from './hot-wash-power.json' with {type:'json'};

export {specification as hotWashSpecification,power as hotWashPower};
export const hotWashDocument={
 id:'moyka-plenki-technical',slug:'moyka-plenki',category:'technical',
 title:'Техническое описание — Линия горячей мойки плёнок и пакетов',type:'Техническое описание линии',
 description:'37 проектных позиций, технологические потоки, водооборот, мощности, качество, размещение и управление горячей мойкой.',
 file:'technical/era-moyka-plenki-technical-description.pdf',downloadName:'ЭРА — Линия горячей мойки плёнок и пакетов.pdf',
 sourceName:'ТО Линия Горячей Мойки Пленок.pdf',pages:22,bytes:4430978,
 sha256:'5648714c2f667ddb9d2168803aac50faf927fedbecb5147deebb57b0186a704a',revision:'18.11.2026',
};
export const hotFilmWashing={
 status:'source-checked',
 description:'Горячая мойка подготовленной плёнки после сухой сепарации: мокрая резка, фрикционная мойка, флотация, ополаскивание и обезвоживание. Тюк, капсулят или гранула.',
 cardTitle:'Линия горячей мойки плёнок и пакетов',cardDescription:'Глубокая очистка после сухой сепарации',
 cardFeature:'Три вида готовой продукции',cardEyebrow:'ГОРЯЧАЯ МОЙКА / ГОТОВАЯ ЛИНИЯ',
 cardFile:'lines/moyka-plenki/catalog-cover-navy.webp',cardSmallFile:'lines/moyka-plenki/catalog-cover-navy-768.webp',
 cardImageAlt:'Проектная компоновка линии горячей мойки плёнок и пакетов ЭРА',
 cardMetrics:[
  {value:'1 500',unit:'кг/ч',label:'Входной поток',note:'До 1,5 т/ч подготовленной плёнки · ТО, стр. 2, 16'},
  {value:'750',unit:'кг/ч',label:'Выпуск гранулы',note:'Номинально, один гранулятор · стр. 2, 16'},
  {value:'1 271,70',unit:'кВт',label:'Установленная мощность',note:'Сводная ведомость комплектации · стр. 17'},
  {value:'890,19',unit:'кВт',label:'Потребляемая мощность',note:'Расчётная, 70% от установленной · стр. 17'},
  {value:'3',unit:'чел./смена',label:'Рабочий персонал',note:'1 оператор, 2 водителя погрузчика · стр. 21'},
  {value:'3',unit:'вида',label:'Готовая продукция',note:'Тюки, капсулят, гранула · стр. 2, 14–15'},
 ],
 equipment:[...new Set(specification.map(p=>p.catalogSlug).filter(Boolean))],optionalEquipment:[],documents:[hotWashDocument],
};
const descriptions={
 'catalog-cover-navy':['visualization','Проектная компоновка линии горячей мойки','Линия целиком'],
 overview:['visualization','Общая компоновка горячей мойки','Линия целиком'],
 'raw-film-01':['photo','Подготовленная плёнка после сухой стадии, партия 1','Входное сырьё'],
 'raw-film-02':['photo','Подготовленная плёнка после сухой стадии, партия 2','Входное сырьё'],
 'material-flow':['scheme','Движение подготовленной плёнки через горячую мойку','Технологическая схема'],
 'layout-numbered':['scheme','Компоновка горячей мойки, позиции 1–36','Состав линии'],
 preparation:['visualization','Раскрытие тюков и защитная сепарация','Подготовка'],
 'buffer-feed':['visualization','Буфер и поочерёдная подача в мокрую резку','Подготовка'],
 'wet-mill':['visualization','Вертикально-роторный измельчитель в жидкой среде','Мокрое измельчение'],
 centrifuge:['photo','Роторная центрифуга: отдельный узел','Обезвоживание'],
 flotator:['photo','Плёночный флотатор: отдельный узел','Мойка'],
 'flotator-flow':['scheme','Флотация, фрикционная мойка и отвод осадка','Технологическая схема'],
 'wet-section':['visualization','Мойка, ополаскивание и последовательный отжим','Мойка'],
 'water-loop':['scheme','Местные контуры и общий водооборот мойки','Водооборот'],
 'product-flow':['scheme','Альтернативные маршруты: тюк, капсулят, гранула','Готовая продукция'],
 'product-bale':['photo','Тюк чистой плёнки: форма товарного продукта','Результат'],
 'product-capsulate':['photo','Капсулят: форма товарного продукта','Результат'],
 'product-granule':['photo','Вторичная гранула: форма товарного продукта','Результат'],
 'kair-overview':['photo','Панель оператора Siemens, общий вид','Управление'],
 'kair-parameters':['photo','Панель оператора, параметры процесса','Управление'],
 'placement-isometric':['scheme','Пример размещения горячей мойки в цехе','Размещение'],
 'placement-top':['scheme','План размещения горячей мойки, вид сверху','Размещение'],
};
export const hotWashMedia=Object.fromEntries(assets.map(asset=>{
 const [type,title,topic]=descriptions[asset.id];
 return [asset.id,{...asset,id:'moyka-plenki-'+asset.id,type,title,topic,page:asset.sourcePage,thumbnail:asset.smallFile,
  product:'/catalog/lines/moyka-plenki',productTitle:hotFilmWashing.cardTitle,
  caption:asset.sourcePage?`${title} · Техническое описание, стр. ${asset.sourcePage}`:'Утверждённая обложка владельца · проектная визуализация',
  source:asset.sourcePage?`Техническое описание горячей мойки, стр. ${asset.sourcePage}`:'Предоставленная владельцем обложка линии',
 }];
}));
// The same photographs already exist in the media registry. Add line membership, not a second photo.
const sharedPhotos={
 'raw-film-02':['project-home/products/clean_film_bale.webp','project-home/products/clean_film_bale-480.webp'],
 centrifuge:['photos/rotornaya-tsentrifuga/01.webp','photos/rotornaya-tsentrifuga/01-thumb.webp'],
 flotator:['photos/plenochnyy-flotator/02.webp','photos/plenochnyy-flotator/02-thumb.webp'],
 'kair-overview':['kair/11.webp','kair/11-768.webp'],
 'kair-parameters':['kair/09.webp','kair/09-768.webp'],
};
export const hotWashGalleryMedia=Object.entries(hotWashMedia).filter(([key])=>key!=='catalog-cover-navy').map(([key,item])=>{
 const shared=sharedPhotos[key];if(!shared)return item;
 const {width,height,...entry}=item;
 return {...entry,file:shared[0],thumbnail:shared[1]};
});

export const hotWashSpecs=[
 ['Подача на мойку','До 1 500 кг/ч подготовленной плёнки'],['Базовая грануляция','750 кг/ч номинально, один гранулятор'],
 ['Режим расчёта','24 часа/сутки, календарь полной загрузки'],['Установленная мощность','1 271,70 кВт по сводной ведомости'],
 ['Расчётная потребляемая мощность','890,19 кВт, 70% от установленной'],['Смена','3 человека: оператор и два водителя погрузчика'],
 ['Состав','37 проектных позиций, включая погрузчик и помещение; не количество машин'],
 ['Ветки мокрой резки','2, работают поочерёдно'],['Флотаторы / центрифуги','2 / 3, последовательно'],
 ['Накопители','2 × 4,7 м³'],['Водооборот','Очистка 25 м³/ч; ёмкость 4 м³; резервуары 20 + 20 м³'],
 ['Проектная компоновка','68 × 33 м, 2 244 м²; высота цеха по спецификации 9 м'],
];
export const hotWashStages=[
 ['Раскрытие и защитная сепарация','1 → 2 → 3 → 4 → 10А','Раскрывает тюки и удаляет случайные свободные включения перед мокрой резкой. Отводы 3 → 5 и 6 → 7 → 8 → 9 собирают примеси.','preparation'],
 ['Измельчение в жидкой среде','10А → 11 → 12А/Б → 13А/Б','Порционная подача. Один измельчитель в работе, второй доступен для переключения. Дозатор 32А подаёт порошок на ленту 11.','wet-mill'],
 ['Первичный отжим и горячая мойка','14 → 15 → 16А → 17А → 18А','Отделение части жидкости, дозирование 32Б на выгрузке 16А, фрикционная мойка и флотация в 18А.','flotator'],
 ['Ополаскивание','18А → 19А → 16Б → 17Б → 18Б','Межступенчатый отжим уменьшает перенос горячей щелочной среды. Чистая вода из резервуара 30 поступает во второй флотатор.','wet-section'],
 ['Финальное обезвоживание','18Б → 19Б → 16В → 20 → 10Б','Вывод ополаскивающей воды, накопление, уплотнение и дозированная подача чистой плёнки.','centrifuge'],
 ['Выбор товарного продукта','10Б → 21 → 22','Тюкование, капсуляция или грануляция — альтернативные маршруты из одного потока. Подробно — в разделе готовой продукции.','product-flow'],
];
export const hotWashProducts=[
 ['product-bale','Тюк чистой плёнки','Пресс 24 автоматически формирует и увязывает тюк около 700 кг; выдача через рольганг 25. Для хранения, перевозки и предприятий с собственной грануляцией.','22 → 24 → 25'],
 ['product-capsulate','Капсулят','Винтовой пресс-капсулятор 26 обезвоживает и термомеханически уплотняет плёнку; выдача через 27 в биг-бэг 9. Плотная сыпучая форма сырья для подходящего оборудования.','22 → 23 → 26 → 27 → 9'],
 ['product-granule','Вторичная полиэтиленовая гранула','Двухстадийная экструзия, фильтрация расплава и двузонная дегазация (28); выдача 29 → 9. Сырьё для плёнок, пакетов, труб и других изделий при подборе марки и требований покупателя.','22 → 23 → 28 → 29 → 9'],
];
export function hotWashEnergy(hours){return 890.19*hours/1000;}
