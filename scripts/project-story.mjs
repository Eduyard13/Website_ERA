import {kairMonitor} from './kair.mjs';
import {feedstockTypes} from '../content/feedstock.mjs';
import {presentationStages, presentationOutputs} from '../content/presentation.mjs';
import {preparationExplainer,contaminantMatrix,processRoute,technicalPreparation} from './presentation-web.mjs';

const arrow = '<span aria-hidden="true">↗</span>';
const action = (text, href, secondary=false) => `<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const image = (file, alt, extra='') => `<img src="/assets/presentation/${file}.webp" alt="${alt}" loading="lazy" ${extra}>`;

export function projectHero(){
 return `<section class="pitch-hero era-indigo-surface" aria-labelledby="pitch-title">
      <div class="pitch-hero-inner">
        <div class="pitch-hero-copy">
          <p class="pitch-kicker"><span></span>ЭКОЛОГИЯ · РЕЦИКЛИНГ · АВТОМАТИЗАЦИЯ</p>
          <h1 id="pitch-title">Из загрязнённой плёнки —<br><em>в новое сырьё.</em></h1>
          <p class="pitch-hero-lead">Технология ЭРА для переработки бытовых полиэтиленовых пакетов и плёнок с высоким уровнем загрязнения.</p>
          <div class="actions">${action('Обсудить мой проект','#discuss')}${action('Как это работает','/technology#solution',true)}</div>
          <a class="pitch-scroll" href="/technology#raw-material"><span aria-hidden="true">↓</span>Знакомство с технологией</a>
        </div>
        <figure class="pitch-hero-photo">
          <img src="/assets/presentation/complex.webp" srcset="/assets/presentation/complex-480.webp 480w, /assets/presentation/complex-880.webp 880w, /assets/presentation/complex.webp 1280w" sizes="(max-width:767px) 100vw, 60vw" width="1280" height="720" alt="Оборудование комплекса ЭРА на производственном участке" fetchpriority="high">
          <figcaption><span class="photo-mark">ЭРА / ПРОМЫШЛЕННАЯ ПЕРЕРАБОТКА</span><span>Оборудование комплекса ЭРА</span></figcaption>
        </figure>
      </div>
    </section>`;
}

export function rawMaterialsStory(){
 return `<section class="story-section raw-story" id="raw-material" aria-labelledby="raw-title">
      <figure class="raw-photo">
        <img src="/assets/presentation/raw-film.webp" srcset="/assets/presentation/raw-film-480.webp 480w, /assets/presentation/raw-film.webp 880w" sizes="(max-width:767px) calc(100vw - 40px), 40vw" alt="Спрессованное загрязнённое плёночное сырьё" width="880" height="1157" loading="lazy">
        <figcaption><span>С НОВОГО ВЗГЛЯДА НА СЫРЬЁ</span><strong>Перерабатывайте то, что остаётся невостребованным.</strong></figcaption>
      </figure>
      <div class="raw-copy">
        <p class="eyebrow">01 / СЫРЬЁ, С КОТОРОГО ВСЁ НАЧИНАЕТСЯ</p>
        <h2 id="raw-title">За невостребованными отходами стоит ценный материал.</h2>
        <p class="story-lead">Бытовой пакет после использования — это полиэтилен, смешанный с остатками того, что его окружало.</p>
        <p>Пакеты и плёнки слипаются, удерживают органику, минеральные частицы и посторонние предметы. Подготовка должна раскрыть материал, высвободить включения и последовательно отделить их от полезной фракции.</p>
        <h3 class="raw-materials-title">С каким сырьём работаем</h3>
        <ul class="raw-materials-list">${feedstockTypes.map(t=>`<li>${t}</li>`).join('')}</ul>
        <p class="raw-feed-note">Полимерный состав и загрязнения определяют комплектацию и режимы переработки.</p>
      </div>
      ${preparationExplainer()}
      ${contaminantMatrix()}
      <div class="story-insight raw-result"><span aria-hidden="true">→</span><p>Полный цикл ЭРА объединяет сухую сепарацию, горячую мойку, сушку и гранулирование в последовательный процесс — от невостребованного сырья к <strong>высококачественному грануляту.</strong></p></div>
    </section>`;
}

export function stageOverview(){return processRoute(presentationStages);}

export function processSlogan(){
 return `<section class="story-slogan era-indigo-surface" aria-label="Наш подход"><p>Полный цикл переработки плёнки:<br><strong>очистить, переработать, использовать снова.</strong></p><span aria-hidden="true">↻</span></section>`;
}

export function outputsStory(){
 return `<section class="story-section output-story" aria-labelledby="output-title">
      <div class="story-heading"><div><p class="eyebrow">03 / РЕЗУЛЬТАТ ПЕРЕРАБОТКИ</p><h2 id="output-title">Материал возвращается<br>в производственный оборот.</h2></div><p>От очищенной плёнки до ПЭ-гранулы —<br>в зависимости от конечной задачи.</p></div>
      <div class="output-grid">${presentationOutputs.map((source,i)=>{const o={...source,...[{title:'Очищенная плёночная фракция',description:'Материал после подготовки на соответствующей стадии.'},{title:'Материал после капсулятора',description:'Уплотнённый и обезвоженный промежуточный материал для дальнейшей переработки.'},{title:'Вторичная ПЭ-гранула',description:'Товарный продукт после стадии грануляции.'}][i]};return `<figure><div class="output-image">${image(o.image,o.title)}<span>0${i+1}</span></div><figcaption><h3>${o.title}</h3><p>${o.description}</p></figcaption></figure>`;}).join('')}</div>
      <p class="story-note">Фотографии показывают формы материала на разных стадиях, а не сравнение одной партии до и после. Применение вторичного материала определяется его составом и показателями качества.</p><a class="text-link" href="/#solution">Продукция и направления применения ${arrow}</a>
    </section>`;
}

export function controlStory(){
 return `<section class="story-section control-story era-indigo-surface" aria-labelledby="control-title">
      <div class="control-copy"><p class="eyebrow">04 / УПРАВЛЕНИЕ ПРОЦЕССОМ</p><h2 id="control-title">Оборудование связано.<br>Процесс под контролем.</h2><p class="story-lead">КАИР — система управления технологическим комплексом ЭРА. Состояние узлов, режимы работы и движение материала — в едином интерфейсе.</p><div class="web-kair-scenarios"><div><h3>Нагрузка и состояние узлов</h3><p>Оператор видит контролируемые параметры и сигналы. Защитные реакции задаются предусмотренными алгоритмами.</p></div><div><h3>Согласование подачи</h3><p>Пуск, остановка и движение материала увязываются в пределах подключённого оборудования.</p></div><div><h3>Режимы работы</h3><p>Настройки под материал и контроль процесса помогают воспроизводить согласованные условия обработки.</p></div></div>${action('Возможности КАИР','/automation',true)}</div>
      ${kairMonitor()}
    </section>`;
}

export function launchStory(){return technicalPreparation();}

export function detailStory(){
 return `<section class="story-section detail-story" aria-labelledby="detail-title">
      <div class="story-heading"><div><p class="eyebrow">06 / СЛЕДУЮЩИЙ УРОВЕНЬ ПОДРОБНОСТИ</p><h2 id="detail-title">Посмотреть решение ближе.</h2></div><p>Выберите, с чего продолжить знакомство.</p></div>
      <div class="detail-doors">${[['Сравнить варианты запуска','Очищенная плёнка в тюках или полный цикл с выпуском ПЭ-гранулы.','/#solution','01'],['Линии и комплектации','Структура решений по сепарации и мойке плёнки.','/catalog/lines','02'],['Каталог оборудования','Отдельные узлы, их назначение и доступные характеристики.','/catalog/equipment','03']].map(([t,d,h,n])=>`<a href="${h}"><span class="door-number">${n} /</span><h3>${t}</h3><p>${d}</p><span class="door-action">Перейти в раздел ${arrow}</span></a>`).join('')}</div>
    </section>`;
}

export function projectContactStory(){
 return `<section class="story-section discuss-story" id="discuss" aria-labelledby="discuss-title"><div><p class="eyebrow">ВАШ ПРОЕКТ НАЧИНАЕТСЯ С РАЗГОВОРА</p><h2 id="discuss-title">Покажите ваше сырьё —<br>подберём последовательность подготовки.</h2><p>Расскажите о материале, загрязнениях и нужном результате. Можно приложить фотографии или видео — это поможет предметно обсудить технологию.</p></div><div class="discuss-actions">${action('Написать о проекте','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Технология ЭРА: сырьё, загрязнения и комплектация'))}<a class="discuss-phone" href="tel:+79032813535">+7 903 281-35-35</a><a class="discuss-email" href="mailto:edkom.office@mail.ru">edkom.office@mail.ru</a><p>В форме можно оставить контакты и приложить материалы.</p><a class="text-link" href="/contacts">Все контакты ${arrow}</a></div></section>`;
}
