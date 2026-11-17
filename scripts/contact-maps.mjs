import {escapeContact as escape} from './contact-channels.mjs';

function safeUrl(value,hosts,path){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&hosts.includes(u.hostname)&&path.test(u.pathname)?u.href:null;}catch{return null;}
}
// An address, external source and reproduced embed are independent capabilities.
// Neither a viewport centre nor an address search becomes a verified factory pin.
export function mapCapabilities(map={},site={}){
 const provider=['google','yandex'].includes(map.provider)?map.provider:null;
 const hasAddress=!!site.address;
 const hasVerifiedMarker=!!(provider&&map.markerVerified&&Number.isFinite(map.lat)&&Number.isFinite(map.lon)&&Math.abs(map.lat)<=90&&Math.abs(map.lon)<=180&&map.coordinateSystem);
 let url=null,embedUrl=null;
 if(provider==='google'){
  url=safeUrl(map.url,['www.google.com','maps.google.com'],/^\/maps(?:\/|$)/)||safeUrl(map.url,['www.beierrecycling.com'],/^\/contact-us\/$/);
  if(map.embedReproduced===true)embedUrl=safeUrl(map.embedUrl,['www.google.com'],/^\/maps\/embed$/);
 }else if(provider==='yandex'){
  url=hasVerifiedMarker?safeUrl(map.url,['yandex.ru','yandex.com'],/^\/maps\//):hasAddress&&site.addressZh?'https://yandex.ru/maps/?text='+encodeURIComponent(site.addressZh+' Jiangsu BEIER Machinery'):null;
  if(hasVerifiedMarker&&map.embedReproduced===true)embedUrl=safeUrl(map.embedUrl,['yandex.ru','yandex.com'],/^\/map-widget\/v1\/$/);
 }
 return {provider,hasAddress,hasVerifiedMarker,hasExternalLink:!!url,hasEmbed:!!embedUrl,url,embedUrl};
}

export function productionMap(site){
 const maps=(site.maps||[]).map(map=>({...map,...mapCapabilities(map,site)})).filter(map=>map.provider);
 const panels=maps.map((map,index)=>`<div class="cp-map-panel" id="contact-map-${map.provider}" data-map-panel="${map.provider}"${index?' hidden':''}${map.hasEmbed?` data-map-embed="${escape(map.embedUrl)}"`:''} data-map-label="${escape(map.label)}"><div class="cp-map-stage" data-map-stage><div class="cp-map-message"><span class="cp-map-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><p class="cp-map-provider">${escape(map.label)}</p><h3>${map.provider==='google'?'Производственная площадка BEIER':'Найдите площадку по адресу'}</h3><p>${map.hasEmbed?'Интерактивная карта с официального сайта BEIER. Карта предоставляется Google Maps.':map.provider==='google'?'Карта предприятия доступна на официальной странице BEIER.':map.hasVerifiedMarker?'Откройте расположение площадки в Яндекс Картах.':'Поиск по официальному адресу в Чжанцзягане. Точная метка предприятия пока не подтверждена.'}</p>${map.hasEmbed?'<button class="cp-map-button" type="button" data-map-load hidden>Показать карту</button>':''}<p class="cp-map-status" data-map-status role="status" aria-live="polite"></p></div></div></div>`).join('');
 const links=maps.filter(map=>map.hasExternalLink).map(map=>`<a href="${escape(map.url)}" target="_blank" rel="noopener noreferrer" data-map-external="${map.provider}">${map.provider==='yandex'&&!map.hasVerifiedMarker?'Найти адрес в Яндекс Картах':map.provider==='google'&&new URL(map.url).hostname==='www.beierrecycling.com'?'Карта на официальном сайте BEIER':'Открыть в '+escape(map.label)} <span aria-hidden="true">↗</span></a>`).join('');
 return `<div class="cp-map" data-contact-maps><div class="cp-map-switch" role="group" aria-label="Картографический сервис" data-map-switch hidden>${maps.map((map,index)=>`<button type="button" aria-pressed="${index===0}" aria-controls="contact-map-${map.provider}" data-map-select="${map.provider}">${escape(map.label)}</button>`).join('')}</div>${panels}<div class="cp-map-links">${links||'<p>Расположение уточняется. Используйте адрес площадки выше.</p>'}</div><p class="cp-map-note">Если карта не отображается, воспользуйтесь ссылками выше. <a href="https://www.beierrecycling.com/contact-us/" target="_blank" rel="noopener noreferrer">Карта на официальном сайте BEIER</a>.</p></div>`;
}
