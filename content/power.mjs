// Site-wide calculation requested by ERA: 70% of installed power, one decimal.
const installedLabels={
 'rotornaya-tsentrifuga':'Установленная мощность по КП',
 'vintovoy-press':'Установленная мощность основного привода',
 'rama-napolnitel':'Мощность привода',
};
export function calculatedPower(installed){
 const match=/^([\d\s]+(?:[,.]\d+)?)\s*кВт/.exec(installed);
 if(!match)throw new Error('Cannot read installed power: '+installed);
 const [integer,fraction='']=match[1].replaceAll(' ','').replace(',','.').split('.');
 const scale=10n**BigInt(fraction.length),units=BigInt(integer+fraction);
 const tenths=(units*7n*2n+scale)/(2n*scale);
 return `${tenths/10n},${tenths%10n} кВт`;
}
export function withCalculatedPower(slug,details){
 const installedLabel=installedLabels[slug]||'Установленная мощность';
 const installed=details.specs.find(([label])=>label===installedLabel)?.[1];
 if(!installed)throw new Error('Missing installed power: '+slug);
 const value=calculatedPower(installed),label='Расчётная потребляемая мощность';
 const specs=details.specs.map(row=>row[0]===label?[label,value]:[...row]);
 if(!specs.some(row=>row[0]===label))specs.splice(specs.findIndex(row=>row[0]===installedLabel)+1,0,[label,value]);
 const notes=details.notes.filter(note=>!/(?:расч[её]т|0[,\.]70|коэффициент)/i.test(note));
 notes.push(`Расчётная потребляемая мощность: 70% от установленной, ${value}. Округление до одного знака после запятой.`);
 if(slug==='vertikalno-rotornyy-izmelchitel')notes.push('Не включает внешний нагрев воды и транспортёры.');
 if(slug==='rotornaya-tsentrifuga')notes.push('В КП установленная мощность округлена до 37,6 кВт; сумма трёх приводов — 37,62 кВт.');
 if(slug==='vintovoy-press')notes.push('Указанная мощность относится к основному приводу винтового пресса.');
 if(slug==='rama-napolnitel')notes.push('Указанная мощность относится к приводу подъёма каретки.');
 const highlights=details.highlights.map(([v,k])=>[/расч[её]тн.*потреб/i.test(k)?value:v,k]);
 return {...details,specs,notes,highlights,power:{installed,installedLabel,factor:0.7,value}};
}
