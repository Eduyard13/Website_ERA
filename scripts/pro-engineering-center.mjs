import source from '../content/pro-engineering-views.json' with {type:'json'};
import {linePlacement} from '../content/line-placement.mjs';
import {renderEngineeringCenter} from './engineering-center.mjs';

const assetRoot='lines/separatsiya-02/engineering-center/';
const placement=linePlacement['separatsiya-02'];
const drawingThumbnails=placement.views.map((view,index)=>({
 id:view.id,shortLabel:['Сверху','Сбоку 1','Сбоку 2','Лист A0'][index],
 file:assetRoot+'drawings/'+view.id+'-thumb.webp',width:360,height:Math.round(view.height*360/view.width)
}));

export function renderProEngineeringCenter(){
 return renderEngineeringCenter({
  scope:'pro-engineering',name:'PRO',assetRoot,placement,views:source.views,drawingThumbnails,
  heights:[['Высота помещения по ТО','9'],['Высота оборудования по ТО','≈6,5']]
 });
}
