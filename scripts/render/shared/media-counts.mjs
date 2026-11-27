import {media} from '../../../content/equipment/catalog.mjs';
import {countMedia,mediaCountLabels} from '../../../public/assets/js/components/media-counts.js';
export function equipmentMediaCounts(node){return countMedia(media.filter(m=>m.product===node.path),node.documents);}
export function mediaCountsMarkup(node){const targets={photos:'photos',videos:'video',schemes:node.diagram?'construction':'operation',frames:'illustrations',documents:'documents'};return `<div class="availability media-counts">${mediaCountLabels(equipmentMediaCounts(node)).map(({key,label,count})=>`<a href="${node.path}#${targets[key]}">${label}: <strong>${count}</strong></a>`).join('')}</div>`;}
