import {imageSize} from './image-size.mjs';

// Shared native route diagram. BASE retains the original trial photograph.
const media={bulk:'lines/separatsiya-01-mini/after.webp'};
const icons={
 bale:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4v10M3 12l9 4 9-4"/>',
 sale:'<path d="M6 7h12l3 13H3L6 7ZM8 7V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3M8 7l-1 13m9-13 1 13"/>',
 wash:'<path d="M12 2c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13ZM8 15c0 2 1 3 3 4"/>',
 pellets:'<circle cx="6" cy="6" r="2.5"/><circle cx="15" cy="5" r="2.5"/><circle cx="9" cy="14" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="17" cy="20" r="2.5"/><circle cx="4" cy="21" r="2"/>'
};
const icon=key=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg>';
function picture(key,cls=''){
 const file=media[key],{width,height}=imageSize(new URL('../public/assets/'+file,import.meta.url));
 return '<img class="'+cls+'" src="/assets/'+file+'" width="'+width+'" height="'+height+'" alt="" loading="lazy" decoding="async">';
}
function illustration(key){
 return '<div class="dry-route-visual" data-route-illustration="'+key+'" aria-hidden="true">'+picture(key)+'<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H100 V2 Q48 4 0 49 Z" fill="#faf7f1"/><path d="M0 49 Q48 4 100 2" fill="none" stroke="#b99148" stroke-width="1.2" vector-effect="non-scaling-stroke"/><path d="M60 100 Q86 95 100 78 V100 Z" fill="#b99148" fill-opacity=".83"/><path d="M60 100 Q86 95 100 78" stroke="#f5e5bb" stroke-width="1" fill="none" vector-effect="non-scaling-stroke"/></svg></div>';
}
// Decorative artwork is cropped directly from the owner-approved Variant 3
// mockup (25 Nov 2026). These are illustrative visuals, not documentary photos.
// All copy, icons, connectors and links remain native HTML/SVG.
const approvedRoot='lines/shared/route-approved-03/';
function approvedPicture(key,cls=''){
 const file=approvedRoot+key+'.webp',{width,height}=imageSize(new URL('../public/assets/'+file,import.meta.url));
 return '<img class="'+cls+'" data-approved-route-art="'+key+'" src="/assets/'+file+'" width="'+width+'" height="'+height+'" alt="" loading="lazy" decoding="async">';
}
function approvedStage(key,number,title,description,link=''){
 return '<article class="dry-route-stage" data-dry-route-stage="'+key+'"><div class="dry-route-stage-copy"><div class="dry-route-stage-top"><span>'+number+'</span>'+(number==='01'?'<b class="dry-route-sale-label">РЕАЛИЗАЦИЯ</b>':'')+icon(key)+'</div><h4>'+title+'</h4><p>'+description+'</p>'+link+'</div>'+(key==='sale'?illustration('bulk'):'<div class="dry-route-visual" data-route-illustration="'+key+'" aria-hidden="true">'+approvedPicture(key)+'</div>')+'</article>';
}
function approvedMap(base=false){
 const title=base?'Очищенная плёночная фракция':'Очищенная плёнка в тюках';
 const sale=base?approvedStage('sale','01','Реализация навалом','Продажа очищенного плёночного сырья переработчикам в согласованном формате поставки. Навалом, в биг-бэгах или в сетчатом боксе.'):approvedStage('bale','01','Реализация в тюках','Готовые партии очищенной плёнки для хранения, отгрузки и реализации переработчикам.');
 return '<div id="product-routes" class="dry-route-map dry-route-map--editorial dry-route-map--approved" data-route-design="editorial-03" data-route-approved="reference-20261125"'+(base?' data-route-base="true"':'')+' aria-label="Два маршрута дальнейшего использования материала"><div class="dry-route-origin">'+approvedPicture('origin','dry-route-approved-origin')+'<span>ВЫХОД ЛИНИИ</span><strong>'+title+'</strong></div><svg class="dry-route-branch" viewBox="0 0 1000 60" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M500 0 V13 Q500 22 490 22 H197 Q187 22 187 33 V54 M500 13 Q500 22 510 22 H804 Q814 22 814 33 V54" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/><path d="m182 47 5 7 5-7m617 0 5 7 5-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg><div class="dry-route-branches"><div class="dry-route-lane" data-dry-route-lane="sale">' +sale+'</div><div class="dry-route-lane" data-dry-route-lane="cycle"><p class="dry-route-lane-label">ПОЛНЫЙ ЦИКЛ</p><div class="dry-route-cycle-stages">'+approvedStage('wash','02','Горячая мойка','Удаление остаточных загрязнений, этикеток, клеёв, жиров и масел; обезвоживание и подготовка к грануляции.','<a class="text-link" href="/catalog/lines/moyka-plenki">Линия горячей мойки ↗</a>')+'<div class="dry-route-down" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M4 16h23M18 7l9 9-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'+approvedStage('pellets','03','Грануляция','Переработка подготовленного полимера в гранулу для производства новой продукции.')+'</div></div></div></div>';
}
export function renderDryRouteMap({base=false}={}){
 return approvedMap(base);
}
