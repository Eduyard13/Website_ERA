import {presentationStages, presentationOutputs, projectSteps} from '../content/presentation.mjs';

const arrow = '<span aria-hidden="true">↗</span>';
const action = (text, href, secondary=false) => `<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const image = (file, alt, extra='') => `<img src="/assets/presentation/${file}.webp" alt="${alt}" loading="lazy" ${extra}>`;
const mediaLink = (file, alt, caption) => `<figure><a href="/media">${image(file,alt)}<span class="photo-link">Смотреть медиатеку ${arrow}</span></a><figcaption>${caption}</figcaption></figure>`;

export function presentationHome() {
  return `<div class="story">
    <section class="pitch-hero" aria-labelledby="pitch-title">
      <div class="pitch-hero-inner">
        <div class="pitch-hero-copy">
          <p class="pitch-kicker"><span></span>ЭКОЛОГИЯ · РЕЦИКЛИНГ · АВТОМАТИЗАЦИЯ</p>
          <h1 id="pitch-title">Из загрязнённой плёнки —<br><em>в новое сырьё.</em></h1>
          <p class="pitch-hero-lead">Технология ERA для переработки бытовых полиэтиленовых пакетов и плёнок с высоким уровнем загрязнения.</p>
          <div class="actions">${action('Обсудить мой проект','#discuss')}${action('Как это работает','#solution',true)}</div>
          <a class="pitch-scroll" href="#raw-material"><span aria-hidden="true">↓</span>Знакомство с технологией</a>
        </div>
        <figure class="pitch-hero-photo">
          <img src="/assets/presentation/complex.webp" srcset="/assets/presentation/complex-480.webp 480w, /assets/presentation/complex-880.webp 880w, /assets/presentation/complex.webp 1280w" sizes="(max-width:767px) 100vw, 60vw" width="1280" height="720" alt="Оборудование комплекса ERA на производственном участке — фотография из презентации" fetchpriority="high">
          <figcaption><span class="photo-mark">ERA / ПРОМЫШЛЕННАЯ ПЕРЕРАБОТКА</span><span>Фото из презентации проекта</span></figcaption>
        </figure>
      </div>
      <nav class="pitch-stage-nav" aria-label="Три стадии переработки">
        ${presentationStages.map(s=>`<a href="/technology#${s.id}"><span class="stage-number">${s.number}</span><span>${s.title}</span>${arrow}</a>`).join('')}
      </nav>
    </section>

    <section class="story-section raw-story" id="raw-material" aria-labelledby="raw-title">
      <figure class="raw-photo">
        <img src="/assets/presentation/raw-film.webp" srcset="/assets/presentation/raw-film-480.webp 480w, /assets/presentation/raw-film.webp 880w" sizes="(max-width:767px) calc(100vw - 40px), 40vw" alt="Спрессованное загрязнённое плёночное сырьё из презентации ERA" width="880" height="1157" loading="lazy">
        <figcaption><span>С ЧЕГО НАЧИНАЕТСЯ ПРОЦЕСС</span>Полигонные пакеты и плёнки · фото из презентации</figcaption>
      </figure>
      <div class="raw-copy">
        <p class="eyebrow">01 / СЫРЬЁ, С КОТОРОГО ВСЁ НАЧИНАЕТСЯ</p>
        <h2 id="raw-title">За сложными отходами<br>стоит ценный материал.</h2>
        <p class="story-lead">Бытовой пакет после использования — это полиэтилен, смешанный с остатками того, что его окружало.</p>
        <p>Плёнка слипается, удерживает органику, песок и другие включения. Для дальнейшей переработки её нужно раскрыть и последовательно очистить.</p>
        <div class="contaminants"><span>Органика</span><span>Песок и земля</span><span>Твёрдые включения</span><span>Масла и клей</span></div>
        <div class="story-insight"><span aria-hidden="true">→</span><p>Технология ERA начинается с подготовки сложного сырья — и связывает стадии очистки в один процесс.</p></div>
      </div>
    </section>

    <section class="story-section solution-story" id="solution" aria-labelledby="solution-title">
      <div class="story-heading"><div><p class="eyebrow">02 / ERA ЗА МИНУТУ</p><h2 id="solution-title">Три стадии.<br>Одна логика переработки.</h2></div><p>Каждая стадия решает свою задачу —<br>и подготавливает материал к следующей.</p></div>
      <div class="pitch-stage-grid">
        ${presentationStages.map(s=>`<article class="pitch-stage-card"><a class="stage-illustration" href="/technology#${s.id}" aria-label="${s.title}: подробнее">${image(s.image,s.caption)}<span>${s.type}</span></a><div class="stage-card-copy"><p class="stage-label"><span>${s.number}</span> / ТЕХНОЛОГИЧЕСКАЯ СТАДИЯ</p><h3>${s.title}</h3><p>${s.summary}</p><a class="stage-more" href="/technology#${s.id}">Узнать подробнее ${arrow}</a></div></article>`).join('')}
      </div>
      <p class="story-note">Компоновки и образец гранулы — из презентации ERA. Состав линии, режимы и характеристики результата подбираются под сырьё; грануляция включается при соответствующей комплектации.</p>
    </section>

    <section class="story-slogan" aria-label="Наш подход"><p>Полный цикл переработки плёнки:<br><strong>очистить, переработать, использовать снова.</strong></p><span aria-hidden="true">↻</span></section>

    <section class="story-section output-story" aria-labelledby="output-title">
      <div class="story-heading"><div><p class="eyebrow">03 / РЕЗУЛЬТАТ ПЕРЕРАБОТКИ</p><h2 id="output-title">Материал возвращается<br>в производственный оборот.</h2></div><p>От очищенной плёнки до ПЭ-гранулы —<br>в зависимости от конечной задачи.</p></div>
      <div class="output-grid">${presentationOutputs.map((o,i)=>`<figure><div class="output-image">${image(o.image,o.title+' — иллюстрация из презентации ERA')}<span>0${i+1}</span></div><figcaption><h3>${o.title}</h3><p>${o.description}</p></figcaption></figure>`).join('')}</div>
      <div class="application-strip"><p>Новый производственный цикл</p><ul><li>Плёнки и пакеты</li><li>Технические профили</li><li>Тара</li><li>Литьевые изделия</li></ul></div>
      <p class="story-note">Иллюстрации стадий из презентации не представлены как единая серия испытаний. Возможность применения вторичного материала определяется его составом и подтверждёнными показателями качества.</p>
    </section>

    <section class="story-section control-story" aria-labelledby="control-title">
      <div class="control-copy"><p class="eyebrow">04 / УПРАВЛЕНИЕ ПРОЦЕССОМ</p><h2 id="control-title">Оборудование связано.<br>Процесс под контролем.</h2><p class="story-lead">«КАИР» — направление управления технологическим комплексом ERA.</p><p>Наблюдение за состоянием узлов, работа с режимами и движением материала объединены в описании системы управления.</p><div class="control-topics"><span>Состояние узлов</span><span>Режимы работы</span><span>Наблюдение за процессом</span></div>${action('Подробнее об управлении','/automation',true)}</div>
      <figure class="control-visual"><div class="control-label"><span class="live-dot" aria-hidden="true"></span>КАИР / УПРАВЛЕНИЕ КОМПЛЕКСОМ</div><a href="/automation" aria-label="Система КАИР: описание управления">${image('kair','Изображение интерфейса системы КАИР из презентации проекта ERA')}</a><figcaption>Изображение из презентации проекта. Состав функций и интеграции согласуется для конкретной комплектации.</figcaption></figure>
    </section>

    <section class="story-section launch-story" id="about-era" aria-labelledby="launch-title">
      <div class="story-heading"><div><p class="eyebrow">05 / ОТ ЗАДАЧИ К ПРОИЗВОДСТВУ</p><h2 id="launch-title">Начинаем с вашего сырья.<br>Двигаемся к решению.</h2></div><p>Технология, комплектация и запуск —<br>последовательные этапы работы над проектом.</p></div>
      <p class="story-lead">ERA — проект по возвращению вторичных полимерных материалов в производственный оборот.</p><p>Сайт объединяет отдельные узлы, линии и комплексы, систему управления и направление искусственного интеллекта. Работа над проектом начинается с описания сырья и целей, изучения исходных данных, подбора технологии и согласования состава и спецификации.</p><ol class="launch-steps">${projectSteps.map((s,i)=>`<li><span>0${i+1}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('')}</ol>
      <div class="manufacturing-story">${mediaLink('manufacture-wide','Оборудование на стадии изготовления, фото из презентации ERA','Фотоотчёт изготовления оборудования · презентация ERA, слайд 24')}<div><p class="eyebrow">ИНЖЕНЕРИЯ В ДЕТАЛЯХ</p><h3>От технологической схемы<br>к собранному оборудованию.</h3><p>Фотографии, компоновки и описания помогают перейти от общего замысла к предметному обсуждению поставки.</p><a class="text-link" href="/media">Фото и схемы проекта ${arrow}</a></div></div>
    </section>

    <section class="story-section detail-story" aria-labelledby="detail-title">
      <div class="story-heading"><div><p class="eyebrow">06 / СЛЕДУЮЩИЙ УРОВЕНЬ ПОДРОБНОСТИ</p><h2 id="detail-title">Посмотреть решение ближе.</h2></div><p>Выберите, с чего продолжить знакомство.</p></div>
      <div class="detail-doors">${[['Технология','Как устроены подготовка, очистка и получение конечного материала.','/technology','01'],['Линии и комплектации','Структура решений по сепарации и мойке плёнки.','/catalog/lines','02'],['Каталог оборудования','Отдельные узлы, их назначение и доступные характеристики.','/catalog/equipment','03']].map(([t,d,h,n])=>`<a href="${h}"><span class="door-number">${n} /</span><h3>${t}</h3><p>${d}</p><span class="door-action">Перейти в раздел ${arrow}</span></a>`).join('')}</div>
    </section>

    <section class="story-section discuss-story" id="discuss" aria-labelledby="discuss-title"><div><p class="eyebrow">ВАШ ПРОЕКТ НАЧИНАЕТСЯ С РАЗГОВОРА</p><h2 id="discuss-title">Какое сырьё<br>вы хотите перерабатывать?</h2><p>Расскажите о материале, загрязнениях и нужном результате. Можно приложить фотографии или видео — это поможет предметно обсудить технологию.</p></div><div class="discuss-actions">${action('Написать о проекте','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Обсудить проект переработки ERA'))}<a class="discuss-phone" href="tel:+79032813535">+7 903 281-35-35</a><a class="discuss-email" href="mailto:edkom.office@mail.ru">edkom.office@mail.ru</a><p>Кнопка откроет вашу почтовую программу.</p><a class="text-link" href="/contacts">Все контакты ${arrow}</a></div></section>
  </div>`;
}

export function presentationTechnology() {
  return `<div class="story technology-story"><section class="story-section tech-intro"><p class="eyebrow">ТЕХНОЛОГИЯ / ПОДРОБНОЕ ОПИСАНИЕ</p><h1>Подготовить. Очистить.<br>Вернуть в производство.</h1><p class="story-lead">Процесс ERA объединяет сухую сепарацию, горячую отмывку и гранулирование при соответствующей комплектации.</p><nav class="tech-links" aria-label="Стадии технологии">${presentationStages.map(s=>`<a href="#${s.id}">${s.number} / ${s.title}</a>`).join('')}</nav></section>
  ${presentationStages.map(s=>`<section class="story-section tech-stage" id="${s.id}"><div><p class="eyebrow">${s.number} / ТЕХНОЛОГИЧЕСКАЯ СТАДИЯ</p><h2>${s.title}</h2><p class="story-lead">${s.summary}</p><p>${s.description}</p><ul>${s.details.map(d=>`<li>${d}</li>`).join('')}</ul><p class="stage-result"><strong>Результат стадии:</strong> ${s.result}</p></div><figure><a href="/assets/presentation/${s.image}.webp" target="_blank" rel="noopener">${image(s.image,s.caption)}</a><figcaption>${s.caption} · слайд ${s.slide}. Нажмите для увеличения.</figcaption></figure></section>`).join('')}
  <section class="story-section tech-context"><h2>Схема подбирается под материал.</h2><p>Компоновки из презентации объясняют назначение стадий, но не задают состав всех вариантов в каталоге. Обязательные узлы, параметры, очистка рабочей жидкости и отделение примесей уточняются по согласованной схеме проекта.</p><div class="actions">${action('Линии и комплектации','/catalog/lines')}${action('Узлы оборудования','/catalog/equipment',true)}${action('Обсудить сырьё','/contacts',true)}</div></section></div>`;
}

export function presentationAutomation() {
  return `<div class="story"><section class="story-section tech-intro"><p class="eyebrow">УПРАВЛЕНИЕ / КАИР</p><h1>Общая логика<br>для технологического процесса.</h1><p class="story-lead">В презентации ERA система «КАИР» описана как управление комплексом с наблюдением за узлами, режимами и движением материала.</p></section><section class="story-section automation-detail"><figure>${image('kair','Изображение системы КАИР из презентации ERA')}<figcaption>Презентация ERA, слайд 16. Изображение интерфейса, представленное в исходном материале.</figcaption></figure><div><h2>Что раскрывает презентация</h2><ul><li>Контроль состояния оборудования и перегрузок.</li><li>Наблюдение за движением материала и работой узлов.</li><li>Настройка режимов для технологического процесса.</li></ul><p>Состав функций, необходимые подключения и совместимость согласуются для конкретного оборудования. Упоминание ИИ в презентации не заменяет описание и проверку отдельной промышленной функции.</p><p>Для предварительного измельчителя в его КП отдельно описаны контроль вибрации и шума, отключение привода при превышении порогов и предупреждения об обслуживании.</p>${action('О предварительном измельчителе','/catalog/equipment/predvaritelnyy-izmelchitel',true)}<div class="actions">${action('Обсудить управление','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Запрос об управлении КАИР'))}</div></div></section></div>`;
}
