export const primaryLinks=[
 {href:'/',label:'О проекте',section:'project'},
 {href:'/technology',label:'Технология',section:'technology'},
 {href:'/catalog',label:'Оборудование',section:'equipment'},
 {href:'/economics',label:'Экономика',section:'economics'},
 {href:'/automation',label:'КАИР',section:'control',title:'КАИР — система интеллектуального управления'},
];
export const navigationGroups=[
 {label:'Проект',links:[{href:'/',label:'О проекте'},{href:'/economics',label:'Экономика переработки'}]},
 {label:'Технология',links:[{href:'/technology',label:'Технология переработки'},{href:'/automation',label:'Управление КАИР'}]},
 {label:'Оборудование',links:[{href:'/catalog',label:'Весь каталог'},{href:'/catalog/lines',label:'Линии и комплексы'},{href:'/catalog/equipment',label:'Отдельные узлы'}]},
 {label:'Материалы',links:[{href:'/media',label:'Фото и видео'},{href:'/documents',label:'Техническая документация'}]},
 {label:'Команда и контакты',links:[{href:'/about-us',label:'О нас'},{href:'/contacts',label:'Контакты'}]},
];
// Existing routes remain available; restore their links when their content is ready.
export const hiddenNavigationLinks=[{href:'/news',label:'Новости'},{href:'/blog',label:'Статьи и обзоры'}];
