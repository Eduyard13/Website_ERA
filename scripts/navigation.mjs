const groups = [
 {href:'/',label:'Знакомство с ERA',home:true},
 {href:'/catalog',label:'Каталог',matches:p=>p==='/catalog'||p.startsWith('/catalog/equipment')},
 {href:'/catalog/lines',label:'Линии',matches:p=>p.startsWith('/catalog/lines')},
 {href:'/technology',label:'Технология'},
 {label:'Управление и ИИ',children:[{href:'/automation',label:'Программа управления'},{href:'/ai',label:'Искусственный интеллект'}]},
 {label:'Материалы',children:[{href:'/media',label:'Фото и видео'},{href:'/documents',label:'Документация'},{href:'/news',label:'Новости'},{href:'/blog',label:'Блог'}]},
 {href:'/about',label:'О проекте'},
 {href:'/contacts',label:'Контакты',matches:p=>p==='/contacts'||p==='/company-details'},
];
const isCurrent=(item,path)=>item.href===path;
const isSection=(item,path)=>item.matches?item.matches(path):path===item.href||path.startsWith(item.href+'/');
const homeMark='<svg class="nav-home-mark" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m10 2 8 8-8 8-8-8 8-8Z" stroke="currentColor" stroke-width="1.2"/><path d="M7 10h6m-3-3v6" stroke="currentColor" stroke-width="1.2"/></svg>';
function link(item,path,submenu=false){
 const current=isCurrent(item,path);const active=current||(!submenu&&isSection(item,path));
 return `<a class="${submenu?'nav-sub-link':'nav-link nav-entry'}${item.home?' nav-home':''}" href="${item.href}"${current?' aria-current="page"':active?' aria-current="location"':''}${item.home?' title="Знакомство с ERA — главная страница"':''}>${item.home?homeMark:''}<span>${item.label}</span></a>`;
}
export function navigation(path){return groups.map(item=>{
 if(!item.children)return link(item,path);
 const active=item.children.some(child=>isSection(child,path));
 return `<details class="nav-section nav-entry"${active?' data-active-section="true"':''}><summary>${item.label}</summary><div>${item.children.map(child=>link(child,path,true)).join('')}</div></details>`;
}).join('');}
