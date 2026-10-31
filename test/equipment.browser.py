from pathlib import Path
from playwright.sync_api import sync_playwright
import os
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-equipment-screenshots'));out.mkdir(parents=True,exist_ok=True)
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3003/Website_ERA').rstrip('/')
slugs=['predvaritelnyy-izmelchitel','predvaritelnyy-raspushitel','ballisticheskiy-separator','rotornyy-raspushitel','bunker-nakopitel','vertikalno-rotornyy-izmelchitel','plenochnyy-flotator','rotornaya-tsentrifuga','vintovoy-press','kapsulyator','ochistka-stokov','rama-napolnitel']
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY'),'bypass':'127.0.0.1,localhost'} if os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY') else None);page=b.new_page();errors=[];failed=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 else None)
 for width in [360,768,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  for route in ['/catalog/equipment','/documents']+['/catalog/equipment/'+s for s in slugs]:
   assert page.goto(base+route).status==200
   page.locator('img[loading=lazy]').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')")
   page.wait_for_function("Array.from(document.images).filter(i=>i.id!=='viewer-image').every(i=>i.complete&&i.naturalWidth>0)")
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {width} {route}: '+str(page.evaluate('document.documentElement.scrollWidth'))
   assert page.locator('h1').count()==1
   if width==1440:
    current=page.locator('.desktop-nav a[aria-current]')
    assert current.count()==1,(route,current.count())
    assert current.get_attribute('href')==('/Website_ERA/documents' if route=='/documents' else '/Website_ERA/catalog')
    assert page.locator('.desktop-nav').evaluate('(e)=>e.getBoundingClientRect().right < document.documentElement.clientWidth')
   if route in ['/catalog/equipment','/catalog/equipment/kapsulyator','/catalog/equipment/ballisticheskiy-separator','/documents'] and width in [360,1440]:
    name=route.split('/')[-1];page.screenshot(path=str(out/f'{name}-{width}.png'),full_page=True)
  print('All 12 cards, catalogue, documents, layout and images:',width,'OK',flush=True)
 page.goto(base+'/catalog/equipment');assert page.locator('[data-node]:visible').count()==12
 page.get_by_role('searchbox').fill('флотатор');assert page.locator('[data-node]:visible').count()==1
 page.get_by_role('link',name='Подробнее',exact=True).filter(visible=True).click();assert page.url.endswith('/plenochnyy-flotator')
 page.go_back();assert page.locator('[data-node]:visible').count()==1
 page.goto(base+'/documents');assert page.locator('[data-document]:visible').count()==12
 page.locator('#document-filters [name=product]').select_option('ballisticheskiy-separator');assert page.locator('[data-document]:visible').count()==1
 with page.expect_download() as download_info:
  page.locator('[data-document]:visible a[download]').click()
 download=download_info.value;download.save_as(str(out/'download-check.pdf'));assert Path(out/'download-check.pdf').read_bytes().startswith(b'%PDF')
 page.get_by_role('button',name='Сбросить',exact=True).click();page.wait_for_timeout(100)
 page.locator('[name=kind]').select_option('Паспорт и коммерческое описание');assert page.locator('[data-document]:visible').count()==1
 page.get_by_role('button',name='Сбросить',exact=True).click();page.wait_for_timeout(100)
 page.get_by_role('searchbox').fill('неттакогослова');assert page.locator('#document-empty').is_visible()
 page.goto(base+'/catalog/equipment/plenochnyy-flotator')
 page.locator('.equipment-scheme .media-open').click();assert page.locator('#media-viewer').is_visible();page.keyboard.press('Escape');assert not page.locator('#media-viewer').is_visible()
 # Check ancestor highlights and keyboard/mobile home navigation.
 for route,selector in [('/catalog/lines/separatsiya-01','a[href="/Website_ERA/catalog/lines"]'),('/technology','a[href="/Website_ERA/technology"]'),('/blog','a[href="/Website_ERA/blog"]')]:
  page.goto(base+route);assert page.locator('.desktop-nav '+selector).get_attribute('aria-current') in ['page','location']
  if route=='/blog':assert page.locator('.desktop-nav details[data-active-section=true] summary').inner_text()=='Материалы'
 page.set_viewport_size({'width':360,'height':850});page.goto(base+'/documents');page.get_by_role('button',name='Меню').click();assert page.locator('#mobile-nav').is_visible()
 page.locator('#mobile-nav .nav-home').click();assert page.url in [base+'/',base]
 page.get_by_role('button',name='Меню').click();assert page.locator('#mobile-nav .nav-home').get_attribute('aria-current')=='page'
 page.keyboard.press('Escape');assert not page.locator('#mobile-nav').is_visible()
 assert not errors,errors;assert not failed,failed
 print('Filters, back restoration, PDF download, modal, ancestor selection and mobile home navigation: OK',flush=True)
 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'/');page.screenshot(path=str(out/'home-menu-1440.png'))
 b.close()
