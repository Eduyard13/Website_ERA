import {presentationMedia} from './presentation.mjs';
export const categories=['Подготовка и подача','Сухая сепарация и очистка','Измельчение и мойка','Обезвоживание','Очистка рабочей жидкости','Фасовка'];
const rows=[
 ['predvaritelnyy-izmelchitel','Предварительный измельчитель',0,'Растюковка, разрыв и крупное измельчение перед дальнейшей переработкой.'],
 ['predvaritelnyy-raspushitel','Предварительный распушитель',0,'Раскрытие уплотнённых фрагментов перед сепарацией.'],
 ['ballisticheskiy-separator','Баллистический сепаратор',1,'Разделение подготовленного потока на фракции.'],
 ['rotornyy-raspushitel','Роторный распушитель',1,'Раскрытие плёнки и сухая очистка.'],
 ['bunker-nakopitel','Бункер-накопитель',0,'Запас материала и согласование подачи.'],
 ['vertikalno-rotornyy-izmelchitel','Вертикально-роторный измельчитель',2,'Измельчение с промывкой в рабочей жидкости.'],
 ['plenochnyy-flotator','Плёночный флотатор',2,'Мойка и разделение плёнки с тонущими загрязнениями.'],
 ['rotornaya-tsentrifuga','Роторная центрифуга',3,'Очистка и механическое обезвоживание.'],
 ['vintovoy-press','Винтовой отжимной пресс',3,'Механический отжим подготовленной влажной плёнки.'],
 ['kapsulyator','Капсулятор',null,'Назначение, место в процессе и параметры уточняются по документации.'],
 ['ochistka-stokov','Комплекс очистки стоков',4,'Вспомогательный комплекс очистки рабочей жидкости.'],
 ['rama-napolnitel','Рама-наполнитель для биг-бэгов',5,'Организация наполнения и смены тары.']
];
export const nodes=rows.map(([slug,title,category,description],i)=>({slug,title,category:categories[category]||'Назначение уточняется',description,status:i===0?'source-checked':'draft',image:i===0?'shredder':null,materials:i===0?['Плёнки','Другие полимеры','Древесина и ТБО']:[],documents:[],media:i===0?['assembly','mechanism','delivery','scheme','shredder']:[],path:'/catalog/equipment/'+slug}));
export const lines=[
 {slug:'separatsiya-01',title:'Сепарация 01',group:'Сепарация',enabled:true},
 {slug:'separatsiya-02',title:'Сепарация 02',group:'Сепарация',enabled:true},
 {slug:'separatsiya-03',title:'Сепарация 03',group:'Сепарация',enabled:false},
 {slug:'moyka-plenki',title:'Мойка плёнки',group:'Мойка',enabled:true}
].map(l=>({...l,path:'/catalog/lines/'+l.slug,status:'draft',equipment:[],optionalEquipment:[],documents:[]}));
const equipmentMedia=[
 {id:'assembly',title:'Сборка узла со стороны привода',type:'photo',topic:'Сборка',file:'assembly.webp'},
 {id:'mechanism',title:'Сборка механизма подвижной щеки',type:'photo',topic:'Сборка',file:'mechanism.webp'},
 {id:'delivery',title:'Готовый узел на транспортной платформе',type:'photo',topic:'Сборка',file:'delivery.webp'},
 {id:'scheme',title:'Конструктивная схема измельчителя',type:'scheme',topic:'Схемы и визуализации',file:'scheme.webp'},
 {id:'shredder',title:'Визуализация базового узла',type:'visualization',topic:'Схемы и визуализации',file:'shredder.webp'}
].map(m=>({...m,product:nodes[0].path,productTitle:nodes[0].title,source:'Предоставленное КП предварительного измельчителя'}));
export const media=[...equipmentMedia,...presentationMedia];
export const mediaType={photo:'Фотография',video:'Видео',scheme:'Схема',visualization:'Визуализация'};
