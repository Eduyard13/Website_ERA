import {resourceHero,resourceChallenges,resourceFeedstocks,resourceStages,resourceStrengths,resourceProducts,resourceLaunch,legacyFinancialAnchors} from '../content/project-home.mjs';
import {marketDistricts,marketModel,marketNational,marketNationalTonnes,marketMoney,marketNumber} from '../content/home-market.mjs';
import {lines} from '../content/catalog.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {projectMedia as media} from './project-media.mjs';
import {projectRequestHref} from './contact.mjs';
import {escapeContact as esc} from './contact-channels.mjs';
import {imageSize} from './image-size.mjs';
import {lineCoverFiles} from './line-page-media.mjs';
import {homeMarketMap,marketDistrictContour} from './home-market.mjs';
import {homeFeedstockEstimate} from './home-feedstocks.mjs';

const arrow='<span aria-hidden="true">↗</span>';
const asset=file=>'/assets/'+file;
const posterAsset=m=>asset(m.file)+(m.assetVersion?'?v='+m.assetVersion:'');
const link=(label,href,classes='resource-link')=>`<a class="${classes}" href="${esc(href)}">${esc(label)} ${arrow}</a>`;
const request=(label,topic,classes='button resource-primary')=>link(label,projectRequestHref(topic),classes);
const sizesGrid='(max-width:539px) calc(100vw - 40px), (max-width:999px) 46vw, 340px';
const dims=file=>imageSize(new URL('../public/assets/'+file,import.meta.url));

const dryGroup='Сепарация';
const dryLines=lines.filter(line=>line.enabled&&line.group===dryGroup);
const washLine=lines.find(line=>line.enabled&&line.slug==='moyka-plenki');
const dryCatalogue='/catalog/lines?group='+encodeURIComponent(dryGroup);

function image(m,{eager=false,sizes=sizesGrid,slot=''}={}){
 const {file,alt,width,height}=m;
 const variants=m.variants?.length?` srcset="${m.variants.map(v=>asset(v.file)+' '+v.width+'w').join(', ')}" sizes="${sizes}"`:'';
 return `<img src="${asset(file)}"${variants} width="${width}" height="${height}" alt="${esc(alt)}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async"${slot?` data-media-slot="${slot}"`:''}>`;
}

function responsiveImage(file,small,alt){
 const {width,height}=dims(file);
 const variants=[{file:small,width:dims(small).width},{file,width}];
 return {file,alt,width,height,variants};
}

function galleryImage(item){
 const baseFile='project-home/market/'+item.file;
 return image(responsiveImage(baseFile+'.webp',baseFile+'-560.webp',item.alt));
}

function lineImage(line){
 const {file,smallFile}=lineCoverFiles(line);
 return image(responsiveImage(file,smallFile,line.cardImageAlt||line.title));
}

function heading(id,title,{kicker='',lead=''}={}){
 return `<header class="resource-heading">
  ${kicker?`<p class="eyebrow">${esc(kicker)}</p>`:''}<h2 id="${id}">${esc(title)}</h2>
  ${lead?`<p>${esc(lead)}</p>`:''}
 </header>`;
}

export function resourceVideo(id,registry=media){
 const m=registry[id],poster=registry[m.posterSlot];
 return `<div class="resource-video${m.file?'':' resource-video--poster'}" data-video-slot="${id}">
  ${m.file?`<video controls playsinline preload="none" poster="${posterAsset(poster)}" aria-label="${esc(m.label)}"><source src="${asset(m.file)}" type="video/mp4">${m.webm?`<source src="${asset(m.webm)}" type="video/webm">`:''}${m.captions?`<track kind="captions" src="${asset(m.captions)}" srclang="ru" label="Русские субтитры">`:''}Ваш браузер не поддерживает видео. ${link('Открыть видео',asset(m.file))}</video>
   ${id==='promo'?'<button class="resource-video-play" type="button" data-resource-play aria-label="Воспроизвести видео о технологии ЭРА" hidden><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M14 9 32 20 14 31Z" fill="currentColor"/></svg></button>':''}`:
   image(poster,{slot:m.posterSlot})}
  <p class="resource-video-operation">${esc(m.label)}</p>
 </div>`;
}

export function resourceHeroSection(){
 const {opening,turn,accent}=resourceHero.title;
 const graphic=responsiveImage('project-home/hero/polymers-cycle.webp','project-home/hero/polymers-cycle-800.webp','Иллюстрация цикла полимеров с использованными плёнками, гранулами, новыми изделиями и жидкими фракциями');
 return `<section class="resource-hero era-indigo-surface" id="resource" aria-labelledby="resource-title" data-home-block="hero">
  <div class="resource-container resource-hero-grid">
   <div class="resource-hero-copy">
    <p class="eyebrow">${esc(resourceHero.kicker)}</p>
    <h1 id="resource-title"><span>${esc(opening)}</span> <span>${esc(turn)} <em>${esc(accent)}</em></span></h1>
    <p class="resource-hero-subtitle">${esc(resourceHero.subtitle)}</p>
    <p class="resource-hero-lead"><strong class="resource-hero-claim">ЭРА разработала, успешно испытала и ввела в промышленную эксплуатацию</strong> технологию и оборудование для переработки загрязнённых плёночных отходов.</p><p class="resource-hero-result">${esc(resourceHero.result)}</p>
    <div class="resource-hero-actions">
     ${link('Изучить технологию','/technology','button resource-primary')}
     ${request('Связаться с нами','Проект переработки плёночного сырья','button secondary')}
    </div>
    ${link('Смотреть оборудование','/catalog')}
   </div>
   ${image(graphic,{slot:'heroHook',eager:true,sizes:'(max-width:810px) 100vw, (max-width:1023px) 810px, (max-width:1800px) 60vw, 1080px'})}
  </div>
 </section>`;
}

function problem(){
 const card=item=>`<article><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`;
 return `<section class="resource-section resource-problem" id="raw-material" aria-labelledby="resource-problem-title" data-home-block="problem">
  <div class="resource-container">
   <div class="resource-problem-intro">
    ${heading('resource-problem-title','Трудноочищаемые плёночные отходы сегодня почти не перерабатываются.',{lead:'Загрязнения удерживаются в складках и на поверхности, а слипшиеся слои затрудняют доступ к включениям. Именно поэтому такие отходы в большинстве случаев остаются невостребованными — несмотря на большой объём и низкую стоимость сырья.'})}
    <aside class="resource-trial"><p class="resource-trial-kicker">ПОДТВЕРЖДЕНО ИСПЫТАНИЯМИ</p>
     <div class="resource-trial-values"><div><strong>до 80%</strong><span>засорённость сырья</span></div><div><strong>до 30%</strong><span>входящая влажность</span></div></div>
     <small>Режим работы и выпуск подбирают под конкретную партию сырья.</small></aside>
   </div>
   <div class="resource-challenge-comparison">
    <section class="resource-challenge-group"><p class="eyebrow">ПРОБЛЕМА</p><h3>Почему это проблемное сырьё</h3><div class="resource-challenges">${resourceChallenges.filter(x=>x.group==='problem').map(card).join('')}</div></section>
    <section class="resource-challenge-group resource-challenge-group--potential"><p class="eyebrow">ПОТЕНЦИАЛ</p><h3>Почему это ценное сырьё для бизнеса</h3><div class="resource-challenges">${resourceChallenges.filter(x=>x.group==='potential').map(card).join('')}</div></section>
   </div>
   ${link('Как работает технология ЭРА','/technology')}
  </div>
 </section>`;
}
function feedstocks(){
 return `<section class="resource-section resource-feedstocks" id="feedstocks" aria-labelledby="resource-feedstocks-title" data-home-block="feedstocks" data-page-progress-label="Виды сырья">
  <div class="resource-container">
   ${heading('resource-feedstocks-title','Что мы перерабатываем')}
   <div class="resource-material-grid">${resourceFeedstocks.map(item=>`<figure data-home-feedstock="${item.id}">${galleryImage(item)}<figcaption>${esc(item.title)}</figcaption></figure>`).join('')}</div>
   <p class="resource-note">Иллюстрации сырьевых групп. Состав биг-бэгов и совместимость полимеров проверяют для каждой партии.</p>
   ${homeFeedstockEstimate()}
  </div>
 </section>`;
}

function process(){
 const icons=[
  '<svg viewBox="0 0 84 76" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 41h70l-7 17H14L7 41Zm7-17h56v17H14zM22 17l16-9 27 11-18 10zM20 41V24m28 17V29M5 61h74M16 61v7m52-7v7"/><path d="M26 29l10-8m3 9 8-8M24 50h38" stroke-opacity=".6"/></g></svg>',
  '<svg viewBox="0 0 84 76" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M8 34h68v24H8zM20 34V18h18v16m9 0V11h18v23M14 44c10-7 18 7 28 0s18 7 28 0M14 52c10-7 18 7 28 0s18 7 28 0M7 62h70M22 62v7m40-7v7"/><circle cx="56" cy="24" r="5"/></g></svg>',
  '<svg viewBox="0 0 84 76" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 23h60v32H12zM18 15h48v8H18zM25 55v9m34-9v9M10 64h64"/><path d="M20 35c10 0 10-8 20-8s10 8 20 8 10-8 14-8M19 44l7-4 7 4 7-4 7 4 7-4 7 4" stroke-opacity=".65"/><circle cx="43" cy="48" r="3"/></g></svg>'
 ];
 return `<section class="resource-section resource-process" id="process" aria-labelledby="resource-process-title" data-home-block="process"><div class="resource-container">
   ${heading('resource-process-title','Технология преобразует трудноочищаемую плёнку в готовую продукцию.')}
   <ol class="resource-steps">${resourceStages.map((stage,index)=>`<li data-process-step="0${index+1}"><span class="resource-step-phase">0${index+1} / ${['ПОДГОТОВКА','ОЧИСТКА','РЕЗУЛЬТАТ'][index]}</span><div class="resource-step-art">${icons[index]}</div><h3>${esc(stage.title)}</h3><p>${esc(stage.text)}</p></li>`).join('')}</ol>
   <div class="resource-links">${link('Изучить технологию ЭРА','/technology')}${link('Линии сухой сепарации',dryCatalogue)}${link('Линия горячей мойки',washLine.path)}</div>
  </div></section>`;
}
function strengths(){
 return `<section class="resource-section resource-strengths era-indigo-surface" id="engineering" aria-labelledby="resource-strengths-title" data-home-block="strengths" data-page-progress-label="Принципы ЭРА">
  <div class="resource-container">${heading('resource-strengths-title','Инженерная логика ЭРА',{lead:'От трудноочищаемого сырья до готового продукта — каждый этап технологии подчинён результату.'})}
   <div class="resource-strength-grid">${resourceStrengths.map((item,index)=>`<article><span class="resource-strength-number">0${index+1}</span><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div>
  </div></section>`;
}
function products(){
 return `<section class="resource-section resource-products" id="products" aria-labelledby="resource-products-title" data-home-block="products">
  <div class="resource-container">
   ${heading('resource-products-title','От отходов — к новым продуктам',{lead:'Очищенная плёнка, капсулят и гранула дают разные возможности для сбыта и дальнейшей переработки.'})}
   <div class="resource-products-grid">${resourceProducts.map(item=>`<article data-home-product="${item.id}">
    <figure>${galleryImage(item)}</figure><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>
   </article>`).join('')}</div>
   <p class="resource-note">Иллюстрации форм материала и возможных направлений применения.</p>
   
  </div>
 </section>`;
}

function districtEconomics(id,title,description,{rounded=false}={}){
 const row=marketDistricts.find(district=>district.id===id);
 const prefix=rounded?'≈ ':'';
 const tonnes=prefix+marketNumber(row.tonnes/1_000_000,rounded?0:2);
 const monthly=prefix+marketMoney(row.monthly,rounded?0:2);
 return `<article class="resource-district-card" data-home-economics="${id}">
  ${marketDistrictContour(id)}
  <div class="resource-district-content">
   <h4>${esc(title)}</h4>
   <strong class="resource-finance-value" data-finance-annual>${marketNumber(row.annual/1_000_000_000,1)} <small>млрд ₽/год</small></strong>
   <p class="resource-district-label">Целевая чистая прибыль</p>
   <dl>
    <div><dt>Масштаб сети</dt><dd data-finance-complexes>${marketNumber(row.complexes)} комплексов</dd></div>
    <div><dt>Сырьевая база</dt><dd>${tonnes} млн т/год</dd></div>
    <div><dt>Чистая прибыль в месяц</dt><dd>${monthly}</dd></div>
   </dl>
   <p>${esc(description)}</p>
   <a class="resource-link" href="#russia-market" data-market-district-link="${id}" aria-label="Посмотреть на карте · ${esc(title)}">Посмотреть на карте ${arrow}</a>
  </div>
 </article>`;
}

function economics(){
 return `<section class="resource-section resource-business" id="economics" aria-labelledby="resource-business-title" data-home-block="business">
  <div class="resource-container">
   <div class="resource-fragments" aria-hidden="true">${legacyFinancialAnchors.map(id=>`<span id="${id}"></span>`).join('')}</div>
   ${heading('resource-business-title','Экономика, которая масштабируется',{lead:'От одного предприятия до промышленной сети федерального масштаба.'})}
   <div class="resource-finance-grid">
    <article data-home-economics="profit">
     <h3>Совокупная чистая прибыль</h3>
     <strong class="resource-finance-value" data-finance-annual>${marketNumber(marketNational.annual/1_000_000_000,1)} <small>млрд ₽/год</small></strong>
     <p>Около ${marketMoney(marketNational.monthly,0)} в месяц</p>
     <p>Целевой сценарий после расходов и налогов</p>
    </article>
    <article data-home-economics="network">
     <h3>Промышленная сеть</h3>
     <strong class="resource-finance-value" data-finance-complexes>${marketNumber(marketNational.complexes)} <small>комплексов</small></strong>
     <p>Расчётный масштаб сети по России</p>
    </article>
    <article data-home-economics="feedstocks">
     <h3>Сырьевая база России</h3>
     <strong class="resource-finance-value">≈ ${marketNationalTonnes} <small>млн т/год</small></strong>
     <p>Оценка образования плёночных отходов и мягкой тары по восьми округам</p>
    </article>
   </div>
   <h3 class="resource-district-title">Приоритетные территории</h3>
   <div class="resource-district-grid">
    ${districtEconomics('central','Центральный федеральный округ','Высокая концентрация населения, торговли, логистики и строительного сектора.')}
    ${districtEconomics('volga','Приволжский федеральный округ','Развитое сельское хозяйство и промышленность. Татарстан, Башкортостан, Самарская область.',{rounded:true})}
   </div>
   <p class="resource-note resource-finance-note">Инвестиционный сценарий при целевой чистой прибыли ${marketMoney(marketModel.targetMonthlyProfit)} в месяц на один условный комплекс, после предусмотренных операционных расходов, амортизации и налога на прибыль. Годовой сценарий предполагает ${marketModel.monthsPerYear} месяцев стабильной работы. Фактический результат зависит от сырья, загрузки, себестоимости, условий площадки и сбыта.</p>
   <a class="button" href="/economics" data-economics-page>Подробнее об экономике проекта ${arrow}</a>
  </div>
 </section>`;
}

function integration(){
 return `<section class="resource-section resource-integration" id="solution" aria-labelledby="resource-integration-title" data-home-block="integration" data-page-progress-label="Поэтапный запуск">
  <div class="resource-container">
   <div id="about-era">${heading('resource-integration-title','Начните с малого. Масштабируйтесь до полного цикла.',{lead:'Не обязательно инвестировать во весь комплекс сразу. Начните с базовой сухой сепарации и расширяйте производство по мере развития бизнеса — добавляя горячую мойку и гранулирование.'})}</div>
   <ol class="resource-launch-grid">${resourceLaunch.map((step,index)=>`<li><div class="resource-launch-top"><span class="resource-launch-phase">${step.phase}</span><strong class="resource-launch-index">0${index+1}</strong></div><div class="resource-module-progress" aria-hidden="true">${[1,2,3].map(n=>`<span class="${n<=index+1?'active':''}"></span>`).join('')}</div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></li>`).join('')}</ol>
   <div class="resource-launch-conclusion"><h3>Инвестируйте в развитие, а не во всё оборудование сразу.</h3><p><em>Проектируем комплектацию с учётом дальнейшего расширения производства.</em></p></div>
  </div>
 </section>`;
}

function equipment(){
 const modules=responsiveImage('covers/catalog-nodes-close.webp','covers/catalog-nodes-close-768.webp','Три технологических узла ЭРА на выставочных пьедесталах');
 const dry=lines.find(line=>line.slug==='separatsiya-02');
 return `<section class="resource-section resource-equipment" id="manufacturing" aria-labelledby="resource-evidence-title" data-home-block="equipment" data-page-progress-label="Оборудование">
  <div class="resource-container">
   ${heading('resource-evidence-title','Технология ЭРА. Воплощённая в оборудовании.',{lead:'Три комплектации сухой сепарации, линия горячей мойки и отдельные технологические узлы — готовые решения под задачи вашего производства.'})}
   <div class="resource-equipment-grid">
    <article><a class="resource-equipment-image" href="${dryCatalogue}" aria-label="Линии сухой сепарации">${lineImage(dry)}</a><div><p class="resource-equipment-kicker">01 / ПОДГОТОВКА СЫРЬЯ</p><h3>Линии сухой сепарации</h3><p>Три комплектации для очистки, сортировки и сушки загрязнённых плёночных отходов.</p><div class="resource-line-links">${dryLines.map(line=>link(line.tier,line.path)).join('')}</div></div></article>
    <article><a class="resource-equipment-image" href="${washLine.path}" aria-label="Линия горячей мойки">${lineImage(washLine)}</a><div><p class="resource-equipment-kicker">02 / ГЛУБОКАЯ ОЧИСТКА</p><h3>Линия горячей мойки</h3><p>Удаление стойких загрязнений, обезвоживание и подготовка плёнки к дальнейшей переработке.</p>${link('Изучить линию',washLine.path)}</div></article>
    <article><a class="resource-equipment-image" href="/catalog/equipment" aria-label="Отдельные узлы">${image(modules)}</a><div><p class="resource-equipment-kicker">03 / ТЕХНОЛОГИЧЕСКИЕ УЗЛЫ</p><h3>Отдельные узлы</h3><p>Оборудование для измельчения, разделения, распушения, мойки и обезвоживания.</p>${link('Смотреть оборудование','/catalog/equipment')}</div></article>
   </div>
   <details class="resource-video-details" data-keep-open><summary>Видео проекта и работа оборудования</summary><div class="resource-video-grid">${resourceVideo('promo')}${resourceVideo('cleaningDemo')}</div></details>
  </div>
 </section>`;
}

function kair(){
 const source=media.kairScreen;
 return `<section class="resource-section resource-control era-indigo-surface" id="kair" aria-labelledby="resource-kair-title" data-home-block="kair" data-page-progress-label="Управление КАИР">
  <div class="resource-container resource-control-grid">
   <div>
    ${heading('resource-kair-title','КАИР — интеллект производства',{lead:'Система согласует работу узлов, сохраняет настройки под сырьё и даёт оператору контроль процесса. Удалённый мониторинг доступен в предусмотренном исполнении.'})}
    ${link('Подробнее о системе КАИР','/automation')}
   </div>
   <figure>
    ${image(responsiveImage(source.file,'kair/01-768.webp',source.alt),{slot:'kairScreen',sizes:'(max-width:899px) calc(100vw - 40px), 46vw'})}
    <figcaption>Общий экран линии и сигналы КАИР</figcaption>
   </figure>
  </div>
 </section>`;
}

function contact(){
 return `<section class="resource-section resource-contact" id="discuss" aria-labelledby="discuss-title" data-home-block="contact">
  <div class="resource-container resource-contact-panel">
   <div>
    ${heading('discuss-title','ЭРА превращает проблему отходов в промышленную возможность.',{lead:'Расскажите, с каким сырьём работаете, какой объём планируете перерабатывать и какой продукт хотите получать.'})}
    <div class="resource-contact-actions">
     ${request('Обсудить проект','Проект переработки плёночного сырья','button')}
     ${request('Запросить презентацию','Презентация технологии и оборудования ЭРА','button secondary')}
    </div>
   </div>
  </div>
 </section>`;
}

export function resourceHome(){
 return `<div class="story resource-page" data-resource-home>
  ${resourceHeroSection()}${problem()}${feedstocks()}${process()}${strengths()}${products()}
  ${homeMarketMap()}${economics()}${integration()}${equipment()}${kair()}${contact()}
 </div>`;
}
