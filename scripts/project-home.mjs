import {resourceHero,resourceChallenges,resourceFeedstocks,resourceStages,resourceStrengths,resourceProducts,resourceLaunch,legacyFinancialAnchors} from '../content/project-home.mjs';
import {marketModel,marketRegions,marketTotals,marketMoney,marketNumber} from '../content/home-market.mjs';
import {lines} from '../content/catalog.mjs';
import {equipmentCardImages} from '../content/equipment-card-images.mjs';
import {economicsConfig} from '../public/economics-config.js';
import {calculateEconomics,initialEconomicsState} from '../public/economics-model.js';
import {projectMedia as media} from './project-media.mjs';
import {projectRequestHref} from './contact.mjs';
import {escapeContact as esc} from './contact-channels.mjs';
import {imageSize} from './image-size.mjs';
import {lineCoverFiles} from './line-page-media.mjs';
import {homeMarketMap} from './home-market.mjs';

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
    <p class="resource-hero-lead">${esc(resourceHero.lead)}</p>
    <div class="resource-hero-actions">
     ${link('Изучить технологию','/technology','button resource-primary')}
     ${request('Связаться с нами','Проект переработки плёночного сырья','button secondary')}
    </div>
    ${link('Смотреть оборудование','/catalog')}
   </div>
   ${image(graphic,{slot:'heroHook',eager:true,sizes:'(max-width:767px) calc(100vw - 18px), (max-width:1023px) 740px, (max-width:1440px) 55vw, 750px'})}
  </div>
 </section>`;
}

function problem(){
 return `<section class="resource-section resource-problem" id="raw-material" aria-labelledby="resource-problem-title" data-home-block="problem">
  <div class="resource-container">
   <div class="resource-problem-intro">
    ${heading('resource-problem-title','Плёнка — одна из самых сложных фракций отходов.',{lead:'Загрязнения удерживаются в складках и на поверхности. Стоимость подготовки и доступность сбыта зависят от того, насколько последовательно их отделяют.'})}
    <div class="resource-trial"><strong>до 80%</strong><span>засорённость сырья в испытаниях</span><small>Режим и выпуск подбирают по конкретной партии.</small></div>
   </div>
   <div class="resource-challenges">${resourceChallenges.map(item=>`<article><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div>
   ${link('Как удаляют загрязнения','/technology#raw-material')}
  </div>
 </section>`;
}

function feedstocks(){
 return `<section class="resource-section resource-feedstocks" id="feedstocks" aria-labelledby="resource-feedstocks-title" data-home-block="feedstocks" data-page-progress-label="Виды сырья">
  <div class="resource-container">
   ${heading('resource-feedstocks-title','Что мы перерабатываем')}
   <div class="resource-material-grid">${resourceFeedstocks.map(item=>`<figure data-home-feedstock="${item.id}">${galleryImage(item)}<figcaption>${esc(item.title)}</figcaption></figure>`).join('')}</div>
   <p class="resource-note">Иллюстрации сырьевых групп. Состав биг-бэгов и совместимость полимеров проверяют для каждой партии.</p>
  </div>
 </section>`;
}

function process(){
 return `<section class="resource-section resource-process" id="process" aria-labelledby="resource-process-title" data-home-block="process">
  <div class="resource-container">
   ${heading('resource-process-title','Технология превращает сложную плёнку в товарный продукт.')}
   <ol class="resource-steps">${resourceStages.map((stage,index)=>`<li data-process-step="0${index+1}"><span aria-hidden="true">0${index+1}</span><h3>${esc(stage.title)}</h3><p>${esc(stage.text)}</p>${link('Открыть этап','/technology#'+stage.id)}</li>`).join('')}</ol>
   <div class="resource-links">
    ${link('Подробнее о технологии','/technology')}
    ${link('Линии сухой сепарации',dryCatalogue)}
    ${link('Линия горячей мойки',washLine.path)}
   </div>
  </div>
 </section>`;
}

function strengths(){
 return `<section class="resource-section resource-strengths era-indigo-surface" id="engineering" aria-labelledby="resource-strengths-title" data-home-block="strengths" data-page-progress-label="Принципы ЭРА">
  <div class="resource-container">
   ${heading('resource-strengths-title','Инженерная логика ЭРА',{lead:'Состав сырья, последовательность очистки и требования к продукту определяют комплектацию.'})}
   <div class="resource-strength-grid">${resourceStrengths.map(item=>`<article><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`).join('')}</div>
  </div>
 </section>`;
}

function products(){
 return `<section class="resource-section resource-products" id="products" aria-labelledby="resource-products-title" data-home-block="products">
  <div class="resource-container">
   ${heading('resource-products-title','От отходов — к новым продуктам',{lead:'Очищенная плёнка, капсулят и гранула дают разные возможности для сбыта и дальнейшей переработки.'})}
   <div class="resource-products-grid">${resourceProducts.map(item=>`<article data-home-product="${item.id}">
    <figure>${galleryImage(item)}</figure><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>
   </article>`).join('')}</div>
   <p class="resource-note">Иллюстрации форм материала и возможных направлений применения.</p>
   ${link('Подробнее о технологических маршрутах','/technology#products')}
  </div>
 </section>`;
}

function economics(){
 const one=calculateEconomics(initialEconomicsState('full'));
 const region=marketRegions.find(row=>row.id==='moscow-oblast');
 return `<section class="resource-section resource-business" id="economics" aria-labelledby="resource-business-title" data-home-block="business">
  <div class="resource-container">
   <div class="resource-fragments" aria-hidden="true">${legacyFinancialAnchors.map(id=>`<span id="${id}"></span>`).join('')}</div>
   ${heading('resource-business-title','Экономика, которая масштабируется',{lead:'Результат предприятия зависит от загрузки, затрат и сбыта. Оценка сырьевой базы помогает наметить масштаб сети.'})}
   <div class="resource-finance-grid">
    <article data-home-economics="complex">
     <h3>Один комплекс</h3>
     <strong>${marketMoney(one.net)}</strong>
     <p>расчётная чистая прибыль за ${economicsConfig.monthDays} день</p>
     <p>Базовый сценарий полного цикла. ${marketNumber(one.capacity)} т сырья и ${marketNumber(one.output)} т гранулы при цене ${marketNumber(one.grossPrice/1000)} ₽/кг с НДС.</p>
    </article>
    <article data-home-economics="region">
     <h3>Региональная сеть</h3>
     <strong>${marketNumber(region.complexes)} <small>комплексов</small></strong>
     <p>ориентир для Московской области</p>
     <p>${marketNumber(region.tonnes)} т плёночного сырья в год. ${marketMoney(region.monthly)} в месяц по оценочной модели карты.</p>
    </article>
    <article data-home-economics="country">
     <h3>Потенциал по России</h3>
     <strong>${marketNumber(marketTotals.tonnes/1_000_000)} <small>млн т/год</small></strong>
     <p>оценка плёночного сырья в восьми округах</p>
     <p>${marketTotals.complexes} условных комплексов. ${marketMoney(marketTotals.monthly)} в месяц по сценарию карты.</p>
    </article>
   </div>
   <p class="resource-note">Регион и Россия рассчитаны при условной ёмкости ${marketNumber(marketModel.moduleTonnes)} т/год и сценарии ${marketMoney(marketModel.targetMonthlyProfit)} чистой прибыли в месяц на условный комплекс.</p>
   <a class="button" href="/economics" data-economics-page>Подробнее об экономике проекта ${arrow}</a>
  </div>
 </section>`;
}

function integration(){
 return `<section class="resource-section resource-integration" id="solution" aria-labelledby="resource-integration-title" data-home-block="integration" data-page-progress-label="Поэтапный запуск">
  <div class="resource-container">
   <div id="about-era">${heading('resource-integration-title','Можно начать с одного этапа и вырасти в полный цикл',{lead:'Подбираем комплектацию под сырьё и площадку. Изготавливаем и поставляем оборудование, согласовываем запуск и сопровождение.'})}</div>
   <ol class="resource-launch-grid">${resourceLaunch.map((step,index)=>`<li><span aria-hidden="true">0${index+1}</span><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></li>`).join('')}</ol>
   ${request('Подобрать комплектацию','Поэтапный запуск переработки плёнки','resource-link')}
  </div>
 </section>`;
}

function equipment(){
 const rotor=equipmentCardImages['rotornyy-raspushitel'];
 return `<section class="resource-section resource-equipment" id="manufacturing" aria-labelledby="resource-evidence-title" data-home-block="equipment" data-page-progress-label="Оборудование">
  <div class="resource-container">
   ${heading('resource-evidence-title','Оборудование для сложного плёночного сырья',{lead:'Выберите готовую линию или узлы для своей производственной площадки.'})}
   <div class="resource-equipment-grid">
    <article>
     <a class="resource-equipment-image" href="${dryCatalogue}" aria-label="Линии сухой сепарации">${image(media.lineWide,{slot:'lineWide'})}</a>
     <div><h3>Линии сухой сепарации</h3><p>Три комплектации под очистку, сортировку и сушку.</p>
     <div class="resource-line-links">${dryLines.map(line=>link('Сепарация '+line.number,line.path)).join('')}</div></div>
    </article>
    <article>
     <a class="resource-equipment-image" href="${washLine.path}" aria-label="Линия горячей мойки">${lineImage(washLine)}</a>
     <div><h3>Линия горячей мойки</h3><p>Глубокая очистка, обезвоживание и выбор товарного выхода.</p>
     ${link('Смотреть линию',washLine.path)}</div>
    </article>
    <article>
     <a class="resource-equipment-image" href="/catalog/equipment" aria-label="Отдельные узлы">${image(responsiveImage(rotor.file,rotor.smallFile,'Каталожный рендер роторного распушителя ЭРА'))}</a>
     <div><h3>Отдельные узлы</h3><p>Измельчение, разделение, распушение, мойка и обезвоживание.</p>
     ${link('Смотреть узлы','/catalog/equipment')}</div>
    </article>
   </div>
   ${link('Перейти в каталог оборудования','/catalog','button')}
   <details class="resource-video-details" data-keep-open>
    <summary>Видео проекта и работа оборудования</summary>
    <div class="resource-video-grid">${resourceVideo('promo')}${resourceVideo('cleaningDemo')}</div>
   </details>
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
