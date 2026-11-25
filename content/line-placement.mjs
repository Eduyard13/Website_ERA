import additionalViews from './line-dimensions-assets.json' with {type:'json'};
import separation02 from './separatsiya-02-dimensions-assets.json' with {type:'json'};

const premiumHeightMark='7,0';
const premiumFitNote='Высоту помещения, монтажные отметки и проезды уточняют для конкретного цеха.';

export const linePlacement={
 'separatsiya-01':{
  length:17.75,width:11.75,idPrefix:'mini-dimension',
  source:'Габаритная схема A4 · растровые проекции из предоставленного чертежа',
  caption:'Отметка 4,662 м приведена на боковой проекции механической части. Монтажную высоту, проезды и зоны обслуживания уточняют при привязке к площадке.',
  views:additionalViews['separatsiya-01'],
 },
 'separatsiya-02':{
  length:45,width:18,idPrefix:'dimension',
  source:'из исходного листа A0',
  caption:'Представленная схема размещения (исходный чертёж). Точная привязка выполняется под площадку заказчика.',
  views:separation02.views,
 },
 'separatsiya-03':{
  length:56.2,width:43.4,idPrefix:'sd-dimension',
  source:'из исходного листа A0',
  heightMark:premiumHeightMark,fitNote:premiumFitNote,
  caption:`${premiumHeightMark} м — высотная отметка воздуховода на боковой проекции. ${premiumFitNote}`,
  views:additionalViews['separatsiya-03'],
 },
 'moyka-plenki':{
  length:68,width:33,idPrefix:'hot-dimension',
  source:'из исходного листа A0',
  caption:'Высота помещения по ТО — 9 м. На проекциях 8,5 м и 5,5 м обозначают отдельные высотные отметки. Монтажную привязку выполняют под площадку.',
  views:additionalViews['moyka-plenki'],
 },
};
