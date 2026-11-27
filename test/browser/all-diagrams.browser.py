"""Verify every native callout on every node, including multi-view cutaways."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,subprocess

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3009/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-all-diagrams'));out.mkdir(parents=True,exist_ok=True)
nodes=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {nodes} from './content/catalog.mjs';console.log(JSON.stringify(nodes.map(n=>({slug:n.slug,title:n.title,diagram:n.diagram}))))"],text=True))
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 for width in [360,768,1440]:
  context=browser.new_context(viewport={'width':width,'height':1000},has_touch=width==360,reduced_motion='reduce')
  page=context.new_page();errors=[];failed=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and '/assets/' in r.url else None)
  for n in nodes:
   page.goto(base+'/catalog/equipment/'+n['slug']+'/#construction')
   root=page.locator('[data-diagram]');root.scroll_into_view_if_needed()
   assert root.locator('[data-part]').count()==len(n['diagram']['parts'])
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,n['slug'])
   for part in n['diagram']['parts']:
    num=part['number'];root.locator('[data-diagram-select]').select_option(str(num))
    pin=root.locator(f'[data-part="{num}"]');assert pin.is_visible(),(n['slug'],width,num)
    if width==360:pin.tap()
    else:pin.hover()
    assert pin.get_attribute('aria-pressed')=='true'
    assert root.locator('[data-tip-label]').inner_text()==part['label'],(n['slug'],width,num)
    assert root.locator('[data-detail-label]').inner_text()==part['label']
    assert root.locator('[data-diagram-tooltip]').is_visible(),(n['slug'],width,num)
    box=root.locator('[data-diagram-tooltip]').bounding_box()
    assert box['x']>=-1 and box['x']+box['width']<=width+1
   # All views can also be selected explicitly; keyboard focus remains usable.
   for view in n['diagram']['views']:
    if len(n['diagram']['views'])>1:root.locator(f'[data-view-switch="{view["id"]}"]').click()
    first=next(part for part in n['diagram']['parts'] if part['view']==view['id'])
    pin=root.locator(f'[data-part="{first["number"]}"]');pin.focus()
    assert root.locator('[data-diagram-tooltip]').is_visible()
    page.keyboard.press('Escape');assert not root.locator('[data-diagram-tooltip]').is_visible()
    page.locator(f'[data-diagram-view="{view["id"]}"]').scroll_into_view_if_needed()
    page.screenshot(path=str(out/f'{n["slug"]}-{view["id"]}-{width}.png'))
   if n['slug'] in ['vertikalno-rotornyy-izmelchitel','rama-napolnitel','kapsulyator']:
    root.locator('[data-diagram-fullscreen]').click()
    page.wait_for_function('!!document.fullscreenElement')
    root.locator('[data-diagram-select]').select_option(str(n['diagram']['parts'][0]['number']))
    assert root.locator('[data-detail-label]').inner_text()==n['diagram']['parts'][0]['label']
    root.locator('[data-diagram-fullscreen]').click();page.wait_for_function('!document.fullscreenElement')
   print(n['slug'],width,len(n['diagram']['parts']),'callouts OK',flush=True)
  assert not errors,errors;assert not failed,failed
  context.close()
 browser.close()
