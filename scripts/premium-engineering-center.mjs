import source from '../content/premium-engineering-views.json' with {type:'json'};
import {linePlacement} from '../content/line-placement.mjs';
import {renderEngineeringCenter} from './engineering-center.mjs';

const placement=linePlacement['separatsiya-03'];

export function renderPremiumEngineeringCenter(){
 return renderEngineeringCenter({
  scope:'premium-engineering',name:'PREMIUM',assetRoot:'lines/separatsiya-03/engineering-center/',
  placement,views:source.views,drawingThumbnails:source.drawingThumbnails,
  heights:[['Высотная отметка воздуховода на боковой проекции',placement.heightMark,placement.fitNote]]
 });
}
