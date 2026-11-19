import estimates from './home-market-estimates.json' with {type:'json'};

export const marketModel=estimates.model;
export const filmKgPerCapita=marketModel.kgWastePerCapita*marketModel.filmShare;

function estimate(row){
 const tonnes=Math.round(row.population*filmKgPerCapita*row.coefficient/1000);
 const complexes=Math.round(tonnes/marketModel.moduleTonnes);
 const monthly=complexes*marketModel.targetMonthlyProfit;
 return {...row,tonnes,complexes,monthly,annual:monthly*12};
}

export const marketDistricts=estimates.districts.map(estimate);
export const marketRegions=estimates.regions.map(estimate);
export const marketTotals=Object.fromEntries(['tonnes','complexes','monthly','annual'].map(key=>[
 key,marketDistricts.reduce((sum,row)=>sum+row[key],0),
]));
export const marketGroups={districts:marketDistricts,regions:marketRegions};

const russianNumber=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2});
export const marketNumber=value=>russianNumber.format(value);
export function marketMoney(value){
 const billion=value>=1_000_000_000;
 const divisor=billion?1_000_000_000:1_000_000;
 return marketNumber(value/divisor)+(billion?' млрд ₽':' млн ₽');
}

const upperLimits=[400_000,700_000,1_000_000,Infinity];
export const marketLevel=row=>upperLimits.findIndex(limit=>row.tonnes<limit);
