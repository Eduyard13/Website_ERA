import {contactChannels,videoChannelDefinitions,messengerDefinitions} from '../content/contact.mjs';

export const escapeContact=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll('↗','&#8599;');
export function confirmedChannelUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function contactIcon(name){
 if(['telegram','max','whatsapp'].includes(name))return `<img src="/assets/brands/${name}.svg" width="32" height="32" alt="" aria-hidden="true" decoding="async">`;
 const paths={
  message:'<path d="M5 5h22v17H14l-7 5v-5H5V5Z"/><path d="M10 11h12M10 16h8"/>',
  phone:'<path d="m9 4 5 7-4 4c2 4 3 5 7 7l4-4 7 5c-1 5-4 6-7 5C12 25 7 20 4 11 3 8 4 5 9 4Z"/>',
  email:'<rect x="4" y="6" width="24" height="20" rx="2"/><path d="m5 8 11 9L27 8"/>',
  youtube:'<rect x="3" y="7" width="26" height="18" rx="5"/><path d="m14 12 7 4-7 4v-8Z"/>',
  vkVideo:'<rect x="3" y="4" width="26" height="24" rx="6"/><path d="m8 11 3 10 3-10m4 0v10m0-5 6-5m-6 5 6 5"/>',
  person:'<circle cx="16" cy="10" r="5"/><path d="M5 29v-3a11 11 0 0 1 22 0v3"/>',
  compass:'<circle cx="16" cy="16" r="12"/><path d="m21 11-3 7-7 3 3-7 7-3ZM16 1v3m0 24v3M1 16h3m24 0h3"/>',
 };
 return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.message}</svg>`;
}
export function videoChannels({compact=false,channels=contactChannels}={}){
 return `<div class="${compact?'footer-video-channels':'cp-video-channels'}" aria-label="Наши видеоканалы">${videoChannelDefinitions.map(channel=>{
  const url=confirmedChannelUrl(channels[channel.id]);
  const content=`${contactIcon(channel.id)}<span class="${compact?'footer-video-name':'cp-channel-copy'}"><strong>${channel.label}</strong>${compact?'':`<span>${escapeContact(channel.description)}</span>`}<small>${url?(compact?'Открыть канал':'Открыть канал ↗'):'Ссылка будет добавлена'}</small></span>`;
  return url?`<a class="${compact?'footer-video-channel':'cp-video-channel'}" href="${escapeContact(url)}" target="_blank" rel="noopener noreferrer" aria-label="Открыть канал ЭРА — ${channel.label}">${content}</a>`:`<div class="${compact?'footer-video-channel':'cp-video-channel'} is-pending" aria-disabled="true" aria-label="${channel.label} — ссылка будет добавлена" title="Ссылка появится после согласования">${content}</div>`;
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
