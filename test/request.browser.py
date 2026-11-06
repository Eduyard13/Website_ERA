"""Request UI and exact multipart payload; email service responses are mocked, not delivery."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse
from email.parser import BytesParser
from email import policy
import json,os,io,zipfile

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3024/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-navigation-request-025'));out.mkdir(parents=True,exist_ok=True)
repo=Path(__file__).resolve().parents[1]
endpoint='https://formsubmit.co/edkom.office@mail.ru'
labels=['О проекте','Технология','Система управления','Каталог оборудования','Галерея']
photo=(repo/'public/assets/presentation/kair.webp').read_bytes()
video=b'\x00\x00\x00\x18ftypmp42'+bytes(range(256))*100
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[];failed=[];results=[];posts=[]
 def service(route):
  request=route.request
  assert request.method=='POST'
  assert request.url==endpoint
  content_type=request.headers['content-type']
  assert content_type.startswith('multipart/form-data; boundary=')
  message=BytesParser(policy=policy.default).parsebytes(('MIME-Version: 1.0\r\nContent-Type: '+content_type+'\r\n\r\n').encode()+request.post_data_buffer)
  fields={};attachments=[]
  for part in message.iter_parts():
   name=part.get_param('name',header='content-disposition')
   filename=part.get_filename()
   if filename is not None:attachments.append({'field':name,'filename':filename,'bytes':part.get_payload(decode=True)})
   else:fields[name]=part.get_payload(decode=True).decode('utf-8')
  posts.append({'fields':fields,'attachments':attachments})
  route.fulfill(status=303,headers={'Location':base+'/contacts/sent/'},body='')
 for width in [320,390,768,1024,1200,1280,1366,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce')
  context.route(endpoint,service)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
  page.goto(base+'/')
  assert page.locator('.primary-nav a').all_text_contents()==labels
  assert page.locator('.primary-nav').is_visible()==(width>=1200)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'header')
  if width>=1200:
   assert page.locator('.primary-nav').bounding_box()['x']>=page.locator('.site-header .brand').bounding_box()['x']+page.locator('.site-header .brand').bounding_box()['width']+8
   assert page.locator('.primary-nav a').last.bounding_box()['x']+page.locator('.primary-nav a').last.bounding_box()['width']<=page.locator('.header-actions').bounding_box()['x']-8,(width,'nav overlaps actions')
  if width>=1200:page.locator('.header-cta').click()
  else:
   page.locator('[data-menu-toggle]').click()
   assert page.locator('.drawer-primary a').all_text_contents()==labels
   page.locator('.drawer-top-cta').click()
   assert not page.locator('#site-menu').is_visible()
  dialog=page.locator('#project-request');form=dialog.locator('form')
  assert dialog.is_visible();assert page.evaluate('document.activeElement.name')=='Имя'
  assert page.evaluate('document.body.classList.contains("request-open")')
  assert dialog.evaluate('(e)=>e.scrollWidth<=e.clientWidth'),(width,'dialog')
  # Native modal focus stays in the form; close keeps the draft and returns focus.
  dialog.locator('[data-request-close]').focus();page.keyboard.press('Shift+Tab')
  assert dialog.evaluate('(e)=>e.contains(document.activeElement)')
  page.keyboard.press('Tab');assert dialog.evaluate('(e)=>e.contains(document.activeElement)')
  form.locator('[name="Имя"]').fill('Тестовый клиент')
  page.keyboard.press('Escape');assert not dialog.is_visible()
  assert not page.evaluate('document.body.classList.contains("request-open")')
  if width>=1200:
   assert page.locator('.header-cta').evaluate('(e)=>e===document.activeElement')
   page.locator('.header-cta').click()
  else:
   page.locator('[data-menu-toggle]').click();page.locator('.drawer-top-cta').click()
  assert form.locator('[name="Имя"]').input_value()=='Тестовый клиент'
  before=len(posts);form.locator('[type=submit]').click();assert len(posts)==before
  form.locator('[name="Компания"]').fill('Компания клиента')
  form.locator('[name="email"]').fill('client@example.com')
  form.locator('[name="Телефон"]').fill('+7 900 123-45-67')
  form.locator('[name="Задача"]').fill('Нужна линия для переработки загрязнённой плёнки, 1500 кг/ч.')
  form.locator('[name="Ссылки"]').fill('https://example.com/company\nhttps://example.com/video')
  upload=form.locator('[data-request-files]')
  upload.set_input_files([{'name':'сырьё.webp','mimeType':'image/webp','buffer':photo},{'name':'работа.mp4','mimeType':'video/mp4','buffer':video}])
  assert form.locator('.request-file-list li').count()==2
  assert form.locator('[data-request-error]').is_hidden()
  if width in [390,1440]:
   page.screenshot(path=str(out/f'request-modal-{width}.png'))
  form.locator('[type=submit]').click()
  page.wait_for_url(base+'/contacts/sent/')
  fields=posts[-1]['fields'];attachments=posts[-1]['attachments']
  for key in ['Имя','Компания','email','Телефон','Задача','Ссылки','Страница обращения']:assert fields.get(key),(width,key,fields)
  assert fields['email']=='client@example.com'
  assert fields['_honey']==''
  assert fields['_template']=='table';assert fields['_subject']=='Заявка с сайта ЭРА'
  assert fields['_next']=='https://eduyard13.github.io'+urlparse(base).path+'/contacts/sent/'
  assert len(attachments)==1
  assert attachments[0]['field']=='attachment'
  assert attachments[0]['filename']=='Материалы_ЭРА.zip'
  with zipfile.ZipFile(io.BytesIO(attachments[0]['bytes'])) as archive:
   assert archive.namelist()==['сырьё.webp','работа.mp4']
   assert archive.read('сырьё.webp')==photo
   assert archive.read('работа.mp4')==video
   assert archive.testzip() is None
  assert 'сырьё.webp' in fields['Вложения'] and 'работа.mp4' in fields['Вложения']
  assert page.locator('h1').inner_text()=='Спасибо за обращение.'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print('Request: header, mobile menu, focus, validation, multipart bytes and return:',width,'OK',flush=True)
  results.append({'width':width,'overflow':False,'multipartFiles':2,'providerResponse':'mocked'})
  context.close()
 # Context survives from equipment, KAIR and a direct contact URL.
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 context.route(endpoint,service)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/catalog/equipment/ballisticheskiy-separator')
 page.get_by_role('link',name='Запросить предложение',exact=True).click()
 form=page.locator('#project-request form')
 assert 'Баллистический сепаратор' in form.locator('[data-request-topic]').input_value()
 assert form.locator('[data-request-source]').input_value().endswith('/ballisticheskiy-separator')
 upload=form.locator('[data-request-files]')
 upload.set_input_files({'name':'крупное-видео.mp4','mimeType':'video/mp4','buffer':b'x'*5_000_001})
 assert 'превышает 5 МБ' in form.locator('[data-request-error]').inner_text()
 assert upload.evaluate('(e)=>e.files.length')==0
 upload.set_input_files({'name':'script.exe','mimeType':'application/octet-stream','buffer':b'bad'})
 assert 'фото, видео или PDF' in form.locator('[data-request-error]').inner_text()
 upload.set_input_files({'name':'<текст>.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\nTEST'})
 assert '<текст>.pdf' in form.locator('.request-file-list').inner_text()
 assert form.locator('.request-file-list script').count()==0
 form.locator('.request-file-list button').click();assert upload.evaluate('(e)=>e.files.length')==0
 assert form.locator('[data-request-error]').is_hidden()
 page.keyboard.press('Escape')
 page.goto(base+'/automation');page.get_by_role('link',name='Обсудить систему',exact=True).click()
 assert 'КАИР' in page.locator('#project-request [data-request-topic]').input_value()
 page.keyboard.press('Escape')
 page.goto(base+'/contacts?topic=%3Cscript%3E%22%D0%A6%D0%B5%D1%85%22%3C%2Fscript%3E#project-form')
 assert page.locator('#project-request').count()==0
 assert page.locator('[data-request-topic]').input_value()=='<script>"Цех"</script>'
 assert page.locator('.project-request-form script').count()==0
 page.locator('[data-request-topic]').fill('Подбор линии переработки плёнки')
 for width in [390,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(out/f'contact-page-{width}.png'),full_page=True)
 context.close()
 # Without JS a request goes to the full form, preserving a real POST endpoint.
 context=browser.new_context(java_script_enabled=False,viewport={'width':1440,'height':1000})
 page=context.new_page();page.goto(base+'/')
 page.locator('.header-cta').click();assert page.url==base+'/contacts#project-form'
 assert page.locator('#project-form form').get_attribute('action')==endpoint
 assert page.locator('#project-form [name="email"]').is_visible()
 context.close()
 assert not errors,errors;assert not failed,failed
 (out/'request-results.json').write_text(json.dumps({'layouts':results,'errors':errors,'deliveryVerified':False,'activation':'recipient confirmation required','failedLocalResponses':failed},ensure_ascii=False,indent=2)+'\n')
 browser.close()
