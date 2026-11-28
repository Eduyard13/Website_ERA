import {beierProduction} from '../home/production.mjs';
export const siteContacts={email:'info@era-cycle.ru',phone:'+7 903 281-35-35',phoneHref:'tel:+79032813535'};
// Only confirmed account URLs belong here. A null URL never becomes a link.
export const contactChannels={youtube:'https://www.youtube.com/channel/UCIPobqUb8oTZkSb1Y9ubtww',vkVideo:'https://vkvideo.ru/@club243794064',telegram:'https://t.me/Eduyard13',max:'https://max.ru/u/f9LHodD0cOLJG4FZs3gHL3lpPmwQ0qEBZoRlKgEs72lHGd9FC0S8W-9NfpA',whatsapp:'https://wa.me/79032813535'};
export const videoChannelDefinitions=[
 {id:'youtube',label:'YouTube',description:'Видеопрезентации оборудования, технологические процессы и результаты испытаний.'},
 {id:'vkVideo',label:'VK Видео',description:'Материалы ЭРА для просмотра на российской видеоплатформе.'},
];
export const messengerDefinitions=[{id:'telegram',label:'Telegram'},{id:'max',label:'MAX'},{id:'whatsapp',label:'WhatsApp'}];
// The verified entrance in WGS-84; Google uses its Chinese map coordinates.
const location={id:beierProduction.id,lat:31.905470,lon:120.540730,coordinateSystem:'WGS-84'};
export const productionSite={
 ...beierProduction,
 location,
 image:{file:'contacts/beier-zhangjiagang-factory.webp',smallFile:'contacts/beier-zhangjiagang-factory-768.webp',smallWidth:768,width:1920,height:714,alt:'Производственный комплекс BEIER Machinery в Чжанцзягане, Китай',caption:'BEIER Machinery · производственная площадка в Чжанцзягане',source:'https://www.beierrecycling.com/about-us/'},
 // The operator must approve each embedded service separately from visitor consent.
 operatorApprovedMapEmbeds:Object.freeze([]),
 maps:[
  {provider:'google',label:'Google Maps',url:'https://www.google.com/maps?cid=14308622914688450133',embedUrl:"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3387.1186854646453!2d120.54503629999999!3d31.903372499999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x35b3de30aaecfbc9%3A0xc69270bb0704fe55!2sBei'er%20Machinery!5e0!3m2!1sen!2sus!4v1656289004886!5m2!1sen!2sus",embedReproduced:true,markerVerified:true,siteId:location.id,lat:31.9033725,lon:120.5450363,coordinateSystem:'GCJ-02',source:'https://www.google.com/maps?cid=14308622914688450133',checkedAt:'2026-11-17'},
  {provider:'yandex',label:'Яндекс Карты',siteId:location.id,lat:location.lat,lon:location.lon,coordinateSystem:location.coordinateSystem,url:`https://yandex.com/maps/?l=sat&ll=${location.lon},${location.lat}&pt=${location.lon},${location.lat}&z=17`,embedUrl:`https://yandex.com/map-widget/v1/?ll=${location.lon},${location.lat}&pt=${location.lon},${location.lat},pm2rdm&z=17&l=sat`,embedReproduced:true,markerVerified:true,markerKind:'custom-point',source:'https://yandex.com/maps/',checkedAt:'2026-11-17'},
 ],
};
export const projectRequest={
 endpoint:'/api/request.php',
 recipient:siteContacts.email,
 maxAttachmentBytes:5_000_000,
 maxFiles:20,
};
