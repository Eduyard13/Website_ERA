"""Preview layouts, shared quick contact and existing dialog integration; no real messages."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import os,json

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3040/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-about-contacts-preview/browser'));out.mkdir(parents=True,exist_ok=True)
widths=[int(value) for value in os.environ.get('ERA_TEST_WIDTHS','320,375,390,430,768,1024,1280,1440,1920').split(',')]
prefix=urlparse(base).path
errors=[];failed=[];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda response:failed.append((response.status,response.url)) if response.status>=400 and response.url.startswith(base) else None)
 def load(path):
  page.goto(base+path);page.wait_for_selector('#quick-contact:not([hidden])')
 def full_images():
  page.locator('img').evaluate_all("images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode().catch(()=>{});} ))")
 for width in widths:
  page.set_viewport_size({'width':width,'height':960 if width>=768 else 844})
  for path,count in [('/about-us/',8),('/contacts/',5)]:
   load(path);full_images()
   assert page.locator('main h1').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,path)
   assert page.locator('.page-progress-rail a').count()==count,(width,path)
   assert page.locator('.primary-nav a').all_text_contents()==['О проекте','Технология','Оборудование','Экономика','КАИР']
   assert page.locator('main img').evaluate_all('images=>images.every(image=>image.complete&&image.naturalWidth>0&&(image.alt.length>0||image.getAttribute("aria-hidden")==="true"))')
   assert page.locator('main .au-team-card,main .cp-form-card,main .cp-map,main .cp-video-channel').evaluate_all('items=>items.every(item=>item.scrollWidth<=item.clientWidth+1)'),(width,path)
   assert page.locator('.footer-video-channel').count()==2
   assert page.locator('a.footer-video-channel').count()==1
   assert page.locator('a.footer-video-channel').get_attribute('href')=='https://www.youtube.com/@RASVET-LLC'
   assert not page.locator('#site-footer').inner_text().find('Реквизиты')>=0
   if path=='/about-us/':
    assert page.locator('[data-team-member]').count()==3
    assert page.locator('[data-profile-state="ready"]').count()==3
    assert page.locator('#team .au-portrait img').count()==3
    assert page.locator('.au-projects-grid').count()==1
    boxes=page.locator('.au-projects-grid>.au-project').evaluate_all('items=>items.map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};})')
    assert len(boxes)==2 and abs(boxes[0]['width']-boxes[1]['width'])<1
    if width>=1024:assert abs(boxes[0]['y']-boxes[1]['y'])<1 and boxes[1]['x']>boxes[0]['x']
    else:assert boxes[1]['y']>=boxes[0]['y']+boxes[0]['height'] and abs(boxes[0]['x']-boxes[1]['x'])<1
    if width>=1024:
     tops=page.locator('.au-team-card').evaluate_all('items=>items.map(e=>e.getBoundingClientRect().y)');assert max(tops)-min(tops)<1
    assert page.locator('.au-portrait.is-placeholder').count()==0
    assert page.locator('.au-company-facts > div').count()==3
    assert page.locator('#project-chelyabinsk img').count()==1
    assert page.locator('#project-chelyabinsk img').get_attribute('src').endswith('/about/projects/chelyabinsk-2021.webp')
   else:
    assert page.locator('[data-request-form]').count()==1
    assert page.locator('#project-request').count()==0
    assert page.locator('.cp-video-channel').count()==2
    assert page.locator('.cp-map iframe').count()==0
    assert page.locator('[data-map-external]').count()==2
    assert page.locator('[data-map-select]').count()==2
   toggle=page.locator('[data-quick-contact-toggle]');panel=page.locator('#quick-contact-panel')
   bounds=toggle.bounding_box();assert bounds['width']>=48 and bounds['height']>=48
   if os.environ.get('ERA_CAPTURE_INTERNAL')=='1' and width in [390,1440]:
    name='about-us' if path=='/about-us/' else 'contacts'
    page.screenshot(path=str(out/f'{name}-{width}-full.png'),full_page=True)
   if path=='/about-us/':
    toggle.focus();page.keyboard.press('Enter');assert panel.is_visible()
    assert toggle.get_attribute('aria-expanded')=='true'
    assert panel.locator('a').count()==6
    assert panel.locator('.contact-messenger').count()==3
    assert panel.locator('.contact-messenger:disabled').count()==0
    assert panel.locator('a').first.evaluate('element=>element===document.activeElement')
    assert panel.locator('a[href^="tel:"]').get_attribute('href')=='tel:+79032813535'
    assert panel.locator('a[href^="mailto:"]').get_attribute('href')=='mailto:info@era-cycle.ru'
    box=panel.bounding_box();assert box['x']>=0 and box['x']+box['width']<=width and box['y']>=0
    if os.environ.get('ERA_CAPTURE_INTERNAL')=='1' and width in [390,1440]:page.screenshot(path=str(out/f'quick-contact-open-{width}.png'))
    page.keyboard.press('Tab');assert panel.locator('a[href^="mailto:"]').evaluate('element=>element===document.activeElement')
    page.keyboard.press('Escape');assert panel.is_hidden();assert toggle.evaluate('element=>element===document.activeElement')
    if os.environ.get('ERA_CAPTURE_INTERNAL')=='1' and width in [390,1440]:page.screenshot(path=str(out/f'quick-contact-closed-{width}.png'))
    page.keyboard.press('Space');assert panel.is_visible()
    page.locator('h1').click();assert panel.is_hidden()
   results.append({'width':width,'path':path,'outline':count,'overflow':False})
  print(f'About, contacts, images, channels, outline and quick-contact keyboard: {width} OK',flush=True)

 # Company galleries stay within their own documented project and restore focus.
 for width in [390,1440]:
  page.set_viewport_size({'width':width,'height':960});load('/about-us/')
  for group,total,keyword in [('production',3,'china-'),('venray',3,'netherlands-'),('chelyabinsk',1,'chelyabinsk-2021')]:
   opener=page.locator(f'[data-media-group="{group}"] .media-open').first
   opener.click();viewer=page.locator('#media-viewer');assert viewer.is_visible()
   assert keyword in page.locator('#viewer-image').get_attribute('src')
   if total==1:
    assert viewer.locator('[data-next]').is_hidden() and viewer.locator('[data-prev]').is_hidden()
   else:
    for _ in range(total):
     page.keyboard.press('ArrowRight');assert keyword in page.locator('#viewer-image').get_attribute('src')
    page.keyboard.press('ArrowLeft');assert keyword in page.locator('#viewer-image').get_attribute('src')
   page.keyboard.press('Escape');assert viewer.is_hidden()
   page.wait_for_function('!document.body.classList.contains("viewer-open")')
   assert opener.evaluate('element=>element===document.activeElement')
   assert not page.locator('body').evaluate('element=>element.classList.contains("viewer-open")')
   page.wait_for_selector('#quick-contact:not([hidden])')
  load('/about-us/');page.locator('.au-hero-actions .button').click()
  assert page.locator('#project-request').is_visible()
  assert page.locator('#project-request [data-request-form]').count()==1
  page.keyboard.press('Escape')
 print('Company galleries, project isolation, single-photo controls, focus return and CTA: OK',flush=True)

 # External navigation is intercepted; no messages or requests to the accounts.
 messenger_urls=[('telegram','https://t.me/Eduyard13'),('max','https://max.ru/u/f9LHodD0cOLJG4FZs3gHL3lpPmwQ0qEBZoRlKgEs72lHGd9FC0S8W-9NfpA'),('whatsapp','https://wa.me/79032813535')]
 for url in ['https://www.youtube.com/@RASVET-LLC',*[url for _,url in messenger_urls]]:
  page.context.route(url,lambda route:route.fulfill(status=200,content_type='text/html',body='<title>Navigation target verified</title>'))
 for width in [390,1440]:
  page.set_viewport_size({'width':width,'height':960})
  load('/contacts/')
  targets=[('a.cp-video-channel','https://www.youtube.com/@RASVET-LLC'),*[(f'.cp-messengers a[data-channel={channel}]',url) for channel,url in messenger_urls],('a.footer-video-channel','https://www.youtube.com/@RASVET-LLC')]
  for selector,url in targets:
   with page.expect_popup() as event:page.locator(selector).click()
   popup=event.value;popup.wait_for_load_state('domcontentloaded');assert popup.url==url;popup.close()
  for channel,url in messenger_urls:
   page.locator('[data-quick-contact-toggle]').click()
   with page.expect_popup() as event:page.locator(f'#quick-contact-panel a[data-channel={channel}]').click()
   popup=event.value;popup.wait_for_load_state('domcontentloaded');assert popup.url==url;popup.close()
   assert page.locator('#quick-contact-panel').is_hidden()
  print(f'YouTube, Telegram, MAX and WhatsApp navigation from contacts, footer and quick contact: {width} OK',flush=True)

 page.set_viewport_size({'width':1440,'height':1000})
 for route in ['/','/technology/','/automation/','/economics/','/catalog/','/catalog/equipment/','/catalog/lines/','/media/','/documents/','/about-us/','/contacts/']:
  load(route);page.locator('[data-quick-contact-toggle]').click();assert page.locator('#quick-contact-panel').is_visible()
  page.locator('[data-menu-toggle]').click();page.wait_for_selector('#quick-contact[hidden]',state='attached')
  assert page.locator('#quick-contact-panel').is_hidden()
  assert page.locator('#site-menu .drawer-link[href="'+prefix+'/about-us"]').count()==1
  assert page.locator('#site-menu .drawer-link[href="'+prefix+'/company-details"]').count()==0
  group=page.locator('#site-menu .drawer-group').filter(has=page.locator('a[href="'+prefix+'/contacts"]'))
  assert group.locator('a').evaluate_all('links=>links.map(link=>link.getAttribute("href"))')==[prefix+'/about-us',prefix+'/contacts']
  footer_group=page.locator('.footer-nav-group').filter(has=page.locator('a[href="'+prefix+'/contacts"]'))
  assert footer_group.locator('a').evaluate_all('links=>links.map(link=>link.getAttribute("href"))')==[prefix+'/about-us',prefix+'/contacts']
  page.keyboard.press('Escape');page.wait_for_selector('#quick-contact:not([hidden])')
 print('Shared widget and menu integration: 11 routes OK',flush=True)

 load('/about-us/');toggle=page.locator('[data-quick-contact-toggle]');toggle.click()
 page.locator('#quick-contact-panel [data-project-request]').click();assert page.locator('#project-request').is_visible()
 assert page.locator('#quick-contact').is_hidden()
 page.keyboard.press('Escape');page.wait_for_selector('#quick-contact:not([hidden])')
 page.wait_for_function('document.activeElement.matches("[data-quick-contact-toggle]")')

 load('/contacts/');page.locator('[data-quick-contact-toggle]').click();page.locator('#quick-contact-panel [data-project-request]').click()
 assert page.locator('#project-request').count()==0
 assert page.locator('#contact-name').evaluate('element=>element===document.activeElement')

 page.set_viewport_size({'width':390,'height':844});load('/contacts/')
 page.locator('#contact-name').focus();assert page.locator('#quick-contact').is_hidden()
 page.locator('#contact-name').evaluate('element=>element.blur()');page.wait_for_selector('#quick-contact:not([hidden])')

 page.set_viewport_size({'width':1440,'height':1000});load('/media/')
 page.locator('[data-gallery-open]').first.click();assert page.locator('#gallery-viewer').is_visible();assert page.locator('#quick-contact').is_hidden()
 page.keyboard.press('Escape');page.wait_for_selector('#quick-contact:not([hidden])')
 load('/catalog/equipment/predvaritelnyy-izmelchitel/')
 page.locator('[data-media]:not([data-type=video]) .media-open').first.click();assert page.locator('#media-viewer').is_visible();assert page.locator('#quick-contact').is_hidden()
 page.keyboard.press('Escape');page.wait_for_selector('#quick-contact:not([hidden])')
 load('/technology/')
 inspector=page.locator('[data-kair-inspect]')
 for details in inspector.locator('xpath=ancestor::details').all():
  if details.get_attribute('open') is None:details.locator('summary').first.click()
 inspector.click();assert page.locator('[data-kair-viewer]').is_visible();assert page.locator('#quick-contact').is_hidden()
 page.locator('[data-kair-close]').click();page.wait_for_selector('#quick-contact:not([hidden])')
 print('Request, gallery, legacy photo, KAIR and mobile-field integration: OK',flush=True)

 load('/about-us/');page.locator('[data-menu-toggle]').click()
 if os.environ.get('ERA_CAPTURE_INTERNAL')=='1':page.screenshot(path=str(out/'navigation-1440.png'))
 page.keyboard.press('Escape')
 page.locator('#site-footer').scroll_into_view_if_needed()
 if os.environ.get('ERA_CAPTURE_INTERNAL')=='1':page.screenshot(path=str(out/'footer-1440.png'))
 load('/company-details/?topic=legacy#project-form');page.wait_for_url(base+'/contacts?topic=legacy#project-form')
 load('/about/');page.wait_for_url(base+'/')
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844},reduced_motion='reduce');nojs=context.new_page()
 nojs.goto(base+'/about-us/');assert nojs.locator('.quick-contact-fallback').is_visible()
 assert nojs.locator('main h1').inner_text()=='От практики переработки — к промышленным технологиям.'
 assert nojs.locator('main section').count()==8
 assert nojs.locator('[data-team-member]').count()==3
 assert nojs.locator('.au-projects-grid>.au-project').count()==2
 assert nojs.locator('#project-chelyabinsk a.media-open').get_attribute('href').endswith('/about/projects/chelyabinsk-2021.webp')
 nojs.locator('.au-hero-actions a[href="#projects"]').click();assert nojs.url.endswith('#projects')
 nojs.locator('.au-final-actions .button').focus();nojs.keyboard.press('Enter');nojs.wait_for_url(base+'/contacts#project-form');assert nojs.locator('#contact-form').is_visible()
 nojs.goto(base+'/company-details/');nojs.wait_for_url(base+'/contacts');assert nojs.locator('#contact-form').is_visible()
 context.close()
 assert not errors,errors;assert not failed,failed
 (out/'results.json').write_text(json.dumps({'layouts':results,'sharedRoutes':11,'dialogIntegration':True,'legacyRedirects':True,'noJS':True,'errors':errors,'failedLocalResponses':failed},ensure_ascii=False,indent=2)+'\n')
 browser.close()
