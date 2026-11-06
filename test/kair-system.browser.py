"""KAIR function discovery, scoped tabs, native disclosures and legacy AI route."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3024/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-kair-system-024'));out.mkdir(parents=True,exist_ok=True)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[];failures=[];results=[]
 for width in [320,390,768,1024,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce',has_touch=width<560)
  page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
  assert page.goto(base+'/automation/').status==200
  page.wait_for_selector('[data-kair-system][data-ready=true]')
  assert page.title()=='Система управления КАИР — ЭРА'
  assert page.locator('h1').count()==1
  assert page.locator('[data-kair-slide]').count()==23
  assert page.locator('[data-kair-scenario]').count()==24
  assert page.locator('[data-kair-function]').count()==29
  assert page.locator('a[href$="/ai"]').count()==0
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'hero')
  # Both tab lists retain their own active panel; keyboard implements the tab pattern.
  protection=page.locator('#ka-logic-tab-protection');protection.click()
  assert protection.get_attribute('aria-selected')=='true'
  assert page.locator('#ka-logic-protection').is_visible()
  assert not page.locator('#ka-logic-coordination').is_visible()
  assert 'Отключение главного привода' in page.locator('#ka-logic-protection').inner_text()
  protection.press('End');assert page.locator('#ka-logic-tab-washing').evaluate('(e)=>e===document.activeElement')
  assert page.locator('#ka-logic-washing').is_visible()
  page.keyboard.press('ArrowRight');assert page.locator('#ka-logic-tab-coordination').evaluate('(e)=>e===document.activeElement')
  page.keyboard.press('ArrowLeft');assert page.locator('#ka-logic-washing').is_visible()
  page.keyboard.press('Home');assert page.locator('#ka-logic-coordination').is_visible()
  page.locator('#ka-process-tab-washing').click()
  assert page.locator('#ka-process-washing').is_visible()
  assert page.locator('#ka-logic-coordination').get_attribute('hidden') is None
  assert page.locator('.ka-water-route').count()==3
  assert page.locator('.ka-water-route').nth(2).inner_text().endswith('Ополаскивание')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'water')
  # Scope covers shared functions and keeps local equipment automation distinct.
  controls=page.locator('[data-kair-function-form]')
  expected=page.locator('[data-kair-function][data-scope=both],[data-kair-function][data-scope=separation]').count()
  controls.locator('[data-kair-scope=separation]').click()
  assert page.locator('[data-kair-function]:visible').count()==expected
  assert page.locator('[data-kair-function][data-scope=washing]:visible').count()==0
  assert page.locator('[data-kair-function][data-scope=equipment]:visible').count()==0
  controls.locator('[data-kair-scope=washing]').click()
  assert page.locator('[data-function-id=alkali]').is_visible()
  assert not page.locator('[data-function-id=recipes]').is_visible()
  controls.locator('[data-kair-scope=equipment]').click()
  assert page.locator('[data-kair-function]:visible').count()==3
  assert page.locator('[data-function-id=granulator]').is_visible()
  assert not page.locator('[data-function-id=alkali]').is_visible()
  controls.locator('button[type=reset]').click()
  search=page.locator('[data-kair-function-search]')
  search.fill('ЖУРНАЛ')
  assert page.locator('[data-kair-function]:visible').count()==1
  assert page.locator('[data-function-id=events]').is_visible()
  assert 'Найдено: 1 из 29' in page.locator('[data-kair-function-result]').inner_text()
  search.fill('пленки');without_yo=page.locator('[data-kair-function]:visible').count()
  search.fill('плёнки');assert page.locator('[data-kair-function]:visible').count()==without_yo>0
  search.fill('<script>несуществующаяфункция</script>')
  assert page.locator('[data-kair-function-empty]').is_visible()
  assert page.locator('[data-kair-function]:visible').count()==0
  controls.locator('button[type=reset]').click()
  assert search.input_value()==''
  assert not page.locator('[data-kair-function-empty]').is_visible()
  assert page.locator('[data-kair-function-group]:not([hidden])').count()==6
  assert page.locator('[data-kair-function-group][open]').count()==1
  # A benefit tile opens and filters the matching functional group.
  page.locator('[data-kair-group-link=water]').click()
  assert page.locator('#kair-functions-water').get_attribute('open') is not None
  assert page.locator('[data-kair-function]:visible').count()==4
  assert 'Вода и возврат жидкости' in page.locator('[data-kair-function-result]').inner_text()
  controls.locator('button[type=reset]').click()
  page.locator('#kair-functions-protection>summary').click()
  assert page.locator('[data-function-id=vibration]').is_visible()
  assert page.locator('#kair-functions-process').get_attribute('open') is not None
  # Native scenario disclosures expose every delivered scenario, including the long list.
  scenario=page.locator('[data-kair-scenario="1"]');scenario.locator('summary').click()
  assert scenario.locator('.ka-scenario-content').is_visible()
  assert 'на площадке остаётся персонал' in scenario.inner_text()
  scenario.locator('summary').click();assert not scenario.locator('.ka-scenario-content').is_visible()
  more=page.locator('.ka-more-scenarios');more.locator('>summary').click()
  assert page.locator('[data-kair-scenario="24"]').is_visible()
  page.locator('[data-kair-scenario="24"]>summary').click()
  assert page.locator('[data-kair-scenario="24"] .ka-scenario-content').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'disclosures')
  assert page.locator('[data-kair-function-group]>.ka-function-grid').first.evaluate('(e)=>getComputedStyle(e).position')=='static'
  assert page.locator('[data-kair-scenario="24"]>.ka-scenario-content').evaluate('(e)=>getComputedStyle(e).position')=='static'
  assert page.locator('[data-ka-tab],[data-kair-scope],.ka-reset').evaluate_all('(es)=>es.filter(e=>e.getBoundingClientRect().height).every(e=>e.getBoundingClientRect().height>=44)')
  if width in [390,1440]:
   page.evaluate('scrollTo({top:0,behavior:"instant"})');page.screenshot(path=str(out/f'final-hero-{width}.png'))
   page.locator('#kair-functions').screenshot(path=str(out/f'final-functions-{width}.png'))
   page.locator('#kair-scenarios').screenshot(path=str(out/f'final-scenarios-{width}.png'))
  # The deleted standalone AI page is a compatibility redirect only, with query retained.
  page.goto(base+'/ai/?source=legacy')
  page.wait_for_url(base+'/automation?source=legacy')
  assert page.locator('[data-kair-system]').count()==1
  page.locator('[data-menu-toggle]').click()
  assert page.locator('#site-menu a[href$="/automation"]').count()==1
  assert 'Искусственный интеллект' not in page.locator('#site-menu').inner_text()
  results.append({'width':width,'overflow':False,'tabs':True,'filters':True,'scenarios':True,'legacyRedirect':True})
  print('KAIR: responsive layout, keyboard tabs, scoped search, disclosures and redirect:',width,'OK',flush=True)
  context.close()
 # Native disclosures and redirect stay usable when JavaScript is disabled.
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000})
 page=context.new_page();page.goto(base+'/automation/')
 page.locator('#kair-functions-water>summary').click()
 assert page.locator('[data-function-id=water-treatment]').is_visible()
 page.locator('[data-kair-scenario="1"]>summary').click()
 assert page.locator('[data-kair-scenario="1"] .ka-scenario-content').is_visible()
 page.goto(base+'/ai/');page.wait_for_url(base+'/automation')
 assert page.locator('h1').count()==1
 context.close()
 assert not errors,errors
 assert not failures,failures
 (out/'acceptance.json').write_text(json.dumps({'responsive':results,'pageErrors':errors,'failedLocalResponses':failures},ensure_ascii=False,indent=2)+'\n')
 browser.close()
