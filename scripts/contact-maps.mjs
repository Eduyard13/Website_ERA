import {escapeContact as escape} from './contact-channels.mjs';

function safeUrl(value,hosts,path){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&hosts.includes(u.hostname)&&path.test(u.pathname)?u.href:null;}catch{return null;}
}
function samePin(value,map){
 const url=new URL(value),[lon,lat]=String(url.searchParams.get('pt')||'').split(',').map(Number);
 return Number.isFinite(lon)&&Number.isFinite(lat)&&Math.abs(lon-map.lon)<1e-7&&Math.abs(lat-map.lat)<1e-7;
}
export function mapCapabilities(map={},site={}){
 const provider=['google','yandex'].includes(map.provider)?map.provider:null;
 const hasAddress=!!site.address;
 const hasVerifiedMarker=!!(provider&&map.markerVerified&&Number.isFinite(map.lat)&&Number.isFinite(map.lon)&&Math.abs(map.lat)<=90&&Math.abs(map.lon)<=180&&map.coordinateSystem);
 let url=null,embedUrl=null;
 if(provider==='google'){
  url=safeUrl(map.url,['www.google.com','maps.google.com'],/^\/maps(?:\/|$)/);
  if(map.embedReproduced===true)embedUrl=safeUrl(map.embedUrl,['www.google.com'],/^\/maps\/embed$/);
 }else if(provider==='yandex'){
  url=hasVerifiedMarker?safeUrl(map.url,['yandex.com'],/^\/maps\//):null;
  if(url&&!samePin(url,map))url=null;
  if(hasVerifiedMarker&&map.embedReproduced===true)embedUrl=safeUrl(map.embedUrl,['yandex.com'],/^\/map-widget\/v1\/$/);
  if(embedUrl&&!samePin(embedUrl,map))embedUrl=null;
 }
 return {provider,hasAddress,hasVerifiedMarker,hasExternalLink:!!url,hasEmbed:!!embedUrl,url,embedUrl};
}

export function productionMap(site){
 const maps=(site.maps||[]).map(map=>({...map,...mapCapabilities(map,site)})).filter(map=>map.provider);
 const panels=maps.map((map,index)=>`<div class="cp-map-panel" id="contact-map-${map.provider}" data-map-panel="${map.provider}"${index?' hidden':''}${map.hasEmbed?` data-map-embed="${escape(map.embedUrl)}"`:''} data-map-label="${escape(map.label)}"><div class="cp-map-stage" data-map-stage><div class="cp-map-message"><p class="cp-map-provider">${escape(map.label)}</p><p data-map-status role="status" aria-live="polite">Откройте карту по ссылке ниже. Встроенная карта доступна после выбора в настройках cookies.</p></div></div></div>`).join('');
 const cookiePanel=maps.some(map=>map.hasEmbed)?`<div class="cp-cookie" id="map-cookie-choices" data-map-cookie-panel role="region" aria-labelledby="map-cookie-title" hidden><strong id="map-cookie-title">Встроенные карты и cookies</strong><p>Если разрешите карты, Google Maps или Яндекс Карты получат технические данные браузера и смогут использовать cookies. Выбор можно изменить в любой момент.</p><div class="cp-cookie-actions"><button type="button" data-map-cookie-choice="allow">Разрешить карты</button><button type="button" data-map-cookie-choice="deny">Отклонить карты</button></div><a href="/privacy/cookies/">Как используются cookies и хранилище браузера</a></div>`:'';
 const links=maps.filter(map=>map.hasExternalLink).map(map=>`<a href="${escape(map.url)}" target="_blank" rel="noopener noreferrer" data-map-external="${map.provider}">${map.provider==='yandex'?'Открыть в Яндекс Картах':'Открыть в Google Maps'} <span aria-hidden="true">↗</span></a>`).join('');
 return `<div class="cp-map" data-contact-maps>${cookiePanel}<div class="cp-map-switch" role="group" aria-label="Картографический сервис" data-map-switch hidden>${maps.map((map,index)=>`<button type="button" aria-pressed="${index===0}" aria-controls="contact-map-${map.provider}" data-map-select="${map.provider}">${escape(map.label)}</button>`).join('')}</div>${panels}<div class="cp-map-links">${links}</div><p class="cp-map-note">${cookiePanel?'<button type="button" data-map-cookie-settings aria-controls="map-cookie-choices" aria-expanded="false" hidden>Настройки cookies</button>':''}</p></div>`;
}
