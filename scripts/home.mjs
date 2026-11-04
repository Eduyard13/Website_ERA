import {projectHero} from './project-story.mjs';
import {commercialSections} from './commercial.mjs';
export {presentationTechnology,presentationAutomation} from './technology.mjs';

export function presentationHome(){
 return `<div class="story commercial-page" data-commercial-home>${projectHero()}${commercialSections()}</div>`;
}
