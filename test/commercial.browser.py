"""One shared economics scenario: financial identity, nine chapters and responsive UX."""
from pathlib import Path
from functools import lru_cache
from urllib.parse import urlparse
import json, os, subprocess
from playwright.sync_api import sync_playwright

repo=Path(__file__).resolve().parents[1]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3033/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-economics-033/browser'));out.mkdir(parents=True,exist_ok=True)
widths=[int(w) for w in os.environ.get('ERA_TEST_WIDTHS','320,390,768,1024,1440,1920').split(',')]
node="import {calculateEconomics} from './public/economics-model.js';import {tonnes,millions,percentage,money} from './public/economics-view.js';import {unitMoney} from './public/economics-page-view.js';const s=JSON.parse(process.argv[1]);s.salePrices={separation:50000,full:100000,...s.salePrices};const r=calculateEconomics(s);console.log(JSON.stringify({profit:millions(r.net),revenue:millions(r.revenue),output:tonnes(r.output),margin:percentage(r.margin),cost:unitMoney(r.perProduct?.totalCosts),input:tonnes(r.state.input),load:percentage(r.load),remainder:tonnes(r.state.input-r.output),grossPrice:new Intl.NumberFormat('ru-RU',{minimumFractionDigits:Number.isInteger(r.grossPrice/1000)?0:2,maximumFractionDigits:2}).format(r.grossPrice/1000)+' ₽/кг',pie:r.donutAvailable,capacity:r.capacity,net:r.net,rawInput:r.state.input,unitProfit:unitMoney(r.perProduct?.net),unitPrice:unitMoney(r.netPrice),unitTax:unitMoney(r.perProduct?.tax),unitCost:unitMoney(r.perProduct?.totalCosts)}))"
@lru_cache(None)
def expected(state):return json.loads(subprocess.check_output(['node','--input-type=module','-e',node,state],cwd=repo,text=True))
def compact(s):return ''.join(s.split())
errors=[];failures=[];results=[];screens=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 page.route('**/formsubmit.co/**',lambda route:route.abort())
 def load():
  assert page.goto(base+'/economics/').status==200
  page.wait_for_function('document.querySelector("[data-economics-page]").dataset.economicsReady==="true"')
 def mode(name):page.locator(f'.ec-hero [data-econ-mode={name}]').click()
 def price(value,section='#market'):page.locator(f'{section} [data-econ-preset="{value}"]').click()
 def slider(load):page.locator('[data-econ-range]').evaluate('(e,v)=>{e.value=Number(e.max)*v;e.dispatchEvent(new Event("input",{bubbles:true}))}',load)
 def verify(state,unit='kg'):
  r=expected(json.dumps(state,sort_keys=True));root=page.locator('[data-economics-page]')
  assert root.get_attribute('data-econ-mode')==state.get('mode','separation')
  keys=['profit','revenue','output','margin','cost','input','load','remainder','grossPrice']
  if unit=='kg':keys+=['unitProfit','unitPrice','unitTax','unitCost']
  for key in keys:
   for element in root.locator(f'[data-value="{key}"]').all():
    assert compact(element.inner_text())==compact(r[key]),(key,state,element.inner_text(),r[key])
  assert bool(page.locator('.econ-ring').count())==r['pie']
  assert (root.get_attribute('data-econ-state')=='loss')==(r['net']<0)
  assert not any(v in root.inner_text() for v in ['NaN','Infinity'])
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate('({w:innerWidth,s:document.documentElement.scrollWidth})')
  label=page.locator('[data-point-label]:visible');assert r['profit'] in label.inner_text()
  plot=page.locator('.econ-curve-plot:visible').bounding_box();tip=label.bounding_box()
  assert tip['x']>=plot['x']-1 and tip['x']+tip['width']<=plot['x']+plot['width']+1,('Point label horizontal bounds',plot,tip)
  assert tip['y']>=plot['y']-1 and tip['y']+tip['height']<=plot['y']+plot['height']*260/340+3,('Point label vertical bounds',plot,tip)
  assert bool(page.locator('[data-product-passport]').get_by_text('30–70 ppm',exact=True).count())==(state.get('mode')=='full')
  return r
 for width in widths:
  page.set_viewport_size({'width':width,'height':900 if width>=768 else 844});load();verify({})
  assert page.locator('.ec-section').count()==9
  assert page.locator('.page-progress-rail a').count()==9
  assert page.locator('.ec-modes').count()==2
  assert page.locator('.ec-modes button').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().height>=48)')
  assert page.locator('.ec-details[open]').count()==0
  for selected in ['separation','full']:
   mode(selected);verify({'mode':selected})
   if width in [390,1440]:
    page.locator('img[loading=lazy]').evaluate_all('es=>es.forEach(e=>e.loading="eager")')
    page.wait_for_function('Array.from(document.querySelectorAll(".ec-photo img")).every(e=>e.complete&&e.naturalWidth>0)')
    for i,section in enumerate(page.locator('.ec-section').all()):
     filename=f'{selected}-{width}-{i:02}.png';section.screenshot(path=str(out/filename),style='.site-header,.page-progress-rail{visibility:hidden!important}');screens.append(filename)
   for loadvalue in [0,.5,1]:
    slider(loadvalue);r=expected(json.dumps({'mode':selected}));verify({'mode':selected,'input':r['capacity']*loadvalue})
  assert page.locator('[data-product-image]').get_attribute('src').startswith(urlparse(base).path+'/assets/')
  results.append({'width':width,'nineChapters':True,'sharedScenario':True,'zeroHalfFull':True,'overflow':False})
  print('Shared scenario, loss/zero, photo and charts:',width,'OK',flush=True)
 page.set_viewport_size({'width':1440,'height':1000});load()
 # A price in any section updates every repeated KPI; per-mode prices persist.
 price(45000);verify({'salePrices':{'separation':45000}})
 mode('full');verify({'mode':'full'})
 price(110000,'#project-resilience');verify({'mode':'full','salePrices':{'full':110000}})
 mode('separation');verify({'salePrices':{'separation':45000}})
 mode('full');verify({'mode':'full','salePrices':{'full':110000}})
 page.locator('[data-econ-price]').fill('100');verify({'mode':'full','salePrices':{'full':100000}})
 # Inputs remain the same DOM nodes and retain focus during typing.
 field=page.locator('[data-econ-price]');field.focus();assert field.evaluate('e=>e===document.activeElement')
 field.fill('99.5');assert field.evaluate('e=>e===document.activeElement');verify({'mode':'full','salePrices':{'full':99500}})
 field.fill('100');field.press('Tab')
 for selected in ['separation','full']:
  mode(selected)
  for lines in [1,2,3]:
   page.locator(f'[data-econ-lines="{lines}"]').click()
   capacity=expected(json.dumps({'mode':selected,'lines':lines}))['capacity']
   prices={'separation':45000,'full':100000}
   for loadvalue in [0,.25,.5,1]:
    slider(loadvalue);verify({'mode':selected,'lines':lines,'input':capacity*loadvalue,'salePrices':prices})
  slider(.5)
  for lines in [1,3,2]:
   page.locator(f'[data-econ-lines="{lines}"]').click();assert abs(float(page.locator('[data-econ-range]').input_value())/float(page.locator('[data-econ-range]').get_attribute('max'))-.5)<1e-8
 mode('full');page.locator('[data-econ-lines="1"]').click();slider(1);price(100000)
 page.locator('[data-econ-unit=tonne]').click();verify({'mode':'full'},unit='tonne')
 assert '₽/т' in page.locator('[data-value=unitCost]').inner_text()
 page.locator('[data-econ-unit=kg]').click();verify({'mode':'full'})
 # Full-load groups expose original amounts without recalc on hover/click.
 utilities=page.locator('.econ-legend [data-segment=utilities]');utilities.focus()
 assert page.locator('[data-ring-label]').inner_text()=='Энергия и вода'
 assert 'Электроэнергия:' in page.locator('[data-segment-detail]').inner_text()
 utilities.click();assert utilities.get_attribute('aria-pressed')=='true';page.keyboard.press('Escape')
 assert page.locator('[data-ring-label]').inner_text()=='Выручка без НДС'
 assert page.locator('.econ-ring path').first.evaluate('e=>getComputedStyle(e).transitionDuration')=='0s'
 page.locator('[data-econ-number]').fill('999999');verify({'mode':'full','input':999999});assert page.locator('[data-econ-clamp]').is_visible()
 page.locator('[data-econ-number]').press('Tab');assert page.locator('[data-econ-number]').evaluate('e=>e.validity.valid')
 page.locator('[data-econ-number]').fill('0');verify({'mode':'full','input':0})
 assert page.locator('[data-value=cost]').first.inner_text()=='—'
 assert page.locator('[data-econ-bridge]').get_by_text('Товарного выпуска пока нет').count()==1
 page.locator('[data-econ-price]').fill('0');verify({'mode':'full','input':0,'salePrices':{'full':0}})
 page.locator('[data-econ-price]').fill('100');slider(1);price(100000)
 # Sources are collapsed, all 20 cards are preserved, tabs work by keyboard.
 page.locator('[data-open-offers]').first.click();assert page.locator('#market-offers').get_attribute('open') is not None
 assert page.locator('.market-offer').count()==20
 page.get_by_role('tab',name='ПВД / LDPE',exact=True).click();assert page.locator('[role=tabpanel]:visible .market-offer').count()==10
 page.keyboard.press('ArrowRight');assert page.locator('[role=tabpanel]:visible .market-offer').count()==6
 page.keyboard.press('Home');assert page.locator('[role=tabpanel]:visible .market-offer').count()==4
 # Request contains all selected scenario parameters; no real message is submitted.
 page.locator('[data-economics-request]').click();assert page.locator('#project-request').is_visible()
 topic=page.locator('#project-request [data-request-topic]').input_value()
 assert 'Полный цикл' in topic and '100,00' in topic and '970,4' in topic,topic
 page.keyboard.press('Escape')
 for anchor in ['market','economics','econ-month-title','econ-tonne-title','econ-curve-title','econ-volume','econ-monthly-price','econ-per-tonne-price','econ-curve-price','market-tab-film','market-panel-ldpe','market-panel-hdpe']:
  page.goto(base+'/economics/#'+anchor);assert page.locator('#'+anchor).count()==1
  if anchor=='market-tab-film':assert page.locator('#market-offers').get_attribute('open') is not None
  if anchor.startswith('market-panel-'):assert page.locator('#'+anchor).is_visible()
 # Ordinary keyboard controls and a touch viewport use the same state.
 touch=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
 mobile=touch.new_page();mobile.goto(base+'/economics/');mobile.locator('.ec-hero [data-econ-mode=full]').tap()
 assert mobile.locator('#monthly-result [data-value=profit]').inner_text().startswith('14,13')
 mobile.locator('#market [data-econ-preset="110000"]').tap();assert mobile.locator('.ec-hero [data-value=profit]').inner_text().startswith('17,57')
 mobile.locator('[data-econ-range]').focus();mobile.keyboard.press('Home');assert mobile.locator('.ec-hero [data-value=output]').inner_text()=='0 т'
 assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth');touch.close()
 # JavaScript-free fallback is the same mathematically correct base scenario.
 static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});plain=static.new_page();plain.goto(base+'/economics/')
 assert plain.locator('.ec-section').count()==9
 assert plain.locator('#monthly-result [data-value=profit]').inner_text().startswith('4,45')
 assert plain.locator('.econ-ring').count()==1
 assert plain.locator('[data-economics-page] noscript').count()==1;static.close()
 assert not errors,errors;assert not failures,failures
 (out/'results.json').write_text(json.dumps({'responsive':results,'screenshots':screens,'priceMemory':'OK','allLoadsAndCounts':'OK','unitsAndZero':'OK','requestContext':'OK','keyboardAndTouch':'OK','staticFallback':'OK','errors':errors,'failures':failures},ensure_ascii=False,indent=2)+'\n')
 print('Shared price memory, units, all loads/counts, grouped costs, sources, request context and static fallback: OK',flush=True)
 browser.close()
