import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {media,nodes,lines} from '../../content/equipment/catalog.mjs';
import {buildGalleryData,galleryCounts} from '../../scripts/render/pages/gallery-data.mjs';
import {selectGalleryItems,findGalleryItem,thumbnailWindow,durationLabel} from '../../public/assets/js/gallery/gallery-model.js';
import {renderGallery} from '../../scripts/render/pages/gallery.mjs';
const data=buildGalleryData();

test('Шоурум сохраняет исходные IDs и файлы, 12 узлов и четыре опубликованные линии',()=>{
 assert.equal(data.albums.filter(a=>a.collection==='nodes').length,12);assert.equal(data.albums.filter(a=>a.collection==='lines').length,4);
 for(const node of nodes)assert.ok(data.albums.some(a=>a.id===node.slug));
 for(const line of lines.filter(l=>!l.enabled))assert.ok(!data.albums.some(a=>a.id===line.slug));
 for(const original of media){const m=findGalleryItem(data.items,original.id);assert.ok(m,original.id);assert.equal(m.file,original.file);}
 assert.equal(data.missing.length,0);assert.deepEqual(data.collections.map(c=>c.id),['raw','nodes','lines','work','products','videos']);
});
test('Одна запись на физический файл, реальные раздельные счётчики и только доступные источники',()=>{
 assert.equal(new Set(data.items.map(m=>m.id)).size,data.items.length);assert.equal(new Set(data.items.map(m=>m.file)).size,data.items.length);
 const allIds=data.items.flatMap(m=>[m.id,...m.aliases]);assert.equal(new Set(allIds).size,allIds.length);
 for(const m of data.items){assert.ok(existsSync('public/assets/'+m.file),m.file);assert.ok(existsSync('public/assets/'+m.thumbnail),m.thumbnail);assert.ok(m.width>0&&m.height>0);if(m.kind==='video')assert.ok(existsSync('public/assets/'+m.poster));}
 const counts=galleryCounts(data.items);assert.equal(Object.values(counts).reduce((a,b)=>a+b),data.items.length);assert.equal(counts.video,4);
});
test('Альбомы измельчителя и баллистики включают одну презентацию, фото и инженерные изображения',()=>{
 for(const slug of ['predvaritelnyy-izmelchitel','ballisticheskiy-separator']){
  const album=data.albums.find(a=>a.id===slug),items=selectGalleryItems(data.items,{album:slug});
  assert.equal(items.filter(m=>m.kind==='video').length,1);assert.ok(items.some(m=>m.kind==='photo'));assert.ok(items.some(m=>['scheme','visualization'].includes(m.kind)));
  assert.equal(items[0].id,album.coverId);assert.equal(items[1].kind,'video');assert.equal(items[2].kind,'photo');
  const video=items.find(m=>m.kind==='video');assert.ok(selectGalleryItems(data.items,{collection:'videos'}).includes(video));
 }
});
test('Коллекции различают сырьё, сборку и работу; схемы не становятся фотографиями',()=>{
 assert.ok(selectGalleryItems(data.items,{collection:'raw'}).every(m=>m.kind==='photo'));
 for(const m of selectGalleryItems(data.items,{collection:'work'}))assert.ok(['photo','frame','video'].includes(m.kind));
 assert.ok(!selectGalleryItems(data.items,{collection:'work'}).some(m=>m.id==='predvaritelnyy-izmelchitel-photo-02'));
 assert.equal(findGalleryItem(data.items,'home-fluffier').kind,'frame');
 assert.equal(findGalleryItem(data.items,'project-dry-separation').kind,'visualization');
 assert.ok(!findGalleryItem(data.items,'ballisticheskiy-separator-photo-05').albumIds.some(id=>id.startsWith('separatsiya-')));
});
test('Архив и просмотрщик используют одни фильтры, поддерживая прежние типы и связи с продуктом',()=>{
 const product=nodes.find(n=>n.slug==='vintovoy-press').path;
 const photos=selectGalleryItems(data.items,{product,type:'photo'});assert.equal(photos.length,6);
 assert.ok(selectGalleryItems(data.items,{type:'scheme'}).every(m=>['scheme','visualization'].includes(m.kind)));
 assert.equal(selectGalleryItems(data.items,{q:'нет такого материала xyzq'}).length,0);
 assert.equal(selectGalleryItems(data.items,{collection:'not-a-collection'}).length,0);
 assert.ok(selectGalleryItems(data.items,{q:'ПЭ-гранула'}).length>0);
});
test('Новые материалы добавляются данными; отсутствующие файлы и неготовые видео исключены',()=>{
 const reference=data.items.find(m=>m.kind==='photo'),file='test/new-file.webp',fileExists=f=>f===file||existsSync('public/assets/'+f);
 const extra={id:'new-reviewed-photo',file,type:'photo',productPath:nodes[0].path,title:'Новый ракурс узла',width:1000,height:700};
 const expanded=buildGalleryData({additional:[extra,{...extra,id:'missing',file:'does-not-exist.webp'},{id:'not-ready',type:'video',ready:false,file:'videos/predvaritelnyy-izmelchitel.mp4'}],fileExists});
 assert.ok(expanded.items.some(m=>m.id===extra.id));assert.ok(expanded.albums.find(a=>a.id===nodes[0].slug).ids.includes(extra.id));
 assert.ok(!expanded.items.some(m=>['missing','not-ready'].includes(m.id)));assert.ok(reference);
});
test('Разные IDs одного файла объединяются; конфликт одинакового ID с разными файлами отклоняется',()=>{
 const m=data.items[0],duplicate={...m,id:'same-file-alias',type:m.kind,product:m.productPath};
 const merged=buildGalleryData({additional:[duplicate]});assert.equal(merged.items.length,data.items.length);assert.equal(findGalleryItem(merged.items,duplicate.id).file,m.file);
 const exact=buildGalleryData({additional:[{...duplicate,id:m.id}]});assert.equal(exact.items.length,data.items.length);assert.ok(!findGalleryItem(exact.items,m.id).aliases.includes(m.id));
 assert.throws(()=>buildGalleryData({additional:[{...duplicate,id:m.id,file:data.items.find(x=>x.file!==m.file).file}]}),/Duplicate gallery ID/);
});
test('Лента миниатюр ограничена и включает текущий кадр даже у альбома из 1000 материалов',()=>{
 for(const length of [0,1,10,1000])for(const index of [0,Math.max(0,length-1),Math.floor(length/2)]){
  const w=thumbnailWindow(length,index);assert.ok(w.start>=0&&w.end<=length&&w.end-w.start<=15);if(length)assert.ok(index>=w.start&&index<w.end);
 }
 assert.equal(durationLabel(104.52),'1:44');assert.equal(durationLabel(296),'4:56');assert.equal(durationLabel(null),'');
});
test('Редакционные подписи и встроенные данные не создают HTML из пользовательских строк',()=>{
 const copy=structuredClone(data),unsafe='<img src=x onerror="alert(1)"> ↗ </script>';
 copy.collections[0].title=unsafe;copy.items.find(m=>m.id==='home-promo').title=unsafe;
 const html=renderGallery(copy);assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img src=x'));
 const payload=html.match(/<script type="application\/json" id="gallery-data">([\s\S]*?)<\/script>/)[1];
 assert.ok(!payload.includes('<'));assert.equal(JSON.parse(payload).items.find(m=>m.id==='home-promo').title,unsafe);
});
