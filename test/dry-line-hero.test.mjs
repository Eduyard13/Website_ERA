import {test} from 'node:test';
import assert from 'node:assert/strict';
import {render,basePath} from '../scripts/build.mjs';
import {lines} from '../content/catalog.mjs';
import {miniLineMetrics} from '../content/mini-film-separation.mjs';
import {lineMetrics} from '../content/film-separation.mjs';

const slugs=['separatsiya-01','separatsiya-02','separatsiya-03'];
const headings=[
 'Сухая сепарация плёнки BASE',
 'Сухая сепарация плёнки PRO',
 'Сухая сепарация и сушка PREMIUM'
];

test('Единый первый экран всех трёх сухих комплектаций сохраняет собственные рендеры, цифры и документы',()=>{
 for(const [index,slug] of slugs.entries()){
  const line=lines.find(candidate=>candidate.slug===slug);
  const html=render(line.path);
  const start=html.indexOf('<section class="section line-hero line-hero--commercial"');
  assert.ok(start>=0,slug+' hero');
  const hero=html.slice(start,html.indexOf('</section>',start)+10);
  assert.ok(hero.includes('data-dry-line-hero="'+slug+'"'),slug);
  assert.ok(hero.includes('<h1>'+headings[index]+'</h1>'),slug);
  assert.equal((hero.match(/data-line-metric="/g)||[]).length,4,slug);
  assert.ok(hero.includes('ПРОИЗВОДСТВЕННЫЙ ПАСПОРТ'),slug);
  const image=line.catalogCardFile||line.cardFile;
  assert.ok(hero.includes('src="'+basePath+'/assets/'+image+'"'),slug+' uses original cover');
  assert.ok(hero.includes('alt="'+line.cardImageAlt+'"')||hero.includes('data-line-catalog-cover'),slug);
  assert.ok(hero.includes('href="#composition"'),slug);
  assert.ok(hero.includes('Обсудить комплектацию'),slug);
  assert.ok(hero.includes('Техническое описание · PDF'),slug);
  assert.ok(html.includes('href="'+basePath+'/line-engineering.css?v='),slug);
  assert.equal((html.match(/<h1>/g)||[]).length,1,slug+' one H1');
 }
});
test('BASE: один поток, нет штатной сортировки по пяти потокам и нет пресса',()=>{
 const line=lines.find(item=>item.slug==='separatsiya-01');
 const html=render(line.path);
 const hero=html.slice(html.indexOf('data-dry-line-hero="separatsiya-01"'),html.indexOf('</section>',html.indexOf('data-dry-line-hero="separatsiya-01"')));
 assert.ok(hero.includes('Один поток плёнки'));
 assert.ok(!hero.includes('автоматический пресс')&&!/\b(?:5|Пять) раздельных потоков/.test(hero));
 for(const metric of miniLineMetrics)assert.ok(html.includes(metric[0]),metric[2]);
 assert.ok(hero.includes('225<small>кВт</small>'));
 assert.ok(hero.includes('3<small>чел./смена</small>'));
 assert.ok(hero.includes('600–700 кг/ч'));
 assert.ok(hero.includes('PDF, 14 страниц'));
});
test('PRO: пять бункеров и тюк, все KPI происходят из технического описания PRO',()=>{
 const line=lines.find(item=>item.slug==='separatsiya-02');
 const html=render(line.path);
 const hero=html.slice(html.indexOf('data-dry-line-hero="separatsiya-02"'),html.indexOf('</section>',html.indexOf('data-dry-line-hero="separatsiya-02"')));
 assert.ok(hero.includes('5 раздельных потоков'));
 for(const [index,[value,unit]] of lineMetrics.entries()){
  if(index<2)assert.ok(hero.includes(value+'<small>'+unit+'</small>'));
 }
 assert.ok(hero.includes('5<small>потоков</small>'));
 assert.ok(hero.includes('5 × 4,7 м³'));
 assert.ok(hero.includes('≈700<small>кг</small>'));
 assert.ok(hero.includes('PDF, 32 страницы'));
});
test('PREMIUM: источники KPI и сушилка не подменяются данными других линий',()=>{
 const line=lines.find(item=>item.slug==='separatsiya-03');
 const html=render(line.path);
 const hero=html.slice(html.indexOf('data-dry-line-hero="separatsiya-03"'),html.indexOf('</section>',html.indexOf('data-dry-line-hero="separatsiya-03"')));
 for(const metric of line.cardMetrics.slice(0,3))assert.ok(hero.includes(metric.value+'<small>'+metric.unit+'</small>'),metric.label);
 assert.ok(hero.includes('до 5<small>%</small>'));
 assert.ok(hero.includes('Не норма влажности отгружаемых тюков'));
 assert.ok(hero.includes(line.cardMetrics[5].value+'<small>потоков</small>'));
 assert.ok(hero.includes('две баллистические ступени'));
 assert.ok(hero.includes('data-pdf-open="separatsiya-03-technical"'));
 assert.ok(hero.includes('PDF, 28 страниц'));
});
