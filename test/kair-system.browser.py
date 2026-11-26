"""KAIR sticky navigation, benefits, independent controls and legacy links."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3024/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-kair-system-024'));out.mkdir(parents=True,exist_ok=True)
section_ids=['kair-'+slug for slug in (
 'value','logic','scenarios','process','screens','functions','hardware','project','contact'
)]
nav_selector='[data-kair-section-nav]'
anchor_in_view="""id=>{
 const top=document.getElementById(id).getBoundingClientRect().top;
 const bottom=document.querySelector('[data-kair-section-nav]').getBoundingClientRect().bottom;
 return top-bottom>=14 && top-bottom<=18;
}"""

def check_anchor(page,id):
 page.wait_for_function(anchor_in_view,arg=id)
 page.wait_for_function("""id=>{
  const active=document.querySelector('.page-progress-rail [aria-current=location]');
  return active?.hash==='#'+(id.startsWith('kair-functions-')?'kair-functions':id);
 }""",arg=id)

def check_sticky(page):
 assert page.evaluate("""()=>{
  const header=document.querySelector('.site-header').getBoundingClientRect();
  const nav=document.querySelector('[data-kair-section-nav]').getBoundingClientRect();
  return Math.abs(header.bottom-nav.top)<1 && nav.height>=44 && nav.height<=52;
 }""")

def check_active(page,id):
 active_id='kair-project' if id=='kair-contact' else id
 page.wait_for_function("""id=>{
  const link=document.querySelector('[data-kair-section-nav] [aria-current=location]');
  if(link?.hash!=='#'+id)return false;
  const item=link.getBoundingClientRect(),track=link.parentElement.getBoundingClientRect();
  return item.left>=track.left-1 && item.right<=track.right+1;
 }""",arg=active_id)
 assert page.locator(nav_selector+' [aria-current=location]').count()==1
 check_sticky(page)

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 errors=[];failures=[];results=[]
 for width in [320,390,768,1024,1440,1600]:
  height=1200 if width==1440 else 1000
  context=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',has_touch=width<560)
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
  nav=page.locator(nav_selector)
  assert page.locator('[data-kair-system]').evaluate('e=>e.firstElementChild.matches("[data-kair-section-nav]")')
  assert page.locator('.kair-system > section').evaluate_all('ss=>ss.slice(1).map(s=>s.id)')==section_ids
  assert nav.locator('a').evaluate_all('links=>links.map(a=>a.hash.slice(1))')==section_ids[:-1]
  assert page.locator('.page-progress-rail a').evaluate_all('links=>links.map(a=>a.hash.slice(1))')==['page-section-1']+section_ids
  assert nav.locator('[aria-current]').count()==0
  check_sticky(page)
  if width in [390,1440]:
   page.locator('[data-cookie-choice="deny"]').click()
   page.mouse.move(0,0)
   page.screenshot(path=str(out/f'hero-{width}.png'))
  for id in section_ids[:-1]:
   nav.locator('a[href="#'+id+'"]').click()
   assert page.evaluate('location.hash')=='#'+id
   check_anchor(page,id)
   check_active(page,id)
   heading=page.locator('#'+id+' h2').first.bounding_box()
   assert nav.bounding_box()['y']+nav.bounding_box()['height']<heading['y']<height
   if id=='kair-value' and width in [390,1440]:page.screenshot(path=str(out/f'benefits-{width}.png'))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'section navigation')
  cards=page.locator('.ka-value-card')
  assert cards.count()==6
  assert cards.locator('a,button,[tabindex]').count()==0
  assert cards.last.locator('h3').inner_text()=='Свобода владельца'
  assert cards.last.evaluate('e=>getComputedStyle(e).backgroundImage.includes("rgb(28, 41, 64)")')
  assert cards.locator('svg').evaluate_all('icons=>icons.every(e=>e.getBoundingClientRect().width===46)')
  columns=3 if width>850 else 2 if width>560 else 1
  assert page.locator('.ka-value-grid').evaluate('e=>getComputedStyle(e).gridTemplateColumns.split(" ").length')==columns
  for start in range(0,6,columns):
   sizes=[cards.nth(i).bounding_box()['height'] for i in range(start,start+columns)]
   assert max(sizes)-min(sizes)<1
  # Manual scrolling keeps the URL and moves the active mark in either direction.
  for id in ('kair-screens','kair-logic','kair-scenarios'):
   page.evaluate('(id)=>window.scrollBy(0,document.getElementById(id).getBoundingClientRect().top-150)',id)
   check_active(page,id)
   assert page.evaluate('location.hash')=='#kair-project'
  page.locator('.page-progress-rail a[href="#kair-contact"]').click()
  check_anchor(page,'kair-contact')
  check_active(page,'kair-contact')
  if width==1440:
   page.mouse.move(0,0)
   page.screenshot(path=str(out/'project-1440.png'))
  if width==390:
   page.locator('#kair-contact [data-project-request]').click()
   assert page.locator('dialog#project-request').is_visible()
   page.keyboard.press('Escape')
   page.locator('#kair-contact a[href$="/economics"]').click()
   assert page.url.rstrip('/').endswith('/economics')
   page.goto(base+'/automation/#kair-screens')
   check_anchor(page,'kair-screens')
   page.reload();check_anchor(page,'kair-screens')
   page.locator('#kair-screens a[href="#kair-scenarios"]').click()
   check_anchor(page,'kair-scenarios')
   page.go_back();check_active(page,'kair-screens')
   page.go_forward();check_active(page,'kair-scenarios')
   nav.locator('a[href="#kair-value"]').click()
   page.locator('.ka-value-hook').scroll_into_view_if_needed()
   check_active(page,'kair-value')
   page.mouse.move(0,0)
   page.screenshot(path=str(out/'benefits-accent-390.png'))
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
  search.fill('дозирован')
  assert page.locator('[data-function-id=alkali]').is_visible()
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
  # A direct bookmark opens its function group without filtering out the others.
  page.goto(base+'/automation/#kair-functions-protection')
  check_anchor(page,'kair-functions-protection')
  assert page.locator('[data-function-id=vibration]').is_visible()
  assert '29 описаний в 6 группах' in page.locator('[data-kair-function-result]').inner_text()
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
  check_active(page,'kair-scenarios')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'disclosures')
  assert page.locator('[data-kair-function-group]>.ka-function-grid').first.evaluate('(e)=>getComputedStyle(e).position')=='static'
  assert page.locator('[data-kair-scenario="24"]>.ka-scenario-content').evaluate('(e)=>getComputedStyle(e).position')=='static'
  assert page.locator('[data-ka-tab],[data-kair-scope],.ka-reset').evaluate_all('(es)=>es.filter(e=>e.getBoundingClientRect().height).every(e=>e.getBoundingClientRect().height>=44)')
  # The deleted standalone AI page is a compatibility redirect only, with query retained.
  page.goto(base+'/ai/?source=legacy')
  page.wait_for_url(base+'/automation?source=legacy')
  assert page.locator('[data-kair-system]').count()==1
  page.locator('[data-menu-toggle]').click()
  assert page.locator('#site-menu a[href$="/automation"]').count()==1
  assert 'Искусственный интеллект' not in page.locator('#site-menu').inner_text()
  results.append({'width':width,'overflow':False,'anchors':8,'sticky':True,
                  'columns':columns,'tabs':True,'filters':True,'scenarios':True,'legacyRedirect':True})
  print('KAIR: sticky navigation, benefits, tabs, 29 functions, 24 scenarios and redirect:',width,'OK',flush=True)
  context.close()
 # Keyboard focus, full-motion scrolling and respect for the browser's reduced motion preference.
 page=browser.new_page(viewport={'width':1440,'height':1000})
 page.goto(base+'/automation/')
 link=page.locator(nav_selector+' a[href="#kair-project"]')
 link.press('Tab')
 page.keyboard.press('Shift+Tab')
 assert link.evaluate('e=>e.matches(":focus-visible")')
 assert link.evaluate('e=>getComputedStyle(e).outlineStyle')=='solid'
 assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior')=='smooth'
 page.keyboard.press('Enter')
 check_anchor(page,'kair-project')
 page.emulate_media(reduced_motion='reduce')
 assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior')=='auto'
 page.set_viewport_size({'width':640,'height':360})
 link.press('Enter')
 check_anchor(page,'kair-project')
 check_active(page,'kair-project')
 assert page.locator('.page-progress-rail').bounding_box()['y']>=page.locator(nav_selector).bounding_box()['y']+49
 page.close()
 # Native disclosures and redirect stay usable when JavaScript is disabled.
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000},reduced_motion='reduce')
 page=context.new_page();page.goto(base+'/automation/')
 page.locator(nav_selector+' a[href="#kair-scenarios"]').click()
 assert page.evaluate(anchor_in_view,'kair-scenarios')
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
