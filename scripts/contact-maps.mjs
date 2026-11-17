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
 const frame=map=>`<iframe src="${escape(map.embedUrl)}" title="${escape(map.label)} — производственная площадка ЭРА · BEIER Machinery" width="100%" height="340" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
 const panels=maps.map((map,index)=>`<div class="cp-map-panel" id="contact-map-${map.provider}" data-map-panel="${map.provider}"${index?' hidden':''}${map.hasEmbed?` data-map-embed="${escape(map.embedUrl)}"`:''} data-map-label="${escape(map.label)}"><div class="cp-map-stage" data-map-stage>${index===0&&map.hasEmbed?frame(map):''}<div class="cp-map-message"${map.hasEmbed?' hidden':''}><p class="cp-map-provider">${escape(map.label)}</p><p data-map-status role="status" aria-live="polite">${map.hasExternalLink?'Карта недоступна в этом браузере. Откройте её в картографическом сервисе.':'Карта этого сервиса пока недоступна. Адрес производственной площадки указан ниже.'}</p></div></div></div>`).join('');
 const links=maps.filter(map=>map.hasExternalLink).map(map=>`<a href="${escape(map.url)}" target="_blank" rel="noopener noreferrer" data-map-external="${map.provider}">${map.provider==='yandex'?'Открыть в Яндекс Картах':'Открыть в Google Maps'} <span aria-hidden="true">↗</span></a>`).join('');
 return `<div class="cp-map" data-contact-maps><div class="cp-map-switch" role="group" aria-label="Картографический сервис" data-map-switch hidden>${maps.map((map,index)=>`<button type="button" aria-pressed="${index===0}" aria-controls="contact-map-${map.provider}" data-map-select="${map.provider}">${escape(map.label)}</button>`).join('')}</div>${panels}<div class="cp-map-links">${links}</div><p class="cp-map-note">Если карта не отображается, откройте её по ссылкам выше.</p></div>`;
}
