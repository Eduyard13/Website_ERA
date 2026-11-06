import {presentationStages} from '../content/presentation.mjs';
import {rawMaterialsStory,stageOverview,processSlogan,outputsStory,controlStory,launchStory,detailStory,projectContactStory} from './project-story.mjs';
import {technicalQuality} from './quality.mjs';
import {drySeparationSection,washingConfiguration} from './technology-lines.mjs';
export {renderKairSystem as presentationAutomation} from './kair-system.mjs';
const arrow='<span aria-hidden="true">↗</span>';
const action=(text,href,secondary=false)=>`<a class="button ${secondary?'secondary':''}" href="${href}">${text}${arrow}</a>`;
const image=(file,alt)=>`<img src="/assets/presentation/${file}.webp" alt="${alt}" loading="lazy">`;
function processStage(stage){
 if(stage.id==='dry-separation')return drySeparationSection(stage);
 const granulation=stage.id==='granulation';
 return `<section class="story-section tech-stage tech-stage--${stage.id}" id="${stage.id}"><div><p class="eyebrow">${stage.number} / ТЕХНОЛОГИЧЕСКАЯ СТАДИЯ</p>${granulation?'<p class="tech-integrated-stage">Завершающий этап в составе линии мойки</p>':''}<h2>${stage.title}</h2><p class="story-lead">${stage.description}</p><ul>${stage.details.map(detail=>`<li>${detail}</li>`).join('')}</ul>${granulation?'<p class="tech-granulation-note">Гранулирование выполняется на грануляторе линии мойки или на собственном оборудовании предприятия. Отдельная линия гранулирования для этого не требуется.</p>':''}<p class="stage-result"><strong>Результат стадии:</strong> ${stage.result}</p></div><figure><a href="/assets/presentation/${stage.image}.webp" target="_blank" rel="noopener">${image(stage.image,stage.caption)}</a><figcaption>${stage.caption}. Нажмите для увеличения.</figcaption></figure>${stage.id==='hot-washing'?washingConfiguration():''}</section>`;
}

export function presentationTechnology() {
  return `<div class="story technology-story"><section class="story-section tech-intro"><p class="eyebrow">ТЕХНОЛОГИЯ / ПОДРОБНОЕ ОПИСАНИЕ</p><h1>Подготовить. Очистить.<br>Вернуть в производство.</h1><p class="story-lead">Процесс ЭРА объединяет сухую сепарацию, горячую отмывку и гранулирование при соответствующей комплектации.</p><nav class="tech-links technology-outline" aria-label="Стадии технологии">${presentationStages.map(s=>`<a href="#${s.id}">${s.number} / ${s.title}</a>`).join('')}<a href="#raw-material">Сырьё и загрязнения</a><a href="#granule-quality">Качество гранулы</a><a href="#control-title">Управление КАИР</a></nav></section>
  ${rawMaterialsStory()}
  ${stageOverview()}
  ${presentationStages.map(processStage).join('')}
  <section class="story-section tech-context"><h2>Схема подбирается под материал.</h2><p>Последовательность узлов, очистка рабочей жидкости и отделение примесей определяются видом сырья и требуемым результатом. Компоновка учитывает производительность, ресурсы и размещение на площадке.</p><div class="actions">${action('Линии и комплектации','/catalog/lines')}${action('Узлы оборудования','/catalog/equipment',true)}${action('Обсудить сырьё','/contacts',true)}</div></section>${processSlogan()}${outputsStory()}${technicalQuality()}${controlStory()}${launchStory()}${detailStory()}${projectContactStory()}</div>`;
}
