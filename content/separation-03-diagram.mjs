import markers from './separation-03-markers.json' with {type:'json'};
import occupancy from './separation-03-occupancy.json' with {type:'json'};
import nativeTargets from './separation-03-native-targets.json' with {type:'json'};
import {separation03Specification} from './separation-03.mjs';

const {width,height}=markers.source;
const point=([x,y])=>[+(x/width*1000).toFixed(3),+(y/width*1000).toFixed(3)];
export const separation03Diagram={
 id:'line03-construction',slug:'separatsiya-03',title:'Сухая сепарация и сушка: позиции 1–37',
 file:'lines/separatsiya-03/layout-native.webp',width,height,page:6,defaultPart:10,occupancy,
 parts:markers.positions.map(position=>{
  const item=separation03Specification.find(s=>s.position===position.number);
  return {number:item.position,label:item.name,description:item.purpose,regions:[],callouts:position.instances.map(c=>{
   const end=nativeTargets.callouts[c.id];
   if(!end)throw new Error('Missing vector endpoint '+c.id);
   const instanceName={
     '6-1':'Подающий конвейер первой ступени',
     '6-2':'Подающий конвейер второй ступени',
     '7-1':'Первый баллистический сепаратор',
     '7-2':'Второй баллистический сепаратор',
   }[c.id]||c.instanceLabel;
   const target=point(end);
   return {id:c.id,badge:point(c.badge),target,pdfLeader:[target],instanceLabel:instanceName,
     tooltipLabel:item.name,
     tooltipDescription:instanceName?`${instanceName}. ${item.purpose}`:item.purpose};
  })};
 }),
};
