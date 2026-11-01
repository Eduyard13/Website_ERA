from playwright.sync_api import sync_playwright
from pathlib import Path
import os
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-presentation-screenshots'));out.mkdir(parents=True,exist_ok=True)
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3002/Website_ERA').rstrip('/')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'],proxy={'server':os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY'),'bypass':'127.0.0.1,localhost'} if os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY') else None)
 page=b.new_page();errors=[];failed=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 else None)
 for width in [360,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  for route,name in [('/','home'),('/technology','technology'),('/automation','automation'),('/media','media'),('/catalog/equipment','catalog')]:
   assert page.goto(base+route).status==200
   page.locator('img[loading=lazy]').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')")
   page.wait_for_function("Array.from(document.images).filter(i=>i.id!=='viewer-image').every(i=>i.complete && i.naturalWidth>0)")
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow {width} {name}'
   assert page.locator('h1').count()==1
   assert page.locator('img:not(#viewer-image)').evaluate_all("imgs=>imgs.every(i=>new URL(i.currentSrc).pathname.startsWith('/Website_ERA/assets/'))")
   if width in [360,1440] and route in ['/','/technology']:
    page.screenshot(path=str(out/f'{name}-{width}.png'),full_page=True)
    if route=='/':page.screenshot(path=str(out/f'home-first-screen-{width}.png'))
  page.locator('[data-menu-toggle]').click();assert page.locator('#site-menu').is_visible();page.keyboard.press('Escape');assert not page.locator('#site-menu').is_visible()
  print('Pages, responsive images, overflow, menu:',width,'OK',flush=True)
 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'/')
 page.get_by_role('link',name='Как это работает',exact=True).click();assert page.url.endswith('#solution')
 page.get_by_role('link',name='Узнать подробнее',exact=True).nth(1).click();assert page.url.endswith('/technology#hot-washing');assert page.locator('#hot-washing').is_visible()
 page.reload();assert page.locator('#hot-washing').is_visible()
 page.goto(base+'/');page.get_by_role('link',name='Подробнее об управлении',exact=True).click();assert page.url.endswith('/automation')
 page.goto(base+'/');page.get_by_role('link',name='Обсудить мой проект',exact=True).click();assert page.url.endswith('#discuss')
 assert page.get_by_role('link',name='Написать о проекте',exact=True).get_attribute('href').startswith('mailto:edkom.office@mail.ru?subject=')
 for title,ending in [('Технология','/technology'),('Линии и комплектации','/catalog/lines'),('Каталог оборудования','/catalog/equipment')]:
  page.goto(base+'/');page.locator('.detail-doors').get_by_role('link',name=title,exact=False).click();assert page.url.endswith(ending)
 page.goto(base+'/media')
 count=page.locator('[data-media]:visible').count();assert page.locator('[data-media][data-image*="/presentation/"]').count()>0
 page.get_by_role('button',name='Схемы',exact=True).click()
 page.locator('[name=product]').select_option('/Website_ERA/technology#dry-separation')
 assert page.locator('[data-media]:visible').count()==1
 opener=page.locator('[data-media]:visible .media-open');opener.click();assert page.locator('#media-viewer').is_visible()
 assert page.locator('#viewer-product').get_attribute('href')=='/Website_ERA/technology#dry-separation'
 assert '/Website_ERA/assets/presentation/' in page.locator('#viewer-image').get_attribute('src')
 page.keyboard.press('Escape');assert not page.locator('#media-viewer').is_visible();assert opener.evaluate('(e)=>e===document.activeElement')
 page.get_by_role('button',name='Сбросить',exact=True).click();page.wait_for_timeout(100)
 video_count=page.locator('[data-media][data-type=video]').count()
 page.get_by_role('button',name='Видео',exact=True).click();assert page.locator('[data-media]:visible').count()==video_count;assert page.locator('#media-empty').is_visible()==(video_count==0)
 assert not errors,errors
 assert not failed,failed
 print('Story transitions, stages, nested refresh, mailto, detail routes, new gallery media, dialog: OK',flush=True)
 b.close()
