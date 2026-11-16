"""Mini-line alignment, all 11 callouts, real source viewers and catalogue regressions."""
from pathlib import Path
from hashlib import sha256
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
from line_tooltip_checks import assert_tooltip_clearance
import json,os,subprocess

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3060').rstrip('/')
prefix=urlparse(base).path
out=Path(os.environ.get('ERA_LINE_REPORT_DIR','/tmp/era-mini-alignment-20261116/browser-mini'));out.mkdir(parents=True,exist_ok=True)
model=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {miniLineDiagram} from './content/line-diagrams.mjs';console.log(JSON.stringify(miniLineDiagram))"],text=True))
results=[];errors=[];failed=[]
sections=['purpose','raw-materials','specs','process','composition','quality','placement','kair','photos','documents','equipment']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,390,768,1024,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},has_touch=width<768,reduced_motion='reduce')
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
  page.goto(base+'/catalog/lines/');page.wait_for_function('document.querySelector("#line-result").textContent.includes("4")')
  cards=page.locator('[data-line]');assert cards.count()==4
  assert cards.evaluate_all('es=>es.map(e=>e.tagName)')==['A','A','ARTICLE','ARTICLE']
  boxes=[cards.nth(i).bounding_box() for i in range(4)]
  if width>=768:assert boxes[0]['x']<boxes[1]['x'] and abs(boxes[0]['y']-boxes[1]['y'])<1
  else:assert boxes[0]['y']<boxes[1]['y']
  mini=cards.nth(0);assert mini.locator('dt').count()==6
  assert mini.locator('img').get_attribute('src').endswith('catalog-cover-navy.webp')
  assert mini.locator('img').evaluate('(e)=>getComputedStyle(e).objectFit')=='contain'
  mini.locator('h3').click();page.wait_for_url('**/catalog/lines/separatsiya-01*')
  page.wait_for_selector('#line01-construction[data-monitor-ready=true]')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('.film-line>section[id]:not(.line-hero):not(.line-request)').evaluate_all('es=>es.map(e=>e.id)')==sections
  assert page.locator('.line-anchor-nav a').evaluate_all('es=>es.map(e=>e.hash.slice(1))')==sections
  assert page.locator('#quality #options').count()==1
  assert page.locator('#kair .line-control').count()==1 and page.locator('#placement .line-control').count()==0
  for text in ['225 кВт','157,5 кВт','600–700 кг/ч','17,75 × 11,75 м','3 человека в смену']:
   assert text in page.locator('main').inner_text()
  hero=page.locator('[data-hero-finish=titanium-gallery-mini]');image=hero.locator('img');image.evaluate('(e)=>e.decode()')
  assert image.get_attribute('src').endswith('/separatsiya-01-mini/hero-titanium.webp')
  assert image.get_attribute('width')=='1500' and image.get_attribute('height')=='1010' and image.get_attribute('fetchpriority')=='high'
  assert image.evaluate('(e)=>getComputedStyle(e).objectFit==="contain"&&getComputedStyle(e).filter==="none"')
  assert abs(image.bounding_box()['width']/image.bounding_box()['height']-1500/1010)<.01
  hero.locator('.media-open').click();assert page.locator('#media-viewer').is_visible()
  assert page.locator('#viewer-image').get_attribute('src').endswith('/separatsiya-01-mini/hero-titanium.webp')
  assert page.locator('#viewer-product').get_attribute('href')==prefix+'/catalog/lines/separatsiya-01'
  page.keyboard.press('Escape')
  # Exact same rhythm and typography as the full line, on the two review widths.
  if width in [390,1440]:
   selectors=['.line-hero h1','.line-hero','.line-section-heading h2','.line-image--hero']
   styles=page.evaluate('(sels)=>sels.map(s=>{const x=getComputedStyle(document.querySelector(s));return [x.fontSize,x.lineHeight,x.paddingTop,x.paddingBottom,x.borderRadius]})',selectors)
   reference=context.new_page();reference.goto(base+'/catalog/lines/separatsiya-02/');reference.wait_for_selector('[data-monitor-ready=true]')
   assert styles==reference.evaluate('(sels)=>sels.map(s=>{const x=getComputedStyle(document.querySelector(s));return [x.fontSize,x.lineHeight,x.paddingTop,x.paddingBottom,x.borderRadius]})',selectors)
   reference.close()
  root=page.locator('#line01-construction');viewport=root.locator('[data-diagram-viewport]');select=root.locator('[data-diagram-select]');tip=root.locator('[role=tooltip]')
  assert select.input_value()=='3' and select.locator('option').count()==11
  for selector in ['button[data-callout]','[data-line-leader]','[data-callout-hit]','.guide-end']:
   assert root.locator(selector).count()==11
  assert root.locator('.line-diagram-pin-masks').count()==0
  assert root.locator('svg image').get_attribute('href').endswith('/separatsiya-01-mini/layout-native.webp')
  assert root.locator('.diagram-canvas').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(228, 233, 237)'
  geometry=root.evaluate('''root=>{const m=root.querySelector('svg').getScreenCTM();return [...root.querySelectorAll('button[data-callout]')].every(pin=>{const p=root.querySelector('[data-line-leader="'+pin.dataset.callout+'"]'),start=p.getPointAtLength(0),end=p.getPointAtLength(p.getTotalLength()),a=new DOMPoint(start.x,start.y).matrixTransform(m),b=pin.getBoundingClientRect(),target=p.nextElementSibling;return Math.hypot(a.x-b.left-b.width/2,a.y-b.top-b.height/2)<1&&Math.hypot(end.x-Number(target.getAttribute('cx')),end.y-Number(target.getAttribute('cy')))<.1;});}''')
  assert geometry
  select.scroll_into_view_if_needed();height=root.bounding_box()['height'];outer=page.evaluate('scrollY')
  for part in model['parts']:
   select.select_option(str(part['number']))
   assert root.locator('[data-detail-label]').inner_text()==part['label']
   assert abs(root.bounding_box()['height']-height)<1 and abs(page.evaluate('scrollY')-outer)<1
  placements={'floating':0,'dock':0}
  def exercise(mode):
   for part in model['parts']:
    callout=part['callouts'][0];button=root.locator('button[data-callout="'+callout['id']+'"]');button.scroll_into_view_if_needed()
    stable=root.bounding_box();drawing=viewport.bounding_box()
    if width<768:button.tap()
    else:page.mouse.move(1,1);button.hover()
    tip.wait_for(state='visible');assert root.get_attribute('data-selected-callout')==callout['id']
    assert tip.locator('[data-tip-description]').inner_text()==callout['tooltipDescription']
    assert button.get_attribute('aria-describedby')=='line01-construction-tooltip'
    assert_tooltip_clearance(tip,width,(width,mode,callout['id']))
    placements[tip.get_attribute('data-placement')]+=1
    assert abs(root.bounding_box()['height']-stable['height'])<1 and abs(viewport.bounding_box()['height']-drawing['height'])<1
    if width>=768:page.mouse.move(1,1)
  exercise('normal')
  # Every full hit path selects its own object using a real pointer click.
  for key in [part['callouts'][0]['id'] for part in model['parts']]:
   path=root.locator('[data-callout-hit="'+key+'"]');path.scroll_into_view_if_needed()
   point=path.evaluate('''e=>{const m=e.getScreenCTM();for(const f of [.15,.25,.35,.45,.55,.65,.75,.85,.95]){const q=e.getPointAtLength(e.getTotalLength()*f),p=new DOMPoint(q.x,q.y).matrixTransform(m);if(p.y>180&&p.y<innerHeight-10&&document.elementFromPoint(p.x,p.y)===e)return {x:p.x,y:p.y};}return null;}''')
   assert point,(width,key);page.mouse.click(**point);assert root.get_attribute('data-selected-callout')==key
   assert_tooltip_clearance(tip,width,(width,key,'path click'))
  pin=root.locator('button[data-callout="03"]');pin.scroll_into_view_if_needed();pin.focus();page.keyboard.press('ArrowRight');assert select.input_value()=='4'
  page.keyboard.press('End');assert select.input_value()=='11';page.keyboard.press('Home');assert select.input_value()=='1'
  expand=root.locator('[data-diagram-fullscreen]');expand.click();page.wait_for_function('document.querySelector("#line01-construction").dataset.expanded==="true"')
  assert root.locator('[data-diagram-zoom]').input_value()=='fit';exercise('fullscreen fit')
  root.locator('[data-diagram-zoom]').select_option('2');exercise('fullscreen 200%')
  page.keyboard.press('Escape');page.wait_for_function('document.querySelector("#line01-construction").dataset.expanded==="false"')
  assert expand.evaluate('(e)=>e===document.activeElement')
  # The original diagrams and source photos still use the site viewer.
  for summary,key in [('[data-line-source-diagram] summary','layout'),('[data-line-flow] summary','flow')]:
   page.locator(summary).click();link=page.locator('.mini-line [data-media][data-image$="/'+key+'.webp"] .media-open');link.click()
   assert page.locator('#media-viewer').is_visible() and page.locator('#viewer-image').get_attribute('src').endswith('/'+key+'.webp')
   page.keyboard.press('Escape')
  page.locator('#placement .media-open').click();assert page.locator('#viewer-image').get_attribute('src').endswith('/placement.webp');page.keyboard.press('Escape')
  page.locator('#specs details summary').click();assert page.locator('.mini-specification-table tbody tr').count()==13
  page.locator('#raw-materials details summary').click();assert page.locator('#specs details').get_attribute('open') is not None
  assert page.locator('#equipment [data-catalogue-image]').count()==3
  for card in page.locator('#equipment [data-catalogue-image]').all():
   assert card.locator('a').get_attribute('href').startswith(prefix+'/catalog/equipment/')
   assert card.locator('img').evaluate('(e)=>getComputedStyle(e).objectFit==="contain"&&getComputedStyle(e).filter==="none"')
  # Native links and real shared PDF viewer, including its 14-page navigation.
  opener=page.locator('#documents [data-pdf-open="separatsiya-01-mini-technical"]');opener.click()
  page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 1 из 14"',timeout=30000)
  pdf=page.locator('#pdf-viewer');pdf.locator('[data-pdf-next]').click();page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 2 из 14"')
  if width in [390,1440]:
   with page.expect_download() as info:pdf.locator('[data-pdf-download]').click()
   saved=out/'mini-original.pdf';info.value.save_as(saved);assert sha256(saved.read_bytes()).hexdigest()=='07e383f99d3abd1049d4b1ff4472749a510005311558993e46ea87e0409a3a3d';saved.unlink()
  page.keyboard.press('Escape');assert not pdf.is_visible() and opener.evaluate('(e)=>document.activeElement===e')
  assert page.locator('#documents [download]').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  results.append({'width':width,'callouts':11,'modes':['normal','fullscreen fit','fullscreen 200%'],'placements':placements,'pdfPages':14,'screenshots':False});context.close()
  print('Mini-line, source media, 11 callouts and 14-page PDF:',width,'OK',flush=True)
 # Fullscreen modal fallback and no-JS source links work on the mini-line too.
 context=browser.new_context(viewport={'width':390,'height':844});context.add_init_script("Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true})")
 page=context.new_page();page.goto(base+'/catalog/lines/separatsiya-01/');page.wait_for_selector('[data-monitor-ready=true]');page.locator('[data-diagram-fullscreen]').click()
 assert page.locator('.line-monitor-modal[open]').is_visible();page.keyboard.press('Escape');assert page.locator('.line-monitor-modal').count()==0
 assert page.locator('body').evaluate('(e)=>getComputedStyle(e).overflow')!='hidden';context.close()
 context=browser.new_context(java_script_enabled=False);page=context.new_page();page.goto(base+'/catalog/lines/separatsiya-01/')
 assert page.locator('#documents [download]').get_attribute('href').endswith('/era-separatsiya-01-mini-technical-description.pdf');context.close();browser.close()
assert not errors,errors
assert not failed,failed
(out/'results.json').write_text(json.dumps({'widths':results,'pageErrors':errors,'failedResponses':failed},ensure_ascii=False,indent=2)+'\n')
print('Mini-line acceptance passed:',out/'results.json',flush=True)
