import powerData from './line-power-data.json' with {type:'json'};

export const linePowerData=powerData.lines;

const numberFormat=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
const fixedFormat=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
export function formatLineNumber(value, fixed=false){
 return (fixed?fixedFormat:numberFormat).format(value).replace(/[\u00a0\u202f]/g,' ');
}

export function lineMetric(line, labels, unit){
 const found=line.cardMetrics.filter(metric=>labels.includes(metric.label)&&metric.unit===unit);
 if(found.length!==1)throw new Error(`Missing or ambiguous line metric: ${line.slug} / ${labels.join(', ')} / ${unit}`);
 return found[0];
}

export const dryFilmOutputLabels=['Очищенная плёнка','Готовая плёнка','Выход очищенной плёнки'];

export function linePowerTotals(slug){
 const data=linePowerData[slug];
 const installed=Number(data.rows.reduce((sum,row)=>sum+(row.installed_total_kw??0),0).toFixed(2));
 return {installed,calculated:Number((installed*data.load_factor).toFixed(2))};
}
