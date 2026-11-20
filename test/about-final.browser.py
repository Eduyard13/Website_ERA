"""Approved About layout and original media checks; no form submissions."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import os
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3131').rstrip('/')
prefix=urlparse(base).path
labels=['Инженерно-технологическое направление','Коммерческое развитие и партнерство','Производственная интеграция']
ids=['about-us-intro','experience','production-base','projects','engineering','team','working-together','about-us-contact']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('ERA_CHROME_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
 context=browser.new_context(reduced_motion='reduce');context.route('**/api/request.php',lambda route:route.abort())
 page=context.new_page();errors=[];failures=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 for width in [320,360,390,600,768,1024,1200,1280,1440,1920]:
  page.set_viewport_size({'width':width,'height':1000});page.goto(base+'/about-us/');page.wait_for_selector('.page-progress-rail a')
  page.locator('main img').evaluate_all("items=>Promise.all(items.map(i=>{i.loading='eager';return i.decode().catch(()=>{});} ))")
  assert page.locator('main h1').count()==1 and page.locator('.page-progress-rail a').count()==8
  assert page.locator('.about-us-page section').evaluate_all('s=>s.map(i=>i.id)')==ids
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert page.locator('main img').evaluate_all('items=>items.every(i=>i.complete&&i.naturalWidth>0&&i.alt.length>0)')
  team=page.locator('#team');assert team.locator('h2').inner_text()=='Ключевые специалисты проекта'
  assert team.locator('.au-team-card h3').all_text_contents()==labels
  assert team.locator('[data-profile-state=ready]').count()==3 and team.locator('.is-placeholder').count()==0
  assert team.locator('img').evaluate_all('items=>items.map(i=>i.getAttribute("src").split("/").pop())')==['01-engineering.webp','02-commercial.webp','03-integration.webp']
  assert team.locator('.au-team-role').count()==0 and team.locator('.au-team-location').all_text_contents()==['Производственная площадка · Китай','Внедрение проектов · Россия']
  assert team.locator('.au-portrait').evaluate_all('items=>items.every(i=>Math.abs(i.getBoundingClientRect().width/i.getBoundingClientRect().height-.8)<.005)')
  assert team.locator('.au-portrait img').evaluate_all('items=>items.every(i=>getComputedStyle(i).objectFit==="cover")')
  profiles=team.locator('.au-team-card').evaluate_all('items=>items.map(c=>{const b=c.getBoundingClientRect(),p=c.querySelector(".au-portrait").getBoundingClientRect(),t=c.querySelector(".au-team-copy").getBoundingClientRect(),s=getComputedStyle(c);return {x:b.x,y:b.y,w:b.width,h:b.height,photo:{x:p.x,y:p.y,w:p.width,h:p.height},text:{x:t.x,y:t.y,w:t.width,h:t.height},inside:c.scrollWidth<=c.clientWidth&&c.scrollHeight<=c.clientHeight+1,children:[...c.querySelectorAll("h3,p")].every(e=>e.scrollWidth<=e.clientWidth+1),columns:s.gridTemplateColumns.split(" ").length};})')
  for profile in profiles:
   photo,text=profile['photo'],profile['text']
   assert profile['inside'] and profile['children'] and profile['columns']==2,(width,profile)
   assert photo['x']+photo['w']<text['x'] and abs(photo['y']-text['y'])<1
   assert photo['w']<=150 and photo['w']<profile['w']/2
   assert abs(photo['h']/photo['w']-1.25)<.01
   if width>=1200:assert text['w']>=205
  if width>=1200:
   assert max(p['y'] for p in profiles)-min(p['y'] for p in profiles)<1
   assert max(p['w'] for p in profiles)-min(p['w'] for p in profiles)<1
   assert max(p['h'] for p in profiles)-min(p['h'] for p in profiles)<1
  else:
   for first,second in zip(profiles,profiles[1:]):assert second['y']>=first['y']+first['h'] and abs(first['x']-second['x'])<1
  assert team.locator('.au-team-card a,.au-team-card button').count()==0
  assert team.locator('.au-team-copy p').evaluate_all('items=>items.every(e=>parseFloat(getComputedStyle(e).fontSize)>=11&&getComputedStyle(e).webkitLineClamp==="none")')
  production=page.locator('#production-base');assert production.locator('a[href^="https:"]').count()==1
  tour=production.locator('a[href^="https:"]');assert tour.get_attribute('href')=='https://en.beierpm.com/vr/' and tour.get_attribute('target')=='_blank'
  assert 'noopener' in tour.get_attribute('rel') and 'noreferrer' in tour.get_attribute('rel')
  assert production.locator('iframe').count()==0 and production.locator('.au-source a').count()==0
  collage=production.locator('.au-production-gallery');visit=production.locator('.au-factory-visit')
  assert 15<=visit.bounding_box()['y']-(collage.bounding_box()['y']+collage.bounding_box()['height'])<=25
  assert collage.locator('img').evaluate_all('items=>items.every(i=>getComputedStyle(i).objectFit==="cover"&&Math.abs(i.getBoundingClientRect().height-i.closest(".media-open").getBoundingClientRect().height)<1)')
  boxes=collage.locator('.au-gallery-item').evaluate_all('items=>items.map(i=>{const r=i.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})')
  a,b,c=boxes
  if width>=768:
   assert 300<=collage.bounding_box()['height']<=460
   assert abs(a['y']-b['y'])<1 and abs(b['x']-c['x'])<1 and c['y']>=b['y']+b['h'] and abs(a['y']+a['h']-(c['y']+c['h']))<1
  elif width>=480:assert abs(b['y']-c['y'])<1 and b['y']>=a['y']+a['h']
  else:assert b['y']>=a['y']+a['h'] and c['y']>=b['y']+b['h']
  cards=page.locator('.au-projects-grid>.au-project');assert cards.count()==2
  first,second=cards.all();assert first.locator('[data-media-group=venray]').count()==3 and second.locator('[data-media-group=chelyabinsk]').count()==1
  assert page.locator('.au-project-thumbnails').count()==0
  for card in [first,second]:assert card.evaluate('c=>!!(c.querySelector(".au-project-gallery").compareDocumentPosition(c.querySelector(".au-project-copy"))&Node.DOCUMENT_POSITION_FOLLOWING)')
  small=first.locator('.au-gallery-item:not(:first-child)').all();x,y=[i.bounding_box() for i in small]
  assert abs(x['width']-y['width'])<1 and abs(x['y']-y['y'])<1
  if width>=768:assert x['width']>=190
  if width>=1024:assert abs(first.bounding_box()['y']-second.bounding_box()['y'])<1
  else:assert second.bounding_box()['y']>=first.bounding_box()['y']+first.bounding_box()['height']
  if os.environ.get('ERA_CAPTURE_INTERNAL')=='1' and width in [320,390,600,768,1024,1200,1280,1440,1920]:
   out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-about-team-review'));out.mkdir(parents=True,exist_ok=True)
   for selector,name in [('.au-production-gallery','production'),('.au-projects-grid','projects'),('.au-team-grid','team')]:page.locator(selector).screenshot(path=str(out/f'{name}-{width}.png'))
  print('About: approved portraits, one tour, full collage, 3/1 project views, layout and outline:',width,'OK',flush=True)
 for group,count,part in [('production',3,'china-'),('venray',3,'netherlands-'),('chelyabinsk',1,'chelyabinsk-2021')]:
  opener=page.locator('[data-media-group="'+group+'"] .media-open').first;opener.click();viewer=page.locator('#media-viewer');assert viewer.is_visible()
  assert part in page.locator('#viewer-image').get_attribute('src')
  if count==1:assert viewer.locator('[data-next]').is_hidden() and viewer.locator('[data-prev]').is_hidden()
  else:
   for _ in range(count):page.keyboard.press('ArrowRight');assert part in page.locator('#viewer-image').get_attribute('src')
  page.keyboard.press('Escape');page.wait_for_function('!document.body.classList.contains("viewer-open")');assert opener.evaluate('e=>document.activeElement===e')
 page.locator('.au-tour-link').focus();assert page.locator('.au-tour-link').evaluate('e=>document.activeElement===e')
 page.locator('.au-final-actions .button').click();assert page.locator('#project-request').is_visible();page.keyboard.press('Escape')
 nojs=browser.new_context(java_script_enabled=False);p2=nojs.new_page();p2.goto(base+'/about-us/')
 assert p2.locator('#team img').count()==3 and p2.locator('[data-media-group=venray]').count()==3
 assert p2.locator('main h1').count()==1 and p2.locator('.au-tour-link').is_visible();nojs.close()
 assert not errors,errors;assert not failures,failures;browser.close();print('About: isolated originals, Escape/focus, CTA, no-JS and no local HTTP failures passed; no forms submitted.',flush=True)
