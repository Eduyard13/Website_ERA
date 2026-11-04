import {presentationStages} from '../content/presentation.mjs';
import {rawMaterialsStory,stageOverview,processSlogan,outputsStory,controlStory,launchStory,detailStory,projectContactStory} from './project-story.mjs';
import {technicalQuality} from './quality.mjs';
import {kairMonitor} from './kair.mjs';
const arrow='<span aria-hidden="true">↗</span>';
const action=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const image=(file,alt)=>`<img src="/assets/presentation/${file}.webp" alt="${alt}" loading="lazy">`;

export function presentationTechnology() {
  return `<div class="story technology-story"><section class="story-section tech-intro"><p class="eyebrow">ТЕХНОЛОГИЯ / ПОДРОБНОЕ ОПИСАНИЕ</p><h1>Подготовить. Очистить.<br>Вернуть в производство.</h1><p class="story-lead">Процесс ЭРА объединяет сухую сепарацию, горячую отмывку и гранулирование при соответствующей комплектации.</p><nav class="tech-links technology-outline" aria-label="Стадии технологии">${presentationStages.map(s=>`<a href="#${s.id}">${s.number} / ${s.title}</a>`).join('')}<a href="#raw-material">Сырьё и загрязнения</a><a href="#granule-quality">Качество гранулы</a><a href="#control-title">Управление КАИР</a></nav></section>
  ${rawMaterialsStory()}
  ${stageOverview()}
  ${presentationStages.map(s=>`<section class="story-section tech-stage" id="${s.id}"><div><p class="eyebrow">${s.number} / ТЕХНОЛОГИЧЕСКАЯ СТАДИЯ</p><h2>${s.title}</h2><p class="story-lead">${s.description}</p><ul>${s.details.map(d=>`<li>${d}</li>`).join('')}</ul><p class="stage-result"><strong>Результат стадии:</strong> ${s.result}</p></div><figure><a href="/assets/presentation/${s.image}.webp" target="_blank" rel="noopener">${image(s.image,s.caption)}</a><figcaption>${s.caption}. Нажмите для увеличения.</figcaption></figure></section>`).join('')}
  <section class="story-section tech-context"><h2>Схема подбирается под материал.</h2><p>Последовательность узлов, очистка рабочей жидкости и отделение примесей определяются видом сырья и требуемым результатом. Компоновка учитывает производительность, ресурсы и размещение на площадке.</p><div class="actions">${action('Линии и комплектации','/catalog/lines')}${action('Узлы оборудования','/catalog/equipment',true)}${action('Обсудить сырьё','/contacts',true)}</div></section>${processSlogan()}${outputsStory()}${technicalQuality()}${controlStory()}${launchStory()}${detailStory()}${projectContactStory()}</div>`;
}


export function presentationAutomation() {
 return `<div class="story"><section class="story-section tech-intro"><p class="eyebrow">УПРАВЛЕНИЕ / КАИР</p><h1>Общая логика<br>для технологического процесса.</h1><p class="story-lead">КАИР — система управления технологическим комплексом ЭРА. Состояние узлов, режимы работы и движение материала — в едином интерфейсе.</p></section><section class="story-section automation-detail">${kairMonitor()}<div><h2>Возможности системы</h2><ul><li>Контроль состояния оборудования и перегрузок.</li><li>Наблюдение за движением материала и работой узлов.</li><li>Настройка режимов технологического процесса.</li></ul><p>Состав системы подбирается под оборудование линии.</p><p>У предварительного измельчителя предусмотрены контроль вибрации и шума, отключение привода при превышении порогов и предупреждения об обслуживании.</p>${action('О предварительном измельчителе','/catalog/equipment/predvaritelnyy-izmelchitel',true)}<div class="actions">${action('Обсудить управление','mailto:edkom.office@mail.ru?subject='+encodeURIComponent('Запрос об управлении КАИР'))}</div></div></section></div>`;
}
