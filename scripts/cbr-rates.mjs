import {currencyCodes,moscowDay,validDay,validateRates} from '../public/fx-core.js';
export function parseCbrXml(xml,{requestedDate,fetchedAt,sourceUrl}){
 if(!validDay(requestedDate))throw new Error('Invalid requested date');
 const root=/<ValCurs\b[^>]*\bDate=["'](\d{2})\.(\d{2})\.(\d{4})["'][^>]*>/i.exec(xml);
 if(!root)throw new Error('CBR response does not contain a dated ValCurs document');
 const effectiveDate=`${root[3]}-${root[2]}-${root[1]}`,rates={};
 const field=(block,name)=>{
  const found=new RegExp(`<${name}\\b[^>]*>([^<]+)</${name}>`,'i').exec(block);
  if(!found)throw new Error('Missing CBR field '+name);return found[1].trim();
 };
 for(const match of xml.matchAll(/<Valute\b[^>]*>([\s\S]*?)<\/Valute>/gi)){
  const block=match[1],code=field(block,'CharCode');if(!currencyCodes.includes(code))continue;
  if(rates[code])throw new Error('Duplicate CBR currency '+code);
  const nominalText=field(block,'Nominal'),valueText=field(block,'Value').replace(/[\s\u00a0]/g,'');
  if(!/^\d+$/.test(nominalText)||!/^\d+(?:[,.]\d+)?$/.test(valueText))throw new Error('Invalid CBR number '+code);
  const nominal=Number(nominalText),value=Number(valueText.replace(',','.'));
  rates[code]={nominal,value,rate:value/nominal};
 }
 return validateRates({schemaVersion:1,source:'CBR',sourceUrl,requestedDate,effectiveDate,fetchedAt,rates});
}
export async function fetchCbrRates({now=new Date(),fetcher=fetch}={}){
 const requestedDate=moscowDay(now),sourceUrl=new URL('https://www.cbr.ru/scripts/XML_daily.asp');
 sourceUrl.searchParams.set('date_req',requestedDate.split('-').reverse().join('/'));
 const response=await fetcher(sourceUrl,{signal:AbortSignal.timeout(20000),headers:{Accept:'application/xml,text/xml;q=0.9','User-Agent':'ERA-Website/1.0 (+https://eduyard13.github.io/Website_ERA/)'}});
 if(!response.ok)throw new Error('CBR request failed: HTTP '+response.status);
 const bytes=new Uint8Array(await response.arrayBuffer());
 const xml=new TextDecoder('windows-1251').decode(bytes);
 return {data:parseCbrXml(xml,{requestedDate,fetchedAt:new Date().toISOString(),sourceUrl:sourceUrl.href}),bytes};
}
