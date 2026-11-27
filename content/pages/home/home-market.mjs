import estimates from './home-market-estimates.json' with {type:'json'};

export const marketModel=estimates.model;
export const filmKgPerCapita=marketModel.kgWastePerCapita*marketModel.filmShare;

function estimate(row){
 const tonnes=Math.round(row.population*filmKgPerCapita*row.coefficient/1000);
 const complexes=Math.round(tonnes/marketModel.moduleTonnes);
 const monthly=complexes*marketModel.targetMonthlyProfit;
 return {...row,tonnes,complexes,monthly,annual:monthly*marketModel.monthsPerYear};
}

export const marketDistricts=estimates.districts.map(estimate);
export const marketRegions=estimates.regions.map(estimate);
export const marketTotals=Object.fromEntries(['population','tonnes','complexes','monthly','annual'].map(key=>[
 key,marketDistricts.reduce((sum,row)=>sum+row[key],0),
]));
export const marketGroups={districts:marketDistricts,regions:marketRegions};
export const marketNational={id:'national',name:'Вся Россия',...marketTotals};

const russianNumbers=[0,1,2].map(maximumFractionDigits=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits}));
export const marketNumber=(value,digits=2)=>russianNumbers[digits].format(value);
export function marketMoney(value,digits=2){
 const billion=value>=1_000_000_000;
 const divisor=billion?1_000_000_000:1_000_000;
 return `${marketNumber(value/divisor,digits)}\u00a0${billion?'млрд':'млн'}\u00a0₽`;
}

export const marketNationalTonnes=marketNumber(marketTotals.tonnes/1_000_000,0);

export const marketFeedstocks=[
 {id:'household',name:'Бытовые плёнки и пакеты',share:40,color:'#BC9954',
  materials:'Пакеты из магазинов, бытовые мешки, гибкая потребительская упаковка, плёночная фракция сортировки ТКО.',
  origin:'Домохозяйства и сортировочные комплексы. Органика, влага, песок и смешанные включения.'},
 {id:'packaging',name:'Промышленные и упаковочные плёнки',share:30,color:'#243E60',
  materials:'Стретч, термоусадочная плёнка, защитная промышленная и транспортная упаковка, плёночные вкладыши.',
  origin:'Склады, распределительные центры, торговля, логистика и производство. Скотч, этикетки, клей, загрязнения при хранении и перевозке.'},
 {id:'agro',name:'Сельскохозяйственные плёнки',share:15,color:'#516F94',
  materials:'Тепличные, укрывные и мульчирующие плёнки, силосные плёнки, агростретч.',
  origin:'Тепличные хозяйства, растениеводство, животноводство. Почва, песок, растительные остатки.'},
 {id:'construction',name:'Строительные плёнки',share:10,color:'#899DB3',
  materials:'Защитные и укрывные плёнки, полиэтиленовые плёнки временных ограждений и упаковки стройматериалов, если отнесены к строительному потоку.',
  origin:'Стройплощадки и строительные отходы. Пыль, штукатурка, грунт, минеральные включения. Материалы другого состава проверяют отдельно.'},
 {id:'bigbags',name:'Мешки и биг-бэги',share:5,color:'#D3C7AA',
  materials:'Использованная мягкая промышленная тара, тканые полипропиленовые мешки и FIBC, полиэтиленовые вкладыши.',
  origin:'Производство, строительство, сельское хозяйство и логистика. Возможны остатки груза и стропы. ПП и ПЭ разделяют, пригодность и маршрут подтверждают для каждой партии.'},
].map(row=>({...row,tonnes:marketTotals.tonnes*row.share/100}));

const upperLimits=[400_000,700_000,1_000_000,Infinity];
export const marketLevel=row=>upperLimits.findIndex(limit=>row.tonnes<limit);
