"""Exercise the actual diagram with mouse, keyboard, touch and fullscreen."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3008/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-diagram-screenshots'));out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 for width in [360,768,1440]:
  context=browser.new_context(viewport={'width':width,'height':1000},has_touch=width==360,reduced_motion='reduce')
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/catalog/equipment/predvaritelnyy-izmelchitel/#construction')
  page.wait_for_function('Array.from(document.images).every(i=>i.loading==="lazy"||i.complete)')
  root=page.locator('[data-diagram]');root.scroll_into_view_if_needed()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert root.locator('[data-part]').count()==12
  assert root.locator('.diagram-projection image').count()==2
  assert page.locator('.equipment-scheme').count()==0
  assert page.locator('.equipment-quick-specs .metric-missing').count()==0
  for part in range(1,13):
   root.locator('[data-diagram-select]').select_option(str(part))
   pin=root.locator(f'[data-part="{part}"]')
   assert pin.is_visible()
   assert pin.get_attribute('aria-pressed')=='true'
   assert root.locator('[data-detail-label]').inner_text()==pin.get_attribute('data-label')
   if width==360:pin.tap()
   else:pin.hover()
   tip=root.locator('[data-diagram-tooltip]')
   assert tip.is_visible(),(width,part)
   assert tip.locator('strong').inner_text()==pin.get_attribute('data-label')
   assert root.locator(f'[data-part-guide="{part}"]').get_attribute('data-active')=='true'
   box=tip.bounding_box()
   assert box['x']>=0 and box['x']+box['width']<=width+1
  root.locator('[data-diagram-select]').select_option('9')
  assert 'доступа к ножам' in root.locator('[data-detail-description]').inner_text()
  root.locator('[data-diagram-select]').select_option('12')
  assert 'рабочий зазор' in root.locator('[data-detail-description]').inner_text()
  root.locator('[data-view-switch=closed]').click()
  assert root.get_attribute('data-view')=='closed'
  if width==360:assert not root.locator('[data-diagram-view=open]').is_visible()
  root.locator('[data-part="1"]').focus()
  assert root.locator('[data-diagram-tooltip]').is_visible()
  page.keyboard.press('Escape')
  assert not root.locator('[data-diagram-tooltip]').is_visible()
  root.locator('[data-view-switch=open]').click()
  root.locator('[data-part="3"]').focus()
  page.screenshot(path=str(out/f'shredder-scheme-{width}.png'))
  root.locator('[data-diagram-fullscreen]').click()
  page.wait_for_function('document.fullscreenElement===document.querySelector("[data-diagram]")')
  root.locator('[data-diagram-select]').select_option('5')
  assert root.locator('[data-part="5"]').is_visible()
  page.screenshot(path=str(out/f'shredder-fullscreen-{width}.png'))
  root.locator('[data-diagram-fullscreen]').click()
  page.wait_for_function('!document.fullscreenElement')
  assert not errors,errors
  print('12 native markers, detail text, touch/hover, keyboard, view switching and fullscreen:',width,'OK',flush=True)
  context.close()
 browser.close()
