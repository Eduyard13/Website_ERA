"""Variant A, eight blocks, media intake, relocated economics and historical links."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3028/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-resource-028/browser'));out.mkdir(parents=True,exist_ok=True)
widths=[320,360,390,768,1280,1440,1920]
title='Там, где другие видят отходы, мы видим промышленный ресурс.'
errors=[];failed=[];sent=[];video_requests=[];results=[]
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
   else:assert page.locator(f'img[data-media-slot={item["slot"]}]').get_attribute('src').endswith('/assets/'+item['file'])
  assert '/project-home/hero/feedstock_hero' in page.locator('img[data-media-slot=heroFeedstock]').evaluate('e=>e.currentSrc')
  assert page.locator('img[data-media-slot=pelletProduct]').get_attribute('src').endswith('/presentation/granules.webp')
  assert page.locator('img[data-media-slot=pellets]').get_attribute('src').endswith('/presentation/granules.webp')
  assert page.locator('img[data-media-slot=kairScreen]').get_attribute('src').endswith('/kair/01.webp')
  assert page.locator('.resource-system-visual .resource-photo').get_attribute('data-type')=='photo'
  assert '3D' not in page.locator('.resource-system-visual .resource-photo figcaption').inner_text()
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
 assert plain.evaluate('document.documentElement.scrollWidth<=innerWidth');static.close()
 assert not errors,errors;assert not failed,failed;assert not sent,sent
 (out/'results.json').write_text(json.dumps({'layouts':results,'legacyLinks':True,'realVideoPlayback':True,'staticFallback':True,'zoomReflow':True,'errors':errors,'failedLocalResponses':failed,'submittedRequests':sent},ensure_ascii=False,indent=2))
 browser.close();print('Video controls, historic anchors, reflow and no-JS fallback: OK',flush=True)
