export const siteContacts={email:'edkom.office@mail.ru',phone:'+7 903 281-35-35',phoneHref:'tel:+79032813535'};
// Only confirmed account URLs belong here. A null URL never becomes a link.
export const contactChannels={youtube:'https://www.youtube.com/@RASVET-LLC',vkVideo:null,telegram:'https://t.me/Eduyard13',max:'https://max.ru/u/f9LHodD0cOLJG4FZs3gHL3lpPmwQ0qEBZoRlKgEs72lHGd9FC0S8W-9NfpA',whatsapp:'https://wa.me/79032813535'};
export const videoChannelDefinitions=[
 {id:'youtube',label:'YouTube',description:'Видеопрезентации оборудования, технологические процессы и результаты испытаний.'},
 {id:'vkVideo',label:'VK Видео',description:'Материалы ЭРА для просмотра на российской видеоплатформе.'},
];
export const messengerDefinitions=[{id:'telegram',label:'Telegram'},{id:'max',label:'MAX'},{id:'whatsapp',label:'WhatsApp'}];
export const productionSite={
 country:'Китай',city:null,address:null,lat:null,lon:null,mapUrl:null,mapEmbedUrl:null,
 image:{file:'photos/ballisticheskiy-separator/02.webp',width:1448,height:1086,alt:'Участок сухой сепарации с подающими транспортёрами',caption:'Фотография оборудования ЭРА'},
};
export const projectRequest={
 endpoint:`https://formsubmit.co/${siteContacts.email}`,
 recipient:siteContacts.email,
 maxAttachmentBytes:5_000_000,
 publicOrigin:'https://eduyard13.github.io',
 subject:'Заявка с сайта ЭРА',
};
