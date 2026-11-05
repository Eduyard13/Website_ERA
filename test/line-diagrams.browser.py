"""All source line callouts: object highlight, function, mouse/touch, pan and fullscreen."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,subprocess

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3024/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-line-interaction-023'));out.mkdir(parents=True,exist_ok=True)
diagrams=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {lineDiagrams} from './content/line-diagrams.mjs';console.log(JSON.stringify(lineDiagrams));"],text=True))
results=[]
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 for width in [320,390,768,1024,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},has_touch=width<768,reduced_motion='reduce')
  page=context.new_page();errors=[];failed=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
  page.goto(base+'/catalog/lines/')
  mini=page.locator('[data-line-id=separatsiya-01]');full=page.locator('[data-line-id=separatsiya-02]')
  assert mini.evaluate('(e)=>getComputedStyle(e).backgroundImage')==full.evaluate('(e)=>getComputedStyle(e).backgroundImage')
  assert 'Цветной плёночный микс' in mini.inner_text() and 'Доп. опция' in mini.inner_text()
  assert 'По согласованию' in mini.inner_text() and '13 позиций' not in mini.inner_text()
  assert mini.locator('img').evaluate('(e)=>getComputedStyle(e).filter')=='none'
  if width in [390,1440]:page.locator('.line-grid').screenshot(path=str(out/f'catalogue-{width}.png'))
  for d in diagrams:
   page.goto(base+'/catalog/lines/'+d['slug']+'/#'+d['id'])
   root=page.locator('#'+d['id']);root.scroll_into_view_if_needed()
   assert root.locator('[data-part]').count()==sum(len(part['pins']) for part in d['parts'])
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,d['id'])
   for part in d['parts']:
    root.locator('[data-diagram-select]').select_option(str(part['number']))
    for pin in root.locator(f'[data-part="{part["number"]}"]').all():
     pin.focus()
     if width<768:pin.tap()
     else:pin.hover()
     tip=root.locator('[data-diagram-tooltip]')
     assert tip.is_visible(),(width,d['id'],part['number'])
     assert root.locator('[data-tip-label]').inner_text()==part['label']
     assert root.locator('[data-tip-description]').inner_text()==part['description']
     assert root.locator('[data-detail-description]').inner_text()==part['description']
     assert root.locator('[data-diagram-select]').input_value()==str(part['number'])
     active=root.locator('[data-part-guide][data-active=true]')
     assert active.count()==1 and active.get_attribute('data-part-guide')==str(part['number'])
     assert active.locator('.diagram-part-region').count()==len(part['regions'])
     assert active.locator('.diagram-part-region').first.evaluate('(e)=>getComputedStyle(e).stroke')!='rgba(0, 0, 0, 0)'
     box=tip.bounding_box();canvas=root.locator('.diagram-canvas').bounding_box()
     assert box['x']>=canvas['x']-1 and box['x']+box['width']<=canvas['x']+canvas['width']+1
     assert box['y']>=canvas['y']-1 and box['y']+box['height']<=canvas['y']+canvas['height']+1
   first=d['parts'][0]['number'];second=d['parts'][1]['number'];last=d['parts'][-1]['number']
   root.locator(f'[data-part="{first}"]').first.focus();page.keyboard.press('ArrowRight')
   assert root.locator('[data-diagram-select]').input_value()==str(second)
   page.keyboard.press('End');assert root.locator('[data-diagram-select]').input_value()==str(last)
   page.keyboard.press('Escape');assert not root.locator('[data-diagram-tooltip]').is_visible()
   initial_width=root.locator('.diagram-projection').bounding_box()['width']
   root.locator('[data-diagram-zoom]').select_option('2')
   projection=root.locator('.diagram-projection');assert projection.bounding_box()['width']>=initial_width*1.99
   viewport=root.locator('[data-diagram-viewport]');viewport.evaluate('(e)=>{e.scrollLeft=0;e.scrollTop=0}')
   if width>=768:
    viewport.scroll_into_view_if_needed();v=viewport.bounding_box();page.mouse.move(v['x']+180,v['y']+45);page.mouse.down();page.mouse.move(v['x']+50,v['y']+45,steps=5);page.mouse.up()
    assert viewport.evaluate('(e)=>e.scrollLeft')>40
   else:
    viewport.focus();before=viewport.evaluate('(e)=>e.scrollLeft');page.keyboard.press('ArrowRight');page.wait_for_timeout(150);assert viewport.evaluate('(e)=>e.scrollLeft')>=before
   root.locator('[data-diagram-zoom]').select_option('1')
   root.locator('[data-diagram-select]').select_option(str(d['defaultPart']))
   if width in [390,1440]:root.screenshot(path=str(out/f'{d["id"]}-{width}.png'))
   if width in [390,1440]:
    root.locator('[data-diagram-fullscreen]').click();page.wait_for_function('!!document.fullscreenElement')
    root.locator('[data-diagram-select]').select_option(str(last));assert root.locator('[data-detail-label]').inner_text()==d['parts'][-1]['label']
    assert root.locator('[data-diagram-tooltip]').is_visible()
    root.locator('[data-diagram-fullscreen]').click();page.wait_for_function('!document.fullscreenElement')
   if d['id']=='line02-workshop':
    main=page.locator('#line02-construction');previous=main.locator('[data-detail-label]').inner_text()
    root.locator('[data-diagram-select]').select_option('29');assert main.locator('[data-detail-label]').inner_text()==previous
   results.append({'width':width,'diagram':d['id'],'sourcePositions':len(d['parts']),'pins':root.locator('[data-part]').count(),'allTooltipsAndHighlights':'passed'})
   print(d['id'],width,len(d['parts']),'objects: hover/touch, descriptions, highlight, keyboard, pan and zoom OK',flush=True)
  assert not errors,errors;assert not failed,failed;context.close()
 browser.close()
(out/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
