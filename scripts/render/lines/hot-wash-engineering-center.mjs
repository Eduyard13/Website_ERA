import source from '../../../content/lines/hot-wash/hot-wash-engineering-views.json' with {type:'json'};
import {linePlacement} from '../../../content/lines/shared/line-placement.mjs';
import {renderEngineeringCenter} from './engineering-center.mjs';

export function renderHotWashEngineeringCenter(){
 return renderEngineeringCenter({
  scope:'hot-wash-engineering',name:'HOT-WASH',assetRoot:'lines/moyka-plenki/engineering-center/',
  placement:linePlacement['moyka-plenki'],views:source.views,drawingThumbnails:source.drawingThumbnails,
  heights:[['Высота цеха по ТО','9'],['Высотные отметки на чертеже','8,5 и 5,5','Свободную высоту над узлами, проезды и монтажную привязку уточняют для конкретного цеха. 2 244 м² — площадь представленной компоновки, не универсальный минимум.']]
 });
}
