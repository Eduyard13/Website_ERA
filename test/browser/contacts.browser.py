"""Contacts acceptance with intercepted form requests and external map links."""
import os,json
from playwright.sync_api import sync_playwright

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3091').rstrip('/')
widths=[320,360,375,390,768,1024,1280,1440,1920]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('ERA_CHROME_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 context=browser.new_context(reduced_motion='reduce',permissions=['clipboard-read','clipboard-write'])
 context.route(base+'/api/request.php',lambda route:route.abort())
 page=context.new_page();errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
 for width in widths:
  page.set_viewport_size({'width':width,'height':960})
  page.goto(base+'/contacts/');page.wait_for_selector('[data-request-ready=true]')
  page.locator('main img').evaluate_all("items=>Promise.all(items.map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))")
  assert page.locator('main h1').inner_text()=='От вашей задачи — к нашему решению.'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert page.locator('.page-progress-rail a').count()==5,width
  assert page.locator('main img').evaluate_all('items=>items.every(i=>i.complete&&i.naturalWidth>0)'),width
  assert page.locator('.cp-direct,.cp-form-card,.cp-map,.cp-production-image,.cp-production-address,.cp-video-channel').evaluate_all('items=>items.every(i=>i.scrollWidth<=i.clientWidth+1)'),width
  assert page.locator('[data-request-form]').count()==1
  assert not page.locator('[data-contact-optional]').get_attribute('open')
  assert page.locator('[data-request-files]').count()==1
  assert page.locator('[data-request-submit]').is_visible()
  assert page.locator('[data-map-embed]').count()==0
  if page.locator('[data-cookie-notice]').is_visible():
   page.locator('[data-cookie-choice=allow]').click()
  assert page.locator('.cp-map iframe').count()==0
  assert page.locator('[data-map-external]').count()==2
  assert page.locator('a.cp-video-channel[target=_blank][rel="noopener noreferrer"]').count()==2
  assert page.locator('.cp-video-channel.is-pending').count()==0
  assert page.locator('.cp-channel-badge img').get_attribute('src').endswith('/assets/brands/vk-video.svg')
  assert page.locator('.footer-video-channel img').get_attribute('src').endswith('/assets/brands/vk-video.svg')
  assert page.locator('[name="email"]').evaluate('i=>parseFloat(getComputedStyle(i).fontSize)>=16')
  if width>=1024:
   left=page.locator('.cp-direct').bounding_box();right=page.locator('.cp-form-card').bounding_box()
   assert abs(left['y']-right['y'])<1 and abs(left['height']-right['height'])<1
   assert right['x']>=left['x']+left['width']-1
  else:
   assert page.locator('.cp-form-card').bounding_box()['y']>=page.locator('.cp-direct').bounding_box()['y']+page.locator('.cp-direct').bounding_box()['height']-1
  assert page.locator('[data-map-external=google]').is_visible()
  figure=page.locator('.cp-production-image').bounding_box();map_box=page.locator('.cp-map').bounding_box()
  if width>=768:assert abs(figure['y']-map_box['y'])<1 and abs(figure['height']-map_box['height'])<1
  image=page.locator('.cp-production-frame img');frame=page.locator('.cp-production-frame')
  assert image.evaluate("i=>getComputedStyle(i).objectFit==='cover'")
  assert abs(image.bounding_box()['height']-frame.bounding_box()['height'])<1 and abs(image.bounding_box()['width']-frame.bounding_box()['width'])<1
  assert image.evaluate("i=>i.outerHTML.match(/\\bsizes=/g).length===1")
  if width>=768:assert image.evaluate("i=>i.currentSrc.endsWith('/assets/contacts/beier-zhangjiagang-factory.webp')")
  assert page.locator('main a').evaluate_all("links=>links.every(a=>!/(^|\\.)(beierpm|beierrecycling|beiermachinery)\\.com$/.test(new URL(a.href).hostname))")
  page.locator('[data-contact-optional] summary').click()
  assert page.locator('[data-request-topic]').is_visible()
  assert page.locator('[name="Ссылки"]').is_visible()
  assert page.locator('[data-contact-optional]>div').evaluate("e=>getComputedStyle(e).position==='static'")
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('Contacts layout, assets, form and map controls:',width,'OK',flush=True)
 page.locator('[data-copy-address]').click()
 page.wait_for_function("document.querySelector('[data-copy-status]').textContent==='Адрес скопирован.'")
 assert page.evaluate('navigator.clipboard.readText()')==page.locator('address [lang=en]').inner_text()
 page.goto(base+'/contacts/?topic=%3Cscript%3E%22%D0%A6%D0%B5%D1%85%22%3C%2Fscript%3E#project-form')
 assert page.locator('[data-contact-optional]').get_attribute('open') is not None
 assert page.locator('[data-request-topic]').input_value()=='<script>"Цех"</script>'
 assert page.locator('[data-request-topic]').is_visible()
 assert page.locator('form script').count()==0
 # Denied clipboard and storage have accessible fallbacks.
 fallback=browser.new_context(reduced_motion='reduce')
 fallback.add_init_script("Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied')}}});Storage.prototype.getItem=()=>{throw Error('Denied')};Storage.prototype.setItem=()=>{throw Error('Denied')};")
 f=fallback.new_page();f.goto(base+'/contacts/');f.locator('[data-copy-address]').click()
 assert 'вручную' in f.locator('[data-copy-status]').inner_text()
 assert f.evaluate('getSelection().toString()')==f.locator('address [lang=en]').inner_text()
 assert f.locator('[data-cookie-notice]').is_hidden()
 assert f.locator('.cp-map iframe').count()==0
 fallback.close()
 # Intercept the full-page form too: optional fields, picker, drag/drop, 5 MB and exact ZIP bytes.
 from email.parser import BytesParser
 from email import policy
 from urllib.parse import urlparse
 import zipfile,io
 posts=[]
 def receive(route):
  request=route.request;assert request.method=='POST'
  content_type=request.headers['content-type'];assert content_type.startswith('multipart/form-data; boundary=')
  message=BytesParser(policy=policy.default).parsebytes(('MIME-Version: 1.0\r\nContent-Type: '+content_type+'\r\n\r\n').encode()+request.post_data_buffer)
  fields={};attachments=[]
  for part in message.iter_parts():
   key=part.get_param('name',header='content-disposition')
   if part.get_filename() is not None:attachments.append((part.get_filename(),part.get_payload(decode=True)))
   else:fields[key]=part.get_payload(decode=True).decode('utf-8')
  posts.append((fields,attachments));route.fulfill(status=303,headers={'Location':base+'/contacts/sent/'},body='')
 context.unroute(base+'/api/request.php');context.route(base+'/api/request.php',receive)
 page.set_viewport_size({'width':390,'height':844});page.goto(base+'/contacts/')
 form=page.locator('[data-request-form]');form.locator('[type=submit]').click();assert not posts
 for key,value in [('Имя','Проверка формы'),('Компания','Тестовая компания'),('email','fixture@example.com'),('Телефон','+7 900 000-00-00'),('Задача','Подбор линии; тест запроса только в браузерной фикстуре.')]:form.locator('[name="'+key+'"]').fill(value)
 form.locator('[data-request-files]').set_input_files({'name':'large.pdf','mimeType':'application/pdf','buffer':b'0'*5000001})
 assert 'превышает 5 МБ' in form.locator('[data-request-error]').inner_text();assert form.locator('.request-file-list li').count()==0;assert not posts
 form.locator('[data-contact-optional] summary').click();form.locator('[data-request-topic]').fill('Комплектация линии');form.locator('[name="Ссылки"]').fill('https://example.com/video')
 photo=(__import__('pathlib').Path(__file__).resolve().parents[2]/'public/assets/contacts/beier-zhangjiagang-factory-768.webp').read_bytes()
 with page.expect_file_chooser() as chooser:form.locator('[data-request-pick]').click()
 chooser.value.set_files({'name':'сырьё.webp','mimeType':'image/webp','buffer':photo})
 transfer=page.evaluate_handle("""()=>{const d=new DataTransfer();d.items.add(new File(['%PDF-fixture'],'задание.pdf',{type:'application/pdf'}));return d;}""")
 form.locator('[data-request-drop]').dispatch_event('dragover',{'dataTransfer':transfer});assert 'is-dragging' in form.locator('[data-request-drop]').get_attribute('class')
 form.locator('[data-request-drop]').dispatch_event('drop',{'dataTransfer':transfer});assert form.locator('.request-file-list li').count()==2
 form.locator('.request-file-list button').last.click();assert form.locator('.request-file-list li').count()==1
 form.locator('[data-request-drop]').dispatch_event('drop',{'dataTransfer':transfer});assert form.locator('.request-file-list li').count()==2
 assert form.locator('[data-request-error]').is_hidden();form.locator('[name="Согласие"]').check();form.locator('[type=submit]').click();page.wait_for_url(base+'/contacts/sent/')
 assert len(posts)==1;fields,attachments=posts[0]
 assert fields['Интересует']=='Комплектация линии' and fields['Ссылки']=='https://example.com/video'
 assert fields['_honey']=='' and fields['Согласие']=='1' and fields['consent_revision']=='ERA-PD-1.3'
 assert len(attachments)==1 and attachments[0][0]=='Материалы_ЭРА.zip'
 with zipfile.ZipFile(io.BytesIO(attachments[0][1])) as archive:
  assert archive.read('сырьё.webp')==photo and archive.read('задание.pdf')==b'%PDF-fixture'
 print('Inline form: validation, optional fields, 5 MB, picker, drag/drop, removal, multipart originals and redirect passed with intercepted POST.',flush=True)
 # Check enlarged text at 200% on desktop with all sections available.
 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'/contacts/')
 # Desktop 200% zoom on a 1440 px screen: 720 CSS px, scale factor 2.
 session=context.new_cdp_session(page)
 session.send('Emulation.setDeviceMetricsOverride',{'width':720,'height':500,'deviceScaleFactor':2,'mobile':False})
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'200% overflow'
 assert page.locator('[name="email"]').is_visible()
 page.locator('[data-contact-optional] summary').click();assert page.locator('[name="Ссылки"]').is_visible()
 session.send('Emulation.clearDeviceMetricsOverride')
 # Existing pages retain their headline, request modal, navigation and footer.
 for width in [390,1440]:
  page.set_viewport_size({'width':width,'height':960})
  for path in ['/about-us/','/technology/','/economics/','/catalog/']:
   page.goto(base+path);page.wait_for_selector('#quick-contact:not([hidden])')
   assert page.locator('main h1').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(path,width)
   assert page.locator('[data-contact-optional]').count()==0
   assert page.locator('#project-request [data-request-form]').count()==1
   assert page.locator('#site-footer').is_visible()
 nojs=browser.new_context(java_script_enabled=False);f=nojs.new_page();f.goto(base+'/contacts/')
 assert f.locator('address').is_visible()
 assert f.locator('[data-map-external=google]').is_visible() and f.locator('[data-map-external=yandex]').is_visible()
 assert f.locator('[data-map-switch]').is_hidden()
 assert f.locator('.cp-map iframe').count()==0
 f.locator('[data-contact-optional] summary').click();assert f.locator('[name="Ссылки"]').is_visible()
 assert f.locator('[data-request-form]').get_attribute('method')=='post'
 nojs.close();assert not errors,errors
 browser.close()
 print('Contacts: clipboard, denied permissions/storage, topic, 200%, 4 regression routes and no-JS passed; no submissions sent.',flush=True)
