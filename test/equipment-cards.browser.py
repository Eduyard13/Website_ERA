"""Owner-provided equipment art, stone cards, verified metrics and native links."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3012/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/equipment-cards-review'));out.mkdir(parents=True,exist_ok=True)
results=[];errors=[];failed=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) else None)
 for width in [320,390,768,1024,1200,1440,1920]:
  page.set_viewport_size({'width':width,'height':1000});assert page.goto(base+'/catalog/equipment').status==200
  page.locator('[data-node] img').evaluate_all("items=>items.forEach(i=>i.loading='eager')")
  page.evaluate('async()=>await Promise.all([...document.querySelectorAll("[data-node] img")].map(i=>i.decode()))')
  assert page.locator('[data-node]:visible').count()==12
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  for i in range(12):
   card=page.locator('[data-node]').nth(i)
   assert card.evaluate('(e)=>e.tagName')=='A'
   assert card.locator('a,button,input').count()==0
   assert card.locator('.node-card-specs>div').count()==4
   assert card.locator('.node-card-features li').count()==2
   assert card.locator('.node-card-materials dd').inner_text()
   assert card.evaluate('(e)=>e.scrollHeight<=e.clientHeight+1')
   assert card.locator('.node-card-specs>div').evaluate_all('items=>items.every(e=>e.scrollWidth<=e.clientWidth)'),(width,i)
   info=card.locator('img').evaluate('(i)=>{const r=i.getBoundingClientRect(),f=i.parentElement.getBoundingClientRect(),s=getComputedStyle(i);return {image:[r.width,r.height],frame:[f.width,f.height],natural:[i.naturalWidth,i.naturalHeight],fit:s.objectFit,padding:s.padding,blend:s.mixBlendMode,transform:s.transform,file:i.getAttribute("src")}}')
   assert info['fit']=='contain' and info['padding']=='0px' and info['blend']=='normal' and info['transform']=='none'
   assert abs(info['image'][0]-info['frame'][0])<1 and abs(info['image'][1]-info['frame'][1])<1
   assert abs(info['frame'][0]/info['frame'][1]-4/3)<.005
   # Responsive-image density correction rounds naturalWidth/naturalHeight.
   assert abs(info['natural'][0]/info['natural'][1]-4/3)<.01,info
   slug=card.get_attribute('href').split('/')[-1];assert info['file'].endswith('/'+slug+'.webp')
  if width in [390,1440]:
   page.locator('.site-header').evaluate('(e)=>e.style.visibility="hidden"')
   page.locator('[data-node]').first.screenshot(path=str(out/f'final-shredder-{width}.png'))
   page.locator('[data-node]').nth(2).screenshot(path=str(out/f'final-ballistic-{width}.png'))
   page.screenshot(path=str(out/f'final-catalogue-{width}.png'),full_page=True)
  results.append({'width':width,'cards':12,'fullImage':True,'overflow':False})
  print('All 12 images, full podiums, four metrics, materials, native links and no overflow:',width,'OK',flush=True)
 page.set_viewport_size({'width':1440,'height':1000})
 # Each model opens its own existing page.
 for i in range(12):
  page.goto(base+'/catalog/equipment');card=page.locator('[data-node]').nth(i);href=card.get_attribute('href')
  card.locator('h3').click();assert page.url.endswith(href)
  assert page.locator('h1').count()==1
  assert page.locator('link[href*="node-cards.css"]').count()==0
 # The image, numbers and blank padding are also within the same link.
 for target in ['.card-visual','.node-card-specs','.node-card-features','.card-action']:
  page.goto(base+'/catalog/equipment');page.locator('[data-node]').first.locator(target).click(position={'x':10,'y':10})
  assert page.url.endswith('/catalog/equipment/predvaritelnyy-izmelchitel')
 page.goto(base+'/catalog/equipment');page.get_by_role('searchbox').fill('флотатор')
 assert page.locator('[data-node]:visible').count()==1;page.locator('[data-node]:visible').click()
 assert page.url.endswith('/plenochnyy-flotator');page.go_back();assert page.locator('[data-node]:visible').count()==1
 page.get_by_role('button',name='Сбросить',exact=True).click();page.wait_for_function('document.querySelectorAll("[data-node]:not([hidden])").length===12')
 page.locator('[name=category]').select_option('Обезвоживание');assert page.locator('[data-node]:visible').count()==3
 page.get_by_role('button',name='Сбросить',exact=True).click();page.wait_for_function('document.querySelectorAll("[data-node]:not([hidden])").length===12')
 page.locator('[name=material]').select_option('Рабочая моющая жидкость');assert page.locator('[data-node]:visible').count()==1
 assert 'Комплекс очистки стоков' in page.locator('[data-node]:visible').inner_text()
 page.goto(base+'/catalog/equipment');page.emulate_media(reduced_motion='no-preference')
 for i in [0,2,3,10,11]:
  card=page.locator('[data-node]').nth(i);before=card.bounding_box();card.hover();page.wait_for_timeout(360)
  assert card.evaluate('(e)=>getComputedStyle(e,"::after").opacity')=='1'
  assert card.evaluate('(e)=>getComputedStyle(e,"::after").borderTopColor')=='rgb(198, 164, 59)'
  assert card.bounding_box()['width']==before['width'] and card.bounding_box()['height']==before['height']
  assert card.locator('img').evaluate('(i)=>getComputedStyle(i).transform')=='none'
 page.mouse.move(0,0);card=page.locator('[data-node]').first;href=card.get_attribute('href');card.focus();assert card.evaluate('(e)=>e.matches(":focus-visible")')
 page.keyboard.press('Enter');page.wait_for_url('**'+href)
 assert not errors,errors;assert not failed,failed
 (out/'results.json').write_text(json.dumps({'responsive':results,'destinations':12,'filtersAndBack':'OK','goldAndKeyboard':'OK','jsErrors':errors,'localHttpFailures':failed},ensure_ascii=False,indent=2)+'\n')
 print('All destinations, whole-card clicks, filter restoration, materials, gold focus and keyboard: OK',flush=True)
 browser.close()
