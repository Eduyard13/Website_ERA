"""Eight chapter stops, gesture isolation, ordinary scroll and overflow safety."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3029/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-slides-029/browser'));out.mkdir(parents=True,exist_ok=True)
errors=[];failed=[];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 def load(url='/'):
  page.goto(base+url);page.wait_for_selector('.home-slide-tools')
 def wait_slide(n):
  page.wait_for_function('(n)=>document.querySelector("[data-resource-home]").dataset.activeSlide===String(n)',arg=n)
  page.wait_for_function('(n)=>Math.abs(document.querySelectorAll("[data-home-block]")[n-1].getBoundingClientRect().top-document.querySelector(".site-header").getBoundingClientRect().height)<3',arg=n)
 load();assert page.locator('html').get_attribute('data-home-view')=='slides'
 assert page.locator('.home-slide-rail a').count()==8
 assert page.locator('[data-slide-counter]').inner_text()=='01 / 08'
 assert page.locator('[data-slide-prev]').is_disabled()
 # One wheel gesture and its momentum must land on only one next panel.
 page.mouse.move(500,300)
 for _ in range(8):page.mouse.wheel(0,100)
 wait_slide(2);page.wait_for_timeout(400)
 assert page.locator('[data-slide-counter]').inner_text()=='02 / 08'
 for n in range(3,9):
  page.mouse.wheel(0,170);wait_slide(n);page.wait_for_timeout(360)
 assert page.locator('.home-slide-rail [aria-current=location]').get_attribute('data-slide-to')=='7'
 # The real footer remains reachable after the eighth panel.
 page.locator('[data-slide-next]').click();page.wait_for_function('document.querySelector("footer").getBoundingClientRect().bottom<=innerHeight+3')
 page.wait_for_function('document.querySelector(".home-slide-rail").hidden')
 assert not page.locator('.home-slide-rail').is_visible()
 assert page.locator('footer').is_visible()
 load();page.locator('.home-slide-rail [data-slide-to="5"]').click();wait_slide(6)
 assert page.url.endswith('#resource-business-title') and '/economics' not in page.url
 assert page.locator('.resource-business').get_by_role('link',name='Изучить экономику проекта',exact=True).get_attribute('href').endswith('/economics')
 # Keyboard navigation and PageDown use normal focus and native scroll snapping.
 load();page.locator('.home-slide-rail [data-slide-to="2"]').focus();page.keyboard.press('Enter');wait_slide(3)
 assert page.locator('.home-slide-rail [data-slide-to="2"]').evaluate('e=>e===document.activeElement')
 load();page.locator('body').click(position={'x':10,'y':100});page.keyboard.press('PageDown');wait_slide(2)
 # Open modal, lightbox and native video controls retain their own input.
 load();page.locator('.resource-hero a[data-project-request]').click()
 before=page.evaluate('scrollY');page.mouse.wheel(0,1000);page.wait_for_timeout(100);assert page.evaluate('scrollY')==before
 assert not page.locator('.home-slide-tools').is_visible();page.keyboard.press('Escape')
 page.locator('.home-slide-rail [data-slide-to="4"]').click();wait_slide(5)
 page.locator('.resource-evidence-grid .media-open').first.click();assert page.locator('#media-viewer').is_visible();page.keyboard.press('Escape')
 assert page.locator('[data-video-slot=cleaningDemo] video').get_attribute('controls') is not None
 assert page.locator('[data-video-slot=promo] video').count()==0
 # Freely scrolling is available as an explicit, shareable comparison mode.
 page.locator('[data-slide-mode]').click()
 assert page.locator('html').get_attribute('data-home-view')=='scroll' and 'view=scroll' in page.url
 assert not page.locator('.home-slide-rail').is_visible()
 assert page.locator('html').evaluate('e=>getComputedStyle(e).scrollSnapType')=='none'
 page.locator('[data-slide-mode]').click();assert page.locator('html').get_attribute('data-home-view')=='slides'
 load('/?view=scroll');assert page.locator('html').get_attribute('data-home-view')=='scroll'
 # All content and media stay present in both layouts; eight desktop frames fit.
 for width,height in [(1280,800),(1440,900),(1920,1080)]:
  page.set_viewport_size({'width':width,'height':height});load('/?view=slides')
  page.locator('img[loading=lazy]').evaluate_all('images=>images.forEach(i=>i.loading="eager")')
  page.wait_for_function('[...document.images].filter(i=>i.id!=="viewer-image").every(i=>i.complete&&i.naturalWidth>0)')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('h1').count()==1 and page.locator('[data-home-block]').count()==8
  for i in range(8):
   page.locator(f'.home-slide-rail [data-slide-to="{i}"]').click();wait_slide(i+1)
   panel=page.locator('[data-home-block]').nth(i)
   assert panel.evaluate('e=>e.scrollHeight<=e.clientHeight+2')
   if width==1440:
    assert panel.bounding_box()['height']<=height-page.locator('.site-header').bounding_box()['height']+3
    page.screenshot(path=str(out/f'slide-{i+1:02}-{width}.png'))
  results.append({'width':width,'height':height,'sections':8,'overflow':False})
  print('Eight presentation panels, controls and overflow:',width,'OK',flush=True)
 # Small screens and large text keep long panels readable, with native touch.
 mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mp=mobile.new_page()
 mp.goto(base+'/?view=slides');mp.wait_for_selector('.home-slide-tools')
 assert not mp.locator('.home-slide-rail').is_visible()
 mp.mouse.wheel(0,240);mp.wait_for_timeout(200)
 assert mp.evaluate('scrollY')>0
 for width in [320,390,768]:
  mp.set_viewport_size({'width':width,'height':844});mp.goto(base+'/?view=slides')
  assert mp.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert mp.locator('[data-home-block]').evaluate_all('es=>es.every(e=>e.scrollHeight<=e.clientHeight+2)')
  mp.locator('[data-slide-next]').click();mp.wait_for_function('document.querySelector("[data-resource-home]").dataset.activeSlide==="2"')
  assert mp.locator('[data-slide-counter]').inner_text()=='02 / 08'
  if width==390:mp.screenshot(path=str(out/'mobile-slide-02.png'))
 mobile.close()
 # Non-reduced motion animates the transition; the target settles after one gesture.
 animated=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='no-preference');ap=animated.new_page();ap.goto(base+'/?view=slides');ap.wait_for_selector('.home-slide-tools');ap.mouse.move(500,300);ap.mouse.wheel(0,160)
 ap.wait_for_function('document.querySelector("[data-resource-home]").dataset.activeSlide==="2"');ap.wait_for_function('Math.abs(document.querySelectorAll("[data-home-block]")[1].getBoundingClientRect().top-document.querySelector(".site-header").getBoundingClientRect().height)<3')
 animated.close()
 static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});plain=static.new_page();plain.goto(base+'/')
 assert plain.locator('.home-slide-tools').count()==0 and plain.locator('[data-home-block]').count()==8
 assert plain.locator('html').evaluate('e=>getComputedStyle(e).scrollSnapType')=='none';static.close()
 page.goto(base+'/economics/');assert page.locator('.home-slide-tools').count()==0;assert page.locator('[data-widget-switch]').count()==4
 assert not errors,errors;assert not failed,failed
 (out/'results.json').write_text(json.dumps({'desktop':results,'singleGesture':True,'ordinaryMode':True,'keyboard':True,'modals':True,'mobile':True,'reducedMotion':True,'staticFallback':True,'errors':errors,'failedLocalResponses':failed},ensure_ascii=False,indent=2))
 print('Gestures, footer, keyboard, modals, comparison mode, mobile and no-JS: OK',flush=True);browser.close()
