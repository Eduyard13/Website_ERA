"""Real KAIR photos, carousel navigation, native fullscreen and timer behavior."""
from pathlib import Path
import json,os,subprocess
from playwright.sync_api import sync_playwright

repo=Path(__file__).resolve().parents[1]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3010/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/kair-slides-review'));out.mkdir(parents=True,exist_ok=True)
slides=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {kairSlides} from './content/kair.mjs'; console.log(JSON.stringify(kairSlides))"],cwd=repo,text=True))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[];failures=[];results=[]
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 for width in [320,390,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  for route in ['/','/automation']:
   assert page.goto(base+route).status==200
   monitor=page.locator('[data-kair]');monitor.scroll_into_view_if_needed()
   page.mouse.move(0,0)
   current=monitor.locator('[data-kair-slide][data-current=true] img');current.evaluate('(i)=>i.decode()')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
   assert monitor.locator('[data-kair-counter]').inner_text()=='1 из 23'
   assert monitor.locator('[data-kair-pause]').inner_text()=='Продолжить показ'
   assert 'Настоящие экраны' in monitor.inner_text()
   frame=monitor.locator('.kair-monitor-screen').bounding_box();image=current.bounding_box()
   assert abs(frame['width']-image['width'])<1 and abs(frame['height']-image['height'])<1
   assert abs(frame['width']/frame['height']-16/9)<.01
   assert current.evaluate('(i)=>getComputedStyle(i).objectFit')=='cover'
   monitor.locator('[data-kair-next]').click();page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 23"')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route,'paused controls')
   monitor.locator('[data-kair-inspect]').click()
   viewer=monitor.locator('[data-kair-viewer]');assert viewer.is_visible()
   page.wait_for_function('document.querySelector("[data-kair-viewer-image]").naturalWidth>0')
   assert viewer.locator('[data-kair-viewer-counter]').inner_text()=='2 из 23'
   assert viewer.locator('[data-kair-viewer-image]').get_attribute('src').endswith('/'+slides[1]['original'])
   page.wait_for_function('document.fullscreenElement===document.querySelector(".kair-viewer-shell")',timeout=3000)
   assert viewer.evaluate('(e)=>e.scrollWidth<=e.clientWidth'),(width,route,'viewer overflow')
   viewer.locator('[data-kair-viewer-next]').click();page.wait_for_function('document.querySelector("[data-kair-viewer-counter]").textContent==="3 из 23"')
   page.keyboard.press('End');page.wait_for_function('document.querySelector("[data-kair-viewer-counter]").textContent==="23 из 23"')
   page.keyboard.press('ArrowRight');page.wait_for_function('document.querySelector("[data-kair-viewer-counter]").textContent==="1 из 23"')
   if width in [390,1440] and route=='/':page.screenshot(path=str(out/f'fullscreen-{width}.png'))
   viewer.locator('[data-kair-close]').click();page.wait_for_function('!document.fullscreenElement&&!document.querySelector("[data-kair-viewer]").open')
   assert not viewer.is_visible()
   assert monitor.locator('[data-kair-inspect]').evaluate('(e)=>e===document.activeElement')
   if width in [390,1440] and route=='/':monitor.screenshot(path=str(out/f'monitor-{width}.png'))
   results.append({'width':width,'route':route,'fillsScreen':True,'nativeFullscreen':True})
  print('Responsive monitor, frame fit, controls, native fullscreen, keyboard and focus:',width,'OK',flush=True)
 # Every delivered image can be selected without losing the monitor's geometry.
 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'/');monitor=page.locator('[data-kair]');monitor.scroll_into_view_if_needed()
 initial=monitor.locator('.kair-monitor-screen').bounding_box()
 for index,slide in enumerate(slides):
  page.wait_for_function('(n)=>document.querySelector("[data-kair-counter]").textContent===`${n} из 23`',arg=index+1)
  active=monitor.locator('[data-kair-slide][data-current=true] img');active.evaluate('(i)=>i.decode()')
  assert active.get_attribute('src').endswith('/'+slide['file'])
  box=active.bounding_box();assert abs(box['width']-initial['width'])<1 and abs(box['height']-initial['height'])<1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if index<len(slides)-1:monitor.locator('[data-kair-next]').click()
 # Rapid requests use the last selected frame, including a return to the same one.
 monitor.locator('[data-kair-prev]').click();monitor.locator('[data-kair-next]').click()
 page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="23 из 23"')
 page.wait_for_function('document.querySelectorAll("[data-kair-slide]:not([hidden])").length===1')
 assert monitor.locator('[data-kair-slide][data-current=true]').count()==1
 print('All 23 originals represented, fixed geometry and rapid navigation: OK',flush=True)
 # Actual production interval, pause/resume and leaving the viewport.
 live=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='no-preference')
 live.on('pageerror',lambda e:errors.append(str(e)))
 live.goto(base+'/');m=live.locator('[data-kair]');m.scroll_into_view_if_needed();live.mouse.move(0,0)
 live.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 23"',timeout=12000)
 m.locator('[data-kair-pause]').click();live.locator('#control-title').click();live.mouse.move(0,0)
 assert m.locator('[data-kair-pause]').get_attribute('aria-pressed')=='true'
 live.wait_for_timeout(8500);assert m.locator('[data-kair-counter]').inner_text()=='2 из 23'
 m.locator('[data-kair-pause]').click()
 live.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="3 из 23"',timeout=12000)
 assert m.locator('[data-kair-pause]').evaluate('(e)=>e===document.activeElement')
 live.evaluate('scrollTo({top:0,behavior:"instant"})');live.wait_for_timeout(8500)
 assert m.locator('[data-kair-counter]').inner_text()=='3 из 23'
 print('Production 8-second autoplay, persistent pause, resume and offscreen suspension: OK',flush=True)
 assert not errors,errors;assert not failures,failures
 (out/'results.json').write_text(json.dumps({'responsive':results,'allPhotos':23,'autoplayIntervalMs':8000,'errors':errors,'failedLocalResponses':failures},ensure_ascii=False,indent=2)+'\n')
 browser.close()
