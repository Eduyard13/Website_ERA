// Product-type illustrations linked to their original public image URLs.
// Original source metadata is retained; no claim of ERA authorship or testing.
const references=[
 {id:'clear',title:'Прозрачная плёнка',source:'Waste Optima',page:'https://www.wasteoptima.com/industrial-plastic-recycling/industrial-plastic-film-recycling',image:'https://images.squarespace-cdn.com/content/v1/649219dee5586d7b971d3292/c908249b-87d0-4972-86f6-ba26867ea00f/Plastic%2Bfilm%2Bwebsite.jpg'},
 {id:'sorted',title:'Раздельные цветные фракции',source:'Morssinkhof Rymoplast',page:'https://morssinkhof-rymoplast.com/materialen/flexibels/',image:'https://d15gpb5pyl94gl.cloudfront.net/media/_bestand/16398/DSC_0612.jpg'}
];
const icons={
 bale:'<path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4v10M3 12l9 4 9-4"/>',
 wash:'<path d="M12 2c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13ZM8 15c0 2 1 3 3 4"/>',
 pellets:'<circle cx="6" cy="6" r="2.5"/><circle cx="15" cy="5" r="2.5"/><circle cx="9" cy="14" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="17" cy="20" r="2.5"/><circle cx="4" cy="21" r="2"/>'
};
const icon=key=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg>';
function referenceCard(m){
 return '<figure class="dry-route-photo" data-dry-route-reference="'+m.id+'"><a class="dry-route-reference-image" href="'+m.image+'" target="_blank" rel="noopener noreferrer" aria-label="Открыть оригинал: '+m.title+'"><span class="dry-route-reference-placeholder">Открыть фотографию</span><span role="img" aria-label="'+m.title+'" class="dry-route-reference-art" style="background-image:url(&quot;'+m.image+'&quot;)"></span><span class="line-image-zoom" aria-hidden="true">⤢</span></a><figcaption><strong>'+m.title+'</strong></figcaption></figure>';
}
function photoGallery(){
 return '<div class="dry-route-gallery" data-dry-route-gallery="reference" aria-label="Примеры товарных фракций">'+references.map(referenceCard).join('')+'</div>';
}
const stage=(key,number,title,description,link='')=>'<article class="dry-route-stage" data-dry-route-stage="'+key+'"><div class="dry-route-stage-top"><span>'+number+'</span>'+icon(key)+'</div><h4>'+title+'</h4><p>'+description+'</p>'+link+'</article>';
export function renderDryProductRoutes(){
 return '<div class="dry-product-routes" data-dry-product-routes><div class="dry-route-heading"><p class="eyebrow">ТОВАРНЫЙ ПРОДУКТ</p><h3>Готовая продукция и дальнейший путь материала</h3></div><div class="dry-route-hero"><div class="dry-route-media">'+photoGallery()+'</div><div class="dry-route-copy"><h4>Очищенная плёнка, готовая к отгрузке и дальнейшей переработке</h4><p>После сухой очистки и сортировки плёнку накапливают раздельно и прессуют в товарные партии. Материал можно реализовать в тюках или направить на следующий этап полного цикла переработки.</p></div></div><div class="dry-route-map" aria-label="Два маршрута дальнейшего использования материала"><div class="dry-route-origin"><span>ВЫХОД ЛИНИИ</span><strong>Очищенная плёнка в тюках</strong></div><svg class="dry-route-branch" viewBox="0 0 1000 56" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M500 0 V22 H250 V51 M500 22 H750 V51" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/><path d="m244 45 6 6 6-6m488 0 6 6 6-6" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg><div class="dry-route-branches"><div class="dry-route-lane" data-dry-route-lane="sale"><p class="dry-route-lane-label">МАРШРУТ 01 · РЕАЛИЗАЦИЯ</p>'+stage('bale','01','Реализация в тюках','Готовые партии очищенной плёнки для хранения, отгрузки и реализации переработчикам.')+'</div><div class="dry-route-lane" data-dry-route-lane="cycle"><p class="dry-route-lane-label">МАРШРУТ 02 · ПОЛНЫЙ ЦИКЛ</p>'+stage('wash','02','Горячая мойка','Удаление остаточных загрязнений, этикеток, клеёв, жиров и масел; обезвоживание и подготовка к грануляции.','<a class="text-link" href="/catalog/lines/moyka-plenki">Линия горячей мойки ↗</a>')+'<div class="dry-route-down" aria-hidden="true">↓</div>'+stage('pellets','03','Грануляция','Переработка подготовленного полимера в гранулу для производства новой продукции.')+'</div></div></div></div>';
}
