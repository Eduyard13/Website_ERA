"""Navigation 3 + 2: real transitions, geometry and keyboard; no screenshots."""
from pathlib import Path
from urllib.parse import urlparse
import json, os
from playwright.sync_api import sync_playwright
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3045/Website_ERA').rstrip('/')
root=urlparse(base).path
labels=['О проекте','Технология','Оборудование','Экономика','КАИР']
groups=['Проект','Технология','Оборудование','Материалы','Команда и контакты']
paths=['/','/economics','/technology','/automation','/catalog','/catalog/lines','/catalog/equipment','/media','/documents','/about-us','/contacts']
results={'widths':[],'routes':[],'links':[],'forms':[],'screenshots':False};errors=[]
def open_menu(page):
 page.locator('[data-menu-toggle]').click();menu=page.locator('#site-menu')
 assert menu.is_visible() and page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='true'
 assert page.evaluate('document.body.classList.contains("menu-open")')
 assert menu.locator('[data-menu-close]').evaluate('(e)=>document.activeElement===e')
 return menu
def closed(page):
 assert not page.locator('#site-menu').is_visible()
 assert page.locator('[data-menu-toggle]').get_attribute('aria-expanded')=='false'
 assert not page.evaluate('document.body.classList.contains("menu-open")')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,390,768,900,1024,1200,1280,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce');page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/')
  assert page.locator('.primary-nav a').all_text_contents()==labels
  assert page.locator('.primary-nav').is_visible()==(width>=1200)
  assert page.locator('.primary-nav a[aria-current=page]').inner_text()=='О проекте'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  menu=open_menu(page)
  assert menu.get_attribute('data-menu-layout')=='3-plus-2'
  headings=menu.locator('.drawer-group-heading')
  assert headings.all_text_contents()==groups
  assert headings.evaluate_all('es=>es.every(e=>getComputedStyle(e).fontSize==="13px")')
  assert menu.locator('.drawer-major-groups>section').count()==3
  assert menu.locator('.drawer-support-groups>section').count()==2
  assert menu.locator('.drawer-link').count()==11 and menu.locator('.drawer-contact-cta').count()==1
  assert menu.locator('.drawer-top-cta,.drawer-primary').count()==0
  assert menu.locator('.drawer-link,button,.drawer-contact-cta').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().height>=44)')
  assert menu.locator('.drawer-scroll').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  boxes=menu.locator('.drawer-group').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})')
  panel=menu.bounding_box();assert panel['x']>=0 and panel['x']+panel['width']<=width+1
  if width>=1200:
   assert 1000<=panel['width']<=1120
   assert max(b['y'] for b in boxes[:3])-min(b['y'] for b in boxes[:3])<1
   assert boxes[0]['x']<boxes[1]['x']<boxes[2]['x'] and abs(boxes[3]['y']-boxes[4]['y'])<1
   assert boxes[3]['y']>=max(b['y']+b['h'] for b in boxes[:3])+20
   assert menu.locator('.drawer-contact-cta').bounding_box()['y']+48<1000
  elif width>=768:
   assert abs(boxes[0]['y']-boxes[1]['y'])<1 and boxes[0]['x']<boxes[1]['x']
   assert abs(boxes[2]['y']-boxes[3]['y'])<1 and boxes[2]['y']>boxes[0]['y'] and boxes[4]['y']>boxes[2]['y']
  else:
   assert max(b['x'] for b in boxes)-min(b['x'] for b in boxes)<1
   assert all(boxes[i+1]['y']>boxes[i]['y']+boxes[i]['h'] for i in range(4))
  close_y=menu.locator('[data-menu-close]').bounding_box()['y'];background_y=page.evaluate('scrollY')
  menu.locator('.drawer-scroll').evaluate('(e)=>e.scrollTop=e.scrollHeight')
  assert menu.locator('[data-menu-close]').bounding_box()['y']==close_y and page.evaluate('scrollY')==background_y
  menu.locator('[data-menu-close]').focus();page.keyboard.press('Shift+Tab')
  assert menu.locator('.drawer-contact-cta').evaluate('(e)=>document.activeElement===e')
  page.keyboard.press('Tab');assert menu.locator('[data-menu-close]').evaluate('(e)=>document.activeElement===e')
  for key in ['Tab']*14+['Shift+Tab']*14:
   page.keyboard.press(key);assert menu.evaluate('(e)=>e.contains(document.activeElement)')
  page.keyboard.press('Escape');closed(page)
  assert page.locator('[data-menu-toggle]').evaluate('(e)=>document.activeElement===e')
  open_menu(page).locator('[data-menu-close]').click();closed(page)
  if width>=1200:
   open_menu(page);page.mouse.click(5,300);closed(page)
  results['widths'].append({'width':width,'menuWidth':panel['width']});context.close()
 print('Responsive layout, controls, scrolling and keyboard: 9 widths OK',flush=True)
 cases=[('/','project','/'),('/technology/','technology','/technology'),('/catalog/','equipment','/catalog'),('/catalog/lines/','equipment','/catalog/lines'),('/catalog/lines/separatsiya-01/','equipment','/catalog/lines'),('/catalog/lines/separatsiya-02/','equipment','/catalog/lines'),('/catalog/equipment/predvaritelnyy-izmelchitel/','equipment','/catalog/equipment'),('/economics/','economics','/economics'),('/automation/','control','/automation')]
 cases += [(s+'/','all',s) for s in ['/media','/documents','/about-us','/contacts']]+[(s+'/','all',None) for s in ['/news','/blog']]
 for width in [390,1440]:
  context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce');page=context.new_page()
  page.on('pageerror',lambda e:errors.append(str(e)))
  for route,section,active_path in cases:
   response=page.goto(base+route);assert response.status==200,(route,response.status)
   current=page.locator('.site-header [data-current-section=true]');assert current.count()==1
   if section=='all':assert current.get_attribute('data-menu-toggle') is not None
   else:assert current.get_attribute('href')==root+{'project':'/','technology':'/technology','equipment':'/catalog','economics':'/economics','control':'/automation'}[section]
   menu=open_menu(page);selected=menu.locator('[aria-current=page],[data-current-branch=true]')
   assert selected.count()==(1 if active_path else 0),(width,route)
   if active_path:assert selected.get_attribute('href')==root+active_path
   assert menu.locator('a[href$="/news"],a[href$="/blog"]').count()==0
   page.keyboard.press('Escape');results['routes'].append({'width':width,'route':route})
  for path in paths:
   page.goto(base+'/documents/');open_menu(page).locator(f'.drawer-link[href="{root+path}"]').click()
   page.wait_for_url(base+path.rstrip('/')+('/' if path=='/' else '**'))
   assert urlparse(page.url).path.rstrip('/')==(root+path).rstrip('/'),(path,page.url)
   closed(page);assert page.locator('h1').count()==1;results['links'].append({'width':width,'path':path,'from':'menu'})
  for path in ['/economics','/automation','/catalog','/media','/documents','/about-us','/contacts']:
   page.goto(base+'/');page.locator(f'.site-footer a[href="{root+path}"]').first.click();page.wait_for_url(base+path+'**')
   assert urlparse(page.url).path.rstrip('/')==root+path
   results['links'].append({'width':width,'path':path,'from':'footer'})
  page.goto(base+'/');open_menu(page).locator('.drawer-contact-cta').click()
  page.locator('#project-request').wait_for(state='visible');closed(page)
  assert page.locator('#project-request [name="Имя"]').evaluate('(e)=>document.activeElement===e')
  page.keyboard.press('Escape');assert not page.locator('#project-request').is_visible()
  page.goto(base+'/contacts/');open_menu(page).locator('.drawer-contact-cta').click();closed(page);page.wait_for_timeout(100)
  assert page.locator('#project-form [name="Имя"]').evaluate('(e)=>document.activeElement===e'),'Inline form must retain focus after closing the menu'
  assert page.locator('#project-request').count()==0;results['forms'].append({'width':width,'modal':'OK','inline':'OK'})
  for old,target in [('/about/','/'),('/company-details/','/contacts/'),('/ai/','/automation/')]:
   page.goto(base+old);page.wait_for_url(lambda url:urlparse(url).path.rstrip('/')==(root+target).rstrip('/'))
  page.goto(base+'/does-not-exist');assert page.locator('h1').inner_text()=='404'
  assert page.locator('.site-header [data-current-section=true]').count()==0;context.close()
  print(f'Active routes, menu/footer transitions, forms and redirects: {width} OK',flush=True)
 print('Active states, 36 real transitions, forms and redirects OK',flush=True)
 context=browser.new_context(viewport={'width':1440,'height':620},reduced_motion='reduce');page=context.new_page();page.goto(base+'/')
 menu=open_menu(page);assert menu.locator('.drawer-scroll').evaluate('(e)=>e.scrollHeight>e.clientHeight')
 menu.locator('.drawer-contact-cta').click();assert page.locator('#project-request').is_visible();context.close()
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=context.new_page()
 page.goto(base+'/about/');page.wait_for_url(base+'/');assert page.locator('.site-footer a').count()>=11
 assert page.locator('.primary-nav a').all_text_contents()==labels;context.close();browser.close()
assert not errors,errors
results['short_viewport']='OK';results['no_javascript']='Footer and redirect OK';results['page_errors']=errors
report=Path(os.environ.get('ERA_NAV_REPORT','/tmp/era-navigation-0354/browser/results.json'));report.parent.mkdir(parents=True,exist_ok=True)
report.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print(f'Acceptance passed: {report}',flush=True)
