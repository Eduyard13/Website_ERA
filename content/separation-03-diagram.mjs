import markers from './separation-03-markers.json' with {type:'json'};
import occupancy from './separation-03-occupancy.json' with {type:'json'};
import {separation03Specification} from './separation-03.mjs';

const {width,height}=markers.source;
const point=([x,y])=>[+(x/width*1000).toFixed(3),+(y/width*1000).toFixed(3)];
export const separation03Diagram={
 id:'line03-construction',slug:'separatsiya-03',title:'Сухая сепарация и сушка: позиции 1–37',
 file:markers.source.file,width,height,page:6,defaultPart:10,occupancy,
 parts:markers.positions.map(position=>{
  const item=separation03Specification.find(s=>s.position===position.number);
  return {number:item.position,label:item.name,description:item.purpose,regions:[],callouts:position.instances.map(c=>({
   id:c.id,badge:point(c.badge),target:point(c.badge),pdfLeader:[],instanceLabel:c.instanceLabel,
   tooltipLabel:item.name,tooltipDescription:c.instanceLabel?`${c.instanceLabel}. ${item.purpose}`:item.purpose,
  }))};
 }),
};
