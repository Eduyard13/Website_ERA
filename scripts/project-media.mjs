import {existsSync} from 'node:fs';
import {projectMediaSlots} from '../content/project-media.mjs';
import {imageSize} from './image-size.mjs';
const root=new URL('../public/assets/',import.meta.url);
const available=(file,assetRoot=root)=>existsSync(new URL(file,assetRoot));
function customFile(expected,assetRoot){
 const stem=expected.replace(/\.[^.]+$/,'');
 const names=/\.mp4$/.test(expected)?[expected]:[stem+'.webp',stem+'.avif',expected,stem+'.jpg',stem+'.png'];
 return names.map(name=>'project-home/'+name).find(file=>available(file,assetRoot));
}
export function resolveProjectMedia(slots=projectMediaSlots,assetRoot=root){
 return Object.fromEntries(Object.entries(slots).map(([id,slot])=>{
  const custom=customFile(slot.expected,assetRoot),file=custom||slot.fallback?.file||null;
  const size=custom&&slot.type==='photo'?imageSize(new URL(custom,assetRoot)):null;
  const width=size?.width||slot.fallback?.width||1600,height=size?.height||slot.fallback?.height||900;
  const stem=custom?.replace(/\.[^.]+$/,'');
  const variants=custom?[480,880,1280,1920].map(w=>({file:`${stem}-${w}.webp`,width:w})).filter(v=>available(v.file,assetRoot)):slot.variants?.map((file,i)=>({file,width:i?width:480}));
  if(size&&!variants.some(variant=>variant.width===width))variants.push({file:custom,width});
  return [id,{...slot,id,file,width,height,custom:!!custom,alt:custom?(slot.customAlt||slot.alt):slot.alt,
   label:custom?slot.label:slot.fallbackLabel||slot.label,variants,
   caption:custom?slot.customCaption||'Материалы ЭРА':slot.fallbackCaption||null,
   mediaType:custom?slot.customMediaType||'photo':slot.fallbackMediaType||'photo',
   captions:slot.captions&&available('project-home/'+slot.captions,assetRoot)?'project-home/'+slot.captions:null,
   webm:slot.type==='video'&&custom&&available(custom.replace(/\.mp4$/,'.webm'),assetRoot)?custom.replace(/\.mp4$/,'.webm'):null,
  }];
 }));
}
export const projectMedia=resolveProjectMedia();
