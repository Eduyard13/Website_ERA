"""Brochure preview, correct line destination and integrated washing/granulation."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,os,hashlib

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3024/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-technology-026'));out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce');errors=[];failures=[];results=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda response:failures.append((response.status,response.url)) if response.status>=400 and response.url.startswith(base) else None)
 for width in [320,390,768,1024,1440,1920]:
  page.set_viewport_size({'width':width,'height':1000});page.goto(base+'/technology/')
  assert page.locator('h1').count()==1
  card=page.locator('[data-technology-line]');card.scroll_into_view_if_needed()
  card.locator('img').evaluate_all('images=>images.forEach(image=>image.loading="eager")')
  page.wait_for_function('[...document.querySelectorAll(".tech-line-card img")].every(image=>image.complete&&image.naturalWidth>0)')
  assert card.count()==1
  assert card.get_attribute('href').endswith('/catalog/lines/separatsiya-02')
  assert card.locator('a,button').count()==0
  assert card.locator('.tech-line-metrics>div').count()==6
  assert 'При среднем засоре 50%' in card.inner_text()
  assert '70% от установленной' in card.inner_text()
  assert card.locator('.tech-line-equipment').evaluate('(image)=>getComputedStyle(image).objectFit')=='contain'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'card')
  card.hover();assert card.evaluate('(element)=>getComputedStyle(element).borderTopColor')=='rgb(198, 164, 59)'
  note=page.locator('.tech-stage-notes');note.locator('summary').click()
  assert note.locator('div').is_visible()
  assert note.locator('div').evaluate('(element)=>getComputedStyle(element).position')=='static'
  assert page.locator('#raw-material').evaluate('(raw)=>raw.compareDocumentPosition(document.querySelector("#dry-separation")) & Node.DOCUMENT_POSITION_FOLLOWING')
  assert page.locator('#hot-washing').evaluate('(wash)=>wash.compareDocumentPosition(document.querySelector("#granulation")) & Node.DOCUMENT_POSITION_FOLLOWING')
  assert page.locator('[data-washing-configuration]').count()==2
  assert 'без гранулятора' in page.locator('[data-washing-configuration=existing-granulator]').inner_text()
  assert 'Гранулятор уже установлен' in page.locator('[data-washing-configuration=with-granulator]').inner_text()
  assert page.locator('#granulation a[href*="/catalog/lines/"]').count()==0
  page.locator('#hot-washing').scroll_into_view_if_needed()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'washing')
  if width in [390,1440]:
   page.locator('.site-header').evaluate('(header)=>header.style.visibility="hidden"')
   page.locator('#dry-separation').screenshot(path=str(out/f'card-{width}.png'))
   page.locator('.tech-washing-configuration').screenshot(path=str(out/f'configuration-{width}.png'))
   page.locator('#granulation').screenshot(path=str(out/f'granulation-{width}.png'))
   page.locator('.site-header').evaluate('(header)=>header.style.visibility=""')
  # Selecting either the image or the body uses the same full-line destination.
  (card.locator('.tech-line-equipment') if width in [320,768,1440] else card.locator('h3')).click()
  page.wait_for_url(base+'/catalog/lines/separatsiya-02')
  assert page.locator('.film-line').count()==1
  page.go_back();assert page.locator('#dry-separation').count()==1
  results.append({'width':width,'line':'separatsiya-02','overflow':False})
  print('Technology: brochure card, whole-card link, stages and washing options:',width,'OK',flush=True)
 # Download is the unchanged, three-page source, not a rendered screenshot.
 page.goto(base+'/technology/')
 with page.expect_download() as download:
  page.locator('.tech-line-resources a[download]').click()
 file=out/'downloaded-overview.pdf';download.value.save_as(str(file))
 assert hashlib.sha256(file.read_bytes()).hexdigest()=='80876c22af16480aafa298b7a0630b26c2a88a9341d577867300a49e7b58a068'
 # Native links and disclosures keep working without JavaScript.
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000})
 fallback=context.new_page();fallback.goto(base+'/technology/')
 fallback.locator('.tech-stage-notes summary').click();assert fallback.locator('.tech-stage-notes>div').is_visible()
 fallback.locator('[data-technology-line]').click();fallback.wait_for_url(base+'/catalog/lines/separatsiya-02')
 context.close()
 assert not errors,errors;assert not failures,failures
 (out/'browser-results.json').write_text(json.dumps({'layouts':results,'errors':errors,'failedLocalResponses':failures,'sourceDownloadSha256':'80876c22af16480aafa298b7a0630b26c2a88a9341d577867300a49e7b58a068'},ensure_ascii=False,indent=2)+'\n')
 browser.close()
