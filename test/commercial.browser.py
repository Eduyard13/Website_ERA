"""Four independent financial-model scenarios, VAT, mobile labels and preserved links."""
from pathlib import Path
from functools import lru_cache
import json, os, subprocess
from playwright.sync_api import sync_playwright

repo=Path(__file__).resolve().parents[1]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3022/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-economics-2026-11-05/browser'));out.mkdir(parents=True,exist_ok=True)
widths=[int(w) for w in os.environ.get('ERA_TEST_WIDTHS','320,390,768,1024,1280,1440,1920').split(',')]
node="import {calculateEconomics} from './public/economics-model.js';import {tonnes,millions,money,percentage} from './public/economics-view.js';const r=calculateEconomics(JSON.parse(process.argv[1]));console.log(JSON.stringify({profit:millions(r.net),revenue:millions(r.revenue),output:tonnes(r.output),margin:percentage(r.margin),unit:money(r.perProduct?.net)+'/т',inputUnit:money(r.perInput)+'/т',pie:r.donutAvailable,capacity:r.capacity,load:r.load,input:r.state.input,net:r.net,summary:r.net<0?'Убыток':'Чистая прибыль'}))"
@lru_cache(None)
def model(state):
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',node,state],cwd=repo,text=True))
def expected(state):return model(json.dumps(state,sort_keys=True))
def compact(s):return ''.join(s.split())
errors=[];failures=[];results=[]

with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 def widget(kind):return page.locator(f'[data-econ-widget="{kind}"]')
 def snapshots():
  data={}
  for kind in ['monthly','per-tonne','curve']:
   root=widget(kind)
   data[kind]=(root.get_attribute('data-econ-mode'),root.locator('[data-econ-price]').input_value(),root.locator('[data-econ-profit],[data-econ-output],.econ-unit-totals strong').all_inner_texts(),root.locator('[data-econ-number]').input_value() if kind=='curve' else None)
  data['market']=(page.locator('[data-market-widget]').get_attribute('data-market-mode'),page.locator('[data-market-selected-price]').inner_text())
  return data
 def unchanged(before,changed):
  after=snapshots()
  for kind in before:
   if kind!=changed:assert before[kind]==after[kind],('Non-local update',changed,kind,before[kind],after[kind])
 def check_point():
  root=widget('curve');plot=root.locator('.econ-curve-plot:visible');label=plot.locator('[data-point-label]');box=plot.bounding_box();tip=label.bounding_box();circle=plot.locator('circle').bounding_box()
  assert tip['x']>=box['x']-1 and tip['x']+tip['width']<=box['x']+box['width']+1,('Label horizontal bounds',box,tip)
  assert tip['y']>=box['y']-1 and tip['y']+tip['height']<=box['y']+box['height']*260/340+2,('Label and axis bounds',box,tip)
  assert circle['x']>=box['x'] and circle['x']+circle['width']<=box['x']+box['width']
  assert label.locator('strong').evaluate('(e)=>e.scrollWidth<=e.clientWidth'),label.inner_text()
 def verify(kind,state):
  root=widget(kind);r=expected(state)
  assert root.get_attribute('data-econ-mode')==state.get('mode','separation')
  if kind=='monthly':
   for key in ['profit','revenue','output','margin']:assert compact(root.locator(f'[data-econ-{key}]').inner_text())==compact(r[key]),(kind,key,state,r)
   assert bool(root.locator('.econ-ring').count())==r['pie']
  elif kind=='per-tonne':
   assert [compact(v) for v in root.locator('.econ-unit-totals strong').all_inner_texts()]==[compact(r['unit']),compact(r['inputUnit'])],(kind,state,r)
  else:
   for key in ['profit','output']:assert compact(root.locator(f'[data-econ-{key}]').inner_text())==compact(r[key]),(kind,key,state,r)
   assert compact(r['profit']+'/мес.') in compact(root.locator('[data-point-label]:visible strong').inner_text())
   assert r['summary'] in root.locator('[data-point-label]:visible').inner_text()
   assert r['profit'] in root.locator('[data-curve-accessible-result]').inner_text();check_point()
  assert not any(term in root.inner_text() for term in ['NaN','Infinity'])
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')

 for width in widths:
  page.set_viewport_size({'width':width,'height':1000});assert page.goto(base+'/').status==200
  page.wait_for_function('document.querySelector("[data-econ-widget=monthly]").dataset.econMode==="separation"')
  assert page.locator('[data-widget-switch]').count()==4
  for kind in ['monthly','per-tonne','curve']:verify(kind,{})
  for buttons in page.locator('[data-widget-switch]').all():
   assert buttons.locator('[aria-pressed=true]').count()==1
   assert buttons.locator('button').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().height>=48)')
   assert buttons.locator('[aria-pressed=true]').evaluate('(e)=>getComputedStyle(e).backgroundColor')!=buttons.locator('[aria-pressed=false]').evaluate('(e)=>getComputedStyle(e).backgroundColor')
  offers=page.locator('.market-offer').evaluate_all('es=>es.map(e=>e.outerHTML)')
  before=snapshots();page.locator('button[data-market-mode="full"]').click();unchanged(before,'market')
  assert '110 ₽/кг с НДС' in page.locator('[data-market-selected-price]').inner_text()
  assert 'Премиальный этап, с 7-го рабочего месяца' in page.locator('[data-market-selected-price]').inner_text()
  assert page.locator('[role=tabpanel]:visible .market-offer').count()==10
  page.locator('[data-market-price="100000"]').click();assert '100 ₽/кг с НДС' in page.locator('[data-market-selected-price]').inner_text();unchanged(before,'market')
  page.locator('button[data-market-mode="separation"]').click()
  for kind in ['monthly','per-tonne','curve']:
   before=snapshots();widget(kind).locator('button[data-econ-mode="full"]').click();verify(kind,{'mode':'full'});unchanged(before,kind)
   if width in [390,1440]:widget(kind).screenshot(path=str(out/f'{kind}-full-{width}.png'))
   widget(kind).locator('button[data-econ-mode="separation"]').click();verify(kind,{})
  if width in [320,390]:
   for mode in ['separation','full']:
    widget('curve').locator(f'button[data-econ-mode={mode}]').click()
    for load in [0,.5,1]:
     widget('curve').locator('[data-econ-range]').evaluate('(e,u)=>{e.value=Number(e.max)*u;e.dispatchEvent(new Event("input",{bubbles:true}))}',load)
     value=float(widget('curve').locator('[data-econ-number]').input_value());verify('curve',{'mode':mode,'input':value})
   widget('curve').locator('button[data-econ-mode=separation]').click()
  assert offers==page.locator('.market-offer').evaluate_all('es=>es.map(e=>e.outerHTML)')
  assert page.locator('.pitch-stage-nav').count()==0 and page.locator('[data-kair]').count()==0
  results.append({'width':width,'fourIndependentModes':True,'baselineMatchesModels':True,'wholePointLabel':True,'overflow':False})
  print('Four independent scenarios, default model values, point label and layout:',width,'OK',flush=True)

 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'/');page.wait_for_selector('[data-econ-state]')
 monthly=widget('monthly');unit=widget('per-tonne');curve=widget('curve')
 profit=monthly.locator('.econ-legend [data-segment=profit]');profit.focus();assert monthly.locator('[data-ring-label]').inner_text()=='Чистая прибыль'
 profit.click();assert profit.get_attribute('aria-pressed')=='true';page.keyboard.press('Escape');assert monthly.locator('[data-ring-label]').inner_text()=='Выручка без НДС'
 monthly.locator('.econ-ring [data-segment=electricity]').hover();assert monthly.locator('[data-ring-label]').inner_text()=='Электроэнергия'
 assert monthly.locator('.econ-ring [data-segment=electricity]').evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
 page.keyboard.press('Escape')
 # Price and mode memories are local to each of the four widgets.
 monthly.locator('button[data-econ-mode=full]').click();monthly.locator('[data-econ-preset="100000"]').click();verify('monthly',{'mode':'full','salePrices':{'full':100000}})
 unit.locator('button[data-econ-mode=full]').click();unit.locator('[data-econ-price]').fill('90');verify('per-tonne',{'mode':'full','salePrices':{'full':90000}})
 curve.locator('button[data-econ-mode=full]').click();verify('curve',{'mode':'full'})
 for root in [monthly,unit,curve]:root.locator('button[data-econ-mode=separation]').click();root.locator('button[data-econ-mode=full]').click()
 verify('monthly',{'mode':'full','salePrices':{'full':100000}});verify('per-tonne',{'mode':'full','salePrices':{'full':90000}});verify('curve',{'mode':'full'})
 before=snapshots()
 for lines in [2,3,1]:
  curve.locator(f'[data-econ-lines="{lines}"]').click();verify('curve',{'mode':'full','lines':lines});unchanged(before,'curve')
  assert abs(float(curve.locator('[data-econ-number]').input_value())-expected({'mode':'full','lines':lines})['capacity'])<.00051
 # Every input event updates the point immediately, including endpoints and losses.
 for mode in ['separation','full']:
  curve.locator(f'button[data-econ-mode={mode}]').click()
  for lines in [1,2,3]:
   curve.locator(f'[data-econ-lines="{lines}"]').click()
   for load in [0,.25,.5,.75,1]:
    curve.locator('[data-econ-range]').evaluate('(e,u)=>{e.value=Number(e.max)*u;e.dispatchEvent(new Event("input",{bubbles:true}))}',load)
    value=float(curve.locator('[data-econ-number]').input_value());verify('curve',{'mode':mode,'lines':lines,'input':value});unchanged(before,'curve')
 # Mode/count changes preserve partial utilisation as well as full utilisation.
 curve.locator('[data-econ-range]').evaluate('(e)=>{e.value=Number(e.max)*.5;e.dispatchEvent(new Event("input",{bubbles:true}))}')
 for mode in ['separation','full']:
  curve.locator(f'button[data-econ-mode={mode}]').click()
  for lines in [1,2,3]:
   curve.locator(f'[data-econ-lines="{lines}"]').click();r=expected({'mode':mode,'lines':lines});value=float(curve.locator('[data-econ-number]').input_value());assert abs(value/r['capacity']-.5)<.00001
 curve.locator('[data-econ-price]').fill('100');value=float(curve.locator('[data-econ-number]').input_value());verify('curve',{'mode':'full','lines':3,'input':value,'salePrices':{'full':100000}})
 curve.locator('[data-econ-number]').fill('0');verify('curve',{'mode':'full','lines':3,'input':0,'salePrices':{'full':100000}})
 curve.locator('[data-econ-number]').fill('999999');verify('curve',{'mode':'full','lines':3,'input':999999,'salePrices':{'full':100000}});assert curve.locator('[data-econ-clamp]').is_visible()
 curve.locator('[data-econ-number]').fill('720.5');verify('curve',{'mode':'full','lines':3,'input':720.5,'salePrices':{'full':100000}})
 curve.locator('[data-econ-price]').fill('0');verify('curve',{'mode':'full','lines':3,'input':720.5,'salePrices':{'full':0}})
 monthly.locator('[data-econ-price]').fill('0');verify('monthly',{'mode':'full','salePrices':{'full':0}});assert monthly.locator('.econ-cost-table').is_visible()
 # Keyboard operation and source offers keep their own VAT/date/grade information.
 page.locator('button[data-market-mode=full]').focus();page.keyboard.press('Space');assert page.locator('button[data-market-mode=full]').get_attribute('aria-pressed')=='true'
 page.get_by_role('tab',name='ПВД / LDPE',exact=True).click();page.keyboard.press('ArrowRight');assert page.get_by_role('tab',name='ПНД / HDPE',exact=True).get_attribute('aria-selected')=='true';assert page.locator('[role=tabpanel]:visible .market-offer').count()==6
 assert 'Не указан' in page.locator('[role=tabpanel]:visible .market-offer').first.inner_text()
 page.keyboard.press('Home');assert page.locator('[role=tabpanel]:visible .market-offer').count()==10
 # A touch user sees the moving monetary label without hovering.
 touch=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mobile=touch.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.goto(base+'/');mobile.wait_for_selector('[data-econ-state]');mcurve=mobile.locator('[data-econ-widget=curve]');mcurve.locator('button[data-econ-mode=full]').tap()
 for load in [0,.5,1]:
  slider=mcurve.locator('[data-econ-range]');slider.scroll_into_view_if_needed();box=slider.bounding_box();mobile.touchscreen.tap(box['x']+8+(box['width']-16)*load,box['y']+box['height']/2)
  assert mcurve.locator('[data-point-label]:visible').is_visible();assert 'млн ₽/мес.' in mcurve.locator('[data-point-label]:visible strong').inner_text()
  tip=mcurve.locator('[data-point-label]:visible').bounding_box();assert tip['x']>=0 and tip['x']+tip['width']<=390
 assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth');touch.close()
 # Static HTML has the same correct full-load separation values and four defaults.
 static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000});plain=static.new_page();plain.goto(base+'/')
 assert plain.locator('[data-econ-widget=monthly] [data-econ-profit]').inner_text().startswith('4,45')
 assert plain.locator('[data-econ-widget=monthly] .econ-ring').count()==1
 assert plain.locator('[data-econ-widget=per-tonne] h3').inner_text()=='На 1 тонну готовой продукции'
 assert plain.locator('[data-widget-switch] button[aria-pressed=true]').count()==4
 static.close()
 for anchor in ['raw-material','solution','about-era','discuss']:
  page.goto(base+'/#'+anchor);assert page.locator('#'+anchor).count()==1
 page.goto(base+'/#control-title');page.wait_for_url('**/technology#control-title');assert page.locator('[data-kair-slide]').count()==23
 assert not errors,errors;assert not failures,failures
 (out/'results.json').write_text(json.dumps({'responsive':results,'independentPrices':'OK','allCurveLoadsAndCounts':'OK','touchAndKeyboard':'OK','staticFallback':'OK','preservedLinks':'OK','errors':errors,'failures':failures},ensure_ascii=False,indent=2)+'\n')
 print('Local price memories, tax/loss/clamping, point bounds, utilisation, touch, keyboard and static fallback: OK',flush=True)
 browser.close()
