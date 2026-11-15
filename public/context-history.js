const allowedParameters=['q','category','material','group','objectType','product','sort','kind','type','collection','album','format','scope','v'];
export function safeSiteAddress(value,{origin,basePath=''}){
 if(typeof value!=='string'||!value)return null;
 try{const url=new URL(value,origin),base=basePath.replace(/\/$/,'');if(!['http:','https:'].includes(url.protocol)||url.origin!==origin||url.username||url.password||(base&&url.pathname!==base&&!url.pathname.startsWith(base+'/')))return null;
 const clean=new URL(url.pathname.replace(/\/+$/,'')||'/',origin);for(const key of allowedParameters){const value=url.searchParams.get(key);if(value)clean.searchParams.set(key,value);}if(/^#[a-zA-Z0-9_-]+$/.test(url.hash))clean.hash=url.hash;return clean.href;
 }catch{return null;}
}
const pathOf=value=>new URL(value).pathname;
export function isContextDestination(value,site){
 const safe=safeSiteAddress(value,site);if(!safe)return false;const path=pathOf(safe).slice(site.basePath?.length||0)||'/';
 return /^\/documents\/(brochures|technical|layouts|drawings|investments)$/.test(path)||/^\/catalog\/(equipment|lines)\/[a-z0-9-]+$/.test(path);
}
export function confirmContextTransition(record,current,referrer,{origin,basePath='',index=null,length=0,now=Date.now(),navigationType='navigate'}={}){
 const site={origin,basePath},to=safeSiteAddress(current,site),from=safeSiteAddress(referrer,site);
 if(!record||!to||!from||navigationType!=='navigate'||!record.fromId||!Number.isFinite(record.time)||now-record.time<0||now-record.time>120_000)return null;
 const source=safeSiteAddress(record.from,site),destination=safeSiteAddress(record.to,site);
 if(!source||!destination||pathOf(source)===pathOf(to)||pathOf(destination)!==pathOf(to))return null;
 const withoutHash=value=>{const u=new URL(value);u.hash='';return u.href;};if(withoutHash(source)!==withoutHash(from))return null;
 if(Number.isInteger(index)&&Number.isInteger(record.index)){if(index!==record.index+1)return null;}else if(length!==record.length+1)return null;
 return {id:record.fromId,url:source};
}
export function canReturnWithinSite(entry,current,{origin,basePath='',index=null,length=0}={}){
 const site={origin,basePath},here=safeSiteAddress(current,site),previous=safeSiteAddress(entry?.previous?.url,site),entryUrl=safeSiteAddress(entry?.url,site);
 if(!entry?.verified||entry.basePath!==basePath||!entryUrl||!here||!previous||pathOf(entryUrl)!==pathOf(here)||pathOf(previous)===pathOf(here))return false;
 if(Number.isInteger(index)&&Number.isInteger(entry.index))return index===entry.index;
 return length===entry.length&&new URL(entryUrl).hash===new URL(here).hash;
}
export function contextParentAddress(entry,parent,current,site){
 const fallback=safeSiteAddress(parent,site),previous=safeSiteAddress(entry?.previous?.url,site),here=safeSiteAddress(current,site),original=safeSiteAddress(entry?.url,site);
 return entry?.verified&&entry.basePath===site.basePath&&fallback&&previous&&here&&original&&pathOf(here)===pathOf(original)&&pathOf(previous)===pathOf(fallback)?previous:fallback;
}
let remember=()=>{},canReturn=()=>false,parentHref=value=>value;
if(typeof window!=='undefined'){
 const basePath=new URL('.',import.meta.url).pathname.replace(/\/$/,''),site={origin:location.origin,basePath},key='era:context-transition:'+basePath;
 const currentIndex=()=>{const value=window.navigation?.currentEntry?.index;return Number.isInteger(value)&&value>=0?value:null;};
 const objectState=()=>history.state&&typeof history.state==='object'&&!Array.isArray(history.state)?history.state:{};
 const store={read(){try{const raw=sessionStorage.getItem(key);sessionStorage.removeItem(key);return raw?JSON.parse(raw):null;}catch{return null;}},write(value){try{if(value)sessionStorage.setItem(key,JSON.stringify(value));else sessionStorage.removeItem(key);}catch{}}};
 const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const old=objectState().eraContext,existing=safeSiteAddress(old?.url,site),current=safeSiteAddress(location.href,site),pending=store.read();
 const sameEntry=old?.basePath===basePath&&existing&&current&&pathOf(existing)===pathOf(current)&&(currentIndex()!==null?old.index===currentIndex():old.length===history.length&&new URL(existing).hash===new URL(current).hash);
 if(!sameEntry){const previous=confirmContextTransition(pending,location.href,document.referrer,{...site,index:currentIndex(),length:history.length,navigationType:performance.getEntriesByType('navigation')[0]?.type||'navigate'});history.replaceState({...objectState(),eraContext:{id:id(),basePath,url:current,index:currentIndex(),length:history.length,previous,verified:!!previous}},'');}
 let transition=null;
 remember=value=>{
  transition=null;const destination=safeSiteAddress(value,site),source=safeSiteAddress(location.href,site);
  if(!destination||!source||!isContextDestination(destination,site)||pathOf(destination)===pathOf(source)||document.querySelector('main h1')?.textContent.trim()==='404')return;
  const state=objectState();if(!state.eraContext?.id)history.replaceState({...state,eraContext:{id:id(),basePath,url:source,index:currentIndex(),length:history.length,verified:false,previous:null}},'');
  transition={fromId:history.state.eraContext.id,from:source,to:destination,index:currentIndex(),length:history.length,time:Date.now()};
 };
 window.addEventListener('click',event=>{
  if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');if(!link)return;transition=null;
  if(event.defaultPrevented||link.hasAttribute('download')||link.hasAttribute('data-context-back')||(link.target&&link.target!=='_self'))return;
  remember(link.href);
 });
 window.addEventListener('pagehide',()=>{store.write(transition);transition=null;});
 const initialEntry=history.state?.eraContext;parentHref=value=>contextParentAddress(initialEntry,value,location.href,site)||value;
 canReturn=()=>canReturnWithinSite(history.state?.eraContext,location.href,{...site,index:currentIndex(),length:history.length});
}
export const rememberContextNavigation=value=>remember(value);
export const contextCanGoBack=()=>canReturn();

export const contextFallbackHref=value=>parentHref(value);
