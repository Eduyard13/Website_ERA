"""Customer-facing refinements and a private fixture for future KAIR slides."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess,os,json

repo=Path(__file__).resolve().parents[1]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3010/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/workspace/era-review/refinements-v0.12'));out.mkdir(parents=True,exist_ok=True)
fixture=subprocess.check_output(['node','--input-type=module','-e',"""
 import {kairMonitor} from './scripts/kair.mjs';
 // Existing files are test images here, not additional production KAIR screens.
 const slides=[
  {id:'one',file:'presentation/kair.webp',width:616,height:361,alt:'Тестовый экран 1',caption:'Тестовый экран 1'},
  {id:'two',file:'presentation/dry-separation.webp',width:1000,height:500,alt:'Тестовый экран 2',caption:'Тестовый экран 2'},
  {id:'unavailable',file:'test-missing-kair.webp',width:616,height:361,alt:'Недоступный тестовый экран',caption:'Недоступный тестовый экран'}
 ];
 console.log(kairMonitor(slides,{autoplay:true,intervalMs:1000,transitionMs:50}));
"""],cwd=repo,text=True)

with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 for width in [320,360,768,1440]:
  page=browser.new_page(viewport={'width':width,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for route,name in [('/','home'),('/catalog/','hub'),('/catalog/equipment/','catalog'),('/catalog/equipment/kapsulyator/','capsulator'),('/catalog/equipment/rotornaya-tsentrifuga/','centrifuge'),('/technology/','technology'),('/automation/','automation'),('/media/','media'),('/documents/','documents'),('/contacts/','contacts')]:
   assert page.goto(base+route).status==200
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
   header=page.locator('.site-header');assert 64<=header.bounding_box()['height']<=80,(width,route)
   assert header.locator('[data-fx-bar]').count()==0
   assert page.locator('footer [data-fx-bar]').count()==1
   assert page.locator('.footer-nav-group').count()==5
   assert page.locator('.footer-nav a').count()==page.locator('.drawer-groups a').count()==13
   if route in ['/','/automation/']:
    monitor=page.locator('[data-kair]');assert monitor.get_attribute('data-autoplay')=='false'
    assert monitor.locator('[data-kair-slide]').count()==1
    assert monitor.locator('.kair-controls').count()==0
    monitor.scroll_into_view_if_needed()
    screen=monitor.locator('.kair-monitor-screen').bounding_box();assert abs(screen['width']/screen['height']-16/9)<.02
    image=monitor.locator('img');assert image.evaluate('(e)=>getComputedStyle(e).objectFit')=='contain'
    assert image.get_attribute('src').endswith('/presentation/kair.webp')
    monitor.locator('[data-kair-inspect]').click();assert page.locator('#media-viewer').is_visible()
    assert page.locator('#viewer-image').get_attribute('src').endswith('/presentation/kair.webp')
    page.keyboard.press('Escape');assert monitor.locator('[data-kair-inspect]').evaluate('(e)=>e===document.activeElement')
    if width in [360,1440]:monitor.screenshot(path=str(out/f'{name}-monitor-{width}.png'))
   if route=='/':
    discuss=page.locator('#discuss');assert 'era-indigo-surface' not in discuss.get_attribute('class')
    assert discuss.evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(247, 244, 238)'
    assert discuss.evaluate('(e)=>Math.abs(e.getBoundingClientRect().bottom-document.querySelector("footer").getBoundingClientRect().top)<1')
    if width in [360,1440]:
     discuss.scroll_into_view_if_needed();page.screenshot(path=str(out/f'light-cta-footer-boundary-{width}.png'))
   if width in [360,1440] and route in ['/catalog/equipment/','/documents/']:
    page.screenshot(path=str(out/f'{name}-first-screen-{width}.png'))
  assert not errors,errors
  page.close();print('All page types, footer-only FX, monitor, focus, counters and light/dark boundary:',width,'OK',flush=True)

 # No fixture is written to the repository or published. It exercises preloading,
 # explicit pause, out-of-view suspension, error fallback and reduced motion.
 def open_fixture(reduced='no-preference'):
  context=browser.new_context(viewport={'width':1200,'height':1000},reduced_motion=reduced)
  page=context.new_page()
  html=f'''<!doctype html><html lang="ru"><head><link rel="stylesheet" href="{base}/style.css"><link rel="stylesheet" href="{base}/kair.css"><link rel="stylesheet" href="{base}/surfaces.css"><script type="module" src="{base}/kair.js"></script></head><body><button id="outside">Вне компонента</button><div class="era-indigo-surface" style="padding:30px;max-width:850px">{fixture.replace('/assets/',base+'/assets/')}</div><div style="height:1800px"></div></body></html>'''
  page.route('**/__kair_fixture',lambda route:route.fulfill(body=html,content_type='text/html'))
  page.goto(base+'/__kair_fixture')
  page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="1 из 3"')
  return context,page
 context,page=open_fixture();page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 3"')
 page.locator('[data-kair-pause]').click();page.locator('#outside').click();page.wait_for_timeout(1300)
 assert page.locator('[data-kair-counter]').inner_text()=='2 из 3'
 page.locator('[data-kair-prev]').click();page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="1 из 3"')
 page.locator('[data-kair-pause]').click();page.locator('#outside').click()
 page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 3"')
 page.locator('[data-kair-next]').click();page.wait_for_function('document.querySelector("[data-kair-status]").textContent.includes("Не удалось")')
 assert page.locator('[data-kair-counter]').inner_text()=='2 из 3'
 assert page.locator('[data-kair-slide][data-current=true] img').get_attribute('src').endswith('/dry-separation.webp')
 assert page.locator('[data-kair-slide][hidden] a').evaluate_all('es=>es.every(e=>e.tabIndex===-1)')
 context.close();print('Future slides: preload, crossfade, persistent pause/resume, error keeps current screen, hidden focus: OK',flush=True)
 context,page=open_fixture('reduce');page.wait_for_timeout(1400)
 assert page.locator('[data-kair-counter]').inner_text()=='1 из 3'
 page.locator('[data-kair-next]').click();page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 3"')
 context.close();print('Reduced motion: no default autoplay, manual change works: OK',flush=True)
 context,page=open_fixture();page.evaluate('window.scrollTo({top:document.body.scrollHeight,behavior:"instant"})');page.wait_for_timeout(1400)
 assert page.locator('[data-kair-counter]').inner_text()=='1 из 3'
 page.evaluate('window.scrollTo({top:0,behavior:"instant"})');page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 3"')
 context.close();print('Leaving the viewport suspends autoplay; returning resumes: OK',flush=True)
 browser.close()
