"""Presentation additions, preserved finance, native diagrams and request context."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3024/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-presentation-027/browser'));out.mkdir(parents=True,exist_ok=True)
repo=Path(__file__).resolve().parents[1]
widths=[320,360,390,768,1280,1440]
errors=[];failed=[];submissions=[];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda response:failed.append((response.status,response.url)) if response.status>=400 and response.url.startswith(base) else None)
 page.route('**/formsubmit.co/**',lambda route:(submissions.append(route.request.url),route.abort()))
 def overflow():assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(page.viewport_size,page.url)
 def images():
  page.locator('img[loading=lazy]').evaluate_all('images=>images.forEach(image=>image.loading="eager")')
  page.wait_for_function('[...document.images].filter(i=>i.id!=="viewer-image"&&!i.matches("[data-kair-viewer-image]")).every(i=>i.complete&&i.naturalWidth>0)')
 def snapshot(selector,name,width):
  if width not in [390,1440]:return
  page.locator('.site-header').evaluate('(header)=>header.style.visibility="hidden"')
  page.locator(selector).screenshot(path=str(out/f'{name}-{width}.png'))
  page.locator('.site-header').evaluate('(header)=>header.style.visibility=""')
 for width in widths:
  page.set_viewport_size({'width':width,'height':1000});page.goto(base+'/');images();overflow()
  assert page.locator('h1').count()==1
  assert page.locator('.web-proposal-steps>li').count()==4
  assert page.locator('.web-application').count()==5
  for application in page.locator('.web-application').all():
   application.locator('summary').click();assert application.locator('div').is_visible();overflow()
  assert page.locator('.web-delivery-steps>li').count()==5
  assert page.locator('.web-service>ul>li').count()==4
  assert page.locator('.quality-visual').count()==0
  assert page.locator('[data-widget-switch]').count()==4
  assert page.locator('[data-econ-widget=monthly] [data-econ-profit]').inner_text().startswith('4,45')
  assert page.locator('.web-manufacture-photo').count()==5
  region=page.locator('.web-regional details');region.locator('summary').click()
  assert region.locator(':scope>div').evaluate('(e)=>getComputedStyle(e).position')=='static'
  assert region.locator('.web-region-examples>li').count()==11
  assert 'действующие объекты не обозначены' in region.inner_text();overflow()
  region.get_by_role('link',name='Обсудить сырьевую базу').click()
  assert page.locator('#project-request').is_visible()
  assert page.locator('#project-request [data-request-topic]').input_value()=='Сырьевая база: регион, поток и логистика'
  page.locator('#project-request [data-request-files]').set_input_files(repo/'public/assets/presentation/granules.webp')
  assert page.locator('#project-request [data-request-file-list]>li').count()==1
  page.keyboard.press('Escape');assert not page.locator('#project-request').is_visible()
  opener=page.locator('.web-manufacture-photo .media-open').first;opener.click()
  assert page.locator('#media-viewer').is_visible()
  assert '/photos/ballisticheskiy-separator/05.webp' in page.locator('#viewer-image').get_attribute('src')
  page.locator('#media-viewer [data-next]').click();assert 'Общий вид оборудования' in page.locator('#viewer-title').inner_text()
  page.keyboard.press('Escape');assert opener.evaluate('(e)=>e===document.activeElement')
  for selector,name in [('.web-proposal','proposal'),('#solution','applications'),('#manufacturing','manufacture'),('#about-era','delivery')]:snapshot(selector,name,width)
  page.goto(base+'/technology/');images();overflow()
  assert page.locator('h1').count()==1 and page.locator('[data-kair-slide]').count()==23
  assert page.locator('.quality-visual').count()==1
  assert page.locator('[data-technology-line]').get_attribute('href').endswith('/catalog/lines/separatsiya-02')
  controls=page.locator('[data-contaminant-controls]')
  assert page.locator('.web-contaminant-table caption').bounding_box()['height']<=1
  for key in ['mineral','organic','foreign','surface']:
   controls.locator(f'[data-contaminant={key}]').click()
   assert page.locator('[data-contaminant-row]:visible').count()==1
   assert page.locator(f'[data-contaminant-row={key}]').is_visible()
   assert controls.locator('[aria-pressed=true]').count()==1
   overflow()
  controls.locator('button').last.focus();page.keyboard.press('Home');assert controls.locator('button').first.get_attribute('aria-pressed')=='true'
  page.keyboard.press('ArrowRight');assert controls.locator('[data-contaminant=organic]').get_attribute('aria-pressed')=='true'
  manual=page.locator('.web-manual');manual.locator(':scope>summary').click()
  assert '≈ 4,36 кг/ч' in manual.inner_text()
  manual.locator('details>summary').click();assert '59,6 ₽/кг' in manual.inner_text();overflow()
  slider=page.locator('[data-balance-range]');assert slider.is_enabled()
  for z in [0,5,20,35,50]:
   slider.evaluate('(e,z)=>{e.value=z;e.dispatchEvent(new Event("input",{bubbles:true}))}',z)
   assert page.locator('[data-balance-contamination]').inner_text()==str(z)+'%'
   polymer=int(page.locator('[data-balance-polymer]').inner_text().replace('\u00a0','').replace('\u202f','').replace(' ',''))
   inclusions=int(page.locator('[data-balance-inclusions]').inner_text().replace('\u00a0','').replace('\u202f','').replace(' ',''))
   assert polymer==1500*(1-z/100) and polymer+inclusions==1500
   assert page.locator('[data-balance-point]').evaluate('(e)=>parseFloat(e.style.left)')==z*2
   dot=page.locator('[data-balance-point]').bounding_box();assert abs(dot['width']-dot['height'])<.1
   assert page.locator('[data-balance-polymer-bar]').evaluate('(e)=>e.getBoundingClientRect().width')>=0
   overflow()
  slider.focus();page.keyboard.press('Home');assert page.locator('[data-balance-inclusions]').inner_text()=='0'
  page.keyboard.press('End');assert page.locator('[data-balance-polymer]').inner_text()=='750'
  for anchor in ['raw-material','contaminants','solution','material-balance','granule-quality','control-title']:
   page.locator(f'.technology-outline a[href="#{anchor}"]').click()
   top=page.locator('#'+anchor).bounding_box()['y'];header=page.locator('.site-header').bounding_box()
   assert top>=header['y']+header['height']-1,(width,anchor,top,header)
  for selector,name in [('.web-preparation','preparation'),('#contaminants','contaminants'),('.web-process','process'),('#material-balance','balance')]:snapshot(selector,name,width)
  page.locator('.web-project-parameters').get_by_role('link',name='Получить параметры под площадку').click()
  assert page.locator('#project-request [data-request-topic]').input_value()=='Параметры линии под площадку и сырьё'
  page.keyboard.press('Escape')
  page.locator('.detail-doors').get_by_role('link',name='Сравнить варианты запуска').click();page.wait_for_url(base+'/#solution')
  assert page.locator('.sales-routes').count()==1
  results.append({'width':width,'nativeDiagrams':True,'materialBalanceEndpoints':True,'requestContext':True,'overflow':False})
  print('Presentation, diagrams, balance, photo viewer, forms and cross-links:',width,'OK',flush=True)
 # No JavaScript: complete contamination table, source calculations and useful links.
 static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000})
 plain=static.new_page();plain.goto(base+'/technology/')
 assert plain.locator('[data-contaminant-row]:visible').count()==4
 assert not plain.locator('[data-contaminant-controls]').is_visible()
 assert plain.locator('[data-balance-polymer]').inner_text()=='750'
 plain.locator('.web-balance details>summary').click();assert plain.locator('.web-balance-table tbody>tr').count()==11
 assert plain.locator('.web-balance-table').is_visible()
 assert plain.evaluate('document.documentElement.scrollWidth<=innerWidth')
 plain.goto(base+'/');plain.locator('.web-application summary').first.click();assert plain.locator('.web-application[open]>div').is_visible()
 assert plain.locator('.web-regional a[data-project-request]').get_attribute('href').startswith('/Website_ERA/contacts?topic=')
 static.close();assert not errors,errors;assert not failed,failed;assert not submissions,submissions
 (out/'results.json').write_text(json.dumps({'layouts':results,'staticFallback':True,'errors':errors,'failedLocalResponses':failed,'submittedRequests':submissions},ensure_ascii=False,indent=2))
 print('Static fallback and zero sent requests: OK',flush=True);browser.close()
