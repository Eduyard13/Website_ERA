// Presentation-only navigation and copy for dry separation schemes.
// All marker geometry, SVG leaders and descriptions still come from source technical documents.
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

const tiers={
 'separatsiya-01':{
  label:'BASE',count:13,
  lead:'От загрузки плёнки до очищенного материала, готового к следующему этапу.',
  facts:[['13','проектных позиций'],['1','общий поток очищенной плёнки'],['3','человека в смену'],['КАИР','единое управление']],
  groups:[[1,2,'Загрузка и подача'],[3,4,'Баллистическое разделение'],[5,6,'Контроль и роторная очистка'],[7,11,'Отвод включений'],[12,13,'Пылеулавливание и управление']],
  unmapped:[[12,'Система пылеулавливания'],[13,'Шкаф управления и контроля']]
 },
 'separatsiya-02':{
  label:'PRO',count:27,
  lead:'От загрузки тюка до готовых тюков очищенной плёнки.',
  facts:[['27','проектных позиций'],['5','бункеров для раздельных фракций'],['Тюки','очищенная плёнка на выходе'],['КАИР','единое управление']],
  groups:[[1,3,'Загрузка и подача'],[4,7,'Первичная сепарация'],[8,12,'Ручная сортировка'],[13,18,'Роторный узел и пневматика'],[19,25,'Накопление и выдача тюков'],[26,27,'Управление и логистика']],
  unmapped:[]
 },
 'separatsiya-03':{
  label:'PREMIUM',count:37,
  lead:'От загрузки тюка через сушку и двойную сепарацию — до готовых тюков очищенной плёнки.',
  facts:[['37','проектных позиций'],['2','баллистические ступени'],['Роторная','сушка между ступенями'],['Тюки','очищенная плёнка на выходе']],
  groups:[[1,6,'Подготовка сырья'],[7,12,'Баллистика и роторная сушка'],[13,16,'Сортировка и роторная очистка'],[17,24,'Накопление и выдача тюков'],[25,33,'Отвод включений'],[34,37,'Инженерная инфраструктура']],
  unmapped:[]
 }
};

export function renderDryArchitectureHeading(slug){
 const tier=tiers[slug];
 if(!tier)throw Error('Unknown dry configuration '+slug);
 return '<div class="dry-architecture-intro">'+
  '<p class="eyebrow">АРХИТЕКТУРА ЛИНИИ <span>/ '+tier.label+'</span></p>'+
  '<div class="dry-architecture-intro-layout"><div><h2>Каждый узел на своём месте.<br>Каждая функция — на результат.</h2>'+
  '<p class="dry-architecture-lead">'+escape(tier.lead)+'</p></div>'+
  '<div class="dry-architecture-facts" aria-label="Ключевые особенности комплектации">'+
   tier.facts.map(([value,label])=>'<div><strong>'+escape(value)+'</strong><span>'+escape(label)+'</span></div>').join('')+
  '</div></div></div>';
}

export function dryArchitectureGroup(slug,number){
 const tier=tiers[slug];
 return tier?.groups.find(([from,to])=>Number(number)>=from&&Number(number)<=to)?.[2]||'Оборудование линии';
}

export function renderDryArchitectureNavigator(diagram){
 const tier=tiers[diagram.slug];if(!tier)throw Error('Unknown dry diagram '+diagram.slug);
 const selected=diagram.defaultPart;
 const indexed=new Map(diagram.parts.map(p=>[p.number,p]));
 const content=tier.groups.map(([from,to,title])=>{
   const items=[];
   for(let number=from;number<=to;number++){
    const p=indexed.get(number);
    if(p)items.push('<button type="button" class="dry-architecture-item" data-architecture-part="'+number+'" aria-pressed="'+String(number===selected)+'" aria-controls="'+diagram.id+'-details" title="'+escape(p.label)+'">'+
      '<span class="dry-architecture-item-index">'+String(number).padStart(2,'0')+'</span>'+
      '<span class="dry-architecture-item-label">'+escape(p.label)+'</span></button>');
    else{
     const additional=tier.unmapped.find(([n])=>n===number);
     if(additional)items.push('<div class="dry-architecture-item dry-architecture-item--reference" title="Нет отдельной выноски на исходной компоновке">'+
       '<span class="dry-architecture-item-index">'+String(number).padStart(2,'0')+'</span>'+
       '<span class="dry-architecture-item-label">'+escape(additional[1])+'<small>Позиция без выноски</small></span></div>');
    }
   }
   return '<div class="dry-architecture-group"><h4>'+escape(title)+' <span>'+from+'–'+to+'</span></h4>'+items.join('')+'</div>';
 }).join('');
 return '<aside class="dry-architecture-navigation" aria-label="Постоянный навигатор позиций линии">'+
  '<div class="dry-architecture-navigation-header"><p>СОСТАВ ЛИНИИ</p><h3>'+tier.count+' проектных позиций</h3>'+
  '<span>Выберите узел на схеме или в списке справа.</span></div>'+
  '<div class="dry-architecture-list" data-architecture-list tabindex="0" role="group" aria-label="Выбор узла оборудования">'+content+'</div>'+
  '</aside>';
}

export function renderDryArchitectureFooter(){
 return '<p class="dry-architecture-footer"><span aria-hidden="true">ⓘ</span>'+
  'Каждая позиция на схеме — часть единого технологического маршрута. Выберите узел, чтобы увидеть его назначение и место в линии.</p>';
}
