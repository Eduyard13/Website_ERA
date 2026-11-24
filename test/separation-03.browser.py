"""Separation 03 acceptance: source badges, responsive layout, native flows and original PDF."""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import os, json, hashlib
from playwright.sync_api import sync_playwright, expect
from line_tooltip_checks import assert_tooltip_clearance

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3164').rstrip('/')
out=Path(os.environ.get('ERA_SEPARATION03_REPORT_DIR','/tmp/era-separation-03-browser'))
out.mkdir(parents=True,exist_ok=True)
errors=[]; failures=[]; report={'widths':[],'positions':37,'sourceBadges':42}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.route('**/api/request.php',lambda route:route.abort())
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
 def load(path='/catalog/lines/separatsiya-03/'):
  assert page.goto(base+path).status==200
  if '/separatsiya-03/' in path:page.wait_for_selector('#line03-construction[data-monitor-ready=true]')
 def overflow():assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.url
 for width in [320,390,768,1024,1280,1440,1920]:
  page.set_viewport_size({'width':width,'height':1000}); load(); overflow()
  page.locator('main img').evaluate_all('items=>Promise.all(items.map(i=>{i.loading="eager";return i.decode()}))')
  assert page.locator('main img').evaluate_all('items=>items.every(i=>i.complete&&i.naturalWidth&&(i.alt||i.closest("[data-library-document]")))')
  root=page.locator('#line03-construction'); viewport=root.locator('[data-diagram-viewport]')
  assert viewport.evaluate('e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1')
  expect(root.locator('[data-diagram-select] option')).to_have_count(37)
  expect(root.locator('[data-callout]')).to_have_count(42)
  root.locator('[data-diagram-select]').scroll_into_view_if_needed();initial=root.bounding_box()['height']
  for number in range(1,38):
   root.locator('[data-diagram-select]').select_option(str(number))
   expect(root.locator('[data-detail-number]')).to_have_text(str(number).zfill(2))
   assert root.locator('[data-detail-label]').inner_text() and root.locator('[data-detail-description]').inner_text()
   assert abs(root.bounding_box()['height']-initial)<1,(width,number,'unstable monitor')
   assert root.locator('.diagram-details').evaluate('e=>{const r=e.getBoundingClientRect();return [...e.children].filter(c=>getComputedStyle(c).display!=="none").every(c=>c.getBoundingClientRect().bottom<=r.bottom+1)}'),(width,number,'panel overflow')
  tabs=page.locator('[data-line-dimensions] [role=tab]');expect(tabs).to_have_count(3)
  tabs.nth(1).click();expect(page.locator('#sd-dimension-view-side')).to_be_visible()
  tabs.nth(1).focus();page.keyboard.press('Home');expect(page.locator('#sd-dimension-view-top')).to_be_visible()
  overflow();report['widths'].append(width)
  if width in [320,1440]:
   page.goto(base+'/catalog/lines/separatsiya-03/');page.wait_for_selector('[data-monitor-ready]')
   page.screenshot(path=str(out/f'hero-{width}.png'))
  print('Separation 03:',width,'px; 37 selections, stable panel, fit, dimensions, images and no overflow OK',flush=True)
 page.set_viewport_size({'width':1440,'height':1000});load();root=page.locator('#line03-construction')
 tooltip=root.locator('[data-diagram-tooltip]')
 for pin in root.locator('button[data-callout]').all():
  number=pin.get_attribute('data-part');identity=pin.get_attribute('data-callout')
  pin.focus();pin.hover();expect(tooltip).to_be_visible()
  expect(root.locator('[data-diagram-select]')).to_have_value(number)
  expect(root).to_have_attribute('data-selected-callout',identity)
  assert_tooltip_clearance(tooltip,1440,('separation03-hover',identity))
  pin.click();expect(root.locator('[data-detail-number]')).to_have_text(number.zfill(2))
  assert_tooltip_clearance(tooltip,1440,('separation03-click',identity))
  page.keyboard.press('Escape');expect(tooltip).to_be_hidden()
 print('All 42 original badges: hover/click/focus, exact selection and tooltip clearance OK',flush=True)
 root.locator('[data-callout="10-1"]').focus();page.keyboard.press('Enter');expect(tooltip).to_be_visible();page.keyboard.press('Escape')
 expand=root.locator('[data-diagram-fullscreen]');expand.click();expect(root).to_have_attribute('data-expanded','true')
 root.locator('[data-diagram-zoom]').select_option('detail');expect(root).to_have_attribute('data-zoomed','true')
 root.locator('[data-diagram-select]').select_option('34');expect(root.locator('[data-detail-number]')).to_have_text('34')
 page.keyboard.press('Escape');expect(root).to_have_attribute('data-expanded','false');expect(expand).to_be_focused()
 expect(page.locator('#composition .line-more')).to_have_count(0)
 expect(page.locator('[data-separation03-position]')).to_have_count(0)
 root.locator('[data-architecture-part="37"]').click();expect(root.locator('[data-diagram-select]')).to_have_value('37')
 expect(root.locator('[data-detail-label]')).to_have_text('Вилочный погрузчик')
 opener=page.locator('#documents [data-pdf-open="separatsiya-03-technical"]');opener.click()
 page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 1 из 28"',timeout=30000)
 dialog=page.locator('#pdf-viewer');expect(dialog).to_be_visible()
 assert dialog.locator('[data-pdf-canvas]').evaluate('e=>e.width>100&&e.height>100')
 dialog.locator('[data-pdf-page]').fill('28');dialog.locator('[data-pdf-page]').press('Enter')
 page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 28 из 28"')
 with page.expect_download() as download:dialog.locator('[data-pdf-download]').click()
 pdf=Path(download.value.path()).read_bytes()
 assert len(pdf)==5397658 and hashlib.sha256(pdf).hexdigest()=='2b399241ee41e5a792d87ab051f1d764f65faa1071b27bc1950a75024a5b52f6'
 page.keyboard.press('Escape');expect(opener).to_be_focused()
 expect(page.locator('#line03-view-reverse-tab')).to_have_count(0)
 expect(root).to_be_visible()
 page.locator('.line-hero .media-open').click();expect(page.locator('#media-viewer')).to_be_visible()
 assert 'catalog-cover' in page.locator('#viewer-image').get_attribute('src');page.keyboard.press('Escape')
 expect(root.locator('[data-diagram-select]')).to_have_value('37')
 page.locator('.line-hero [data-project-request]').click();expect(page.locator('#project-request')).to_be_visible();page.keyboard.press('Escape')
 for link in page.locator('#equipment .text-link').all():assert page.request.get(link.evaluate('a=>a.href')).status==200
 print('Fullscreen, zoom/Escape/focus, specification, 28-page PDF/view/download, original images and equipment links OK',flush=True)
 page.close();page=browser.new_page(reduced_motion='reduce',viewport={'width':1440,'height':1000})
 page.on('pageerror',lambda e:errors.append(str(e)))
 load('/catalog/lines/?group=Сепарация');page.wait_for_selector('[data-catalog-ready]')
 expect(page.locator('[data-line]:visible')).to_have_count(3)
 for target in ['.line-card-cover','.line-card-content h3','.line-card-metrics']:
  card=page.locator('[data-line-id=separatsiya-03]');expect(card).to_have_js_property('tagName','A')
  assert card.locator('img').evaluate('i=>getComputedStyle(i).objectFit==="contain"&&getComputedStyle(i).transform==="none"')
  card.locator(target).click();page.wait_for_selector('[data-separation03-line]');page.wait_for_selector('[data-context-ready]')
  page.locator('[data-context-back]').click();page.wait_for_selector('[data-catalog-ready]')
  assert parse_qs(urlparse(page.url).query)['group']==['Сепарация']
  expect(page.locator('[data-line]:visible')).to_have_count(3)
 load('/catalog/lines/');expect(page.locator('.line-card--complete')).to_have_count(4)
 a=page.locator('[data-line-id=separatsiya-02] .line-card-cover').bounding_box();b=page.locator('[data-line-id=separatsiya-03] .line-card-cover').bounding_box()
 assert abs(a['width']-b['width'])<1 and abs(a['height']-b['height'])<1 and abs(b['width']/b['height']-1.5)<.01
 load();page.locator('#photos [data-photo-gallery]').click();page.wait_for_selector('[data-gallery-ready=true]')
 page.wait_for_function('document.querySelector("[name=product]").value.endsWith("/catalog/lines/separatsiya-03")')
 expect(page.locator('[data-gallery-archive-grid] [data-gallery-item]')).to_have_count(24)
 page.locator('[data-gallery-load-more]').click()
 expect(page.locator('[data-gallery-archive-grid] [data-gallery-item]')).to_have_count(32)
 expect(page.locator('[data-gallery-load-more]')).to_be_hidden()
 load('/documents/technical/?objectType=line&product=separatsiya-03');page.wait_for_selector('[data-document-library]')
 expect(page.locator('[data-library-document]:visible')).to_have_count(1)
 touch=browser.new_page(has_touch=True,is_mobile=True,viewport={'width':390,'height':1000})
 touch.goto(base+'/catalog/lines/separatsiya-03/');touch.wait_for_selector('[data-monitor-ready]')
 touch.locator('[data-diagram-select]').select_option('10');touch.locator('[data-callout="10-1"]').tap()
 expect(touch.locator('[data-detail-number]')).to_have_text('10');touch.close()
 static=browser.new_context(java_script_enabled=False,viewport={'width':320,'height':1000});s=static.new_page()
 s.goto(base+'/catalog/lines/separatsiya-03/');expect(s.locator('h1')).to_have_text('Линия сухой сепарации и сушки плёнок с сортировкой по видам')
 expect(s.locator('[data-separation03-position]')).to_have_count(0);expect(s.locator('#line03-construction')).to_have_count(1)
 assert s.locator('#documents a[download][href$="/era-separatsiya-03-technical-description.pdf"]').count()==1;static.close()
 assert not errors,errors;assert not failures,failures
 report.update({'errors':errors,'httpFailures':failures,'originalPdf':'SHA256 verified','linksHistoryTouchAndNoJS':'passed'})
 (out/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 browser.close();print('Separation 03 acceptance passed; no forms submitted. '+str(out/'results.json'),flush=True)
