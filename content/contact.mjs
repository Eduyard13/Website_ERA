import {beierProduction} from './production.mjs';
export const siteContacts={email:'edkom.office@mail.ru',phone:'+7 903 281-35-35',phoneHref:'tel:+79032813535'};
// Only confirmed account URLs belong here. A null URL never becomes a link.
export const contactChannels={youtube:'https://www.youtube.com/@RASVET-LLC',vkVideo:null,telegram:'https://t.me/Eduyard13',max:'https://max.ru/u/f9LHodD0cOLJG4FZs3gHL3lpPmwQ0qEBZoRlKgEs72lHGd9FC0S8W-9NfpA',whatsapp:'https://wa.me/79032813535'};
export const videoChannelDefinitions=[
 {id:'youtube',label:'YouTube',description:'Видеопрезентации оборудования, технологические процессы и результаты испытаний.'},
 {id:'vkVideo',label:'VK Видео',description:'Материалы ЭРА для просмотра на российской видеоплатформе.'},
];
export const messengerDefinitions=[{id:'telegram',label:'Telegram'},{id:'max',label:'MAX'},{id:'whatsapp',label:'WhatsApp'}];
export const productionSite={
 ...beierProduction,
 location:{id:beierProduction.id,lat:null,lon:null,coordinateSystem:null},
 image:{file:'contacts/beier-zhangjiagang-factory.webp',smallFile:'contacts/beier-zhangjiagang-factory-768.webp',smallWidth:768,width:1920,height:714,alt:'Производственный комплекс BEIER Machinery в Чжанцзягане, Китай',caption:'BEIER Machinery · производственная площадка в Чжанцзягане',source:'https://www.beierrecycling.com/about-us/'},
 maps:[
  {provider:'google',label:'Google Maps',url:'https://www.google.com/maps?cid=14308622914688450133',embedUrl:"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3387.1186854646453!2d120.54503629999999!3d31.903372499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35b3de30aaecfbc9%3A0xc69270bb0704fe55!2sBei'er%20Machinery!5e0!3m2!1sen!2sus!4v1656289004886!5m2!1sen!2sus",embedReproduced:true,markerVerified:false,lat:null,lon:null,coordinateSystem:null,source:'https://www.beierrecycling.com/contact-us/',checkedAt:'2026-11-17'},
  {provider:'yandex',label:'Яндекс Карты',url:'https://yandex.ru/maps/?text='+encodeURIComponent(beierProduction.addressZh+' Jiangsu BEIER Machinery'),embedUrl:null,markerVerified:false,lat:null,lon:null,coordinateSystem:null,source:'https://yandex.ru/maps/',checkedAt:'2026-11-17'},
 ],
};
export const projectRequest={
 endpoint:`https://formsubmit.co/${siteContacts.email}`,
 recipient:siteContacts.email,
 maxAttachmentBytes:5_000_000,
 publicOrigin:'https://eduyard13.github.io',
 subject:'Заявка с сайта ЭРА',
};
