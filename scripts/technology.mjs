import {presentationStages} from '../content/presentation.mjs';
import {rawMaterialsStory,stageOverview,processSlogan,outputsStory,controlStory,launchStory,detailStory,projectContactStory} from './project-story.mjs';
import {technicalQuality} from './quality.mjs';
import {drySeparationSection,washingConfiguration} from './technology-lines.mjs';
import {materialBalance,parametersForProject,washingRoles} from './presentation-web.mjs';
export {renderKairSystem as presentationAutomation} from './kair-system.mjs';
const image=(file,alt)=>`<img src="/assets/presentation/${file}.webp" alt="${alt}" loading="lazy">`;
function processStage(stage){
 if(stage.id==='dry-separation')return drySeparationSection(stage);
 const granulation=stage.id==='granulation';
 return `<section class="story-section tech-stage tech-stage--${stage.id}" id="${stage.id}"><div><p class="eyebrow">${stage.number} / ТЕХНОЛОГИЧЕСКАЯ СТАДИЯ</p>${granulation?'<p class="tech-integrated-stage">Завершающий этап в составе линии мойки</p>':''}<h2>${stage.title}</h2><p class="story-lead">${stage.description}</p>${granulation?'<p>Грануляция завершает переработку подготовленного полимера. Фильтрация расплава отделяет предусмотренные включения, а предварительная очистка снижает их поступление на эту стадию.</p>':'<p>Интенсивная очистка в жидкой среде и механическое воздействие помогают отмыть масла и жиры. После мойки материал обезвоживают; рабочую жидкость направляют на очистку и возврат.</p>'}<ul>${stage.details.map(detail=>`<li>${detail}</li>`).join('')}</ul>${granulation?'<p class="tech-granulation-note">Гранулирование выполняется на грануляторе линии мойки или на собственном оборудовании предприятия. Отдельная линия гранулирования для этого не требуется. Капсулятор отжимает и уплотняет промежуточный материал; получение ПЭ-гранулы — задача гранулятора.</p>':''}<p class="stage-result"><strong>Результат стадии:</strong> ${granulation?stage.result:'Отмытый и обезвоженный материал для дальнейшей подготовки и грануляции.'}</p></div><figure><a href="/assets/presentation/${stage.image}.webp" target="_blank" rel="noopener">${image(stage.image,stage.caption)}</a><figcaption>${stage.caption}. Нажмите для увеличения.</figcaption></figure>${stage.id==='hot-washing'?washingRoles()+washingConfiguration():''}</section>`;
}

export function presentationTechnology() {
  return `<div class="story technology-story"><section class="story-section tech-intro"><p class="eyebrow">ТЕХНОЛОГИЯ / ПОДРОБНОЕ ОПИСАНИЕ</p><h1>Подготовить. Очистить.<br>Вернуть в производство.</h1><p class="story-lead">Процесс ЭРА объединяет сухую сепарацию, горячую отмывку и гранулирование при соответствующей комплектации.</p><nav class="tech-links technology-outline" aria-label="Разделы технологии"><a href="#raw-material">Сырьё</a><a href="#contaminants">Загрязнения</a><a href="#solution">Схема процесса</a>${presentationStages.map(stage=>`<a href="#${stage.id}">${stage.number} / ${stage.title}</a>`).join('')}<a href="#material-balance">Баланс материала</a><a href="#granule-quality">Качество гранулы</a><a href="#control-title">Управление КАИР</a></nav></section>
  ${rawMaterialsStory()}
  ${stageOverview()}
  ${presentationStages.map(processStage).join('')}
  ${materialBalance()}
  ${processSlogan()}${outputsStory()}${technicalQuality()}${controlStory()}${parametersForProject()}${launchStory()}${detailStory()}${projectContactStory()}</div>`;
}
