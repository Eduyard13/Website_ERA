"""Variant A, eight blocks, media intake, relocated economics and historical links."""
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
import os,json

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3028/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-resource-028/browser'));out.mkdir(parents=True,exist_ok=True)
widths=[320,360,375,390,768,1024,1280,1440,1920]
title='Там, где другие видят отходы, мы видим промышленный ресурс.'
errors=[];failed=[];sent=[];video_requests=[];results=[];seams=[]
manifest=json.loads(Path('docs/homepage-media-assets-0.31.json').read_text())
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('response',lambda response:failed.append((response.status,response.url)) if response.status>=400 and response.url.startswith(base) else None)
 page.on('request',lambda request:video_requests.append(request.url) if request.url.endswith('.mp4') else None)
 page.route('**/formsubmit.co/**',lambda route:(sent.append(route.request.url),route.abort()))
 for width in widths:
  page.set_viewport_size({'width':width,'height':844 if width<768 else 900 if width==1440 else 1080});page.goto(base+'/')
  page.locator('img[loading=lazy]').evaluate_all('images=>images.forEach(i=>i.loading="eager")')
  page.wait_for_function('[...document.images].filter(i=>i.id!=="viewer-image"&&!i.matches("[data-kair-viewer-image]")).every(i=>i.complete&&i.naturalWidth>0)')
  assert page.locator('h1').count()==1 and page.locator('h1').inner_text()==title
  assert page.locator('[data-home-block]').evaluate_all('es=>es.map(e=>e.dataset.homeBlock)')==['hero','problem','process','products','evidence','business','integration','contact']
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert page.locator('.resource-hero-proof').inner_text().startswith('до 80%')
  assert page.locator('[data-econ-widget]').count()==0
  assert page.locator('.primary-nav a').all_text_contents()==['О проекте','Технология','Система управления','Экономика','Каталог']
  assert page.locator('#site-menu .drawer-groups a[href$="/media"]').count()==1
  assert page.locator('[data-home-block=process] [data-video-slot=promo]').count()==1
  promo=page.locator('[data-video-slot=promo]');assert promo.locator('video').count()==1
  assert 'Видео о технологии ЭРА' in promo.inner_text()
  for item in manifest['inputs']:
   if item['format']=='MP4':assert page.locator(f'[data-video-slot={item["slot"]}] source').first.get_attribute('src').endswith('/assets/'+item['file'])
   else:assert page.locator(f'img[data-media-slot={item["slot"]}]').first.get_attribute('src').endswith('/assets/'+item['file'])
  assert '/project-home/hero/feedstock_hero' in page.locator('img[data-media-slot=heroFeedstock]').evaluate('e=>e.currentSrc')
  assert page.locator('img[data-media-slot=pelletProduct]').first.get_attribute('src').endswith('/presentation/granules.webp')
  assert page.locator('img[data-media-slot=pellets]').get_attribute('src').endswith('/presentation/granules.webp')
  assert page.locator('img[data-media-slot=kairScreen]').get_attribute('src').endswith('/kair/01.webp')
  assert page.locator('.resource-system-visual .resource-photo').get_attribute('data-type')=='photo'
  assert '3D' not in page.locator('.resource-system-visual .resource-photo figcaption').inner_text()
  steps=page.locator('.resource-process-steps>li');assert steps.count()==4
  assert steps.locator('h3').all_text_contents()==['Раскрытие и подготовка','Баллистическое разделение','Роторное распушение','Готовый продукт на выходе']
  assert page.locator('[data-process-step="03"] img').get_attribute('src').endswith('/project-home/process/fluffier.webp')
  assert page.locator('[data-process-step="04"] figure').count()==2 and page.locator('[data-process-step="04"] figcaption').count()==0
  pair=page.locator('[data-process-step="04"] figure').all();assert abs(pair[0].bounding_box()['width']-pair[1].bounding_box()['width'])<1
  heights=page.locator('.resource-step-media').evaluate_all('nodes=>nodes.map(e=>e.getBoundingClientRect().height)');assert max(heights)-min(heights)<1
  boxes=[step.bounding_box() for step in steps.all()]
  if width>=1200:assert max(box['y'] for box in boxes)-min(box['y'] for box in boxes)<1
  elif width>=768:assert abs(boxes[0]['y']-boxes[1]['y'])<1 and boxes[2]['y']>boxes[0]['y']+boxes[0]['height']
  else:assert all(boxes[i+1]['y']>=boxes[i]['y']+boxes[i]['height'] for i in range(3))
  assert page.locator('.resource-business-cards>li').count()==3 and page.locator('.resource-integration-steps>li').count()==5
  assert page.locator('.resource-route-logic,.resource-fallback-link,.resource-business-bridge').count()==0
  assert page.locator('.resource-hero-lead').evaluate('e=>getComputedStyle(e).textAlign')=='justify'
  assert page.locator('h1').evaluate('e=>getComputedStyle(e).textAlign')!='justify'
  assert page.locator('[data-resource-play]').is_visible()
  control=page.locator('[data-resource-play]').bounding_box();frame=promo.bounding_box()
  assert abs(control['x']+control['width']/2-frame['x']-frame['width']/2)<2 and abs(control['y']+control['height']/2-frame['y']-frame['height']/2)<2
  for player in page.locator('.resource-video').all():
   box=player.bounding_box();assert abs(box['width']/box['height']-16/9)<.05,(width,box)
  assert not video_requests,video_requests
  if width<768:
   proof=page.locator('.resource-hero-proof').bounding_box();cta=page.locator('.resource-hero-actions').bounding_box();photo=page.locator('.resource-hero-media').bounding_box()
   assert proof['y']<cta['y']<photo['y']
   assert page.locator('.resource-hero-media>picture>img').evaluate('e=>getComputedStyle(e).objectFit')=='contain'
  page.screenshot(path=str(out/f'first-screen-{width}.png'))
  if width in [390,1440]:
   page.locator('.site-header').evaluate('(h)=>h.style.visibility="hidden"')
   for section in page.locator('[data-home-block]').all():
    section.screenshot(path=str(out/f'{section.get_attribute("data-home-block")}-{width}.png'))
   page.locator('.resource-promo').screenshot(path=str(out/f'promo-{width}.png'))
   page.locator('.site-header').evaluate('(h)=>h.style.visibility=""')
  hero_link=page.locator('.resource-hero').get_by_role('link',name='Оценить моё сырьё',exact=True)
  hero_link.click();assert page.locator('#project-request').is_visible()
  assert page.locator('#project-request [data-request-topic]').input_value()=='Оценить исходное сырьё для проекта ЭРА'
  page.keyboard.press('Escape');assert hero_link.evaluate('e=>e===document.activeElement')
  assert page.get_by_role('link',name='Посмотреть технологию',exact=True).count()==0
  assert page.locator('.resource-contact-actions').get_by_role('link',name='Связаться с нами',exact=True).count()==1
  assert page.locator('.resource-contact-actions a[href^="tel:"],.resource-contact-actions a[href^="mailto:"]').count()==0
  opener=page.locator('.resource-evidence-grid .media-open').first;opener.click();assert page.locator('#media-viewer').is_visible()
  page.keyboard.press('Escape');assert opener.evaluate('e=>e===document.activeElement')
  page.locator('[data-menu-toggle]').click();assert page.locator('#site-menu').is_visible();page.keyboard.press('Escape')
  page.get_by_role('link',name='Изучить экономику проекта',exact=True).click()
  assert page.locator('h1').inner_text()=='Экономическое обоснование'
  assert page.locator('[data-widget-switch]').count()==4
  assert page.locator('[data-econ-widget=monthly] [data-econ-profit]').inner_text().startswith('4,45')
  assert page.locator('.primary-nav [aria-current=page]').inner_text()=='Экономика'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,'economics')
  results.append({'width':width,'eightBlocks':True,'mediaFrames':True,'economicsRoute':True,'overflow':False})
  print('Resource hero, eight blocks, media frames, request form and economics:',width,'OK',flush=True)
 # The central action supports mouse, Enter and Space; playback exposes native controls.
 for key in ['Enter','Space']:
  page.goto(base+'/');play=page.locator('[data-resource-play]');play.focus();page.keyboard.press(key)
  page.wait_for_function('document.querySelector("[data-video-slot=promo] video").currentTime>.15')
  assert not play.is_visible()
  page.locator('[data-video-slot=promo] video').evaluate('e=>e.pause()');assert not play.is_visible()
 page.goto(base+'/');page.locator('[data-resource-play]').click();page.wait_for_function('!document.querySelector("[data-video-slot=promo] video").paused')
 video=page.locator('[data-video-slot=promo] video');video.evaluate('e=>e.currentTime=e.duration-.1');page.wait_for_function('document.querySelector("[data-video-slot=promo] video").ended')
 assert page.locator('[data-resource-play]').is_visible()
 # MFR explains an example range without substituting it for a batch specification.
 page.goto(base+'/');page.locator('.resource-mfr-note summary').click();assert page.locator('.resource-mfr-note').get_attribute('open') is not None
 assert page.locator('.resource-mfr-note>div').evaluate('e=>getComputedStyle(e).position')=='static'
 note=page.locator('.resource-mfr-note').inner_text().replace('\xa0',' ');assert '190 °C' in note and '2,16 кг' in note and 'не гарантией конкретной партии' in note
 # Both complete owner-supplied clips preserve playback, sound, seek and fullscreen.
 for slot,duration,seek in [('promo',296,75),('cleaningDemo',100.08,30)]:
  page.goto(base+'/');video=page.locator(f'[data-video-slot={slot}] video')
  assert video.get_attribute('preload')=='none' and video.get_attribute('autoplay') is None and video.get_attribute('loop') is None
  video.scroll_into_view_if_needed();video.evaluate('e=>e.play()');page.wait_for_function('(slot)=>document.querySelector(`[data-video-slot=${slot}] video`).currentTime>.15',arg=slot)
  assert abs(video.evaluate('e=>e.duration')-duration)<.1 and video.evaluate('e=>e.muted') is False
  video.evaluate('(e,t)=>{e.pause();e.currentTime=t;}',seek);page.wait_for_function('([slot,t])=>Math.abs(document.querySelector(`[data-video-slot=${slot}] video`).currentTime-t)<.5',arg=[slot,seek])
  video.evaluate('(e,t)=>e.currentTime=t',duration-2);page.wait_for_function('([slot,t])=>Math.abs(document.querySelector(`[data-video-slot=${slot}] video`).currentTime-t)<.5',arg=[slot,duration-2])
  if video.evaluate('e=>!!e.requestFullscreen'):
   video.evaluate('e=>e.requestFullscreen()');assert page.evaluate('!!document.fullscreenElement');page.evaluate('document.exitFullscreen()')
 # Starting the second player pauses the first; both remain independently usable.
 page.goto(base+'/');page.locator('[data-video-slot=promo] video').evaluate('e=>e.play()')
 page.locator('[data-video-slot=cleaningDemo] video').evaluate('e=>e.play()')
 assert page.locator('[data-video-slot=promo] video').evaluate('e=>e.paused')
 # The final panel and footer meet at the same colour on desktop and mobile.
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':900 if width==1440 else 844});page.goto(base+'/')
  page.locator('img[loading=lazy]').evaluate_all('images=>images.forEach(i=>i.loading="eager")')
  page.wait_for_function('[...document.images].filter(i=>i.id!=="viewer-image").every(i=>i.complete&&i.naturalWidth>0)')
  page.evaluate('window.scrollTo({top:document.querySelector("footer").getBoundingClientRect().top+scrollY-innerHeight/2,behavior:"instant"})');page.wait_for_timeout(60)
  boundary=round(page.locator('footer').bounding_box()['y']);target=out/f'seam-{width}.png';page.screenshot(path=str(target))
  with Image.open(target) as raw:
   image=raw.convert('RGB');differences=[]
   for x in [int(width*.2),int(width*.5),int(width*.8)]:
    above,below=image.getpixel((x,boundary-1)),image.getpixel((x,boundary+1));differences.append(max(abs(a-b) for a,b in zip(above,below)))
   assert max(differences)<9,(width,differences)
   seams.append({'width':width,'maxRGBDifferenceAcrossSeam':max(differences)})
 for anchor in ['market','economics','econ-curve-title','econ-monthly-price','market-tab-film']:
  page.goto(base+'/#'+anchor);page.wait_for_url(lambda url:'/economics' in str(url) and str(url).endswith('#'+anchor))
 for anchor in ['control-title','material-balance']:
  page.goto(base+'/#'+anchor);page.wait_for_url(lambda url:'/technology' in str(url) and str(url).endswith('#'+anchor))
 # Reflow at the CSS viewport equivalent of 320% zoom on a 1440px screen.
 zoom=browser.new_context(viewport={'width':450,'height':900},device_scale_factor=3.2);zp=zoom.new_page();zp.goto(base+'/')
 assert zp.evaluate('document.documentElement.scrollWidth<=innerWidth');assert zp.locator('h1').inner_text()==title;zoom.close()
 static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});plain=static.new_page();plain.goto(base+'/#economics')
 assert plain.locator('[data-home-block]').count()==8
 assert plain.get_by_role('link',name='Изучить экономику проекта',exact=True).get_attribute('href').endswith('/economics')
 assert plain.locator('[data-video-slot=promo] video').count()==1
 assert not plain.locator('[data-resource-play]').is_visible()
 assert plain.evaluate('document.documentElement.scrollWidth<=innerWidth');static.close()
 assert not errors,errors;assert not failed,failed;assert not sent,sent
 (out/'results.json').write_text(json.dumps({'layouts':results,'footerSeams':seams,'legacyLinks':True,'realVideoPlayback':True,'staticFallback':True,'zoomReflow':True,'errors':errors,'failedLocalResponses':failed,'submittedRequests':sent},ensure_ascii=False,indent=2))
 browser.close();print('Video controls, historic anchors, reflow and no-JS fallback: OK',flush=True)
