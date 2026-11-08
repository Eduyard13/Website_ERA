"""Ordinary document scrolling, restored homepage and contextual reading position."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3029/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-scroll-030/browser'));out.mkdir(parents=True,exist_ok=True)
errors=[];failed=[];inventory=[]
expected={'/':8,'/technology/':15,'/automation/':9,'/economics/':9,'/catalog/':2,'/catalog/equipment/':2,'/catalog/lines/':2,'/media/':2,'/documents/':2,'/contacts/':2}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda response:failed.append((response.status,response.url)) if response.status>=400 and response.url.startswith(base) else None)
 def load(path='/'):
  page.goto(base+path);page.wait_for_selector('.page-progress-rail a',state='attached')
 def wait_active(number):
  page.wait_for_function('(n)=>document.querySelector(".page-progress-rail").dataset.activeSection===String(n)',arg=number)
 def jump(number):
  page.locator('.page-progress-rail a').nth(number-1).click();wait_active(number)
 # The original styles and free scroll are restored, even through old slide URLs.
 for query in ['', '?view=slides', '?view=scroll']:
  load('/'+query)
  assert page.locator('html').get_attribute('data-home-view') is None
  assert page.locator('html').evaluate('e=>getComputedStyle(e).scrollSnapType')=='none'
  assert page.locator('.home-slide-tools,.home-slide-rail').count()==0
  assert page.locator('.resource-process').evaluate('e=>getComputedStyle(e).display')=='block'
  assert page.locator('.resource-process-steps>li').count()==4
  assert page.locator('.resource-product').first.evaluate('e=>getComputedStyle(e).display+"/"+getComputedStyle(e).flexDirection')=='flex/column'
  page.mouse.move(500,300);page.mouse.wheel(0,120);page.wait_for_timeout(180)
  assert 100<=page.evaluate('scrollY')<=140,('wheel was changed',page.evaluate('scrollY'))
 # The page outline follows the existing content on every rendered page.
 paths=[]
 for file in sorted(Path('dist').rglob('*.html')):
  relative=file.relative_to('dist').as_posix()
  if relative in ['about/index.html','ai/index.html']:continue
  paths.append('/404.html' if relative=='404.html' else '/'+relative.removesuffix('index.html'))
 for path in paths:
  load(path)
  links=page.locator('.page-progress-rail a');count=links.count()
  assert count>0,path
  if path in expected:assert count==expected[path],(path,count)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),path
  assert links.evaluate_all('links=>links.every(a=>a.getAttribute("aria-label").length>4&&document.getElementById(decodeURIComponent(a.hash.slice(1))))'),path
  labels=links.evaluate_all(r'links=>links.map(a=>a.getAttribute("aria-label").replace(/^\d+\.\s*/,""))')
  assert len(set(labels))==count,(path,'repeated section labels',labels)
  inventory.append({'path':path,'sections':count,'labels':links.evaluate_all('links=>links.map(a=>a.getAttribute("aria-label"))')})
 print('Contextual outline and valid targets:',len(inventory),'pages OK',flush=True)
 # All eight homepage markers track normal document positions in both directions.
 load();assert page.locator('.page-progress-rail').get_attribute('data-tone')=='dark'
 for number in range(2,9):jump(number)
 for number in [7,6,3,2,1]:jump(number)
 jump(6);assert '#resource-business-title' in page.url and '/economics/' not in page.url
 jump(2);assert page.locator('.page-progress-rail').get_attribute('data-tone')=='light'
 # Keyboard links preserve focus. No focus trap or keyboard scrolling replacement.
 page.locator('.page-progress-rail a').nth(2).focus();page.keyboard.press('Enter');wait_active(3)
 assert page.locator('.page-progress-rail a').nth(2).evaluate('e=>e===document.activeElement')
 # Each major page has different labels and highlights its own sections.
 for path,filename in [('/technology/','technology'),('/automation/','control'),('/economics/','economics'),('/catalog/lines/separatsiya-01/','line-01'),('/catalog/lines/separatsiya-02/','line-02'),('/catalog/equipment/predvaritelnyy-izmelchitel/','equipment')]:
  load(path);count=page.locator('.page-progress-rail a').count()
  jump(max(2,count//2));page.screenshot(path=str(out/(filename+'-1440.png')))
  jump(count);jump(1)
 # Newly generated targets work when reloading a shared link.
 load('/catalog/equipment/predvaritelnyy-izmelchitel/');jump(page.locator('.page-progress-rail a').count())
 assert '#page-section-' in page.url
 current=page.locator('.page-progress-rail').get_attribute('data-active-section')
 page.reload();page.wait_for_selector('.page-progress-rail a');wait_active(int(current))
 # Lists retain filters; hidden cards do not become navigation chapters.
 load('/catalog/equipment/');page.locator('.filters input').first.fill('бункер');page.wait_for_timeout(100)
 assert page.locator('.page-progress-rail a').count()==2
 assert 'Каталог узлов' in page.locator('.page-progress-rail a').nth(1).get_attribute('aria-label')
 load('/documents/');assert 'Документы оборудования' in page.locator('.page-progress-rail a').nth(1).get_attribute('aria-label')
 load('/media/');assert 'Фото и видео' in page.locator('.page-progress-rail a').nth(1).get_attribute('aria-label')
 # Modals, real media and the footer retain their original controls.
 load();page.locator('.resource-hero a[data-project-request]').click();assert not page.locator('.page-progress-rail').is_visible();page.keyboard.press('Escape')
 page.locator('[data-menu-toggle]').click();assert not page.locator('.page-progress-rail').is_visible();page.keyboard.press('Escape')
 jump(5);page.locator('.resource-evidence-grid .media-open').first.click();assert not page.locator('.page-progress-rail').is_visible();page.keyboard.press('Escape')
 assert page.locator('[data-video-slot=cleaningDemo] video').get_attribute('controls') is not None
 page.evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');page.wait_for_timeout(100)
 assert page.locator('footer').is_visible()
 assert page.locator('.page-progress-rail').get_attribute('data-active-section')=='8'
 # No-JS geometry matches the restored ordinary layout with the indicator enabled.
 load();page.locator('img[loading=lazy]').evaluate_all('images=>images.forEach(image=>image.loading="eager")')
 page.wait_for_function('[...document.images].filter(i=>i.id!=="viewer-image").every(i=>i.complete&&i.naturalWidth>0)')
 geometry=page.locator('[data-home-block]').evaluate_all('es=>es.map(e=>Math.round(e.getBoundingClientRect().height))')
 page.screenshot(path=str(out/'homepage-1440.png'))
 static=browser.new_context(java_script_enabled=False,viewport={'width':1440,'height':900});plain=static.new_page();plain.goto(base+'/')
 plain.locator('img[loading=lazy]').evaluate_all('images=>images.forEach(image=>image.loading="eager")')
 plain.wait_for_function('[...document.images].filter(i=>i.id!=="viewer-image").every(i=>i.complete&&i.naturalWidth>0)')
 assert plain.locator('[data-home-block]').evaluate_all('es=>es.map(e=>Math.round(e.getBoundingClientRect().height))')==geometry
 assert plain.locator('.page-progress-rail').count()==0;static.close()
 # A narrow reading indicator stays in the existing margin on mobile pages.
 mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mp=mobile.new_page()
 mp.on('pageerror',lambda error:errors.append(str(error)))
 for width in [320,390,768]:
  mp.set_viewport_size({'width':width,'height':844})
  for path in ['/','/technology/','/economics/','/catalog/equipment/','/catalog/lines/separatsiya-01/']:
   mp.goto(base+path);mp.wait_for_selector('.page-progress-rail a')
   assert mp.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,path)
   rail=mp.locator('.page-progress-rail').bounding_box();head=mp.locator('.site-header').bounding_box()
   assert rail['x']>=width-34 and rail['x']+rail['width']<=width and rail['y']>=head['height']-1 and rail['y']+rail['height']<=844,(width,path,rail)
   mp.locator('.page-progress-rail a').nth(1).click();mp.wait_for_function('document.querySelector(".page-progress-rail").dataset.activeSection==="2"')
   if width==390 and path in ['/','/technology/']:mp.screenshot(path=str(out/('mobile-home.png' if path=='/' else 'mobile-technology.png')))
 mobile.close()
 assert not errors,errors;assert not failed,failed
 (out/'results.json').write_text(json.dumps({'pages':inventory,'freeScroll':True,'legacySlideURLsIgnored':True,'originalGeometry':geometry,'keyboard':True,'modals':True,'footer':True,'mobileWidths':[320,390,768],'errors':errors,'failedLocalResponses':failed},ensure_ascii=False,indent=2))
 print('Ordinary scrolling, original layout, navigation, mobile, modals and no-JS: OK',flush=True)
 browser.close()
