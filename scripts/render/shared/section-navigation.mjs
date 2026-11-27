import navigation from '../../../content/shared/section-navigation.json' with {type:'json'};

const pages=new Map(navigation.pages.map(page=>[page.route.replace(/\/$/,'')||'/',page]));
const labels={'/':'О проекте','/technology':'Технология','/economics':'Экономика'};
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function sectionNavigationData(path){
 return pages.get(path);
}

export function sectionNavigation(path){
 const page=sectionNavigationData(path);
 if(!page)return '';
 return `<nav class="section-navigation" data-section-navigation aria-label="Разделы страницы «${labels[path]}»"><div class="section-navigation-track">${page.groups.map(({target,label,activeSections})=>`<a href="#${escape(target)}" data-section-group="${escape(activeSections.join(' '))}">${escape(label)}</a>`).join('')}</div></nav>`;
}
