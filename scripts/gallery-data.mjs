import {existsSync} from 'node:fs';
import {nodes,lines,media} from '../content/catalog.mjs';
import {equipmentVideos} from '../content/equipment-videos.mjs';
import {filmSeparationMedia} from '../content/film-separation.mjs';
import {miniFilmSeparationMedia} from '../content/mini-film-separation.mjs';
import {hotWashGalleryMedia} from '../content/hot-film-washing.mjs';
import {separation03GalleryMedia} from '../content/separation-03.mjs';
import {galleryCollections,galleryOverrides,galleryAdditionalMedia,galleryProjectSlots} from '../content/gallery-collections.mjs';
import {projectMedia} from './project-media.mjs';
import {imageSize} from './image-size.mjs';

const root=new URL('../public/assets/',import.meta.url);
const exists=file=>typeof file==='string'&&!file.startsWith('/')&&!file.includes('..')&&existsSync(new URL(file,root));
const sizeCache=new Map();
function dimensions(file){if(!sizeCache.has(file))sizeCache.set(file,imageSize(new URL(file,root)));return sizeCache.get(file);}
export const galleryKinds={photo:'Фотография',video:'Видео',scheme:'Схема',visualization:'Визуализация',frame:'Кадр из видео'};
const unique=values=>[...new Set(values.filter(Boolean))];
export function galleryCounts(items){return Object.fromEntries(Object.keys(galleryKinds).map(kind=>[kind,new Set(items.filter(m=>m.kind===kind).map(m=>m.file)).size]));}

function homepageRecords(){
 const records=galleryProjectSlots.flatMap(([slot,topic,slug])=>{
  const p=projectMedia[slot];if(!p?.file)return [];
  const node=nodes.find(n=>n.slug===slug);
  return [{id:'home-'+slot,file:p.file,type:p.mediaType||'photo',title:p.alt,description:p.customCaption||p.caption||p.alt,topic,product:node?.path||'/',productTitle:node?.title||'Проект ЭРА',source:'Материалы ЭРА · фотографии и кадры, предоставленные владельцем',width:p.width,height:p.height,variants:p.variants}];
 });
 for(const [slot,title,description,durationSeconds,videoCategory] of [
  ['promo','ЭРА — от сырья к готовому продукту','Общий фильм о технологических этапах и оборудовании ЭРА.',296,'Комплекс'],
  ['cleaningDemo','Демонстрация очистки плёночного сырья','Общепроектная демонстрация работы оборудования с плёночным сырьём. В монтаж включены кадры видеопрезентации баллистического сепаратора.',100.12,'Рабочий процесс'],
 ]){
  const p=projectMedia[slot],poster=projectMedia[p?.posterSlot];if(!p?.file||!poster?.file)continue;
  records.push({id:'home-'+slot,file:p.file,type:'video',ready:true,poster:poster.file,thumbnail:poster.file,title,description,topic:slot==='promo'?'Комплекс':'Работа',product:'/',productTitle:'Проект ЭРА',width:1920,height:1080,durationSeconds,videoCategory,source:'Видеоматериалы ЭРА · полная предоставленная версия',collections:slot==='promo'?['videos']:['videos','work']});
 }
 return records;
}

export function buildGalleryData({baseMedia=media,additional=galleryAdditionalMedia,fileExists=exists}={}){
 const byFile=new Map(),byId=new Map(),missing=[];
 const enabled=lines.filter(line=>line.enabled);
 const sourceLines=[...Object.values(miniFilmSeparationMedia),...Object.values(filmSeparationMedia),...hotWashGalleryMedia,...separation03GalleryMedia].filter(m=>enabled.some(l=>l.path===m.product));
 const videoMetadata=new Map(equipmentVideos.filter(v=>v.ready).map(v=>[v.file,v]));
 const covers=enabled.filter(l=>l.cardFile).map(l=>({id:l.slug+'-catalog-cover',type:'visualization',file:l.cardFile,thumbnail:l.cardSmallFile,title:l.cardImageAlt||'Компоновка линии '+l.number,product:l.path,productTitle:l.slug==='moyka-plenki'?l.cardTitle:'Сепарация '+l.number,topic:'Линия целиком',source:'Подготовленная визуализация ЭРА · каталог линий',coverPriority:0}));
 const sources=[...baseMedia,...homepageRecords(),...sourceLines,...covers,...additional];
 sources.forEach((source,index)=>{
  const m={...source,...galleryOverrides[source.id]},kind=m.kind||m.type;
  if(!galleryKinds[kind]||m.ready===false||!fileExists(m.file)||(kind==='video'&&(m.ready!==true||!fileExists(m.poster)))){missing.push(m.id||m.file);return;}
  const meta=videoMetadata.get(m.file)||{};
  const productPath=m.productPath||m.product||'/',node=nodes.find(n=>n.path===productPath),line=enabled.find(l=>l.path===productPath);
  const albumIds=unique([...(m.albumIds||[]),node?.slug,line?.slug]);
  const collections=unique([...(m.collections||[]),node?'nodes':null,line?'lines':null,
   m.topic==='Сырьё'||m.topic==='Входное сырьё'?'raw':null,
   ['Работа'].includes(m.topic)&&['photo','video','frame'].includes(kind)?'work':null,
   m.topic==='Результат'&&kind==='photo'?'products':null,kind==='video'?'videos':null,
   !node&&kind==='visualization'&&productPath.startsWith('/technology#')?'lines':null,
  ]);
  // A line's result photos are classified only where the supplied title identifies the product.
  if(line&&kind==='photo'&&/очищенн|фракция после/iu.test(m.title)&&!collections.includes('products'))collections.push('products');
  const id=String(m.id||'gallery-'+m.file.replace(/[^a-zA-Z0-9_-]/g,'-'));
  if(byId.has(id)&&byId.get(id)!==m.file)throw new Error('Duplicate gallery ID: '+id);
  byId.set(id,m.file);
  const previous=byFile.get(m.file);
  if(previous){
   previous.aliases=unique([...previous.aliases,id].filter(alias=>alias!==previous.id));previous.collections=unique([...previous.collections,...collections]);previous.albumIds=unique([...previous.albumIds,...albumIds]);previous.productPaths=unique([...previous.productPaths,productPath]);previous.coverPriority=Math.min(previous.coverPriority,m.coverPriority??10);return;
  }
  const size=kind==='video'?null:dimensions(m.file);
  const variants=(m.variants||[]).filter(v=>v?.file&&fileExists(v.file));
  const thumbnail=fileExists(m.thumbnail)?m.thumbnail:variants.find(v=>v.width>=480&&v.width<=880)?.file||m.poster||m.file;
  const sortOrder=m.sortOrder??(m.primary?0:kind==='video'?20:kind==='photo'?30+index:500+index);
  byFile.set(m.file,{id,aliases:[],kind,file:m.file,thumbnail,poster:m.poster||null,variants,
   title:m.title||m.file,description:m.description||m.caption||node?.description||'',topic:m.topic||'Схемы и визуализации',
   source:m.source||m.caption||'Материалы ЭРА',productPath,productPaths:[productPath],productTitle:m.productTitle||node?.title||line?.title||'Проект ЭРА',
   albumIds,collections,sortOrder,coverPriority:m.coverPriority??(m.primary?1:10),
   durationSeconds:m.durationSeconds||meta.durationSeconds||null,videoCategory:m.videoCategory||'Оборудование',
   width:Number.isFinite(Number(m.width))&&Number(m.width)>0?Number(m.width):size?.width||1600,height:Number.isFinite(Number(m.height))&&Number(m.height)>0?Number(m.height):size?.height||900,
  });
 });
 const items=[...byFile.values()].sort((a,b)=>a.sortOrder-b.sortOrder||a.id.localeCompare(b.id));
 const albums=[...nodes.map(n=>({id:n.slug,title:n.title,path:n.path,description:n.description,collection:'nodes'})),...enabled.map(l=>({id:l.slug,title:l.slug==='moyka-plenki'?l.cardTitle:'Сепарация '+l.number,path:l.path,description:l.cardDescription||l.description,collection:'lines'}))].map(album=>{
  const records=items.filter(m=>m.albumIds.includes(album.id));
  const cover=[...records].sort((a,b)=>a.coverPriority-b.coverPriority||Number(a.kind!=='photo')-Number(b.kind!=='photo')||a.sortOrder-b.sortOrder)[0];
  return {...album,ids:records.map(m=>m.id),coverId:cover?.id,counts:galleryCounts(records)};
 }).filter(album=>album.ids.length);
 return {items,albums,collections:galleryCollections.filter(c=>items.some(m=>m.collections.includes(c.id))),counts:galleryCounts(items),missing};
}
