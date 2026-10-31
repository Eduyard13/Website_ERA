import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCbrXml,fetchCbrRates} from '../scripts/cbr-rates.mjs';
import {moscowDay,validateRates} from '../public/fx-core.js';
// Deliberately synthetic values. They are never copied to the public rates feed.
const xml=`<?xml version="1.0" encoding="windows-1251"?><ValCurs Date="31.10.2026" name="Foreign Currency Market"><Valute ID="USD"><NumCode>840</NumCode><CharCode>USD</CharCode><Nominal>1</Nominal><Value>90,1234</Value></Valute><Valute ID="EUR"><CharCode>EUR</CharCode><Nominal>1</Nominal><Value>100,5678</Value></Valute><Valute ID="CNY"><CharCode>CNY</CharCode><Nominal>10</Nominal><Value>125,0000</Value></Valute></ValCurs>`;
const options={requestedDate:'2026-11-01',fetchedAt:'2026-11-01T00:05:00.000Z',sourceUrl:'https://www.cbr.ru/scripts/XML_daily.asp?date_req=01%2F11%2F2026'};
test('ЦБ: номинал, десятичная запятая и дата действия в выходной сохраняются',()=>{
 const data=parseCbrXml(xml,options);
 assert.equal(data.effectiveDate,'2026-10-31');assert.equal(data.requestedDate,'2026-11-01');
 assert.equal(data.rates.USD.rate,90.1234);assert.equal(data.rates.EUR.rate,100.5678);
 assert.equal(data.rates.CNY.nominal,10);assert.equal(data.rates.CNY.rate,12.5);
});
test('ЦБ: повреждённая выгрузка, пропуск, повтор валюты и будущий курс отклоняются',()=>{
 assert.throws(()=>parseCbrXml('<html>Unavailable</html>',options));
 assert.throws(()=>parseCbrXml(xml.replace('<CharCode>CNY</CharCode>','<CharCode>JPY</CharCode>'),options));
 assert.throws(()=>parseCbrXml(xml.replace('</ValCurs>',xml.match(/<Valute ID="USD">[\s\S]*?<\/Valute>/)[0]+'</ValCurs>'),options));
 assert.throws(()=>parseCbrXml(xml.replace('31.10.2026','02.11.2026'),options));
 assert.throws(()=>parseCbrXml(xml.replace('125,0000','broken'),options));
 assert.throws(()=>parseCbrXml(xml.replace('<Nominal>10','<Nominal>0'),options));
 const data=parseCbrXml(xml,options);assert.throws(()=>validateRates({...data,sourceUrl:'https://example.com/rates'}));
});
test('Дата запроса определяется по Москве и официальный запрос относится к сегодняшнему дню',async()=>{
 assert.equal(moscowDay(new Date('2026-10-31T20:59:59Z')),'2026-10-31');
 assert.equal(moscowDay(new Date('2026-10-31T21:00:00Z')),'2026-11-01');
 const result=await fetchCbrRates({now:new Date('2026-10-31T21:05:00Z'),fetcher:async url=>{
  assert.equal(url.hostname,'www.cbr.ru');assert.equal(url.searchParams.get('date_req'),'01/11/2026');
  return new Response(xml,{status:200});
 }});
 assert.equal(result.data.requestedDate,'2026-11-01');
 await assert.rejects(fetchCbrRates({fetcher:async()=>new Response('unavailable',{status:503})}));
});
