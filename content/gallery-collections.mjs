// Editorial metadata only. Existing catalogues and their source records stay intact.
export const galleryCollections=[
 {id:'raw',number:'01',label:'Сырьё',title:'Сырьё, которое требует особой технологии.',lead:'Полиэтиленовые плёнки и пакеты с минеральными, органическими и другими включениями.',action:'Смотреть сырьё',href:'/technology#raw-material',link:'Сырьё и технология'},
 {id:'nodes',number:'02',label:'Узлы',title:'Инженерные решения. Отдельно и в составе линии.',lead:'Раскрытие, разделение, очистка, мойка, обезвоживание — каждый агрегат решает конкретную технологическую задачу.'},
 {id:'lines',number:'03',label:'Линии',title:'От отдельных агрегатов — к согласованной линии.',lead:'Компоновки, производственные участки и взаимосвязь технологических узлов.'},
 {id:'work',number:'04',label:'В работе',title:'Реальные механизмы. Реальная работа.',lead:'Процесс подачи, разделения, очистки и транспортировки материала на производственных участках.',action:'Смотреть оборудование в работе',href:'/technology',link:'Как работает технология'},
 {id:'products',number:'05',label:'Продукция',title:'От очищенной плёнки — к вторичной ПЭ-грануле.',lead:'Результаты разных стадий переработки: подготовленная плёночная фракция и гранула после полного технологического цикла.',action:'Смотреть результаты',href:'/economics',link:'Экономика готового продукта'},
 {id:'videos',number:'06',label:'Видео',title:'Технология в движении.',lead:'Видеопрезентации оборудования, технологических этапов и результатов очистки.'},
];
export const featuredGalleryNodes=['predvaritelnyy-izmelchitel','ballisticheskiy-separator','rotornyy-raspushitel','plenochnyy-flotator'];

// Optional overrides for existing IDs; add metadata here without editing templates.
export const galleryOverrides={
 'project-complex':{collections:['lines','work']},
 'project-production':{collections:['lines']},
 'home-lineWide':{collections:['lines'],coverPriority:1},
 'home-contactDetail':{collections:['lines']},
 'home-evidenceInput':{collections:['raw'],coverPriority:1},
 'home-evidenceProcess':{collections:['work'],coverPriority:1},
 'home-evidenceOutput':{collections:['products'],coverPriority:2},
 'home-filmProduct':{collections:['products']},
 'home-cleanFilm':{collections:['products']},
 'home-fluffier':{kind:'frame',collections:['nodes','work']},
 'project-granules':{collections:['products'],coverPriority:1},
 'separatsiya-01-mini-cover':{coverPriority:0},
};

// New standalone media may be added here. File paths are relative to public/assets.
// Equipment additions require productPath; new videos also need ready:true and poster.
export const galleryAdditionalMedia=[];

// These are pointers into the existing homepage registry, not copies of the files.
export const galleryProjectSlots=[
 ['evidenceInput','Сырьё'],['evidenceProcess','Работа'],['evidenceOutput','Результат'],
 ['filmProduct','Результат'],['cleanFilm','Результат'],['lineWide','Сборка'],['contactDetail','Сборка'],
 ['preshredder','Сборка','predvaritelnyy-izmelchitel'],
 ['separator','Сборка','ballisticheskiy-separator'],
 ['fluffier','Работа','rotornyy-raspushitel'],
];
