import {aboutUsContent} from '../content/about-us.mjs';
import {escapeContact as escape} from './contact-channels.mjs';
import {existsSync} from 'node:fs';

const arrow = '<span aria-hidden="true">↗</span>';
const assetPath = file => typeof file === 'string' && /^(?!.*\.\.)[a-z\d][a-z\d_./-]*\.(webp|avif|jpe?g|png)$/i.test(file) ? `/assets/${file}` : '';
const portraitAvailable = file => assetPath(file) && existsSync(new URL(`../public${assetPath(file)}`, import.meta.url));
const safeHref = url => typeof url === 'string' && (/^\/(?!\/)/.test(url) || /^#[\w-]+$/.test(url) || /^https:\/\/[^\s"<>]+$/.test(url)) ? url : '#main';
const paragraphs = items => items.map(text => `<p>${escape(text)}</p>`).join('');
const externalLink = (url, label, className = 'au-text-link') => `<a class="${className}" href="${escape(safeHref(url))}" target="_blank" rel="noopener noreferrer">${escape(label)} ${arrow}<span class="sr-only"> (откроется в новой вкладке)</span></a>`;
const image = (item, {hero = false, sizes = '(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) 46vw, 620px'} = {}) => {
  const src = assetPath(item.file);
  if (!src) return '';
  const srcset = item.smallFile && assetPath(item.smallFile) ? ` srcset="${escape(assetPath(item.smallFile))} ${item.smallWidth || (item.smallFile.includes('-768') ? 768 : 760)}w, ${escape(src)} ${Number(item.width)}w" sizes="${escape(sizes)}"` : '';
  return `<img src="${escape(src)}"${srcset} width="${Number(item.width)}" height="${Number(item.height)}" alt="${escape(item.alt)}"${hero ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
};
function gallery(items, group, className, product, {sizes} = {}) {
  const label = group === 'production' ? 'Оборудование ЭРА в Китае' : group === 'venray' ? 'Фотографии проекта в Нидерландах' : 'Фотографии проекта в Челябинске';
  return `<div class="au-gallery ${className}" aria-label="${label}">${items.map((item, index) => `<figure class="au-gallery-item" data-media data-type="photo" data-media-group="${escape(group)}" data-image="${escape(assetPath(item.file))}" data-title="${escape(item.caption)}" data-source="Фотография оборудования ЭРА" data-product="${escape(safeHref(product))}"><a class="media-open" href="${escape(assetPath(item.file))}" aria-label="Увеличить: ${escape(item.caption)}">${image(item, {sizes: (Array.isArray(sizes) ? sizes[index] : sizes) || (index === 0 ? '(max-width: 767px) calc(100vw - 40px), (max-width: 1100px) 60vw, 820px' : '(max-width: 767px) calc(100vw - 40px), 400px')})}<span class="au-photo-expand" aria-hidden="true">↗</span></a><figcaption>${escape(item.caption)}</figcaption></figure>`).join('')}</div>`;
}
function projectCard(project) {
  const previewSizes = '(max-width: 767px) calc(100vw - 78px), (max-width: 1023px) calc(100vw - 114px), (max-width: 1199px) calc((100vw - 192px) / 2), (max-width: 1359px) calc((100vw - 208px) / 2), 576px';
  const secondarySizes = '(max-width: 767px) calc((100vw - 90px) / 2), (max-width: 1023px) calc((100vw - 126px) / 2), (max-width: 1199px) calc((100vw - 216px) / 4), (max-width: 1359px) calc((100vw - 232px) / 4), 282px';
  const sizes = project.id === 'venray' ? [previewSizes, secondarySizes, secondarySizes] : previewSizes;
  return `<article class="au-project" id="project-${escape(project.id)}"><header class="au-project-heading"><p class="au-project-meta">${escape(project.year)} / ${escape(project.country)}</p><h3>${escape(project.city)}</h3><p class="au-project-subtitle">${escape(project.subtitle)}</p></header>${gallery(project.gallery, project.id, 'au-project-gallery au-project-'+project.id, '/catalog', {sizes})}<div class="au-project-copy">${paragraphs(project.paragraphs)}${project.status ? `<p class="au-project-status"><span aria-hidden="true"></span>${escape(project.status)}</p>` : ''}</div></article>`;
}
function teamSection(data) {
  const disabled = data.showTeam === false;
  const cards = disabled ? '' : data.team.map((member, index) => {
    const label = typeof member.publicLabel === 'string' ? member.publicLabel.trim() : '';
    const ready = !!(label && typeof member.role === 'string' && member.role.trim() && member.roleApproved === true && member.profileApproved === true && portraitAvailable(member.photo));
    const portrait = ready ? `<div class="au-portrait">${image({file: member.photo, smallFile: portraitAvailable(member.photoSmallFile) ? member.photoSmallFile : undefined, smallWidth: member.photoSmallWidth, width: member.photoWidth, height: member.photoHeight, alt: member.alt || 'Специалист ЭРА: '+label}, {sizes: '(max-width: 599px) calc(100vw - 42px), (max-width: 1023px) 180px, (max-width: 1199px) calc((100vw - 116px) / 3), (max-width: 1359px) calc((100vw - 132px) / 3), 408px'})}</div>` : `<div class="au-portrait is-placeholder" aria-hidden="true"><span class="au-portrait-index">0${index + 1} / ЭРА</span><span class="au-portrait-lines"></span></div>`;
    return `<article class="au-team-card" data-team-member="${escape(member.id)}" data-profile-state="${ready ? 'ready' : 'pending'}">${portrait}<div class="au-team-copy"><h3>${escape(label || 'Команда ЭРА')}</h3><p>${escape(member.description)}</p>${ready && member.location ? `<p class="au-team-location">${escape(member.location)}</p>` : ''}</div></article>`;
  }).join('');
  return `<section class="au-section au-team${disabled ? ' au-team-summary' : ''}" id="team" data-page-progress-label="Команда проекта"><div class="au-container"><p class="eyebrow">05 / КОМАНДА ПРОЕКТА</p>${disabled ? `<div class="au-team-summary-grid"><h2>За решениями —<br>командная работа.</h2><p>Команда ЭРА объединяет инженерное направление, развитие и координацию проектов. Вместе мы прорабатываем технологию, согласовываем производственные задачи и сопровождаем реализацию.</p></div>` : `<div class="au-section-heading"><h2>Ключевые специалисты проекта</h2><p>Три направления объединяют разработку оборудования, коммерческое развитие и практическое внедрение технологий на предприятиях заказчиков.</p></div><div class="au-team-grid">${cards}</div>`}</div></section>`;
}
export function aboutUsPage(data = aboutUsContent) {
  const base = data.productionBase;
  return `<div class="about-us-page">
    <section class="au-hero era-indigo-surface" id="about-us-intro" data-page-progress-label="ЭРА: опыт и внедрения"><div class="au-container">
      <div class="au-hero-grid"><div class="au-hero-copy"><p class="eyebrow">ЭРА / О КОМПАНИИ</p><h1>${escape(data.hero.title)}</h1><p class="au-lead">${escape(data.hero.lead)}</p><div class="au-hero-actions"><a class="button" href="/contacts#project-form">Обсудить проект ${arrow}</a><a class="au-secondary-link" href="#projects">Реализованные проекты <span aria-hidden="true">↓</span></a></div><p class="au-hero-signature">${escape(data.hero.signature)}</p></div><figure class="au-hero-image">${image(data.hero, {hero: true})}<figcaption><span>${escape(data.hero.caption)}</span><span aria-hidden="true">ЭРА / 01</span></figcaption></figure></div>
      <dl class="au-company-facts">${data.companyFacts.map(fact => `<div><dt>${escape(fact.value)}</dt><dd>${escape(fact.label)}</dd></div>`).join('')}</dl>
    </div></section>

    <section class="au-section au-experience" id="experience" data-page-progress-label="Производственный опыт"><div class="au-container"><p class="eyebrow">01 / НАШ ОПЫТ</p><div class="au-experience-grid"><div class="au-experience-number"><strong>20<span>+</span></strong><span class="au-years">лет</span><p>Отраслевой опыт<br>участников команды</p></div><div class="au-experience-copy"><h2>${escape(data.experience.title)}</h2>${paragraphs(data.experience.paragraphs)}</div></div><ol class="au-history-path">${data.experience.stages.map((stage, index) => `<li><span class="au-path-index">0${index + 1}</span><h3>${escape(stage.title)}</h3><p>${escape(stage.text)}</p></li>`).join('')}</ol></div></section>

    <section class="au-section au-production era-indigo-surface" id="production-base" data-page-progress-label="Производственная база BEIER"><div class="au-container"><div class="au-section-heading"><p class="eyebrow">02 / ПРОИЗВОДСТВЕННАЯ БАЗА</p><h2>${escape(base.title)}</h2></div><div class="au-production-intro"><p class="au-manufacturer">BEIER<br><span>Machinery</span></p><div>${paragraphs(base.paragraphs)}</div></div><dl class="au-production-metrics">${base.metrics.map(metric => `<div><dt>${escape(metric.value)}</dt><dd>${escape(metric.label)}</dd></div>`).join('')}</dl><p class="au-source">По данным корпоративного профиля BEIER Machinery.</p><ol class="au-corporate-history">${base.history.map(item => `<li><span>${escape(item.date)}</span><p>${escape(item.text)}</p></li>`).join('')}</ol>
      <div class="au-gallery-heading"><h3>Оборудование ЭРА в Китае</h3><p>Изготовление и сборка · собственные материалы ЭРА</p></div>${gallery(base.gallery, 'production', 'au-production-gallery', '/catalog', {sizes: ['(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) calc(100vw - 64px), 760px', '(max-width: 479px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 78px) / 2), 500px', '(max-width: 479px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 78px) / 2), 500px']})}
      <div class="au-factory-visit"><div><p class="eyebrow">ПРОИЗВОДСТВЕННАЯ БАЗА / КИТАЙ</p><h3>${escape(base.manufacturer)}</h3><address>${escape(base.address)}</address></div><div class="au-tour-links">${externalLink(base.tourUrl, 'Виртуальная экскурсия по производству', 'au-tour-link')}<a class="au-secondary-link" href="/contacts#project-form">Обсудить проект с ЭРА ${arrow}</a></div></div>
    </div></section>

    <section class="au-section au-projects" id="projects" data-page-progress-label="Реализованные проекты"><div class="au-container"><div class="au-section-heading"><p class="eyebrow">03 / РЕАЛИЗОВАННЫЕ ПРОЕКТЫ</p><h2>${escape(data.projects.title)}</h2><p>${escape(data.projects.intro)}</p></div><div class="au-projects-grid">${data.projects.cases.map(projectCard).join('')}</div><a class="au-text-link au-gallery-link" href="/media">Посмотреть оборудование в работе ${arrow}</a></div></section>

    <section class="au-section au-engineering" id="engineering" data-page-progress-label="Наши компетенции"><div class="au-container"><div class="au-section-heading"><p class="eyebrow">04 / ИНЖЕНЕРИЯ И ПРОИЗВОДСТВО</p><h2>Разрабатываем решения. Изготавливаем оборудование. Внедряем технологии.</h2></div><div class="au-engineering-grid">${data.engineering.map((stage, index) => `<article class="au-engineering-card"><figure>${image(stage.image)}<figcaption>${escape(stage.image.caption)}</figcaption></figure><div class="au-stage-copy"><span class="au-stage-number">0${index + 1}</span><h3>${escape(stage.title)}</h3><p>${escape(stage.text)}</p>${stage.href ? `<a class="au-text-link" href="${escape(safeHref(stage.href))}">${escape(stage.linkLabel)} ${arrow}</a>` : ''}</div></article>`).join('')}</div></div></section>

    ${teamSection(data)}

    <section class="au-section au-workflow" id="working-together" data-page-progress-label="Работа с заказчиком"><div class="au-container"><div class="au-section-heading"><p class="eyebrow">06 / РЕАЛИЗАЦИЯ ПРОЕКТА</p><h2>От анализа сырья —<br>к технологическому решению.</h2></div><ol class="au-workflow-steps">${data.steps.map((step, index) => `<li><span class="au-step-node" aria-hidden="true">0${index + 1}</span><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p></li>`).join('')}</ol></div></section>

    <section class="au-final-wrap" id="about-us-contact" data-page-progress-label="Обсудить проект"><div class="au-container au-final era-indigo-surface"><div><p class="eyebrow">07 / ОТ ЗНАКОМСТВА — К ВАШЕМУ ПРОЕКТУ</p><h2>Давайте обсудим вашу производственную задачу.</h2><p>Расскажите, с каким сырьём вы работаете, какие объёмы планируете перерабатывать и какой продукт хотите получать. Мы поможем определить подходящее технологическое решение и состав оборудования.</p></div><div class="au-final-actions"><a class="button" href="/contacts#project-form">Обсудить проект ${arrow}</a><a class="au-secondary-link" href="/catalog">Смотреть оборудование ${arrow}</a></div></div></section>
  </div>`;
}
