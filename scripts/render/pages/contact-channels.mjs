import {contactChannels,videoChannelDefinitions,messengerDefinitions} from '../../../content/pages/contacts/contact.mjs';

export const escapeContact=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll('↗','&#8599;');
export function confirmedChannelUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function contactIcon(name){
 if(['telegram','max','whatsapp'].includes(name))return `<img src="/assets/brands/${name}.svg" width="32" height="32" alt="" aria-hidden="true" decoding="async">`;
 if(name==='youtube')return '<svg viewBox="0 0 40 32" fill="none" aria-hidden="true" focusable="false"><rect x="2" y="4" width="36" height="24" rx="7" fill="currentColor"/><path d="m16 10 12 6-12 6V10Z" fill="#fff"/></svg>';
 if(name==='vkVideo')return '<img src="/assets/brands/vk-video.svg" width="72" height="72" alt="" aria-hidden="true" decoding="async">';
 const paths={
  message:'<path d="M5 5h22v17H14l-7 5v-5H5V5Z"/><path d="M10 11h12M10 16h8"/>',
  phone:'<path d="m9 4 5 7-4 4c2 4 3 5 7 7l4-4 7 5c-1 5-4 6-7 5C12 25 7 20 4 11 3 8 4 5 9 4Z"/>',
  email:'<rect x="4" y="6" width="24" height="20" rx="2"/><path d="m5 8 11 9L27 8"/>',
  person:'<circle cx="16" cy="10" r="5"/><path d="M5 29v-3a11 11 0 0 1 22 0v3"/>',
  compass:'<circle cx="16" cy="16" r="12"/><path d="m21 11-3 7-7 3 3-7 7-3ZM16 1v3m0 24v3M1 16h3m24 0h3"/>',
 };
 return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.message}</svg>`;
}
function compactChannel(channel,channels,{messenger=false}={}){
 const url=confirmedChannelUrl(channels[channel.id]),label=escapeContact(channel.label),status=messenger?'Не подключён':'Канал подключается';
 const content=`<span class="footer-channel-icon">${contactIcon(channel.id)}</span><span class="footer-channel-name"><strong>${label}</strong>${url?'':`<small>${status}</small>`}</span>${url?'<span class="footer-channel-arrow" aria-hidden="true">↗</span>':''}`;
 const attributes=`class="footer-channel ${messenger?'footer-messenger':'footer-video-channel'}${url?'':' is-pending'}" ${messenger?'data-channel':'data-video-channel'}="${escapeContact(channel.id)}"`;
 return url?`<a ${attributes} href="${escapeContact(url)}" target="_blank" rel="noopener noreferrer" aria-label="${messenger?'Написать в':'Открыть канал ЭРА —'} ${label}">${content}</a>`:`<div ${attributes} aria-disabled="true" aria-label="${label} — ${status.toLowerCase()}" title="${status}">${content}</div>`;
}
export function footerChannels({channels=contactChannels}={}){
 return `<div class="footer-channels" aria-label="Мессенджеры и видеоканалы">${messengerDefinitions.map(channel=>compactChannel(channel,channels,{messenger:true})).join('')}${videoChannelDefinitions.map(channel=>compactChannel(channel,channels)).join('')}</div>`;
}
export function videoChannels({compact=false,channels=contactChannels,premium=false}={}){
 if(compact)return `<div class="footer-video-channels" aria-label="Наши видеоканалы">${videoChannelDefinitions.map(channel=>compactChannel(channel,channels)).join('')}</div>`;
 return `<div class="cp-video-channels" aria-label="Наши видеоканалы">${videoChannelDefinitions.map(channel=>{
  const url=confirmedChannelUrl(channels[channel.id]),label=escapeContact(channel.label),icon=contactIcon(channel.id);
  const content=`<span class="cp-channel-head"><span class="cp-channel-badge">${icon}</span><strong>${label}</strong></span>${premium?`<span class="cp-channel-subtitle">${channel.id==='youtube'?'Оборудование в работе':'Технологии и испытания'}</span>`:''}<span class="cp-channel-copy">${escapeContact(channel.description)}</span><span class="cp-channel-action${url?'':' is-status'}">${url?'Открыть канал <span aria-hidden="true">↗</span>':'Канал подключается'}</span>`;
  const attributes=`class="cp-video-channel${url?'':' is-pending'}" data-video-channel="${escapeContact(channel.id)}"`;
  return url?`<a ${attributes} href="${escapeContact(url)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть канал ЭРА — ${label}">${content}</a>`:`<div ${attributes} aria-disabled="true" aria-label="${label} — канал подключается" title="Канал подключается">${content}</div>`;
 }).join('')}</div>`;
}
export function messengerChannels({placeholders=false,channels=contactChannels}={}){
 const links=messengerDefinitions.flatMap(channel=>{
  const url=confirmedChannelUrl(channels[channel.id]);
  const content=`<span class="contact-messenger-icon">${contactIcon(channel.id)}</span><span class="contact-messenger-name">${channel.label}</span><small>${url?'Написать ↗':'Не подключён'}</small>`;
  if(url)return [`<a class="contact-messenger is-available" data-channel="${channel.id}" href="${escapeContact(url)}" target="_blank" rel="noopener noreferrer" aria-label="Написать в ${channel.label}">${content}</a>`];
  return placeholders?[`<button class="contact-messenger is-pending" data-channel="${channel.id}" type="button" disabled aria-disabled="true" title="Канал ещё не подключён">${content}</button>`]:[];
 });
 return links.length?`<div class="contact-messengers">${links.join('')}</div>`:'';
}
