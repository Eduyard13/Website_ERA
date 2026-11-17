"""Technology acceptance checks. No screenshots or real contact submissions."""
import os,json
from playwright.sync_api import sync_playwright

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3081').rstrip('/')
widths=[320,360,390,768,1024,1440]
errors=[];failed=[];results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 def load(fragment=''):
  page.goto(base+'/technology/'+fragment)
  page.wait_for_selector('[data-balance-range]:not([disabled])',state='attached')
  page.wait_for_selector('.page-progress-rail a')
 def images():
  page.locator('main img[src]').evaluate_all('items=>Promise.all(items.map(i=>{i.loading="eager";return i.decode().catch(()=>{});} ))')
 def overflow():
  bad=page.locator('.tf-container,.tf-matrix,.tf-cleaning-table,.tf-process-route,.tf-line-card,.tf-quality-metrics,.tf-applications-grid,.tf-next-actions,.web-balance-layout').evaluate_all('items=>items.filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>({tag:e.tagName,classes:e.className,width:e.clientWidth,scroll:e.scrollWidth}))')
  assert not bad,bad
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate('({w:innerWidth,s:document.documentElement.scrollWidth})')
 for width in widths:
  page.set_viewport_size({'width':width,'height':960})
  load();images();overflow()
  assert page.locator('main h1').count()==1
  assert page.locator('[data-technology-final]>section').count()==10
  assert page.locator('.page-progress-rail a').count()==10
  assert page.locator('[data-feedstock-type]').count()==9
  assert page.locator('[data-contaminant-row]:visible').count()==9
  assert page.locator('#granulation a').count()==0
  assert page.locator('[data-technology-line]').count()==1
  assert page.locator('[data-technology-output]').count()==3
  assert page.locator('[data-technology-application]').count()==5
  assert page.locator('main img[src]').evaluate_all('items=>items.every(i=>i.complete&&i.naturalWidth>0&&i.alt)')
  assert page.locator('.tf-outline a').all_text_contents()==['Сырьё','Этапы','Готовая продукция','Качество','Применение','Оборудование']
  assert page.locator('#granule-quality').inner_text().find('190 °C / 2,16 кг')>=0
  assert page.locator('.tf-line-metrics>div').count()==4
  assert page.locator('[data-washing-configuration]').count()==2
  assert page.locator('.primary-nav a').all_text_contents()==['О проекте','Технология','Оборудование','Экономика','КАИР']
  for fragment in ['#material-balance','#control-title','#about-era','#granule-quality']:
   load(fragment)
   target=page.locator(fragment);assert target.is_visible(),(width,fragment)
   page.wait_for_function('(id)=>{const r=document.querySelector(id).getBoundingClientRect();return r.top>=0&&r.top<innerHeight}',arg=fragment)
   if fragment=='#material-balance':
    slider=page.locator('[data-balance-range]');assert slider.get_attribute('min')=='0' and slider.get_attribute('max')=='50' and slider.get_attribute('step')=='5'
    for value,polymer,inclusions in [(0,1500,0),(20,1200,300),(50,750,750)]:
     slider.evaluate('(e,value)=>{e.value=value;e.dispatchEvent(new Event("input",{bubbles:true}));}',str(value))
     assert int(''.join(page.locator('[data-balance-polymer]').inner_text().split()))==polymer
     assert int(''.join(page.locator('[data-balance-inclusions]').inner_text().split()))==inclusions
    overflow()
   if fragment=='#control-title':assert page.locator('[data-kair]').get_attribute('data-autoplay')=='false'
  results.append({'width':width,'overflow':False,'rows':9,'balance':[0,20,50],'deepLinks':4})
  print('Technology layout, all rows, product data, balance and deep links:',width,'OK',flush=True)
 page.set_viewport_size({'width':390,'height':844});load('#material-balance')
 slider=page.locator('[data-balance-range]');slider.focus();page.keyboard.press('ArrowLeft')
 assert slider.input_value()=='45'
 assert page.locator('[data-balance-polymer]').inner_text()=='825'
 context=browser.new_context(java_script_enabled=False,reduced_motion='reduce',viewport={'width':390,'height':844})
 plain=context.new_page();plain.goto(base+'/technology/')
 assert plain.locator('main h1').count()==1
 assert plain.locator('[data-contaminant-row]:visible').count()==9
 assert plain.locator('[data-technology-application]').count()==5
 assert plain.locator('#granule-quality').is_visible()
 details=plain.locator('details').filter(has=plain.locator('#material-balance')).first
 details.locator('summary').first.click();assert plain.locator('#material-balance').is_visible()
 plain.locator('#material-balance details>summary').click();assert plain.locator('.web-balance-table').is_visible()
 assert plain.locator('.web-balance-table tbody tr').count()==11
 assert plain.evaluate('document.documentElement.scrollWidth<=innerWidth')
 plain.locator('.tf-outline a[href="#applications"]').focus();plain.keyboard.press('Enter');plain.wait_for_url(base+'/technology/#applications')
 context.close();browser.close()
 assert not errors,errors
 assert not failed,failed
 print(json.dumps({'widths':results,'noJS':True,'keyboard':True,'screenshots':False,'errors':errors,'failed':failed},ensure_ascii=False))
