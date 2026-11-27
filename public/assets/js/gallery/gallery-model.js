export const validGalleryTypes=['all','photo','video','scheme','visualization','frame'];
export function galleryItemMatches(item,filter={}){
 const {collection='',album='',type='all',product='',topic='',q=''}=filter;
 const kind=type==='scheme'?['scheme','visualization'].includes(item.kind):type==='all'||item.kind===type;
 const text=q.trim().toLocaleLowerCase('ru');
 return kind&&(!collection||item.collections.includes(collection))&&(!album||item.albumIds.includes(album))&&(!product||item.productPaths.includes(product))&&(!topic||item.topic===topic)&&(!text||[item.title,item.description,item.productTitle,item.topic].join(' ').toLocaleLowerCase('ru').includes(text));
}
export const selectGalleryItems=(items,filter={})=>items.filter(item=>galleryItemMatches(item,filter));
export const galleryStats=items=>Object.fromEntries(['photo','video','scheme','visualization','frame'].map(kind=>[kind,new Set(items.filter(m=>m.kind===kind).map(m=>m.file)).size]));
export const durationLabel=seconds=>Number.isFinite(seconds)&&seconds>0?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:'';
export function findGalleryItem(items,id){return items.find(item=>item.id===id||item.aliases?.includes(id));}
// Render at most a small window of thumbnails, even for a thousand-item album.
export function thumbnailWindow(length,index,size=15){const start=Math.max(0,Math.min(index-Math.floor(size/2),length-size));return {start,end:Math.min(length,start+size)};}
