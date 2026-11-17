import {categories,lines,nodes} from '../content/catalog.mjs';
import {lineMetrics} from '../content/film-separation.mjs';

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const branches=[['lines','Линии и комплексы','/catalog/lines'],['equipment','Отдельные узлы','/catalog/equipment']];
export function catalogBranchNav(active){
 return `<nav class="catalog-branch-nav catalog-branch-nav--${active}" aria-label="Разделы каталога"><a class="catalog-branch-back" href="/catalog/">← Весь каталог</a><div class="catalog-branch-links">${branches.map(([id,label,href])=>id===active?`<span aria-current="page">${label}</span>`:`<a href="${href}/">${label}</a>`).join('')}</div></nav>`;
}
const categoryLabels={'Сухая сепарация и очистка':'Сухая сепарация','Очистка рабочей жидкости':'Очистка стоков'};
const quickFilters=(name,label,all,values,labels={})=>`<div class="catalog-quick-filters" role="group" aria-label="${label}" data-quick-filter="${name}" hidden>${['',...values].map(value=>`<button type="button" data-filter-value="${escape(value)}" aria-pressed="${!value}">${escape(value?labels[value]||value:all)}</button>`).join('')}</div>`;
export function equipmentFilters(){
 return `<form class="filters catalog-branch-filters" id="catalog-filters" role="search"><div class="catalog-search-row"><label class="catalog-search">Найти оборудование<input type="search" name="q" placeholder="Название или назначение" disabled></label><label class="catalog-material">Сырьё<select name="material" disabled><option value="">Все виды сырья</option>${[...new Set(nodes.flatMap(n=>n.materials))].map(value=>`<option>${escape(value)}</option>`).join('')}</select></label><button type="reset" disabled>Сбросить</button></div><label data-native-filter="category">Операция<select name="category" disabled><option value="">Все узлы</option>${categories.map(value=>`<option>${escape(value)}</option>`).join('')}</select></label>${quickFilters('category','Производственная задача','Все узлы',categories,categoryLabels)}</form>`;
}
export function lineFilters(){
 const groups=[...new Set(lines.map(line=>line.group))];
 return `<form class="filters catalog-branch-filters catalog-branch-filters--lines" id="line-filters"><label data-native-filter="group">Направление<select name="group" disabled><option value="">Все линии</option>${groups.map(value=>`<option>${escape(value)}</option>`).join('')}</select></label>${quickFilters('group','Направление линии','Все линии',groups)}<button type="button" data-line-reset disabled>Сбросить</button></form>`;
}

// Match source labels and units explicitly: registry order is not a data contract.
export function lineComparison(source=lines){
 const slugs=['separatsiya-01','separatsiya-02'];
 const selected=slugs.map(slug=>{
  const line=source.find(item=>item.slug===slug&&item.enabled&&item.status==='source-checked');
  if(!line)throw new Error(`Missing approved comparison line: ${slug}`);
  return line;
 });
 const metric=(line,labels,unit)=>{
  const found=line.cardMetrics.filter(item=>labels.includes(item.label)&&item.unit===unit);
  if(found.length!==1)throw new Error(`Comparison metric mismatch: ${line.slug} / ${labels.join(', ')} / ${unit}`);
  return `${found[0].value} ${found[0].unit}`;
 };
 const numericRow=(label,labels,unit)=>[label,...selected.map(line=>metric(line,labels,unit))];
 const storage=lineMetrics.find(([,unit,label])=>unit==='м³'&&label==='Раздельные бункеры с пылеудалением');
 if(!storage)throw new Error('Missing approved separate storage capacity');
 const rows=[
  ['Назначение','Сухая очистка, общий цветной плёночный микс','Сухая очистка, раздельная сортировка и товарные партии'],
  numericRow('Входной поток с загрязнениями',['Входной поток'],'кг/ч'),
  numericRow('Расчётный выход очищенной плёнки при засоре около 50%',['Очищенная плёнка','Готовая плёнка'],'кг/ч'),
  numericRow('Установленная мощность',['Установленная мощность'],'кВт'),
  numericRow('Расчётная потребляемая мощность (70% установленной)',['Потребляемая мощность'],'кВт'),
  ['Сортировка по видам','Дополнительная опция, по согласованию','Предусмотрена, закрытый сортировочный бокс'],
  ['Раздельные накопительные бункеры','Не входят в базовую комплектацию',`${storage[0]} ${storage[1]}`],
  ['Автоматическое прессование','Не входит в базовую комплектацию','Предусмотрено'],
 ];
 return `<details class="catalog-comparison" data-line-comparison data-keep-open><summary>Сравнить комплектации</summary><div class="catalog-comparison-content"><p class="catalog-comparison-hint" id="catalog-comparison-hint">На узком экране таблицу можно прокрутить по горизонтали.</p><div class="catalog-comparison-scroll" role="region" aria-label="Сравнение линий" aria-describedby="catalog-comparison-hint" tabindex="0"><table><caption>Сравнение базовых комплектаций сухой сепарации</caption><thead><tr><th scope="col">Параметр</th><th scope="col">Сепарация 01 · мини-комплектация</th><th scope="col">Сепарация 02 · с сортировкой и прессованием</th></tr></thead><tbody>${rows.map(([label,...values])=>`<tr><th scope="row">${escape(label)}</th>${values.map(value=>`<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="catalog-comparison-note">Показатели выпуска приведены для расчётного режима при засорённости около 50%. Фактическая производительность и комплектация определяются свойствами сырья и согласованными условиями работы. Потребляемая мощность — расчётный ориентир, 70% от установленной.</p><div class="catalog-comparison-links">${selected.map(line=>`<a class="text-link" href="${line.path}">Подробнее о Сепарации ${line.number} <span aria-hidden="true">↗</span></a>`).join('')}</div></div></details>`;
}

export const catalogNoScript='<noscript><p class="catalog-no-script">Для интерактивных фильтров включите JavaScript. Сейчас доступны все карточки и ссылки на подробные страницы.</p></noscript>';
