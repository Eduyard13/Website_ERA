import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contextNavigation,contextNavigationData} from '../scripts/context-navigation.mjs';
import {safeSiteAddress,confirmContextTransition,canReturnWithinSite,contextParentAddress,isContextDestination} from '../public/context-history.js';
import {nodes,lines} from '../content/catalog.mjs';
import {documentCategories,publicLibraryDocuments} from '../content/document-library.mjs';
import {render,basePath} from '../scripts/build.mjs';
const site={origin:'https://era.invalid',basePath:'/Website_ERA'},source='https://era.invalid/Website_ERA/documents/?q=плёнка',destination='https://era.invalid/Website_ERA/documents/technical/';
const record={fromId:'known-entry',from:source,to:destination,index:2,length:3,time:10_000};
test('Общий возврат включён только на категориях, 12 узлах и двух опубликованных линиях',()=>{
 for(const path of ['/','/documents','/catalog','/catalog/equipment','/catalog/lines','/economics','/automation','/contacts','/media','/does-not-exist']){assert.equal(contextNavigationData(path),null);assert.ok(!render(path==='/does-not-exist'?'/news':path).includes('data-context-navigation'));}
 assert.equal(contextNavigationData(undefined),null);
 for(const [path,parent] of [...documentCategories.map(c=>['/documents/'+c.id,'/documents/']),...nodes.map(n=>[n.path,'/catalog/equipment/']),...lines.filter(l=>l.enabled).map(l=>[l.path,'/catalog/lines/'])]){
  const html=render(path);assert.equal((html.match(/data-context-navigation /g)||[]).length,1,path);assert.ok(html.includes(`href="${basePath}${parent}"`));assert.ok(html.includes(`${basePath}/context-navigation.css?v=`));assert.ok(html.includes(`${basePath}/context-navigation.js?v=`));assert.ok(!html.includes('class="breadcrumbs"'),path);
  const nav=html.match(/<nav class="context-navigation"[\s\S]*?<\/nav>/)[0];assert.ok(nav.includes('Назад'));assert.ok(nav.includes('aria-current="page"'));
 }
});
test('Категория компактна и содержит только свои PDF, а витрина остаётся большой',()=>{
 const landing=render('/documents');assert.ok(landing.includes('class="dl-hero"'));assert.ok(landing.includes('class="dl-category-grid"'));assert.ok(landing.includes('library-collections'));assert.ok(!landing.includes('dl-category-tabs'));
 for(const c of documentCategories){const html=render('/documents/'+c.id);assert.ok(html.includes('data-library-layout="compact"'));assert.ok(html.includes('class="dl-compact-intro"'));assert.ok(html.includes('class="dl-container dl-category-tabs"'));assert.ok(!html.includes('class="dl-hero"')&&!html.includes('class="dl-category-grid"')&&!html.includes('library-collections'));assert.ok(html.indexOf('id="document-filters"')<html.indexOf('data-library-heading'));
  const actual=[...html.matchAll(/data-pdf-open="([^"]+)"/g)].map(m=>m[1]).sort();assert.deepEqual(actual,publicLibraryDocuments.filter(d=>d.category===c.id).map(d=>d.id).sort());
  const tabs=html.match(/<nav class="dl-container dl-category-tabs"[\s\S]*?<\/nav>/)[0];assert.equal((tabs.match(/aria-current="page"/g)||[]).length,1);assert.ok(tabs.includes('data-library-home'));
 }
});
test('Подтверждение истории требует реального перехода, своего referrer и новой записи',()=>{
 const options={...site,index:3,length:4,now:10_100,navigationType:'navigate'};
 assert.deepEqual(confirmContextTransition(record,destination,source,options),{id:'known-entry',url:safeSiteAddress(source,site)});
 assert.equal(confirmContextTransition(null,destination,source,options),null);
 assert.equal(confirmContextTransition(record,destination,'https://mail.invalid/inbox',options),null);
 assert.equal(confirmContextTransition(record,destination,source,{...options,index:2}),null);
 assert.equal(confirmContextTransition(record,destination,source,{...options,navigationType:'reload'}),null);
 assert.equal(confirmContextTransition(record,destination,source,{...options,now:200_000}),null);
 assert.equal(confirmContextTransition({...record,from:destination},destination,destination,options),null);
 assert.equal(confirmContextTransition(record,destination,'',options),null);
 assert.equal(confirmContextTransition(record,destination,source,{...options,index:null,length:20}),null);
});
test('Возврат остаётся внутри проекта; hash-запись и сомнительная история используют родителя',()=>{
 const entry={basePath:site.basePath,url:destination,index:3,length:4,verified:true,previous:{id:'known-entry',url:source}};
 assert.equal(canReturnWithinSite(entry,destination,{...site,index:3,length:99}),true);
 assert.equal(canReturnWithinSite(entry,destination+'#library-results',{...site,index:4,length:5}),false);
 assert.equal(canReturnWithinSite({...entry,verified:false},destination,{...site,index:3}),false);
 for(const url of ['https://outside.invalid/path','https://era.invalid/OtherProject/','javascript:alert(1)','blob:https://era.invalid/id'])assert.equal(canReturnWithinSite({...entry,previous:{url}},destination,{...site,index:3}),false);
 assert.equal(canReturnWithinSite(entry,destination,{...site,index:null,length:8}),false);
 assert.equal(contextParentAddress(entry,'https://era.invalid/Website_ERA/documents/',destination,site),safeSiteAddress(source,site));
 assert.equal(contextParentAddress(entry,'https://era.invalid/Website_ERA/catalog/',destination,site),'https://era.invalid/Website_ERA/catalog');
});
test('Трекер не сохраняет темы заявок и посторонние адреса',()=>{
 assert.equal(safeSiteAddress(undefined,site),null);assert.equal(safeSiteAddress('',site),null);
 const safe=safeSiteAddress('https://era.invalid/Website_ERA/contacts?topic=private&email=private&token=secret&q=плёнка#project-form',site);
 const url=new URL(safe);assert.equal(url.searchParams.get('topic'),null);assert.equal(url.searchParams.get('email'),null);assert.equal(url.searchParams.get('token'),null);assert.equal(url.searchParams.get('q'),'плёнка');
 assert.equal(isContextDestination(destination,site),true);assert.equal(isContextDestination('https://era.invalid/Website_ERA/documents/technical/a.pdf',site),false);assert.equal(isContextDestination('https://other.invalid/Website_ERA/documents/technical/',site),false);
});
