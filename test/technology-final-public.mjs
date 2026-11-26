// Check the published technology, homepage and shared section navigation in Chrome.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';

const base=(process.env.ERA_PREVIEW_URL||process.env.ERA_SITE_URL||'http://127.0.0.1:3081').replace(/\/$/,'');
const url=base+'/technology/';
const response=await fetch(url,{cache:'no-store'});
assert.equal(response.status,200,'Published technology HTTP status');
const html=await response.text();
assert.ok(html.includes('data-technology-final'),'The new technology page is published');
assert.match(html,/<h1 id="technology-hero-heading">Загрязнение не определяет будущее полимера\.<\/h1>/);
assert.match(html,/<p class="tf-hero-hook">Его будущее определяет технология\.<\/p>/);
assert.equal((html.match(/data-feedstock-type=/g)||[]).length,5);
assert.equal((html.match(/data-contaminant-row=/g)||[]).length,9);
assert.equal((html.match(/data-technology-application=/g)||[]).length,5);
for(const file of ['technology-final.css','technology-final.js','presentation-web.js','material-balance-model.js']){
 const r=await fetch(base+'/'+file,{cache:'no-store'});assert.equal(r.status,200,file);assert.ok(!r.headers.get('content-type')?.includes('text/html'),file+' MIME');
}
for(const path of ['catalog/lines/separatsiya-01/','catalog/lines/separatsiya-02/','catalog/lines/separatsiya-03/','catalog/lines/moyka-plenki/','catalog/equipment/rotornyy-raspushitel/','catalog/equipment/plenochnyy-flotator/','documents/brochures/era-separatsiya-02-overview.pdf']){
 assert.equal((await fetch(base+'/'+path,{method:'HEAD',cache:'no-store'})).status,200,path);
}
const images=[{"file":"technology/applications/film.webp","sha256":"4b504ccd3188e58ab77521a632a02a0d1bc9c4484c02b799957a340a63712c32"},{"file":"technology/applications/film-600.webp","sha256":"8fc5e1d45d7533bd5689e694d6f96fdd20a4407b428aa33156d75fb51d24cdee"},{"file":"technology/applications/pipes.webp","sha256":"83438f5baf4826151152c1ea0fc43461e8755405a52ecf1d5a29290605a4e538"},{"file":"technology/applications/pipes-600.webp","sha256":"8c50b55b96a3c3a10b19b660e0915709102f46bb3a33d34e3f91ff1bdced31d5"},{"file":"technology/applications/containers.webp","sha256":"551e1a6bbfb08312524870f817ad9ebcead9be4c92e2f49d437066380473778b"},{"file":"technology/applications/containers-600.webp","sha256":"18cee34f8d927f83d9bb1e8ef99641b9dbd7c736eeb306e3c1c0fce59cb1c9e8"},{"file":"technology/applications/pyrolysis.webp","sha256":"5b20a154e34b675646d5bb9d05dad2deea5c18c82d50ca3888836850f7ea8326"},{"file":"technology/applications/pyrolysis-600.webp","sha256":"1f3d17853387481eeb72111ce310ed094797f6181f2f7a84583aafc73237cb8d"},{"file":"technology/applications/energy.webp","sha256":"c837e6fef53a3a4f4cbdc4943695fd7923b448259399512eee2d42f494c535d2"},{"file":"technology/applications/energy-600.webp","sha256":"72d086fbdc10b26a63fede3ebb5047ae01253070093db591afaeaef6a83dfa3d"}];
images.push(
 {file:'technology/hero/technology-hero-transformation.png',sha256:'e480336ae73a5b94365806d123bdb374c3a39639cce34b514bd73336f483b116'},
 {file:'technology/hero/technology-hero-transformation.webp',sha256:'aefada54cd92516daa8cd2b6b51b5c7bc4be8bed82158cc583d4d1c06f8434fc'},
 {file:'technology/hero/technology-hero-transformation-800.webp',sha256:'0e249a4f51cfe93f8ef78bee7fc3df6e7e59d210da01a33d71a8dcf9fb7c28e4'},
 {file:'lines/separatsiya-01/catalog-cover.webp',sha256:'6c287c05cb55dcf7f05153e94ad18ff02c791d19c9e48de5a878d00bc3ae427b'},
 {file:'lines/moyka-plenki/catalog-cover-detailed.webp',sha256:'93ee722f324e163ab3cb5eac4df3546083393e0a9e7a080a3e7ff462769a6a80'},
);
for(const image of images){
 const r=await fetch(base+'/assets/'+image.file,{cache:'no-store'});assert.equal(r.status,200,image.file);assert.equal(r.headers.get('content-type'),image.file.endsWith('.png')?'image/png':'image/webp',image.file);
 const bytes=Buffer.from(await r.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256,image.file+' SHA-256');
}
const binary=process.env.ERA_CHROME_PATH||['/usr/bin/google-chrome','/usr/bin/chromium','/opt/google/chrome/chrome'].find(existsSync);
if(!binary)throw new Error('Chrome is required to verify public technology');
const profile=await mkdtemp(join(tmpdir(),'era-technology-browser-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const chromeClosed=new Promise(resolve=>chrome.once('close',resolve));
let socket;
try{
 let port;
 for(let i=0;i<150;i++){try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await delay(100);}}
 assert.ok(port,'Chrome debugging endpoint');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map(),errors=[];
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
  const request=pending.get(message.id);if(!request)return;pending.delete(message.id);clearTimeout(request.timer);
  if(message.error)request.reject(new Error(message.error.message));else request.resolve(message.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(new Error('CDP timeout: '+method));},30000);
  pending.set(key,{resolve,reject,timer});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Public Chrome condition failed: '+expression);};
 const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
 const snapshot=()=>evaluate(`(()=>{
  const root=document.querySelector('[data-technology-final]');
  const elements=selector=>[...root.querySelectorAll(selector)];
  const visible=selector=>elements(selector).filter(e=>!e.closest('details:not([open])')&&e.checkVisibility());
  return {
   sections:elements(':scope>section').map(e=>e.id),
   h1:elements('h1').length,rail:document.querySelectorAll('.page-progress-rail a').length,
   feedstock:elements('[data-feedstock-type]').length,visibleRows:visible('[data-contaminant-row]').length,
   outputs:elements('[data-technology-output]').length,applications:visible('[data-technology-application]').length,
   lines:elements('[data-technology-line]').map(e=>e.dataset.technologyLine),
   renders:elements('.tf-line-render img').map(e=>e.getAttribute('src').split('/assets/')[1]),
   kair:elements('[data-kair-slide]').length,washing:elements('[data-washing-configuration]').length,
   overflow:document.documentElement.scrollWidth>innerWidth,
   broken:elements('img[src]').filter(i=>!i.complete||!i.naturalWidth||!i.alt).map(i=>i.src),
   quality:root.querySelector('#granule-quality').textContent,
   disclosures:elements('#applications details,#granule-quality details,#discuss details').length,
   scale:elements('#granulation .tf-scale-grid article').length,
   water:elements('#hot-washing .tf-water-loop > li').length,
  };
 })()`);
 const load=async fragment=>{
  await command('Page.navigate',{url:url+(fragment||'')});
  await wait(`document.readyState==='complete'&&document.querySelector('[data-tf-scenario="50"]:not([disabled])')&&document.querySelector('.page-progress-rail a')`);
 };
 const balance=()=>evaluate(`(()=>{
  const root=document.querySelector('#material-balance');
  const text=selector=>root.querySelector(selector).textContent;
  return {
   polymer:text('[data-tf-polymer]'),inclusions:text('[data-tf-inclusions]'),
   input:text('.tf-balance-input strong'),baseline:text('.tf-baseline > strong'),
   selected:[...root.querySelectorAll('[aria-pressed="true"]')].map(button=>button.dataset.tfScenario),
   share:root.querySelector('.tf-balance-bar').style.getPropertyValue('--polymer'),
   overflow:root.scrollWidth>root.clientWidth+2,
  };
 })()`);
 const amount=text=>Number(text.replace(/\s/g,''));
 const expected=['technology-intro','raw-material','contaminants','solution','dry-separation','hot-washing','granulation','products','granule-quality','applications','control-story','technology-next'];
 await command('Page.enable');await command('Runtime.enable');
 await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const widths=[320,390,768,1024,1440,1920];
 for(const width of widths){
  await command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<768});
  await load();
  await evaluate(`Promise.all([...document.querySelectorAll('[data-technology-final] img[src]')].map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))`);
  const s=await snapshot();
  assert.deepEqual(s.sections,expected);
  assert.equal(s.h1,1);assert.equal(s.rail,expected.length);assert.equal(s.feedstock,5);assert.equal(s.visibleRows,9);
  assert.equal(s.outputs,3);assert.equal(s.applications,5);assert.equal(s.washing,2);assert.equal(s.kair,23);
  assert.equal(s.disclosures,0);assert.equal(s.scale,2);assert.equal(s.water,4);
  assert.deepEqual(s.lines,['separatsiya-01','separatsiya-02','separatsiya-03','moyka-plenki']);
  assert.deepEqual(s.renders,['lines/separatsiya-01/catalog-cover.webp','lines/moyka-plenki/catalog-cover-detailed.webp']);
  assert.ok(!s.overflow,'Layout '+width);assert.deepEqual(s.broken,[]);
  for(const value of ['0,8–1,2','190 °C / 2,16 кг','30–70','ppm','30–70 г/т','0,003–0,007%','3–5%'])assert.ok(s.quality.includes(value),value);
  await click('[data-section-navigation] a[href="#products"]');
  await wait(`document.querySelector('[data-section-navigation] a[aria-current="location"]')?.hash==='#products'`);
  await load('#material-balance');
  await wait(`document.querySelector('#material-balance').getClientRects().length>0`);
  assert.deepEqual((await balance()).selected,['50']);
  for(const [value,polymer,inclusions] of [[30,1050,450],[40,900,600],[50,750,750]]){
   await click(`[data-tf-scenario="${value}"]`);
   const b=await balance();
   assert.deepEqual(b.selected,[String(value)]);
   assert.equal(amount(b.polymer),polymer);assert.equal(amount(b.inclusions),inclusions);
   assert.equal(b.share,`${100-value}%`);assert.ok(!b.overflow);
   assert.equal(amount(b.input.replace('кг/ч','')),1500);assert.equal(amount(b.baseline.replace('кг/ч','')),750);
  }
 }
 await evaluate(`document.querySelector('[data-tf-scenario="30"]').focus()`);
 await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});
 await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await wait(`document.querySelector('[data-tf-scenario="30"]').getAttribute('aria-pressed')==='true'`);
 const keyboard=await balance();assert.deepEqual(keyboard.selected,['30']);assert.equal(amount(keyboard.polymer),1050);
 for(const fragment of ['#control-title','#about-era','#granule-quality']){
  await load(fragment);await wait(`(()=>{const e=document.querySelector(${JSON.stringify(fragment)});const r=e.getBoundingClientRect();return e.getClientRects().length>0&&r.top>=0&&r.top<innerHeight;})()`);
 }
 assert.equal(await evaluate(`document.querySelector('[data-kair]').dataset.autoplay`),'false');
 const contact=new URL(await evaluate(`document.querySelector('#discuss [data-project-request]').href`));
 assert.ok(contact.pathname.endsWith('/contacts')&&contact.hash==='#project-form');
 assert.equal(contact.searchParams.get('topic'),'Технология переработки плёночного сырья');
 assert.deepEqual(errors,[],'Technology console errors');
 console.log(`::notice title=Published technology verified::12 sections, 9 contamination cards, 4 catalogue links, 3 products, 5 applications, 23 KAIR photos, ${images.length} image SHA-256 checks including the original hero PNG, ${widths.length} widths, sticky navigation, balance and anchors passed. ${url}`);

 const homeSections=['hero','problem','feedstocks','process','strengths','products','market','business','integration','equipment','kair','contact'];
 const mapSelection=()=>evaluate(`(()=>{
  const record=document.querySelector('[data-market-record]:not([hidden])');
  return {
   name:record.querySelector('[data-market-name]').textContent,
   volume:record.querySelector('[data-market-volume]').textContent.replace(/\\s+/g,' '),
   active:document.querySelector('[data-market-feature][aria-pressed="true"]')?.dataset.marketFeature??null,
  };
 })()`);
 for(const width of [390,1440]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:940,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url:base+'/#russia-market'});
  await wait(`document.readyState==='complete' && document.querySelector('[data-market-map][data-market-ready="true"]') && document.querySelector('[data-feedstock-ready="true"]') && document.querySelector('.page-progress-rail a')`);
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[data-home-block]'),e=>e.dataset.homeBlock)`),homeSections);
  assert.equal(await evaluate(`document.querySelectorAll('.page-progress-rail a').length`),homeSections.length);
  assert.deepEqual(await evaluate(`[document.querySelectorAll('[data-market-districts] path.market-district-area').length,document.querySelectorAll('[data-market-regions] .market-pin').length]`),[8,10]);
  const national={name:'Вся Россия',volume:'≈ 5 млн т/год',active:null};
  assert.deepEqual(await mapSelection(),national);
  assert.equal(await evaluate(`document.querySelector('[data-market-record="national"] [data-market-annual]').textContent.replace(/\\s/g,' ')`),'59,4 млрд ₽');
  const brokenImages=await evaluate(`Promise.all([...document.querySelectorAll('[data-resource-home] img[src]')].map(async i=>{
   i.loading='eager';try{await i.decode();}catch{return i.src;}return i.naturalWidth&&(i.alt||i.closest('[aria-hidden="true"]'))?null:i.src;
  })).then(results=>results.filter(Boolean))`);
  assert.deepEqual(brokenImages,[]);
  const visualState=await evaluate(`(()=>{
   const covers=[...document.querySelectorAll('.resource-equipment-grid .resource-equipment-image')];
   const coverRatios=covers.map(card=>({
    frame:card.getBoundingClientRect().width/card.getBoundingClientRect().height,
    asset:card.querySelector('img').naturalWidth/card.querySelector('img').naturalHeight,
    height:card.getBoundingClientRect().height
   }));
   const kair=document.querySelector('.resource-control .resource-kair-visual img');
   return {coverRatios,kairBlend:getComputedStyle(kair).mixBlendMode,kairMask:getComputedStyle(kair).maskImage,
     kairFigurePosition:getComputedStyle(kair.closest('.resource-kair-visual')).position};
  })()`);
  assert.equal(visualState.coverRatios.length,3);
  for(const [index,cover] of visualState.coverRatios.entries()){
   assert.ok(Math.abs(cover.frame-3/2)<.035,'Uniform product cover 3:2 at '+width);
   if(index!==1)assert.ok(Math.abs(cover.frame-cover.asset)<.035,'Full dry-separation and equipment-nodes artwork at '+width);
   else assert.ok(Math.abs(cover.asset-4/3)<.035,'Washing cover uses approved artwork with minimal backdrop trim');
  }
  assert.ok(Math.max(...visualState.coverRatios.map(c=>c.height))-Math.min(...visualState.coverRatios.map(c=>c.height))<2,'Uniform three product covers at '+width);
  assert.equal(visualState.kairBlend,'normal','KAIR scene must preserve its original midnight-blue palette');
  assert.notEqual(visualState.kairMask,'none','KAIR art must blend into the surrounding native background');
  assert.equal(visualState.kairFigurePosition,width>=1101?'absolute':'relative');
  const spacing=await evaluate(`(()=>{
    const lead=document.querySelector('.resource-control .resource-kair-lead');
    const perks=document.querySelector('.resource-control .resource-kair-benefits');
    const title=document.querySelector('#discuss-title');
    const lines=[...title.querySelectorAll('.resource-contact-title-line')];
    return {leadWidth:lead.getBoundingClientRect().width,perksMargin:getComputedStyle(perks).marginTop,
      perkWidth:perks.getBoundingClientRect().width,ctaLines:lines.map(line=>({top:line.getBoundingClientRect().top}))};
  })()`);
  assert.equal(spacing.ctaLines.length,3,'Closing CTA uses three intentional title lines');
  assert.ok(spacing.ctaLines[0].top<spacing.ctaLines[1].top && spacing.ctaLines[1].top<spacing.ctaLines[2].top,
    'Closing CTA line arrangement at '+width);
  if(width>=1101){
    assert.ok(spacing.leadWidth<=485,'KAIR lead restrained from machinery overlay at '+width);
    assert.ok(spacing.perkWidth<=515,'KAIR benefits restrained from artwork at '+width);
    assert.ok(parseFloat(spacing.perksMargin)>=20,'KAIR benefits lowered under the lead');
  }
  await evaluate('document.fonts.ready.then(()=>true)');
  const hero=await evaluate(`(()=>{
   const root=document.querySelector('#resource');
   const box=root.getBoundingClientRect();
   const copy=root.querySelector('.resource-hero-copy').getBoundingClientRect();
   const image=root.querySelector('.resource-hero-grid > img[data-media-slot="heroHook"]');
   const quote=root.querySelector('.resource-hero-subtitle');
   const art=image.getBoundingClientRect();
   const range=document.createRange();
   range.selectNodeContents(quote);
   return {
    title:root.querySelector('h1').innerText.replace(/\\s+/g,' '),
    subtitle:quote.textContent,
    lead:root.querySelector('.resource-hero-lead').textContent,
    italicLine:getComputedStyle(quote).fontStyle==='italic'&&range.getClientRects().length===1,
    faces:[...document.fonts].filter(font=>font.family==='IBM Plex Sans'&&font.status==='loaded').length,
    artwork:image.src.endsWith('/polymers-cycle.webp')&&image.naturalWidth>0,
    mask:getComputedStyle(image).maskImage!=='none',
    below:art.top>=copy.bottom,
    fullHeight:Math.abs(art.top-box.top)<1&&Math.abs(art.height-box.height)<1&&art.left+art.width/2>box.left+box.width/2,
   };
  })()`);
  assert.equal(hero.title,'От нефти к полимерам. От полимеров — снова к нефти.');
  assert.equal(hero.subtitle,'Отходы одного цикла — сырьё для следующего.');
  assert.equal(hero.lead,'ЭРА разработала, успешно испытала и ввела в промышленную эксплуатацию технологию и оборудование для переработки загрязнённых плёночных отходов.');
  assert.equal(hero.faces,2);
  assert.ok(hero.italicLine&&hero.artwork&&hero.mask&&(width<1024?hero.below:hero.fullHeight),'Homepage hero at '+width);
  await click('[data-market-mode="regions"]');
  await evaluate(`(()=>{const select=document.querySelector('[data-market-select="regions"]');select.value='moscow';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  assert.deepEqual(await mapSelection(),{name:'Москва',volume:'441,8 тыс. т/год',active:'moscow'});
  await evaluate(`document.querySelector('[data-market-feature="moscow-oblast"]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
  assert.deepEqual(await mapSelection(),{name:'Московская область',volume:'302,8 тыс. т/год',active:'moscow-oblast'});
  await click('[data-market-mode="districts"]');
  assert.deepEqual(await mapSelection(),national);
  const finance=await evaluate(`document.querySelector('.resource-finance-grid').textContent`);
  assert.equal(await evaluate(`document.querySelectorAll('[data-home-economics]').length`),5);
  await click('[data-market-district-link="volga"]');
  assert.deepEqual(await mapSelection(),{name:'Приволжский ФО',volume:'999,3 тыс. т/год',active:'volga'});
  assert.equal(await evaluate(`document.querySelector('.resource-finance-grid').textContent`),finance);
  await click('[data-market-reset]');
  assert.deepEqual(await mapSelection(),national);
  assert.equal(await evaluate(`document.querySelectorAll('[data-feedstock-sector]').length`),5);
  await click('[data-feedstock-choice="construction"]');
  assert.equal(await evaluate(`document.querySelector('[data-feedstock-chart]').dataset.view`),'construction');
  assert.deepEqual(await mapSelection(),national);
  await click('[data-feedstock-choice="construction"]');
  const methodologyWasOpen=await evaluate(`document.querySelector('#feedstock-methodology').open`);
  await click('#feedstock-methodology summary');
  assert.equal(await evaluate(`document.querySelector('#feedstock-methodology').open`),!methodologyWasOpen,'Methodology summary must toggle its disclosure state');
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'Homepage overflow at '+width);
 }
 assert.deepEqual(errors,[],'Homepage console errors');
 console.log(`::notice title=Published homepage verified::Hero, 12 sections, five interactive sectors, national map, shared figures and five economics cards at 390 and 1440 px. ${base}/`);

 const menus={
  '/technology/':['raw-material','solution','products','granule-quality','applications','control-story','standalone-equipment'],
  '/':['raw-material','process','products','russia-market','solution','manufacturing','kair'],
  '/economics/':['economic-case','raw-material','economics','production-constructor','project-resilience','production-growth','economics-project'],
 };
 const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const path of ['/technology/','/','/economics/']){
  const pageResponse=await fetch(base+path,{cache:'no-store'});assert.equal(pageResponse.status,200,path);
  const published=await pageResponse.text();
  for(const file of ['section-navigation.css','page-progress.js']){
   const asset=published.match(new RegExp(`(?:href|src)="([^"]+/${file.replace('.','\\.') }\\?v=([a-f0-9]{12}))"`));
   assert.ok(asset,path+' '+file);
   const bytes=await fetch(new URL(asset[1],base),{cache:'no-store'});
   assert.equal(bytes.status,200,file);
   const revision=digest(file+':'+digest(Buffer.from(await bytes.arrayBuffer()))).slice(0,12);
   assert.equal(revision,asset[2],path+' '+file+' release');
  }
 }
 for(const width of [390,1440]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  for(const [path,ids] of Object.entries(menus)){
   await command('Page.navigate',{url:base+path});
   await wait(`document.readyState==='complete'&&document.querySelector('[data-section-navigation]+main')&&document.querySelector('.page-progress-rail a')`);
   const menu='[data-section-navigation]';
   assert.deepEqual(await evaluate(`[...document.querySelectorAll('${menu} a')].map(a=>a.hash.slice(1))`),ids);
   assert.equal(await evaluate(`document.querySelectorAll('.tf-outline,.ec-toc').length`),0);
   assert.equal(await evaluate(`document.querySelector('${menu} [aria-current="location"]')?.hash ?? null`),path==='/economics/'?'#economic-case':null);
   for(const target of ids){
    await click(`${menu} a[href="#${target}"]`);
    await wait(`(()=>{
     const nav=document.querySelector('${menu}');
     const link=nav.querySelector('[aria-current=location]'), hash='#${target}';
     if(!link||link.hash!==hash||location.hash!==hash)return false;
     const rail=document.querySelector('.page-progress-rail [aria-current=location]');
     const bounds=nav.getBoundingClientRect(), heading=document.getElementById('${target}').getBoundingClientRect();
     const item=link.getBoundingClientRect(), track=link.parentElement.getBoundingClientRect();
     const aligned=Math.abs(heading.top-bounds.bottom-16)<2 || ('${target}'==='economic-case' && scrollY<2 && Math.abs(heading.top-bounds.bottom)<2);
     return rail&&link.dataset.sectionGroup.split(' ').includes(rail.hash.slice(1))
      &&aligned&&item.left>=track.left-1&&item.right<=track.right+1
      &&Math.abs(bounds.top-document.querySelector('.site-header').getBoundingClientRect().bottom)<2
      &&document.documentElement.scrollWidth<=innerWidth;
    })()`);
   }
  }
 }
 assert.deepEqual(errors,[],'Published section navigation console errors');
 console.log('::notice title=Published section navigation verified::All 21 approved links, sticky offsets, synchronized groups and asset checks passed on the three public pages at 390 and 1440 px.');

 const kairPage=await fetch(base+'/automation/',{cache:'no-store'});
 assert.equal(kairPage.status,200);
 const kairMarkup=await kairPage.text();
 const style=kairMarkup.match(/href="([^"]*\/kair-stage2\.css\?v=([a-f0-9]{12}))"/);
 assert.ok(style,'Published KAIR stage two stylesheet');
 const styleResponse=await fetch(new URL(style[1],base),{cache:'no-store'});
 assert.equal(styleResponse.status,200);
 assert.equal(digest('kair-stage2.css:'+digest(Buffer.from(await styleResponse.arrayBuffer()))).slice(0,12),style[2]);
 const approvedArt={
  'operator-station.webp':'f9fe1037837ce52c464549cb31e7d8d46834d95c364de8f3c018d1ad6449d05b',
  'business-contact.webp':'3102803e32fce454c783c73db5d54fb9672bd907e87063498556cd16bcb61e33',
  'business-contact-960.webp':'e8498299bf5b9609bd2ba4062a709a79c7f5289040fb4f27e622028dd95025d7',
 };
 for(const [file,checksum] of Object.entries(approvedArt)){
  const path='/assets/kair/'+file;
  assert.ok(kairMarkup.includes(path),file);
  const image=await fetch(base+path,{cache:'no-store'});
  assert.equal(image.status,200,file);
  assert.equal(digest(Buffer.from(await image.arrayBuffer())),checksum,file);
 }
 for(const width of [390,1440]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  await command('Page.navigate',{url:base+'/automation/#kair-functions-water'});
  await wait(`document.querySelector('[data-kair-system][data-ready=true]')&&
   document.querySelector('#ka-function-tab-water[aria-selected=true]')&&
   document.querySelector('[data-kair-section-nav] [aria-current=location]')?.hash==='#kair-functions'`);
  const counts=await evaluate(`['[data-kair-scenario]','[data-kair-function]','[data-kair-compact] [data-kair-slide]',
   '[data-kair-section-nav] a','[data-kair-hardware]'].map(sel=>document.querySelectorAll(sel).length)`);
  assert.deepEqual(counts,[24,29,7,8,8]);
  const [scrollWidth,clientWidth]=await evaluate('[document.documentElement.scrollWidth,document.documentElement.clientWidth]');
  assert.ok(scrollWidth<=clientWidth+1,`KAIR overflow at ${width}px: ${scrollWidth} > ${clientWidth}`);
  await click('#ka-logic-tab-protection');
  await wait(`!document.querySelector('#ka-logic-protection').hidden`);
  await click('#ka-case-category-tab-service');
  await click('#ka-scenario-tab-13');
  await wait(`!document.querySelector('#ka-scenario-13').hidden&&document.querySelector('#ka-scenario-13').textContent.includes('Две ветки работают поочерёдно')`);
  await click('#ka-process-tab-washing');
  assert.equal(await evaluate(`document.querySelectorAll('.ka-water-circuits li').length`),4);
  await click('[data-kair-compact] [data-kair-next]');
  await wait(`document.querySelector('[data-kair-compact] [data-kair-counter]').textContent==='2 из 7'`);
  await click('#kair-contact [data-project-request]');
  await wait(`document.querySelector('#project-request[open] [data-request-submit]:disabled')`);
  await click('#project-request [data-request-close]');
 }
 assert.deepEqual(errors,[],'Published KAIR stage two console errors');
 console.log(`::notice title=Published KAIR stage two verified::Eight revised sections, 4 logic modes, 24 cases, 29 functions, 7 screens, technical gallery, historical bookmark and request dialog passed in Chrome at 390 and 1440 px. ${base}/automation/`);
}finally{
 socket?.close();
 chrome.kill('SIGTERM');
 await chromeClosed;
 await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
