// Editorial content adapted from the user-provided presentation, not a test report.
export const presentationSource = 'Презентация «ЭРА», предоставленная заказчиком';
export const presentationStages = [
  {
    id: 'dry-separation', number: '01', title: 'Сухая сепарация',
    summary: 'Сначала — раскрыть сырьё и отделить основную массу загрязнений.',
    description: 'Материал проходит предварительную подготовку, сепарацию и сухую очистку. Органические, минеральные и твёрдые включения отделяются перед мойкой.',
    image: 'dry-separation', type: 'Визуализация', slide: 11,
    caption: 'Компоновка линии сухой сепарации из презентации ERA',
    result: 'Подготовленная плёночная фракция для следующей стадии.',
    details: ['Раскрытие и предварительное измельчение материала.', 'Разделение потока и отделение посторонних включений.', 'Подготовка плёнки к очистке в жидкой среде.'],
  },
  {
    id: 'hot-washing', number: '02', title: 'Горячая отмывка',
    summary: 'Затем — удалить загрязнения, связанные с поверхностью плёнки.',
    description: 'Очистка в жидкой среде направлена на остаточные загрязнения, масла, жиры и следы клеевых материалов. После мойки плёнку обезвоживают.',
    image: 'hot-washing', type: 'Визуализация', slide: 12,
    caption: 'Компоновка линии горячей отмывки из презентации ERA',
    result: 'Очищенный и подготовленный к дальнейшей переработке материал.',
    details: ['Режим мойки подбирается под сырьё и характер загрязнений.', 'Очистка рабочей жидкости и её возврат — по согласованной схеме.', 'Механическое обезвоживание после мойки.'],
  },
  {
    id: 'granulation', number: '03', title: 'Гранулирование',
    summary: 'После очистки — преобразовать материал в ПЭ-гранулу.',
    description: 'Гранулятор перерабатывает уже очищенный полимер. Результат зависит от состава сырья и качества предыдущих стадий подготовки.',
    image: 'granules', type: 'Образец материала', slide: 13,
    caption: 'Гранула, показанная в презентации ERA',
    result: 'Вторичная ПЭ-гранула при наличии стадии грануляции в комплектации.',
    details: ['Грануляция не заменяет очистку сырья.', 'Состав и характеристики конечного материала требуют проверки.', 'Грануляционная стадия согласовывается отдельно в составе проекта.'],
  },
];
export const presentationOutputs = [
  {id:'clean-film',title:'Очищенная плёнка',description:'Подготовленный материал для следующего этапа переработки.',image:'clean-film',slide:13},
  {id:'compacted-material',title:'Материал после капсулятора',description:'Отжатый материал для следующей стадии переработки.',image:'compacted-material',slide:13},
  {id:'granules',title:'Вторичная ПЭ-гранула',description:'Продукт после соответствующей стадии гранулирования.',image:'granules',slide:13},
];
export const projectSteps = [
  {title:'Изучаем сырьё',text:'Вид плёнки, загрязнения, объём и желаемый результат. При необходимости — испытания.'},
  {title:'Подбираем решение',text:'Технологическая последовательность, состав оборудования и требования к площадке.'},
  {title:'Готовим к запуску',text:'Изготовление, доставка, монтаж и пусконаладка в согласованном объёме проекта.'},
  {title:'Сопровождаем работу',text:'Обучение, обслуживание, запасные части и техническая поддержка по условиям поставки.'},
];
export const presentationMedia = [
  {id:'project-complex',title:'Комплекс ERA: производственный участок',type:'photo',topic:'Работа',file:'presentation/complex.webp',slide:9,product:'/',productTitle:'Проект ERA'},
  {id:'project-raw-film',title:'Полигонное плёночное сырьё',type:'photo',topic:'Сырьё',file:'presentation/raw-film.webp',slide:3,product:'/technology',productTitle:'Технология переработки'},
  ...presentationStages.slice(0,2).map(s=>({id:'project-'+s.id,title:s.caption,type:'visualization',topic:'Схемы и визуализации',file:'presentation/'+s.image+'.webp',slide:s.slide,product:'/technology#'+s.id,productTitle:s.title})),
  ...presentationOutputs.map(o=>({id:'project-'+o.id,title:o.title+' — образец из презентации',type:'photo',topic:'Результат',file:'presentation/'+o.image+'.webp',slide:o.slide,product:'/technology#granulation',productTitle:'Результат переработки'})),
  {id:'project-production',title:'Изготовление оборудования: общий вид',type:'photo',topic:'Сборка',file:'presentation/manufacture-wide.webp',slide:24,product:'/',productTitle:'Проект ERA'},
].map(m=>({...m,source:presentationSource+', слайд '+m.slide}));
