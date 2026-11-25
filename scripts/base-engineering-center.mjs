import source from '../content/base-engineering-views.json' with {type:'json'};
import {linePlacement} from '../content/line-placement.mjs';
import {renderEngineeringCenter} from './engineering-center.mjs';

export function renderBaseEngineeringCenter(){
 return renderEngineeringCenter({
  scope:'base-engineering',name:'BASE',assetRoot:'lines/separatsiya-01/engineering-center/',
  placement:linePlacement['separatsiya-01'],views:source.views,drawingThumbnails:source.drawingThumbnails,
  heights:[['Отметка на боковой проекции','4,662','17,75 × 11,75 м — габарит механической части в плане. Монтажную высоту, проходы, зоны обслуживания, загрузки, выгрузки и смены биг-бэгов уточняют при привязке к площадке.']]
 });
}
