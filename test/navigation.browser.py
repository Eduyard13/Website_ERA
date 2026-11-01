"""Acceptance scenarios from ERA_Header_Navigation_Codex.md."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
import os

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3010/Website_ERA').rstrip('/')
root_path=urlparse(base).path
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/workspace/era-review/navigation-v0.10'));out.mkdir(parents=True,exist_ok=True)
product='/catalog/equipment/predvaritelnyy-izmelchitel/'
cases=[('/', 'project','/'),('/catalog/','equipment','/catalog'),('/catalog/equipment/?q=флотатор','equipment','/catalog/equipment'),(product,'equipment','/catalog/equipment'),('/catalog/lines/','equipment','/catalog/lines'),('/catalog/lines/separatsiya-01/','equipment','/catalog/lines'),('/technology/#hot-washing','technology','/technology')]+[(p,'all',p) for p in ['/automation','/ai','/media','/documents','/news','/blog','/contacts','/company-details']]
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 for width in [360,768,1024,1440]:
  context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  for route,section,panel_path in cases:
   page.goto(base+route)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
   header=page.locator('.site-header');toggle=page.locator('[data-menu-toggle]');menu=page.locator('#site-menu')
   assert (64 if width<1000 else 72)<=header.bounding_box()['height']<=80,(width,route,header.bounding_box())
   assert page.locator('.primary-nav a').all_text_contents()==['О проекте','Оборудование','Технология']
   assert page.locator('.primary-nav').is_visible()==(width>=1000)
   expected={'project':'/','equipment':'/catalog','technology':'/technology'}.get(section)
   if section=='all':
    assert toggle.get_attribute('data-current-section')=='true'
    assert header.locator('.primary-link[data-current-section=true]').count()==0
   else:
    assert header.locator('.primary-link[data-current-section=true]').get_attribute('href')==root_path+expected
    assert toggle.get_attribute('data-current-section') is None
   assert not menu.is_visible()
   assert toggle.bounding_box()['height']>=44
   if route in ['/',product,'/documents']:
    before=header.locator('[data-current-section=true]').evaluate_all('es=>es.map(e=>({label:e.dataset.label,href:e.getAttribute("href")}))')
    if route in ['/',product]:
     page.wait_for_function('!!document.querySelector("[data-fx-bar]").dataset.state')
     page.screenshot(path=str(out/f'{"home" if route=="/" else "equipment"}-header-{width}.png'))
    trigger=toggle.bounding_box();toggle.click()
    assert menu.is_visible();assert toggle.get_attribute('aria-expanded')=='true'
    assert page.evaluate('document.body.classList.contains("menu-open")')
    assert header.locator('[data-current-section=true]').evaluate_all('es=>es.map(e=>({label:e.dataset.label,href:e.getAttribute("href")}))')==before
    active=menu.locator('.drawer-link[aria-current=page],.drawer-link[data-current-branch=true]')
    assert active.count()==1,(width,route)
    assert active.get_attribute('href')==root_path+panel_path
    assert menu.locator('.drawer-link').evaluate_all('items=>items.every(e=>e.getBoundingClientRect().height>=44)')
    assert menu.locator('[data-menu-close]').evaluate('(e)=>document.activeElement===e')
    scroll_before=page.evaluate('window.scrollY')
    area=menu.locator('.drawer-scroll').bounding_box();page.mouse.move(area['x']+area['width']/2,area['y']+area['height']/2);page.mouse.wheel(0,180)
    assert page.evaluate('window.scrollY')==scroll_before
    for key in ['Tab']*24+['Shift+Tab']*24:
     page.keyboard.press(key)
     assert page.evaluate('document.querySelector("#site-menu").contains(document.activeElement)'),(width,route,key)
    menu.locator('[data-menu-close]').focus()
    menu.locator('.drawer-scroll').evaluate('(e)=>e.scrollTop=0')
    if route in ['/',product]:page.screenshot(path=str(out/f'{"home" if route=="/" else "equipment"}-menu-{width}.png'))
    page.keyboard.press('Escape')
    assert not menu.is_visible()
    assert toggle.get_attribute('aria-expanded')=='false'
    assert toggle.evaluate('(e)=>document.activeElement===e')
    assert not page.evaluate('document.body.classList.contains("menu-open")')
    toggle.click();page.mouse.click(trigger['x']+trigger['width']/2,trigger['y']+trigger['height']/2)
    assert not menu.is_visible(),('repeat press',width,route)
    toggle.click();menu.locator('[data-menu-close]').click();assert not menu.is_visible()
    if width>=1000:
     toggle.click();page.mouse.click(5,300);assert not menu.is_visible()
  # Both entry branches keep their original content and filters.
  page.goto(base+'/catalog/');assert page.locator('.catalog-door').count()==2
  assert page.locator('.catalog-door h2').all_text_contents()==['Линии и комплексы','Отдельные узлы']
  page.screenshot(path=str(out/f'catalog-hub-{width}.png'),full_page=True)
  page.locator('.catalog-door').nth(1).click();assert page.locator('[data-node]:visible').count()==12
  page.get_by_role('searchbox').fill('флотатор');assert page.locator('[data-node]:visible').count()==1
  page.locator('[data-node]:visible .card-action').click()
  assert page.locator('.primary-nav [data-current-section=true]').inner_text()=='Оборудование'
  page.go_back();assert page.locator('[data-node]:visible').count()==1
  page.reload();assert page.locator('[data-node]:visible').count()==1
  page.goto(base+'/documents');page.locator('[data-menu-toggle]').click()
  page.locator('.drawer-groups a[href="'+root_path+'/catalog/lines"]').click()
  assert page.url.rstrip('/').endswith('/catalog/lines')
  assert not page.locator('#site-menu').is_visible()
  page.go_back();assert page.locator('[data-menu-toggle]').get_attribute('data-current-section')=='true'
  assert not page.evaluate('document.body.classList.contains("menu-open")')
  page.goto(base+'/');page.locator('[data-menu-toggle]').click()
  page.locator('.drawer-top-cta' if width<1000 else '.drawer-contact-cta').click()
  assert page.url.endswith('#discuss');assert not page.locator('#site-menu').is_visible()
  assert page.locator('.primary-nav a[aria-current=page]').inner_text()=='О проекте'
  page.goto(base+'/about/');page.wait_for_url(base+'/')
  assert page.locator('.primary-nav a[aria-current=page]').inner_text()=='О проекте'
  assert page.locator('#about-era').count()==1
  page.goto(base+'/does-not-exist');assert page.locator('h1').inner_text()=='404'
  assert page.locator('.site-header [data-current-section=true]').count()==0
  assert not errors,errors
  print('Routes, parent branches, current/open states, 44px controls, focus trap, close methods, back, filters, hub, legacy redirect and 404:',width,'OK',flush=True)
  context.close()
 # Redirect also works without JavaScript on static hosting.
 context=browser.new_context(java_script_enabled=False);page=context.new_page()
 page.goto(base+'/about/');page.wait_for_url(base+'/');assert page.locator('.primary-nav a[aria-current=page]').inner_text()=='О проекте'
 context.close();browser.close()
