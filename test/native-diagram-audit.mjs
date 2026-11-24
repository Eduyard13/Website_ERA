import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';

export async function verifyNativeAsset(base, html, slug, expectedSha){
 const file=`/assets/lines/${slug}/layout-native-v2.webp`;
 assert.ok(html.includes(file),`Published HTML references ${file}`);
 const response=await fetch(base+file,{cache:'reload'});
 assert.equal(response.status,200,file);
 assert.equal(response.headers.get('content-type'),'image/webp',file);
 assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),expectedSha,file);
 const monitor=html.match(/\/line-monitor\.js\?v=([a-f0-9]+)/)?.[1];
 assert.ok(monitor,'The published monitor has an asset revision');
 const script=await fetch(`${base}/line-monitor.js?v=${monitor}`,{cache:'reload'});
 assert.equal(script.status,200);
 assert.match(script.headers.get('content-type'),/javascript/);
 assert.match(await script.text(),/data-native-instances/);
}

export async function auditNativeDiagram(evaluate, id, {count, branches}){
 const report=await evaluate(`(${auditInBrowser.toString()})(${JSON.stringify(id)})`);
 assert.equal(report.controls,count,id+' badges');
 assert.equal(report.leaders,count,id+' leaders');
 assert.equal(report.regions,count,id+' contour groups');
 assert.equal(report.hits,count,id+' line interactions');
 assert.equal(report.branches,branches,id+' distinct physical endpoints');
 assert.deepEqual(report.failures,[],id+' instance audit');
}

async function auditInBrowser(id){
 const root=document.getElementById(id);
 const svg=root.querySelector('.diagram-projection > svg');
 const pins=[...root.querySelectorAll('button[data-callout]')];
 const report={controls:pins.length,leaders:svg.querySelectorAll('[data-line-leader]').length,
  regions:svg.querySelectorAll('[data-callout-region]').length,hits:svg.querySelectorAll('[data-callout-hit]').length,
  branches:0,failures:[]};
 const active=(selector,key)=>[...root.querySelectorAll(selector)].map(node=>node.dataset[key]);
 function matchesSelection(pin){
  const onlyInstance=(selector,key)=>active(selector,key).join()===pin.dataset.callout;
  const onlyPart=active('[data-architecture-part][aria-pressed="true"]','architecturePart').join()===pin.dataset.part;
  return root.dataset.selectedCallout===pin.dataset.callout && onlyPart &&
   onlyInstance('[data-callout][aria-pressed="true"]','callout') &&
   onlyInstance('[data-instance-guide][data-active="true"]','instanceGuide') &&
   onlyInstance('[data-callout-region][data-active="true"]','calloutRegion') &&
   root.querySelector('[data-diagram-select]').value===pin.dataset.part &&
   root.querySelector('[data-detail-number]').textContent===pin.textContent &&
   root.querySelector('[data-detail-label]').textContent===pin.dataset.label &&
   root.querySelector('[data-detail-description]').textContent===pin.dataset.description;
 }
 for(const pin of pins){
  const id=pin.dataset.callout;
  const fail=reason=>report.failures.push(`${id}: ${reason}`);
  const leader=svg.querySelector(`[data-line-leader="${id}"]`);
  const hit=svg.querySelector(`[data-callout-hit="${id}"]`);
  const polygons=[...svg.querySelectorAll(`[data-callout-region="${id}"] polygon`)];
  const row=root.querySelector(`[data-architecture-part="${pin.dataset.part}"]`);
  const number=pin.firstElementChild;
  const badge=number.getBoundingClientRect(),style=getComputedStyle(number);
  if(number.textContent!==pin.dataset.part.padStart(2,'0') || badge.width<10 || badge.height<10 ||
    style.visibility!=='visible' || style.display==='none' || style.opacity!=='1')fail('numeral visibility');
  if(!leader||!hit||!polygons.length||!row){fail('missing interactive layers');continue;}
  const path=leader.getAttribute('d');
  if(path!==hit.getAttribute('d'))fail('hit area follows a different path');
  const arms=path.split('M ').slice(1).map(segment=>segment.trim().split(' L ').map(point=>point.split(' ').map(Number)));
  report.branches+=arms.length;
  const start=new DOMPoint(...arms[0][0]).matrixTransform(svg.getScreenCTM());
  if(Math.hypot(start.x-badge.x-badge.width/2,start.y-badge.y-badge.height/2)>1)fail('leader misses badge center');
  for(const arm of arms){
   if(!polygons.some(polygon=>polygon.isPointInFill(new DOMPoint(...arm.at(-1)))))fail('leader ends outside the selected equipment');
  }
  pin.click();
  if(!matchesSelection(pin))fail('badge does not synchronize equipment, list and details');
  // The contour has a 180 ms CSS fill transition. Check the settled visual
  // state rather than the first frame, which can still be fully transparent.
  const transparent=()=>polygons.every(polygon=>getComputedStyle(polygon).fill==='rgba(198, 164, 59, 0)');
  if(transparent())await new Promise(resolve=>setTimeout(resolve,220));
  if(transparent())fail('selected contour has no fill');
  if(!matchesSelection(pin))fail('badge selection changed during contour transition');
  row.click();
  if(!matchesSelection(pin))fail('list does not preserve the selected instance');
  const other=pins.find(candidate=>candidate.dataset.part!==pin.dataset.part);
  other.click();
  row.click();
  const rowPin=pins.find(candidate=>candidate.dataset.callout===root.dataset.selectedCallout);
  if(rowPin?.dataset.part!==pin.dataset.part||!matchesSelection(rowPin))fail('list cannot select the correct position');
  other.click();
  hit.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  if(!matchesSelection(pin))fail('leader does not synchronize the selected instance');
 }
 return report;
}

export async function captureNativeDiagram(evaluate, command, id, file){
 const clip=await evaluate(`(()=>{
  const rect=document.querySelector('#${id} .dry-architecture-layout').getBoundingClientRect();
  return {x:0,y:Math.max(0,Math.round(rect.y+scrollY-100)),width:1440,height:Math.round(rect.height+125),scale:1};
 })()`);
 const {data}=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
 await mkdir(dirname(file),{recursive:true});
 await writeFile(file,Buffer.from(data,'base64'));
}
