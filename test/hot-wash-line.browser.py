"""Published-line flows and all hot-wash positions; no real project submissions."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import os,json,hashlib
from playwright.sync_api import sync_playwright,expect
from line_tooltip_checks import assert_tooltip_clearance

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3161').rstrip('/')
out=Path(os.environ.get('ERA_HOT_WASH_REPORT_DIR','/tmp/era-hot-wash-browser'));out.mkdir(parents=True,exist_ok=True)
errors=[];failures=[];report={'widths':[],'positions':36,'callouts':44}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.route('https://formsubmit.co/**',lambda route:route.abort())
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
 def load(path='/catalog/lines/moyka-plenki/'):
  assert page.goto(base+path).status==200
  if '/moyka-plenki/' in path:page.wait_for_selector('#hotwash-construction[data-monitor-ready=true]')
 def overflow():assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.url
 for width in [320,390,768,1024,1280,1440,1920]:
  page.set_viewport_size({'width':width,'height':1000});load();overflow()
  page.locator('main img').evaluate_all('items=>Promise.all(items.map(i=>{i.loading="eager";return i.decode()}))')
  assert page.locator('main img').evaluate_all('items=>items.every(i=>i.complete&&i.naturalWidth&&(i.alt||i.closest("[data-library-document]")))')
  root=page.locator('#hotwash-construction');viewport=root.locator('[data-diagram-viewport]')
  assert viewport.evaluate('e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1')
  assert root.locator('[data-diagram-select] option').count()==36
  assert root.locator('[data-callout]').count()==44
  root.locator('[data-diagram-select]').scroll_into_view_if_needed()
  initial=root.bounding_box()['height']
  for number in range(1,37):
   root.locator('[data-diagram-select]').select_option(str(number))
   expect(root.locator('[data-detail-number]')).to_have_text(str(number).zfill(2))
   assert root.locator('[data-detail-label]').inner_text()
   assert root.locator('[data-detail-description]').inner_text()
   assert abs(root.bounding_box()['height']-initial)<1,(width,number)
   assert root.locator('.diagram-details').evaluate('e=>{const a=e.getBoundingClientRect();return [...e.children].filter(c=>getComputedStyle(c).display!=="none").every(c=>c.getBoundingClientRect().bottom<=a.bottom+1)}'),(width,number)
  dimensions=page.locator('[data-line-dimensions]');tabs=dimensions.get_by_role('tab')
  expect(tabs).to_have_count(2)
  tabs.nth(1).click();expect(tabs.nth(1)).to_have_attribute('aria-selected','true');expect(page.locator('#hot-dimension-view-top')).to_be_visible()
  tabs.nth(1).focus();page.keyboard.press('Home');expect(tabs.first).to_have_attribute('aria-selected','true')
  expect(page.locator('#hot-dimension-view-workshop')).to_be_visible();overflow()
  assert page.locator('#quality .hw-product-grid>article').count()==3
  assert not page.locator('#quality').evaluate('e=>e.scrollWidth>e.clientWidth')
  report['widths'].append(width)
  print('Hot wash: fit, 36 selections, 3 products, dimensions, images, stable panel and no overflow:',width,'OK',flush=True)
 page.set_viewport_size({'width':1440,'height':1000});load();root=page.locator('#hotwash-construction')
 tooltip=root.locator('[data-diagram-tooltip]')
 for pin in root.locator('button[data-callout]').all():
  number=pin.get_attribute('data-part');identity=pin.get_attribute('data-callout')
  pin.focus();pin.hover();expect(tooltip).to_be_visible()
  expect(root.locator('[data-diagram-select]')).to_have_value(number)
  expect(root).to_have_attribute('data-selected-callout',identity)
  assert_tooltip_clearance(tooltip,1440,('hot-wash',identity))
  pin.click();expect(root.locator('[data-detail-number]')).to_have_text(number.zfill(2))
  assert_tooltip_clearance(tooltip,1440,('hot-wash-click',identity))
  page.keyboard.press('Escape');expect(tooltip).to_be_hidden()
 print('All 44 printed badges: hover, click, focus, exact selection and tooltip clearance OK',flush=True)
 pin=root.locator('[data-callout="18-1"]');pin.focus();page.keyboard.press('Enter');expect(tooltip).to_be_visible();page.keyboard.press('Escape')
 expand=root.locator('[data-diagram-fullscreen]');expand.click();page.wait_for_function('document.querySelector("#hotwash-construction").dataset.expanded==="true"')
 root.locator('[data-diagram-zoom]').select_option('detail')
 expect(root).to_have_attribute('data-zoomed','true')
 root.locator('[data-diagram-select]').select_option('1');expect(root.locator('[data-detail-number]')).to_have_text('01')
 page.keyboard.press('Escape');page.wait_for_function('document.querySelector("#hotwash-construction").dataset.expanded==="false"');expect(expand).to_be_focused()
 spec=page.locator('details').filter(has=page.locator('.hw-specification'));spec.locator('summary').click()
 expect(page.locator('[data-hotwash-position]')).to_have_count(37)
 page.locator('[data-hotwash-select="26"]').click();expect(root.locator('[data-diagram-select]')).to_have_value('26')
 expect(root.locator('[data-detail-label]')).to_contain_text('пресс-капсулятор')
 page.locator('[data-hotwash-position="37"] a').click();page.wait_for_url('**#placement')
 assert page.locator('#placement').evaluate('e=>e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().top<innerHeight')
 opener=page.locator('#documents [data-pdf-open="moyka-plenki-technical"]');opener.click()
 page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 1 из 22"',timeout=30000)
 dialog=page.locator('#pdf-viewer');expect(dialog).to_be_visible()
 assert dialog.locator('[data-pdf-canvas]').evaluate('c=>c.width>100&&c.height>100')
 dialog.locator('[data-pdf-page]').fill('22');dialog.locator('[data-pdf-page]').press('Enter')
 page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 22 из 22"')
 with page.expect_download() as download:
  dialog.locator('[data-pdf-download]').click()
 pdf=Path(download.value.path()).read_bytes();assert len(pdf)==4430978 and hashlib.sha256(pdf).hexdigest()=='5648714c2f667ddb9d2168803aac50faf927fedbecb5147deebb57b0186a704a'
 page.keyboard.press('Escape');expect(opener).to_be_focused()
 for selector,part in [('.line-hero .media-open','overview'),('#hot-dimension-view-workshop .media-open','placement-isometric')]:
  page.locator(selector).click();expect(page.locator('#media-viewer')).to_be_visible()
  assert part in page.locator('#viewer-image').get_attribute('src');page.keyboard.press('Escape')
 page.locator('.line-hero [data-project-request]').click();expect(page.locator('#project-request')).to_be_visible();page.keyboard.press('Escape')
 print('Fullscreen, zoom/Escape/focus, specification, placement link, 22-page PDF/view/download and original images OK',flush=True)
 # A new session keeps the route/back scenarios independent of repeated layout navigation.
 page.close();page=browser.new_page(reduced_motion='reduce',viewport={'width':1440,'height':1000})
 page.on('pageerror',lambda e:errors.append(str(e)))
 load('/catalog/lines/?group=Мойка')
 ready=page.locator('[data-line]:visible');expect(ready).to_have_count(1);assert ready.evaluate('e=>e.tagName')=='A'
 for target in ['.line-card-cover','.line-card-content h3','.line-card-metrics']:
  card=page.locator('[data-line-id=moyka-plenki]');assert card.locator('img').evaluate('i=>getComputedStyle(i).objectFit==="contain"&&getComputedStyle(i).transform==="none"')
  card.locator(target).click();page.wait_for_url('**/moyka-plenki');page.wait_for_selector('[data-context-ready]')
  page.locator('[data-context-back]').click();page.wait_for_selector('[data-catalog-ready]');expect(page.locator('[data-line]:visible')).to_have_count(1)
  assert parse_qs(urlparse(page.url).query)['group']==['Мойка']
 load('/catalog/lines/');cards=page.locator('.line-card--complete')
 expect(cards).to_have_count(4)
 a=page.locator('[data-line-id=separatsiya-02] .line-card-cover').bounding_box();c=page.locator('[data-line-id=moyka-plenki] .line-card-cover').bounding_box()
 assert abs(a['width']-c['width'])<1 and abs(a['height']-c['height'])<1 and abs(c['width']/c['height']-1.5)<.01
 expect(page.locator('[data-line-id=separatsiya-03]')).to_have_js_property('tagName','A')
 expect(page.locator('[data-line-id=separatsiya-03]')).to_have_attribute('href',urlparse(base).path+'/catalog/lines/separatsiya-03')
 load('/technology/#hot-washing');link=page.locator('[data-technology-line=moyka-plenki]');expect(link).to_be_visible();link.click();page.wait_for_selector('[data-hot-wash-line]')
 page.locator('#photos [data-photo-gallery]').click();page.wait_for_selector('[data-gallery-ready=true]')
 page.wait_for_function('document.querySelector("[name=product]").value.endsWith("/catalog/lines/moyka-plenki")')
 expect(page.locator('[data-gallery-archive-grid] [data-gallery-item]')).to_have_count(22)
 load('/documents/technical/?objectType=line&product=moyka-plenki');page.wait_for_selector('[data-document-library]')
 expect(page.locator('[data-library-document]:visible')).to_have_count(1)
 print('Whole-card links, exact cover size, wash filter/back, technology, line media and library filters OK',flush=True)
 touch=browser.new_page(has_touch=True,is_mobile=True,viewport={'width':390,'height':1000})
 touch.goto(base+'/catalog/lines/moyka-plenki/');touch.wait_for_selector('[data-monitor-ready]')
 touch.locator('[data-diagram-select]').select_option('18');touch.locator('[data-callout="18-2"]').tap();expect(touch.locator('[data-detail-number]')).to_have_text('18');touch.close()
 static=browser.new_context(java_script_enabled=False,viewport={'width':320,'height':1000});s=static.new_page();s.goto(base+'/catalog/lines/moyka-plenki/')
 expect(s.locator('h1')).to_have_text('Линия горячей мойки плёнок и пакетов');expect(s.locator('svg image')).to_have_count(1)
 s.locator('details').filter(has=s.locator('.hw-specification')).locator('summary').click();expect(s.locator('[data-hotwash-position]')).to_have_count(37)
 assert s.locator('#documents a[download]').get_attribute('href').endswith('era-moyka-plenki-technical-description.pdf');static.close()
 assert not errors,errors;assert not failures,failures
 report.update({'errors':errors,'localHttpFailures':failures,'pdfSHA256':'verified','linksHistoryAndTouch':'passed','noJS':'passed'})
 (out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 browser.close();print('Hot-wash acceptance passed; no forms submitted. '+str(out/'results.json'),flush=True)
