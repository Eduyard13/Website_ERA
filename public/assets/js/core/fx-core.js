export const currencyCodes=['USD','EUR','CNY'];
export function moscowDay(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=type=>parts.find(p=>p.type===type).value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validDay(value){
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
export function shortDay(day){return day.split('-').reverse().join('.');}
export function validateRates(data){
 if(!data||data.schemaVersion!==1||data.source!=='CBR'||!validDay(data.requestedDate)||!validDay(data.effectiveDate)||data.effectiveDate>data.requestedDate||!Number.isFinite(Date.parse(data.fetchedAt)))throw new Error('Invalid exchange-rate dates');
 const source=new URL(data.sourceUrl);
 if(source.protocol!=='https:'||source.hostname!=='www.cbr.ru'||source.pathname!=='/scripts/XML_daily.asp'||source.searchParams.get('date_req')!==data.requestedDate.split('-').reverse().join('/'))throw new Error('Invalid exchange-rate source');
 for(const code of currencyCodes){
  const item=data.rates?.[code];
  if(!item||!Number.isInteger(item.nominal)||item.nominal<=0||!Number.isFinite(item.value)||item.value<=0||!Number.isFinite(item.rate)||item.rate<=0||Math.abs(item.rate-item.value/item.nominal)>1e-8)throw new Error('Invalid currency '+code);
 }
 return data;
}
