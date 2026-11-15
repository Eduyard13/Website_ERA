import {contactChannels,videoChannelDefinitions,messengerDefinitions} from '../content/contact.mjs';

export const escapeContact=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll('↗','&#8599;');
export function confirmedChannelUrl(value){
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
// VK silhouette: Simple Icons, CC0-1.0; the play mark identifies VK Video.
const vkChannelMark='m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z';
export function contactIcon(name){
 if(['telegram','max','whatsapp'].includes(name))return `<img src="/assets/brands/${name}.svg" width="32" height="32" alt="" aria-hidden="true" decoding="async">`;
 if(name==='youtube')return '<svg viewBox="0 0 40 32" fill="none" aria-hidden="true" focusable="false"><rect x="2" y="4" width="36" height="24" rx="7" fill="currentColor"/><path d="m16 10 12 6-12 6V10Z" fill="#fff"/></svg>';
 if(name==='vkVideo')return `<svg viewBox="0 0 40 32" fill="none" aria-hidden="true" focusable="false"><rect x="1" y="3" width="26" height="26" rx="7" fill="#fff"/><path d="${vkChannelMark}" transform="translate(1 3) scale(1.0833333)" fill="currentColor"/><path d="m31 10 8 6-8 6V10Z" fill="currentColor"/></svg>`;
 const paths={
  message:'<path d="M5 5h22v17H14l-7 5v-5H5V5Z"/><path d="M10 11h12M10 16h8"/>',
  phone:'<path d="m9 4 5 7-4 4c2 4 3 5 7 7l4-4 7 5c-1 5-4 6-7 5C12 25 7 20 4 11 3 8 4 5 9 4Z"/>',
  email:'<rect x="4" y="6" width="24" height="20" rx="2"/><path d="m5 8 11 9L27 8"/>',
  person:'<circle cx="16" cy="10" r="5"/><path d="M5 29v-3a11 11 0 0 1 22 0v3"/>',
  compass:'<circle cx="16" cy="16" r="12"/><path d="m21 11-3 7-7 3 3-7 7-3ZM16 1v3m0 24v3M1 16h3m24 0h3"/>',
 };
 return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.message}</svg>`;
}
export function videoChannels({compact=false,channels=contactChannels}={}){
 return `<div class="${compact?'footer-video-channels':'cp-video-channels'}" aria-label="Наши видеоканалы">${videoChannelDefinitions.map(channel=>{
  const url=confirmedChannelUrl(channels[channel.id]),label=escapeContact(channel.label),icon=contactIcon(channel.id);
  const content=compact?`<span class="footer-video-icon">${icon}</span><span class="footer-video-name"><strong>${label}</strong>${url?'':'<small>Канал подключается</small>'}</span>${url?'<span class="footer-video-arrow" aria-hidden="true">↗</span>':''}`:`<span class="cp-channel-head"><span class="cp-channel-badge">${icon}</span><strong>${label}</strong></span><span class="cp-channel-copy">${escapeContact(channel.description)}</span><span class="cp-channel-action${url?'':' is-status'}">${url?'Открыть канал <span aria-hidden="true">↗</span>':'Канал подключается'}</span>`;
  const attributes=`class="${compact?'footer-video-channel':'cp-video-channel'}${url?'':' is-pending'}" data-video-channel="${escapeContact(channel.id)}"`;
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
