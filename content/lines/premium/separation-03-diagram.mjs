import markers from './separation-03-markers.json' with {type:'json'};
import occupancy from './separation-03-occupancy.json' with {type:'json'};
import nativeTargets from './separation-03-native-targets.json' with {type:'json'};
import {separation03Specification} from './separation-03.mjs';

const {file,width,height}=nativeTargets;
const point=([x,y])=>[+(x/width*1000).toFixed(3),+(y/width*1000).toFixed(3)];
export const separation03Diagram={
 id:'line03-construction',slug:'separatsiya-03',title:'Сухая сепарация и сушка: позиции 1–37',
 file,width,height,page:6,defaultPart:10,occupancy,
 parts:markers.positions.map(position=>{
  const item=separation03Specification.find(s=>s.position===position.number);
  return {number:item.position,label:item.name,description:item.purpose,callouts:position.instances.map(c=>{
   const geometry=nativeTargets.callouts[c.id];
   if(!geometry)throw new Error('Missing PDF geometry for '+c.id);
   const instanceName={
     '6-1':'Подающий конвейер первой ступени',
     '6-2':'Подающий конвейер второй ступени',
     '7-1':'Первый баллистический сепаратор',
     '7-2':'Второй баллистический сепаратор',
   }[c.id]||c.instanceLabel;
   return {id:c.id,badge:point(geometry.badge),leaders:geometry.leaders.map(leader=>leader.map(point)),
     regions:geometry.regions.map(region=>region.map(point)),instanceLabel:instanceName,
     tooltipLabel:item.name,
     tooltipDescription:instanceName?`${instanceName}. ${item.purpose}`:item.purpose};
  })};
 }),
};
