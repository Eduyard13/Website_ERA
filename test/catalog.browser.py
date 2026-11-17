"""Catalog branches: real controls, query/history, responsive art and no-JS fallback."""
from pathlib import Path
from urllib.parse import urlparse,parse_qs
import json,os
from playwright.sync_api import sync_playwright,expect

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3141').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-catalog-review'));out.mkdir(parents=True,exist_ok=True)
errors=[];failures=[];layouts=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
 def load(branch,query=''):
  assert page.goto(base+'/catalog/'+branch+query).status==200
  if branch:page.wait_for_selector('[data-catalog-ready="true"]')
 def count(kind,n):expect(page.locator('[data-'+kind+']:visible')).to_have_count(n)
 def button(name):return page.get_by_role('button',name=name,exact=True)
 def pressed(name):expect(button(name)).to_have_attribute('aria-pressed','true')
 def query():return parse_qs(urlparse(page.url).query,keep_blank_values=True)
 def no_overflow():assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.url
 for width in [320,390,768,900,1024,1200,1440,1920]:
  for height in [768,900,1000]:
   page.set_viewport_size({'width':width,'height':height})
   for branch in ['', 'lines/', 'equipment/']:
    load(branch);no_overflow()
    if not branch:
     expect(page.locator('.catalog-door')).to_have_count(2)
     page.locator('.catalog-door img').evaluate_all("items=>items.forEach(i=>i.loading='eager')")
     page.evaluate('async()=>await Promise.all([...document.querySelectorAll(".catalog-door img")].map(i=>i.decode()))')
     for card in page.locator('.catalog-door').all():
      image=card.locator('img').bounding_box();copy=card.locator('.catalog-exhibit-copy').bounding_box()
      assert image['y']+image['height']<=copy['y']+1
      assert abs(image['width']/image['height']-1.5)<.01
      assert card.locator('img').evaluate('(e)=>getComputedStyle(e).objectFit')=='contain'
     boxes=[c.bounding_box() for c in page.locator('.catalog-door').all()]
     if width>=900:assert abs(boxes[0]['y']-boxes[1]['y'])<1 and abs(boxes[0]['height']-boxes[1]['height'])<1
     else:assert boxes[1]['y']>=boxes[0]['y']+boxes[0]['height']
    else:
     expect(page.get_by_role('navigation',name='Разделы каталога')).to_have_count(1)
     expect(page.locator('.catalog-branch-nav [aria-current=page]')).to_have_count(1)
     expect(page.locator('[data-context-navigation]')).to_have_count(0)
     expect(page.locator('[data-native-filter]')).to_be_hidden()
     assert page.locator('[data-quick-filter] button').evaluate_all('items=>items.every(e=>e.getBoundingClientRect().height>=44)')
     if branch=='lines/':
      count('line',4)
      page.locator('.catalog-comparison summary').click();no_overflow()
      region=page.get_by_role('region',name='Сравнение линий')
      expect(region).to_be_visible()
      if width<768:assert region.evaluate('(e)=>e.scrollWidth>e.clientWidth')
      assert page.locator('.catalog-comparison table').evaluate('(e)=>e.getBoundingClientRect().height>300')
     else:count('node',12)
    if height==900 and width in [390,900,1440]:
     page.screenshot(path=str(out/f'{branch.strip("/") or "hub"}-{width}.png'),full_page=not branch)
   layouts.append([width,height])
 print('All three routes: 8 widths × 3 heights, complete 3:2 scenes and local table scroll: OK',flush=True)
 # Start navigation scenarios in an independent session after the layout matrix.
 page.close()
 page=browser.new_page(reduced_motion='reduce',viewport={'width':1440,'height':900})
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append([r.status,r.url]) if r.status>=400 and r.url.startswith(base) else None)
 load('')
 for card in page.locator('.catalog-door').all():
  before=card.bounding_box();card.hover();assert card.bounding_box()==before
  card.focus();assert card.bounding_box()==before
  expect(card).to_be_focused()
 first=page.locator('.catalog-door').first;first.focus();page.keyboard.press('Enter');page.wait_for_url('**/catalog/lines');page.wait_for_selector('[data-catalog-ready]')
 load('lines/')
 pressed('Все линии');count('line',4)
 assert not page.locator('.catalog-comparison').evaluate('(e)=>e.open')
 button('Сепарация').focus();page.keyboard.press('Space');count('line',3);pressed('Сепарация');expect(button('Сепарация')).to_be_focused()
 assert query()['group']==['Сепарация']
 summary=page.locator('.catalog-comparison summary');summary.focus();page.keyboard.press('Enter')
 assert page.locator('.catalog-comparison').evaluate('(e)=>e.open')
 for value in ['225 кВт','402,67 кВт','157,5 кВт','281,87 кВт','5 × 4,7 м³','Дополнительная опция, по согласованию']:
  expect(page.locator('.catalog-comparison')).to_contain_text(value)
 button('Мойка').click();count('line',1);pressed('Мойка');expect(page.locator('.catalog-comparison')).to_be_hidden()
 expect(page.locator('[data-line]:visible')).to_have_js_property('tagName','ARTICLE')
 button('Все линии').click();count('line',4);assert page.locator('.catalog-comparison').evaluate('(e)=>e.open')
 assert 'group' not in query()
 for group,n in [('Сепарация',3),('Мойка',1)]:
  load('lines/','?campaign=test&optional=old&group='+group);count('line',n);pressed(group)
  assert query()['campaign']==['test'] and 'optional' not in query()
  button('Сбросить').click();count('line',4);assert query()=={'campaign':['test']}
 load('lines/','?group=invalid');count('line',4);pressed('Все линии');assert not query()
 load('lines/','?group=Сепарация')
 page.locator('[data-line-id=separatsiya-01]').click();page.wait_for_url('**/separatsiya-01');page.wait_for_selector('[data-context-ready]');expect(page.locator('[data-context-back]')).to_be_visible()
 page.locator('[data-context-back]').click();page.wait_for_url(lambda url:'/catalog/lines' in url and '/separatsiya-' not in url);page.wait_for_selector('[data-catalog-ready]');count('line',3);pressed('Сепарация')
 # Native branch transitions carry no incompatible filter parameters, Back restores the source URL.
 page.get_by_role('navigation',name='Разделы каталога').get_by_role('link',name='Отдельные узлы').click();page.wait_for_url('**/catalog/equipment/');page.wait_for_selector('[data-catalog-ready]')
 count('node',12);assert not query()
 page.go_back();page.wait_for_selector('[data-catalog-ready]');count('line',3);pressed('Сепарация')
 page.go_forward();page.wait_for_selector('[data-catalog-ready]');count('node',12)
 load('equipment/')
 for name,n in [('Все узлы',12),('Подготовка и подача',3),('Сухая сепарация',2),('Измельчение и мойка',2),('Обезвоживание',3),('Очистка стоков',1),('Фасовка',1)]:
  button(name).click();count('node',n);pressed(name)
  expect(page.locator('[data-quick-filter] [aria-pressed=true]')).to_have_count(1)
  expect(button(name)).to_be_focused()
 button('Обезвоживание').click();page.get_by_role('searchbox').fill('центрифуга');count('node',1)
 button('Сбросить').click();count('node',12);pressed('Все узлы');expect(page.get_by_role('searchbox')).to_have_value('')
 page.get_by_role('searchbox').fill('флотатор');count('node',1)
 page.locator('[data-node]:visible').click();page.wait_for_url('**/plenochnyy-flotator');page.go_back();page.wait_for_selector('[data-catalog-ready]');count('node',1)
 page.reload();page.wait_for_selector('[data-catalog-ready]');count('node',1)
 button('Сбросить').click();page.locator('[name=material]').select_option('Рабочая моющая жидкость');count('node',1)
 expect(page.locator('[data-node]:visible')).to_contain_text('Комплекс очистки стоков')
 page.get_by_role('searchbox').fill('флотатор');count('node',0);expect(page.locator('#catalog-empty')).to_be_visible();expect(page.locator('#catalog-result')).to_have_text('Найдено: 0 из 12 узлов')
 button('Сбросить').click();count('node',12);expect(page.locator('#catalog-empty')).to_be_hidden()
 load('equipment/','?campaign=test&category=invalid&material=invalid&q=%20%20');count('node',12);pressed('Все узлы');assert query()=={'campaign':['test']}
 # A state already used by context-back must survive every replaceState.
 page.evaluate("history.replaceState({eraContext:{marker:'preserved'},custom:'kept'},'',location.href)")
 length=page.evaluate('history.length');page.get_by_role('searchbox').fill('центрифуга')
 assert page.evaluate('history.length')==length
 assert page.evaluate('history.state.custom')=='kept' and page.evaluate('history.state.eraContext.marker')=='preserved'
 button('Сбросить').click();assert query()=={'campaign':['test']}
 # Exercise current-URL hydration for popstate and BFCache pageshow explicitly.
 page.evaluate("history.pushState(history.state,'','?campaign=test&category=Обезвоживание');dispatchEvent(new PopStateEvent('popstate'))")
 count('node',3);pressed('Обезвоживание')
 page.evaluate("history.replaceState(history.state,'','?campaign=test&q=флотатор');dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
 count('node',1);pressed('Все узлы');expect(page.get_by_role('searchbox')).to_have_value('флотатор')
 print('Real category/group buttons, AND search/materials, invalid query/reset, comparison, keyboard, detail/branch Back and Forward, history.state, popstate and BFCache hydration: OK',flush=True)
 touch=browser.new_page(has_touch=True,is_mobile=True,viewport={'width':390,'height':900})
 touch.goto(base+'/catalog/equipment/');touch.wait_for_selector('[data-catalog-ready]')
 touch.get_by_role('button',name='Обезвоживание',exact=True).tap();expect(touch.locator('[data-node]:visible')).to_have_count(3)
 touch.close()
 # A stale enhancement leaves a genuinely usable native select, not two competing controls.
 fallback=browser.new_page()
 def native_only(route):
  response=route.fetch()
  route.fulfill(response=response,body=response.text().replace('const group=form.querySelector(', 'const group=null;//form.querySelector('))
 fallback.route('**/catalog-branches.js*',native_only)
 fallback.goto(base+'/catalog/equipment/');fallback.wait_for_selector('[data-catalog-ready]')
 expect(fallback.locator('[name=category]')).to_be_visible();fallback.locator('[name=category]').select_option('Обезвоживание');expect(fallback.locator('[data-node]:visible')).to_have_count(3)
 fallback.close()
 nojs=browser.new_context(java_script_enabled=False,viewport={'width':320,'height':900})
 static=nojs.new_page()
 for branch,kind,n in [('equipment/','node',12),('lines/','line',4)]:
  assert static.goto(base+'/catalog/'+branch).status==200
  expect(static.locator('[data-'+kind+']:visible')).to_have_count(n)
  expect(static.locator('[data-quick-filter]')).to_be_hidden()
  assert static.locator('.catalog-branch-filters input,.catalog-branch-filters select,.catalog-branch-filters>button').evaluate_all('items=>items.every(e=>e.disabled)')
  expect(static.locator('.catalog-no-script')).to_be_visible()
  assert 'Сейчас доступны все карточки' in static.locator('.catalog-no-script').text_content()
  static.locator('[data-'+kind+']').first.click();expect(static.locator('h1')).to_be_visible()
 static.goto(base+'/catalog/');static.locator('.catalog-door').last.click();expect(static.locator('[data-node]')).to_have_count(12)
 nojs.close()
 assert not errors,errors
 assert not failures,failures
 (out/'results.json').write_text(json.dumps({'layouts':layouts,'filterHistoryAndNoJS':'passed','errors':errors,'localHttpFailures':failures},ensure_ascii=False,indent=2)+'\n')
 print('Native-select fallback, no-JS cards and links, 0 console errors and 0 local HTTP failures: OK',flush=True)
 browser.close()
