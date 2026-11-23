import markers from './moyka-plenki-markers.json' with {type:'json'};
import occupancy from './moyka-plenki-occupancy.json' with {type:'json'};
import specification from './hot-wash-specification.json' with {type:'json'};
import nativeTargets from './moyka-plenki-native-targets.json' with {type:'json'};

const {file,width,height}=nativeTargets;
const point=([x,y])=>[+(x/width*1000).toFixed(3),+(y/width*1000).toFixed(3)];
export const hotWashDiagram={
 id:'hotwash-construction',slug:'moyka-plenki',title:'Горячая мойка: позиции 1–36',file,width,height,page:5,defaultPart:18,occupancy,
 parts:markers.positions.map(position=>{
  const item=specification.find(s=>s.position===position.number);
  const callouts=position.instances.map(c=>{
   const geometry=nativeTargets.callouts[c.id];
   if(!geometry)throw new Error('Missing PDF geometry for '+c.id);
   return {id:c.id,badge:point(geometry.badge),leaders:geometry.leaders.map(leader=>leader.map(point)),
    regions:geometry.regions.map(region=>region.map(point)),instanceLabel:c.instanceLabel,
    tooltipLabel:item.name,tooltipDescription:c.instanceLabel?`${c.instanceLabel}. ${item.purpose}`:item.purpose};
  });
  return {number:item.position,label:item.name,description:item.purpose,callouts};
 }),
};
