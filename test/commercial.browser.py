"""Commercial scenarios share one financial state; legacy project content stays reachable."""
from pathlib import Path
import json,os,subprocess
from playwright.sync_api import sync_playwright

repo=Path(__file__).resolve().parents[1]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3018/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-homepage-rebuild-0.20/commercial-tests'));out.mkdir(parents=True,exist_ok=True)
states=[{}, {'mode':'full'}, {'mode':'full','lines':2}, {'mode':'full','lines':2,'input':1440}, {'mode':'full','input':1080}, {'mode':'full','input':0}, {'mode':'full','salePrices':{'full':10000}}, {'salePrices':{'separation':26000}}, {'separationYield':0}, {'input':720.5}, {'mode':'full','granulationYield':.8}, {'mode':'full','lines':3,'input':3240}]
node="import {calculateEconomics} from './public/economics-model.js';import {tonnes,millions,money,percentage} from './public/economics-view.js';const states=JSON.parse(process.argv[1]);console.log(JSON.stringify(states.map(s=>{const r=calculateEconomics(s);return {profit:millions(r.net),revenue:millions(r.revenue),output:tonnes(r.output),margin:percentage(r.margin),perProduct:money(r.perProduct?.net),perInput:money(r.perInput),pie:r.donutAvailable,breakEven:r.breakEvenState}})))"
expected=json.loads(subprocess.check_output(['node','--input-type=module','-e',node,json.dumps(states)],cwd=repo,text=True))
compact=lambda s:''.join(s.split())
errors=[];failures=[];results=[]

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)

 def verify(index):
  values=expected[index]
  for attr,key in [('profit','profit'),('revenue','revenue'),('output','output'),('margin','margin')]:
   assert compact(page.locator(f'[data-econ-{attr}]').inner_text())==compact(values[key]),(index,attr,page.locator(f'[data-econ-{attr}]').inner_text(),values[key])
  units=page.locator('.econ-unit-totals strong').all_inner_texts()
  assert [compact(v) for v in units]==[compact(values['perProduct']),compact(values['perInput'])],(index,units,values)
  assert bool(page.locator('.econ-ring').count())==values['pie']
  assert values['profit'] in page.locator('.econ-curve-figure svg').get_attribute('aria-label')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),index
  assert not any(term in page.locator('[data-economics]').inner_text() for term in ['NaN','Infinity'])

 for width in [320,390,768,1024,1280,1440,1920]:
  page.set_viewport_size({'width':width,'height':1000});assert page.goto(base+'/').status==200
  page.wait_for_function('document.querySelector("[data-economics]").dataset.econMode==="separation"');verify(0)
  assert page.locator('.pitch-stage-nav').count()==0 and page.locator('[data-kair]').count()==0
  assert page.locator('.business-feedstock-grid>article').count()==4
  assert page.locator('[role=tabpanel]:visible .market-offer').count()==4
  for selector in ['.econ-curve-figure','.econ-bridge-figure']:
   frame=page.locator(selector).bounding_box();svg=page.locator(selector+' svg').bounding_box()
   assert svg['width']<=frame['width']+1,(width,selector)
  assert page.locator('.econ-curve-figure circle').evaluate('(e)=>{const p=e.getBoundingClientRect(),r=e.closest("figure").getBoundingClientRect();return p.x>=r.x&&p.right<=r.right}'),width
  page.locator('[data-econ-mode=full]').click();verify(1)
  if width in [390,1440]:
   page.locator('.site-header').evaluate('(e)=>e.style.visibility="hidden"')
   page.locator('.economics-section').screenshot(path=str(out/f'economics-full-{width}.png'))
  results.append({'width':width,'sharedBaseValues':True,'bothModes':True,'wholeGraphs':True,'overflow':False})
  print('Base scenarios, chart point visible, complete bridge and no overflow:',width,'OK',flush=True)

 page.set_viewport_size({'width':1440,'height':1000});page.goto(base+'/');page.wait_for_selector('[data-econ-state]')
 profit=page.locator('.econ-legend [data-segment=profit]');profit.focus();assert page.locator('[data-ring-label]').inner_text()=='Чистая прибыль в модели'
 profit.click();assert profit.get_attribute('aria-pressed')=='true';page.keyboard.press('Escape');assert page.locator('[data-ring-label]').inner_text()=='Выручка'
 page.locator('.econ-ring [data-segment=electricity]').hover();assert page.locator('[data-ring-label]').inner_text()=='Электроэнергия'
 assert page.locator('.econ-ring [data-segment=electricity]').evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
 page.keyboard.press('Escape')
 page.locator('[data-econ-mode=full]').click();page.locator('[data-econ-lines="2"]').click();assert page.locator('[data-econ-number]').input_value()=='720';verify(2)
 page.locator('[data-econ-number]').fill('1440');verify(3)
 page.locator('[data-econ-number]').fill('1800');page.locator('[data-econ-lines="1"]').click();assert page.locator('[data-econ-number]').input_value()=='1080';assert page.locator('[data-econ-clamp]').is_visible();verify(4)
 page.locator('[data-econ-number]').fill('0');verify(5);assert page.locator('.econ-cost-table').is_visible()
 page.locator('[data-econ-number]').fill('720');page.locator('.econ-assumptions>summary').click()
 assert page.locator('.econ-assumption-inputs').evaluate('(e)=>getComputedStyle(e).position')=='static'
 page.locator('[data-econ-price]').fill('10000');verify(6)
 page.locator('[data-econ-mode=separation]').click();page.locator('[data-econ-price]').fill('26000');verify(7);assert 'за пределом мощности' in page.locator('[data-break-even]').inner_text()
 page.locator('[data-econ-price]').fill('45000');page.locator('[data-econ-yield]').fill('0');verify(8);assert 'Безубыточность недостижима' in page.locator('[data-break-even]').inner_text()
 page.locator('[data-econ-yield]').fill('50');page.locator('[data-econ-number]').fill('720.5');verify(9);assert page.locator('[data-econ-range]').input_value()=='720.5'
 page.locator('[data-econ-number]').fill('720');page.locator('[data-econ-mode=full]').click();assert page.locator('[data-econ-price]').input_value()=='10000'
 page.locator('[data-econ-price]').fill('75000');page.locator('[data-econ-granulation-yield]').fill('80');verify(10)
 page.locator('[data-econ-granulation-yield]').fill('90');page.locator('[data-econ-lines="3"]').click();page.locator('[data-econ-number]').fill('3240');verify(11)
 print('Legend focus/tap/Escape, zero/loss/capacity, fractional input, independent prices and shared calculations: OK',flush=True)

 tabs=page.get_by_role('tab');page.get_by_role('tab',name='ПВД / LDPE',exact=True).click();assert page.locator('[role=tabpanel]:visible .market-offer').count()==10
 page.keyboard.press('ArrowRight');assert page.get_by_role('tab',name='ПНД / HDPE',exact=True).get_attribute('aria-selected')=='true';assert page.locator('[role=tabpanel]:visible .market-offer').count()==6
 page.keyboard.press('Home');assert page.locator('[role=tabpanel]:visible .market-offer').count()==4
 page.locator('[role=tabpanel]:visible details').first.locator('summary').click();assert 'Не указан' in page.locator('[role=tabpanel]:visible details').first.inner_text()
 for anchor in ['raw-material','solution','about-era','discuss']:
  page.goto(base+'/#'+anchor);assert page.locator('#'+anchor).count()==1
 for anchor in ['raw-title','control-title','detail-title']:
  page.goto(base+'/#'+anchor);page.wait_for_url('**/technology#'+anchor);assert page.locator('#'+anchor).count()==1
 page.goto(base+'/');page.get_by_role('link',name='Как это работает',exact=True).click();page.wait_for_url('**/technology#solution')
 assert page.locator('[data-kair-slide]').count()==23
 page.locator('[data-kair]').scroll_into_view_if_needed();page.locator('[data-kair-next]').click();page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 23"')
 print('Market keyboard tabs, old anchors, hero transition and migrated KAIR: OK',flush=True)

 touch=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mobile=touch.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.goto(base+'/');mobile.locator('[data-econ-mode=full]').tap();mobile.locator('.econ-legend [data-segment=profit]').tap();assert mobile.locator('[data-ring-label]').inner_text()=='Чистая прибыль в модели'
 mobile.get_by_role('tab',name='ПНД / HDPE',exact=True).tap();assert mobile.locator('[role=tabpanel]:visible .market-offer').count()==6
 assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth');touch.close()
 static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000});plain=static.new_page();plain.goto(base+'/')
 assert plain.locator('[data-econ-profit]').inner_text().startswith('3,60');assert plain.locator('.econ-ring').count()==1;assert plain.locator('.econ-bridge-values').count()==1
 static.close();assert not errors,errors;assert not failures,failures
 (out/'results.json').write_text(json.dumps({'responsive':results,'functionalScenarios':len(states),'keyboardAndTouch':'OK','migrationLinks':'OK','staticFallback':'OK','errors':errors,'failures':failures},ensure_ascii=False,indent=2)+'\n')
 print('Touch controls and readable baseline without JavaScript: OK',flush=True)
 browser.close()
