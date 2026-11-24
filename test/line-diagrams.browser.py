"""Fit monitor, original A0 projections/PDF and legacy diagram regressions. No screenshots."""
from pathlib import Path
from hashlib import sha256
import json, os, subprocess
from playwright.sync_api import sync_playwright

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3052').rstrip('/')
out=Path(os.environ.get('ERA_LINE_REPORT_DIR','/tmp/era-separation-02-0362/browser'));out.mkdir(parents=True,exist_ok=True)
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {fullLineDiagram} from './content/line-diagrams.mjs';console.log(JSON.stringify(fullLineDiagram))"],text=True))
errors=[];failures=[];report={'widths':[],'screenshots':False}
from line_tooltip_checks import assert_tooltip_clearance

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,390,768,1024,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},has_touch=width<768,reduced_motion='reduce')
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failures.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
  page.goto(base+'/catalog/lines/separatsiya-02/');page.wait_for_selector('[data-monitor-ready=true]')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  root=page.locator('.line-monitor');viewport=root.locator('[data-diagram-viewport]');select=root.locator('[data-diagram-select]')
  assert root.get_attribute('data-construction-finish')=='light-engineering'
  assert root.locator('.diagram-heading h3').inner_text()=='Линия изнутри. В деталях.'
  assert root.locator('.diagram-canvas').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(228, 233, 237)'
  assert root.evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(244, 242, 237)'
  hero=page.locator('[data-hero-finish=titanium-gallery]');hero.locator('img').evaluate('(e)=>e.decode()')
  assert hero.locator('img').get_attribute('src').endswith('/lines/separatsiya-01/catalog-cover.webp')
  assert hero.locator('img').evaluate('(e)=>getComputedStyle(e).objectFit==="contain"&&getComputedStyle(e).filter==="none"')
  assert page.locator('#equipment [data-catalogue-image]').count()==5
  for card in page.locator('#equipment [data-catalogue-image]').all():
   slug=card.get_attribute('data-catalogue-image');image=card.locator('img')
   assert image.get_attribute('src').endswith('/catalogue/equipment/'+slug+'.webp')
   assert image.evaluate('(e)=>getComputedStyle(e).objectFit==="contain"&&getComputedStyle(e).filter==="none"')
  if width in [390,1440]:
   hero.locator('.media-open').click();page.wait_for_selector('#media-viewer[open]')
   assert page.locator('#viewer-image').get_attribute('src').endswith('/lines/separatsiya-01/catalog-cover.webp')
   page.keyboard.press('Escape');assert not page.locator('#media-viewer').is_visible()
  assert page.locator('[data-diagram]').count()==1 and select.locator('option').count()==27
  assert root.locator('[data-fullscreen-zoom]').is_hidden()
  assert root.locator('[data-line-leader]').count()==28
  assert root.locator('[data-leader-join]').count()==0
  assert root.locator('[data-callout-hit]').count()==28
  assert root.locator('.guide-end').count()==28
  assert root.locator('.line-diagram-pin-masks').count()==0
  assert root.locator('[data-part] span').count()==28
  assert root.locator('[data-part]').count()==28
  assert viewport.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1&&getComputedStyle(e).overflow==="visible"')
  select.scroll_into_view_if_needed();page.wait_for_timeout(60)
  y=page.evaluate('scrollY');height=root.bounding_box()['height']
  for part in data['parts']:
   select.select_option(str(part['number']))
   assert abs(page.evaluate('scrollY')-y)<=1,('selection moved page',width,part['number'])
   assert abs(root.bounding_box()['height']-height)<=1,('console changed height',width,part['number'])
   assert root.locator('[data-detail-label]').inner_text()==part['label']
   assert root.locator('[data-detail-description]').inner_text()==part['description']
   active=root.locator('[data-part-guide][data-active=true]');assert active.count()==1
   assert active.get_attribute('data-part-guide')==str(part['number'])
   assert active.locator('.diagram-part-region').count()==len(part['regions'])
   assert viewport.evaluate('(e)=>e.scrollLeft===0&&e.scrollTop===0')
   assert root.locator('.diagram-details').evaluate('(e)=>e.scrollHeight<=e.clientHeight+1'),(width,part['number'],'console overflow')
  # Every supplied callout has an immediate short tooltip, including both 27 instances.
  tooltip=root.locator('[role=tooltip]')
  for part in data['parts']:
   for callout in part['callouts']:
    button=root.locator('button[data-callout="'+callout['id']+'"]')
    button.scroll_into_view_if_needed()
    if width<768:button.tap()
    else:
     page.mouse.move(1,1);button.hover()
    tooltip.wait_for(state='visible')
    assert root.get_attribute('data-selected-callout')==callout['id']
    assert tooltip.locator('[data-tip-description]').inner_text()==callout['tooltipDescription']
    assert tooltip.locator('[data-tip-label]').inner_text()==str(part['number']).zfill(2)+' · '+callout['tooltipLabel']
    assert button.get_attribute('aria-describedby')=='line02-construction-tooltip'
    assert_tooltip_clearance(tooltip,width,(width,callout['id']))
    if width>=768:
     page.mouse.move(1,1);assert not tooltip.is_visible()
  # A real click on a full vector path chooses that callout, rather than a neighbour.
  path=root.locator('[data-callout-hit="17"]');path.scroll_into_view_if_needed()
  point=path.evaluate('''e=>{const m=e.getScreenCTM();for(const fraction of [.2,.35,.5,.65,.8]){const q=e.getPointAtLength(e.getTotalLength()*fraction),p=new DOMPoint(q.x,q.y).matrixTransform(m);if(p.y>180&&p.y<innerHeight-10&&p.x>2&&p.x<innerWidth-2&&document.elementFromPoint(p.x,p.y)===e)return {x:p.x,y:p.y};}return null;}''')
  assert point,(width,'no visible guide hit');page.mouse.click(point['x'],point['y'])
  assert root.get_attribute('data-selected-callout')=='17' and tooltip.is_visible()
  assert_tooltip_clearance(tooltip,width,(width,'click on guide 17'))
  root.locator('.diagram-heading h3').click();assert not tooltip.is_visible()
  # Real keyboard/pointer interaction on the original numbered callouts.
  pin=root.locator('[data-part="4"]').first;pin.scroll_into_view_if_needed();y=page.evaluate('scrollY')
  pin.evaluate('(e)=>e.focus({preventScroll:true})');assert select.input_value()=='4'
  page.keyboard.press('ArrowRight');assert select.input_value()=='5'
  page.keyboard.press('End');assert select.input_value()=='27'
  assert abs(page.evaluate('scrollY')-y)<=1
  if width>=768:
   pin.hover();assert select.input_value()=='4'
  else:
   pin.tap();assert select.input_value()=='4'
  for number,regions in [('20',5),('25',4),('27',2)]:
   select.select_option(number);assert root.locator('[data-part-guide][data-active=true] .diagram-part-region').count()==regions
  # Normal dragging does not capture the pointer or pan the image.
  viewport.scroll_into_view_if_needed();box=viewport.bounding_box()
  page.mouse.move(box['x']+box['width']*.5,box['y']+min(30,box['height']*.4));page.mouse.down();page.mouse.move(box['x']+box['width']*.3,box['y']+min(30,box['height']*.4));page.mouse.up()
  assert viewport.evaluate('(e)=>e.scrollLeft===0&&e.scrollTop===0') and root.get_attribute('data-diagram-dragging') is None
  expand=root.locator('[data-diagram-fullscreen]');expand.click();page.wait_for_function('document.querySelector(".line-monitor").dataset.expanded==="true"')
  assert root.locator('[data-diagram-zoom]').input_value()=='fit'
  assert viewport.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2&&e.scrollHeight<=e.clientHeight+2'),('fullscreen fit',width)
  # In expanded fit mode every tooltip still clears the equipment and active paths.
  for part in data['parts']:
   for callout in part['callouts']:
    button=root.locator('button[data-callout="'+callout['id']+'"]')
    stable=viewport.bounding_box()
    if width<768:button.tap()
    else:
     page.mouse.move(1,1);button.hover()
    tooltip.wait_for(state='visible')
    assert root.get_attribute('data-selected-callout')==callout['id']
    assert tooltip.locator('[data-tip-description]').inner_text()==callout['tooltipDescription']
    assert_tooltip_clearance(tooltip,width,(width,callout['id'],'fullscreen fit'))
    after=viewport.bounding_box()
    assert abs(after['width']-stable['width'])<=1 and abs(after['height']-stable['height'])<=1
    if width>=768:page.mouse.move(1,1)
  before=root.locator('.diagram-projection').bounding_box()['width']
  root.locator('[data-diagram-zoom]').select_option('2');assert root.locator('.diagram-projection').bounding_box()['width']>=before*1.99
  for key in ['08','09','15','27-loading','27-unloading']:
   button=root.locator('button[data-callout="'+key+'"]');button.scroll_into_view_if_needed()
   if width<768:button.tap()
   else:
    page.mouse.move(1,1);button.hover()
   tooltip.wait_for(state='visible')
   assert root.get_attribute('data-selected-callout')==key
   assert_tooltip_clearance(tooltip,width,(width,key,'fullscreen 200%'))
   if width>=768:page.mouse.move(1,1)
  select.select_option('27');assert root.locator('[data-detail-label]').inner_text()==data['parts'][-1]['label']
  if width<768:
   root.locator('[data-diagram-zoom]').select_option('detail')
   assert root.locator('.diagram-projection').bounding_box()['width']>=1199
   outer=page.evaluate('scrollY')
   for direction,expected in [('start','27-loading'),('end','27-unloading')]:
    viewport.evaluate('(e,d)=>{e.scrollLeft=d==="start"?0:e.scrollWidth-e.clientWidth;e.scrollTop=d==="start"?e.scrollHeight-e.clientHeight:0}',direction)
    nearest=root.locator('button[data-part="27"]').evaluate_all('''es=>{const v=document.querySelector('#line02-construction [data-diagram-viewport]').getBoundingClientRect();return es.map(e=>{const p=e.getBoundingClientRect();return {id:e.dataset.callout,d:Math.hypot(p.left+p.width/2-v.left-v.width/2,p.top+p.height/2-v.top-v.height/2)}}).sort((a,b)=>a.d-b.d)[0].id;}''')
    assert nearest==expected
    select.select_option('27');assert root.get_attribute('data-selected-callout')==expected
    assert page.evaluate('scrollY')==outer
    root.locator('button[data-callout="'+expected+'"]').tap()
    assert_tooltip_clearance(tooltip,width,(width,expected,'zoomed'))

  if width in [390,1440]:page.keyboard.press('Escape')
  else:expand.click()
  page.wait_for_function('document.querySelector(".line-monitor").dataset.expanded==="false"')
  assert expand.evaluate('(e)=>document.activeElement===e')
  assert page.locator('body').evaluate('(e)=>getComputedStyle(e).overflow')!='hidden'
  # A0 tabs switch actual source projections and support keyboard navigation.
  tabs=page.locator('[data-dimension-tab]');stage=page.locator('.line-dimensions-stage');stage_height=stage.bounding_box()['height']
  for i,view in enumerate(['top','side-1','side-2','sheet']):
   page.locator('[data-dimension-tab='+view+']').click()
   panel=page.locator('#dimension-view-'+view);assert panel.is_visible()
   assert page.locator('[role=tabpanel]:visible').count()==1
   panel.locator('img').wait_for();panel.locator('img').evaluate('(e)=>e.decode()')
   assert panel.locator('img').evaluate('(e)=>e.naturalWidth>=3200&&getComputedStyle(e).objectFit==="contain"')
   assert stage.bounding_box()['height']==stage_height
  page.locator('[data-dimension-tab=sheet]').press('Home');assert page.locator('[data-dimension-tab=top]').get_attribute('aria-selected')=='true'
  page.keyboard.press('ArrowRight');assert page.locator('[data-dimension-tab=side-1]').get_attribute('aria-selected')=='true'
  # Existing shared PDF viewer: a real A0 page, zoom, fit, SHA-checked download, focus and Escape.
  opener=page.locator('.line-dimensions-actions [data-pdf-open]');opener.click()
  page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 1 из 1"',timeout=30000)
  pdf=page.locator('#pdf-viewer');assert pdf.locator('[data-pdf-next]').is_disabled()
  assert pdf.locator('[data-pdf-canvas]').evaluate('(e)=>e.getBoundingClientRect().width<=document.querySelector("[data-pdf-stage]").clientWidth')
  initial=pdf.locator('[data-pdf-scale]').inner_text();pdf.locator('[data-pdf-zoom-in]').click()
  page.wait_for_function('(old)=>document.querySelector("[data-pdf-scale]").textContent!==old',arg=initial)
  pdf.locator('[data-pdf-fit]').click();page.wait_for_function('(old)=>document.querySelector("[data-pdf-scale]").textContent===old',arg=initial)
  if width in [390,1440]:
   with page.expect_download() as info:pdf.locator('[data-pdf-download]').click()
   path=out/'a0.pdf';info.value.save_as(path);assert sha256(path.read_bytes()).hexdigest()=='8557bce36e8963146ec9fd33d11295c4483e2e4d4106f19ae41e7c50c39f98d0';path.unlink()
  page.keyboard.press('Escape');assert not pdf.is_visible();assert opener.evaluate('(e)=>document.activeElement===e')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('#documents [data-library-document]').count()==3
  assert page.locator('#equipment .line-unit-grid article').count()>5
  report['widths'].append(width);context.close();print('Full line, 27 positions, 4 A0 views, PDF and fullscreen:',width,'OK',flush=True)
 # Explicitly test unavailable Fullscreen API and rejected request fallback, Escape and body/focus cleanup.
 for mode in ['unavailable','rejected']:
  context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
  context.add_init_script("Object.defineProperty(Element.prototype,'requestFullscreen',{value:"+("undefined" if mode=='unavailable' else "()=>Promise.reject(new Error('unavailable'))")+",configurable:true});")
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/catalog/lines/separatsiya-02/');page.wait_for_selector('[data-monitor-ready=true]')
  expand=page.locator('.line-monitor [data-diagram-fullscreen]');expand.click();assert page.locator('.line-monitor-modal[open]').is_visible()
  page.locator('[data-diagram-select]').select_option('20');assert page.locator('[data-detail-label]').inner_text()==data['parts'][19]['label']
  page.keyboard.press('Escape');assert page.locator('.line-monitor-modal').count()==0
  assert expand.evaluate('(e)=>document.activeElement===e')
  assert page.locator('body').evaluate('(e)=>getComputedStyle(e).overflow')!='hidden'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');context.close()
 # Both lines opt into one fit controller; equipment nodes retain their own interface.
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/catalog/lines/separatsiya-01/');page.wait_for_selector('#line01-construction[data-monitor-ready=true]');assert page.locator('[data-diagram-mode=fit]').count()==1
 mini=page.locator('[data-line-diagram=separatsiya-01]');mini.locator('[data-diagram-select]').select_option('11')
 assert mini.locator('[data-detail-label]').inner_text() and mini.locator('[data-diagram-tooltip]').is_hidden()
 assert mini.locator('[data-line-leader]').count()==11 and mini.locator('.line-diagram-pin-masks').count()==0
 mini.locator('button[data-callout="11"]').click();assert mini.locator('[data-diagram-tooltip]').is_visible()
 assert page.locator('[data-line-source-diagram]').count()==0
 page.goto(base+'/catalog/equipment/ballisticheskiy-separator/');node=page.locator('[data-diagram]');node.locator('[data-part]').first.focus();assert node.locator('[data-diagram-tooltip]').is_visible()
 context.close()
 # No-JS PDF fallbacks remain genuine links and downloads.
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=context.new_page();page.goto(base+'/catalog/lines/separatsiya-02/')
 assert page.locator('#dimension-view-top').is_visible()
 assert page.locator('#documents [download]').count()==3
 assert page.locator('.line-dimensions-actions [download]').get_attribute('href').endswith('/drawings/era-separatsiya-02-dimensions-a0.pdf')
 context.close();browser.close()
assert not errors,errors
assert not failures,failures
report.update({'fallbackFullscreen':['unavailable','rejected'],'legacyMiniAndNode':True,'pageErrors':errors,'failedResponses':failures})
out.joinpath('results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Line and A0 acceptance passed:',out/'results.json',flush=True)
