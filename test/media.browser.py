from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright
import os

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3004/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-media-screenshots'));out.mkdir(parents=True,exist_ok=True)
product='/Website_ERA/catalog/equipment/vintovoy-press'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY'),'bypass':'127.0.0.1,localhost'} if os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY') else None)
 page=b.new_page();errors=[];failed=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 else None)
 for width in [360,768,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.goto(base+'/media').status==200
  assert page.locator('[data-media]:visible').count()==71
  assert page.locator('[data-media]:visible').evaluate_all("items=>items.every(i=>i.dataset.type==='photo')")
  assert page.locator('[data-album]').count()==11
  video_count=page.locator('[data-media][data-type=video]').count()
  page.locator('.photo-albums summary').click()
  page.locator('[data-album] img').evaluate_all("imgs=>imgs.forEach(i=>i.loading='eager')")
  page.wait_for_function("Array.from(document.querySelectorAll('[data-album] img')).every(i=>i.complete&&i.naturalWidth>0)")
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow gallery {width}'
  page.screenshot(path=str(out/f'gallery-albums-{width}.png'))
  page.locator(f'[data-album][data-product="{product}"]').click()
  assert page.locator('[data-media]:visible').count()==6
  assert page.locator(f'[data-album][data-product="{product}"]').get_attribute('aria-pressed')=='true'
  assert parse_qs(urlparse(page.url).query)['product']==[product]
  opener=page.locator('[data-media]:visible .media-open').first
  assert '-thumb.webp' in opener.locator('img').get_attribute('src')
  opener.click();assert page.locator('#media-viewer').is_visible()
  first=page.locator('#viewer-image').get_attribute('src')
  assert '/photos/vintovoy-press/' in first and '-thumb' not in first
  assert page.locator('#viewer-product').get_attribute('href')==product
  page.keyboard.press('ArrowRight');assert page.locator('#viewer-image').get_attribute('src')!=first
  page.keyboard.press('ArrowLeft');assert page.locator('#viewer-image').get_attribute('src')==first
  page.screenshot(path=str(out/f'viewer-{width}.png'))
  page.keyboard.press('Escape');assert not page.locator('#media-viewer').is_visible()
  assert opener.evaluate('(e)=>e===document.activeElement')
  page.reload();assert page.locator('[data-media]:visible').count()==6
  page.get_by_role('button',name='Сбросить',exact=True).click()
  page.wait_for_function("document.querySelectorAll('[data-media]:not([hidden])').length===71")
  page.get_by_role('button',name='Схемы',exact=True).click()
  assert page.locator('[data-media]:visible').count()>20
  assert page.locator('[data-media]:visible').evaluate_all("items=>items.every(i=>['scheme','visualization'].includes(i.dataset.type))")
  page.get_by_role('button',name='Все',exact=True).click();assert page.locator('[data-media]:visible').count()>90
  page.get_by_role('button',name='Видео',exact=True).click();assert page.locator('[data-media]:visible').count()==video_count
  assert page.locator('#media-empty').is_visible()==(video_count==0)
  print('Albums, photo/scheme/video filters, URLs, viewer and focus:',width,'OK',flush=True)
 for slug in ['predvaritelnyy-izmelchitel','vertikalno-rotornyy-izmelchitel','rotornyy-raspushitel','ballisticheskiy-separator']:
  for width in [360,1440]:
   page.set_viewport_size({'width':width,'height':1000});page.goto(base+'/catalog/equipment/'+slug)
   assert page.locator('.equipment-photo img').count()==1
   assert '/photos/'+slug+'/' in page.locator('.equipment-photo img').get_attribute('src')
   assert page.locator('.equipment-quick-specs>div').count()==6
   assert page.locator('.equipment-quick-specs .metric-missing').count()==0
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(slug,width)
   page.screenshot(path=str(out/f'{slug}-hero-{width}.png'))
   assert page.locator('[data-diagram]').count()==1
   if slug=='vertikalno-rotornyy-izmelchitel':assert page.locator('.diagram-pin').count()==25
   if slug=='rotornyy-raspushitel':
    page.locator('[data-diagram-select]').select_option('2')
    assert 'Дисковая' in page.locator('[data-detail-label]').inner_text()
   page.locator('[data-diagram]').scroll_into_view_if_needed();page.screenshot(path=str(out/f'{slug}-legend-{width}.png'))
  page.locator('[data-photo-gallery]').click()
  assert page.locator('[data-media]:visible').count()>=5
  assert page.locator('[data-media]:visible').evaluate_all("items=>items.every(i=>i.dataset.product.endsWith('/"+slug+"')&&i.dataset.type==='photo')")
 assert not errors,errors;assert not failed,failed
 print('Photo heroes, six parameters, calculated power, numbered keys and product links: OK',flush=True)
 b.close()
