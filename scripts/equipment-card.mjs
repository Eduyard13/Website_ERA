import {equipmentCardData} from '../content/equipment-cards.mjs';
import {equipmentMediaCounts} from './media-counts.mjs';
import {mediaCountLabels} from '../public/media-counts.js';
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const metric=value=>{
 const match=/^(.*?)\s*(кг\/ч|мешков\/ч|м³\/ч|кВт|м³|мкм|мм|кг|шт\.|°C|°|%)(\*?)$/.exec(value);
 if(!match)return `<span class="node-metric-number">${escape(value)}</span>`;
 const prefix=/^(Не более|до)\s+/.exec(match[1]);
 return `${prefix?`<small class="node-metric-prefix">${escape(prefix[1])}</small>`:''}<span class="node-metric-number">${escape(prefix?match[1].slice(prefix[0].length):match[1])}</span><small>${escape(match[2]+match[3])}</small>`;
};
export function nodeCard(node){
 const card=equipmentCardData(node),image=card.image;
 const search=[node.title,node.description,card.materials,...card.features].join(' ').toLocaleLowerCase('ru');
 const stone=image.stoneColors.map((color,i)=>`${color} ${i*25}%`).join(',');
 return `<a class="node-card node-card--stone" data-node data-title="${escape(search)}" data-category="${escape(node.category)}" data-materials="${escape(node.materials.join('|'))}" href="${node.path}" aria-labelledby="node-${node.slug}-title" style="--node-stone:linear-gradient(90deg,${stone})"><span class="card-visual"><img src="/assets/${image.file}" srcset="/assets/${image.smallFile} 768w, /assets/${image.file} ${image.width}w" sizes="(min-width:1344px) 402px, (min-width:1200px) calc((100vw - 112px) / 3), (min-width:768px) calc((100vw - 88px) / 2), calc(100vw - 40px)" width="${image.width}" height="${image.height}" alt="${escape(node.title)} — иллюстрация оборудования" loading="lazy" decoding="async"></span><div class="node-body"><p class="eyebrow">${escape(node.category)}</p><h3 id="node-${node.slug}-title">${escape(node.title).replaceAll('-','-<wbr>')}</h3><p class="node-summary">${escape(card.summary)}</p><dl class="node-card-materials"><dt>Материалы</dt><dd>${escape(card.materials)}</dd></dl><dl class="node-card-specs">${card.metrics.map(m=>`<div><dt>${escape(m.label)}</dt><dd>${metric(m.value)}</dd>${m.note?`<p>${escape(m.note)}</p>`:''}</div>`).join('')}</dl><ul class="node-card-features">${card.features.map(text=>`<li>${escape(text)}</li>`).join('')}</ul><div class="node-card-media">${mediaCountLabels(equipmentMediaCounts(node)).map(({label,count})=>`<span>${label}: <b>${count}</b></span>`).join('')}</div><span class="card-action">Подробнее об узле <span aria-hidden="true">↗</span></span></div></a>`;
}
