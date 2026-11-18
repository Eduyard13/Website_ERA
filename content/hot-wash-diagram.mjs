import markers from './moyka-plenki-markers.json' with {type:'json'};
import occupancy from './moyka-plenki-occupancy.json' with {type:'json'};
import specification from './hot-wash-specification.json' with {type:'json'};

const {width,height}=markers.source;
const point=([x,y])=>[+(x/width*1000).toFixed(3),+(y/width*1000).toFixed(3)];
export const hotWashDiagram={
 id:'hotwash-construction',slug:'moyka-plenki',title:'Горячая мойка: позиции 1–36',file:markers.source.file,width,height,page:5,defaultPart:18,occupancy,
 parts:markers.positions.map(position=>{
  const item=specification.find(s=>s.position===position.number);
  return {number:item.position,label:item.name,description:item.purpose,
   regions:position.instances.filter(c=>c.region.length).map(c=>c.region.map(point)),
   callouts:position.instances.map(c=>({id:c.id,badge:point(c.badge),target:point(c.target||c.badge),pdfLeader:c.target?[point(c.target)]:[],
    instanceLabel:c.instanceLabel,tooltipLabel:item.name,tooltipDescription:c.mode==='source-label-only'?`${item.purpose} Показан исходный номер на схеме; параметры — в спецификации.`:c.instanceLabel?`${c.instanceLabel}. ${item.purpose}`:item.purpose,
   })),
  };
 }),
};
