import {contactChannels,videoChannelDefinitions,messengerDefinitions} from '../content/contact.mjs';

export const escapeContact=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll('↗','&#8599;');
export function confirmedChannelUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function contactIcon(name){
 const paths={
  message:'<path d="M5 5h22v17H14l-7 5v-5H5V5Z"/><path d="M10 11h12M10 16h8"/>',
  phone:'<path d="m9 4 5 7-4 4c2 4 3 5 7 7l4-4 7 5c-1 5-4 6-7 5C12 25 7 20 4 11 3 8 4 5 9 4Z"/>',
  email:'<rect x="4" y="6" width="24" height="20" rx="2"/><path d="m5 8 11 9L27 8"/>',
  youtube:'<rect x="3" y="7" width="26" height="18" rx="5"/><path d="m14 12 7 4-7 4v-8Z"/>',
  vkVideo:'<rect x="3" y="4" width="26" height="24" rx="6"/><path d="m8 11 3 10 3-10m4 0v10m0-5 6-5m-6 5 6 5"/>',
  telegram:'<circle cx="16" cy="16" r="15" fill="currentColor" stroke="none"/><path d="m25.2 8.3-2.7 14.7c-.2 1-.8 1.3-1.6.8l-4.3-3.2-2.1 2c-.2.2-.5.4-.9.4l.3-4.5 8.2-7.4c.4-.3-.1-.5-.6-.2l-10.2 6.4-4.4-1.4c-.9-.3-1-1 .2-1.4l17.2-6.6c.8-.3 1.5.2 1.2 1.4Z" fill="#fff" stroke="none"/>',
  max:'<path d="M27 15.5A11 11 0 0 1 16 27a12 12 0 0 1-5-1l-6 2 2-6a11 11 0 1 1 20-6.5Z"/><path d="M10 20v-9l6 6 6-6v9"/>',
  whatsapp:'<path d="M28 15.5A12 12 0 0 1 16 28a13 13 0 0 1-6-1.5L4 28l1.5-6A12 12 0 1 1 28 15.5Z"/><path d="m11 9 3 4-2 2c1.3 2.5 2.5 3.7 5 5l2-2 4 3c-.5 2-2 3-4 2-5-2-8-5-10-10-.8-2 .2-3.5 2-4Z"/>',
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
