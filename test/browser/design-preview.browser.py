"""Verify the preview-only submission guard and standalone file:// design exports."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
from urllib.parse import urljoin

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3041').rstrip('/')
exports=Path(os.environ.get('ERA_DESIGN_EXPORT_DIR','/workspace/exports/era-about-contacts-preview'))
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-about-contacts-preview/offline'));out.mkdir(parents=True,exist_ok=True)
offline_base=os.environ.get('ERA_DESIGN_EXPORT_URL','').rstrip('/')+'/' if os.environ.get('ERA_DESIGN_EXPORT_URL') else ''
def design_url(name):return urljoin(offline_base,name+'.html') if offline_base else (exports/(name+'.html')).as_uri()
requests=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 context.route('**/api/request.php',lambda route:(requests.append(route.request.url),route.abort()))
 page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
 def submit_preview(form):
  form.locator('[name="Имя"]').fill('Просмотр макета')
  form.locator('[name="email"]').fill('preview@example.invalid')
  form.locator('[name="Задача"]').fill('Проверка визуального макета без отправки заявки.')
  assert form.locator('[data-request-submit]').is_disabled()
  assert form.locator('[data-preview-notice] a').get_attribute('href')=='https://era-cycle.ru/contacts/'
  form.locator('[name="Задача"]').press('Enter')
  assert not requests
 for path in ['/contacts/','/about-us/']:
  page.goto(base+path);page.wait_for_selector('#quick-contact:not([hidden])')
  if path=='/about-us/':page.locator('.header-cta').click();form=page.locator('#project-request form')
  else:form=page.locator('#contact-form')
  submit_preview(form)
 print('Preview-only submission guard: page and modal OK',flush=True)

 offline=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 network=[]
 def offline_request(route):
  if offline_base and route.request.url.startswith(offline_base) and route.request.resource_type=='document':route.continue_()
  else:network.append(route.request.url);route.abort()
 offline.route('http://**/*',offline_request)
 offline.route('https://**/*',offline_request)
 view=offline.new_page();view.on('pageerror',lambda error:errors.append(str(error)))
 for width in [390,1440]:
  view.set_viewport_size({'width':width,'height':844 if width==390 else 1000})
  for name in ['about-us','contacts']:
   view.goto(design_url(name));view.wait_for_selector('#quick-contact:not([hidden])')
   view.locator('img[src]').evaluate_all("images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();}))")
   assert view.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert view.locator('main h1').count()==1
   view.locator('[data-quick-contact-toggle]').click();assert view.locator('#quick-contact-panel').is_visible();view.keyboard.press('Escape')
   view.screenshot(path=str(out/f'{name}-{width}.png'),full_page=True)
  print(f'Self-contained pages: no external resources, images, styles and widget {width} OK',flush=True)
 view.goto(design_url('about-us'));view.locator('[data-menu-toggle]').click()
 view.locator('#site-menu .drawer-link[href="contacts.html"]').click();view.wait_for_url(design_url('contacts'))
 submit_preview(view.locator('#contact-form'))
 assert not network,network

 nojs=browser.new_context(java_script_enabled=False);nj=nojs.new_page()
 for url in [base+'/contacts/',design_url('contacts')]:
  nj.goto(url);assert nj.locator('[data-request-submit]').is_disabled()
 nojs.close();assert not requests and not errors,(requests,errors)
 (out/'results.json').write_text(json.dumps({'previewGuard':True,'offlineWidths':[390,1440],'offlineRequests':network,'standaloneMode':'local HTTP' if offline_base else 'file://','realSubmissions':requests,'noJsPreviewDisabled':True,'errors':errors},ensure_ascii=False,indent=2)+'\n')
 browser.close()
