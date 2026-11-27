const unique=(items,key)=>new Set(items.map(key).filter(Boolean)).size;
const asset=item=>(item.file||item.image||item.video||item.id||'').replace(/[?#].*$/,'');
export function countMedia(items=[],documents=[]){
 return {photos:unique(items.filter(m=>m.type==='photo'),asset),videos:unique(items.filter(m=>m.type==='video'),asset),schemes:unique(items.filter(m=>['scheme','visualization'].includes(m.type)),asset),visualizations:items.some(m=>m.type==='visualization'),frames:unique(items.filter(m=>m.type==='frame'),asset),documents:unique(documents,d=>(d.file||d.href||d.id||'').replace(/[?#].*$/,''))};
}
export function mediaCountLabels(counts){return [['photos','Фото'],['videos','Видео'],['schemes',counts.visualizations?'Схемы и визуализации':'Схемы'],['frames','Кадры из видео'],['documents','Документы']].filter(([key])=>counts[key]>0).map(([key,label])=>({key,label,count:counts[key]}));}
