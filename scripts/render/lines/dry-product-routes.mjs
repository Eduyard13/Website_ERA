import {renderDryRouteMap} from './dry-route-map.mjs';
// Product-type illustrations linked to their original public image URLs.
// Original source metadata is retained; no claim of ERA authorship or testing.
const references=[
 {id:'clear',title:'Прозрачная плёнка',source:'Waste Optima',page:'https://www.wasteoptima.com/industrial-plastic-recycling/industrial-plastic-film-recycling',image:'https://images.squarespace-cdn.com/content/v1/649219dee5586d7b971d3292/c908249b-87d0-4972-86f6-ba26867ea00f/Plastic%2Bfilm%2Bwebsite.jpg'},
 {id:'sorted',title:'Раздельные цветные фракции',source:'Morssinkhof Rymoplast',page:'https://morssinkhof-rymoplast.com/materialen/flexibels/',image:'https://d15gpb5pyl94gl.cloudfront.net/media/_bestand/16398/DSC_0612.jpg'}
];
function referenceCard(m){
 return '<figure class="dry-route-photo" data-dry-route-reference="'+m.id+'"><a class="dry-route-reference-image" href="'+m.image+'" target="_blank" rel="noopener noreferrer" aria-label="Открыть оригинал: '+m.title+'"><span class="dry-route-reference-placeholder">Открыть фотографию</span><span role="img" aria-label="'+m.title+'" class="dry-route-reference-art" style="background-image:url(&quot;'+m.image+'&quot;)"></span><span class="line-image-zoom" aria-hidden="true">⤢</span></a><figcaption><strong>'+m.title+'</strong></figcaption></figure>';
}
function photoGallery(){
 return '<div class="dry-route-gallery" data-dry-route-gallery="reference" aria-label="Примеры товарных фракций">'+references.map(referenceCard).join('')+'</div>';
}
export function renderDryProductRoutes(){
 return '<div class="dry-product-routes" data-dry-product-routes><div class="dry-route-heading"><p class="eyebrow">ТОВАРНЫЙ ПРОДУКТ</p><h3>Готовая продукция и дальнейший путь материала</h3></div><div class="dry-route-hero"><div class="dry-route-media">'+photoGallery()+'</div><div class="dry-route-copy"><h4>Очищенная плёнка, готовая к отгрузке и дальнейшей переработке</h4><p>После сухой очистки и сортировки плёнку накапливают раздельно и прессуют в товарные партии. Материал можно реализовать в тюках или направить на следующий этап полного цикла переработки.</p></div></div>'+renderDryRouteMap()+'</div>';
}
