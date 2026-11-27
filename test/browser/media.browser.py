"""Editorial showroom, shared media identities, mixed albums and the isolated viewer."""
from pathlib import Path
from urllib.parse import parse_qs, urlparse, urlencode
from playwright.sync_api import sync_playwright
import os,json,subprocess

repo=Path(__file__).resolve().parents[2]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3034/Website_ERA').rstrip('/')
prefix=urlparse(base).path
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-gallery-034/browser'));out.mkdir(parents=True,exist_ok=True)
widths=[int(v) for v in os.environ.get('ERA_TEST_WIDTHS','320,390,768,1024,1280,1440,1920').split(',')]
data=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {buildGalleryData} from './scripts/render/pages/gallery-data.mjs';console.log(JSON.stringify(buildGalleryData()))"],cwd=repo,text=True))
byid={m['id']:m for m in data['items']};albums={a['id']:a for a in data['albums']}
errors=[];failures=[];video_requests=[];expected_failures=set();results=[];screens=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:video_requests.append(r.url) if '.mp4' in r.url else None)
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 and r.url.startswith(base) and urlparse(r.url).path not in expected_failures else None)
 def load(query=''):
  assert page.goto(base+'/media/'+query).status==200
  page.wait_for_selector('[data-gallery-ready=true]')
 def overflow():assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),page.evaluate('({w:innerWidth,s:document.documentElement.scrollWidth})')
 def open_album(slug):
  page.locator(f'[data-gallery-album-card="{slug}"] .gs-album-open').click();page.locator('#gallery-viewer').wait_for(state='visible')
 def current_id():return parse_qs(urlparse(page.url).query).get('item',[''])[0]
 def check_dialog():
  box=page.locator('#gallery-viewer').bounding_box();viewport=page.viewport_size
  assert box['x']>=-1 and box['x']+box['width']<=viewport['width']+1,box
  assert box['y']>=-1 and box['y']+box['height']<=viewport['height']+1,box
  assert page.locator('#gallery-viewer').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
  assert page.locator('[data-gallery-filmstrip] button').count()<=15
  assert page.locator('[data-gallery-filmstrip] [aria-current=true]').count()==1
 def close():
  page.locator('[data-gallery-close]').click();page.locator('#gallery-viewer').wait_for(state='hidden')
 def archive_type(value):page.locator(f'[data-gallery-type="{value}"]').click()
 for width in widths:
  page.set_viewport_size({'width':width,'height':1000 if width>=768 else 844});video_requests.clear();load();overflow()
  assert page.locator('h1').count()==1 and 'Инженерия' in page.locator('h1').inner_text()
  assert page.locator('[data-gallery-editorial]:visible').count()==6
  assert page.locator('.gs-featured-albums [data-gallery-album-card]').count()==4
  assert page.locator('[data-gallery-album-card]').count()==14
  assert page.locator('[data-gallery-video-card]').count()==4
  assert page.locator('#media-viewer').count()==0
  assert not video_requests,'Videos must not download on page load'
  assert page.locator('.page-progress-rail a').count()==8
  if width in [390,1440]:
   page.locator('[data-gallery-editorial] img:visible').evaluate_all('es=>es.forEach(e=>e.loading="eager")')
   page.wait_for_function('Array.from(document.querySelectorAll("[data-gallery-editorial] img")).filter(e=>e.getClientRects().length).every(e=>e.complete&&e.naturalWidth>0)')
   for section in ['intro','raw','nodes','lines','work','products','videos']:
    file=f'gallery-{section}-{width}.png';page.locator('#gallery-'+section).screenshot(path=str(out/file),style='.site-header,.page-progress-rail{visibility:hidden!important}');screens.append(file)
  opener=page.locator('[data-gallery-album-card=predvaritelnyy-izmelchitel] .gs-album-open');opener.click()
  assert page.locator('[data-gallery-viewer-format]').input_value()=='all'
  assert page.locator('[data-gallery-viewer-counter]').inner_text().endswith('/ '+str(len(albums['predvaritelnyy-izmelchitel']['ids'])))
  assert page.locator('[data-gallery-viewer-image]').evaluate('e=>getComputedStyle(e).objectFit')=='contain';check_dialog()
  assert page.locator('[data-gallery-viewer-product]').get_attribute('href')==prefix+'/catalog/equipment/predvaritelnyy-izmelchitel'
  if width in [390,1440]:
   page.locator('[data-gallery-filmstrip] img').evaluate_all('es=>es.forEach(e=>e.loading="eager")')
   page.wait_for_function('Array.from(document.querySelectorAll("[data-gallery-filmstrip] img")).every(e=>e.complete&&e.naturalWidth>0)')
   file=f'viewer-photo-{width}.png';page.screenshot(path=str(out/file));screens.append(file)
  page.locator('[data-gallery-next]').click()
  assert current_id()=='predvaritelnyy-izmelchitel-film'
  assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused&&v.currentTime===0&&v.controls&&v.playsInline&&!v.muted')
  page.locator('[data-gallery-next]').click()
  assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused&&!v.hasAttribute("src")')
  assert page.locator('[data-gallery-viewer-image]').is_visible()
  page.locator('[data-gallery-viewer-format]').select_option('photo')
  assert byid[current_id()]['kind']=='photo'
  page.locator('[data-gallery-viewer-collection]').select_option('raw')
  assert all(m['kind']=='photo' for m in data['items'] if 'raw' in m['collections'])
  assert byid[current_id()]['kind']=='photo';check_dialog()
  page.locator('[data-gallery-viewer-collection]').select_option('nodes');page.locator('[data-gallery-viewer-album]').select_option('ballisticheskiy-separator');page.locator('[data-gallery-viewer-format]').select_option('all')
  page.locator('[data-gallery-next]').click();assert current_id()=='ballisticheskiy-separator-film'
  page.keyboard.press('Escape');page.locator('#gallery-viewer').wait_for(state='hidden')
  assert opener.evaluate('e=>e===document.activeElement')
  page.locator('[data-gallery-mode-button=all]').click();page.locator('#gallery-results').wait_for(state='visible')
  assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==24
  page.locator('[data-gallery-load-more]').click();assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==48
  paged_opener=page.locator('[data-gallery-archive-grid] [data-gallery-open]').last;paged_opener.click();close()
  assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==48
  assert paged_opener.evaluate('e=>e===document.activeElement')
  product=prefix+'/catalog/equipment/vintovoy-press';page.locator('#media-filters [name=product]').select_option(product);archive_type('photo')
  assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==6
  assert parse_qs(urlparse(page.url).query)['product']==[product]
  page.reload();page.wait_for_selector('[data-gallery-ready=true]');assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==6
  archive_type('video');assert page.locator('#media-empty').is_visible()
  archive_type('all');assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==8
  page.locator('[data-gallery-archive-grid] [data-gallery-open]').first.click();assert page.locator('[data-gallery-viewer-counter]').inner_text().endswith('/ 8')
  page.locator('[data-gallery-viewer-collection]').select_option('nodes');page.locator('[data-gallery-viewer-album]').select_option('ballisticheskiy-separator')
  assert page.locator('[data-gallery-viewer-counter]').inner_text().endswith('/ '+str(len(albums['ballisticheskiy-separator']['ids'])))
  close();assert page.locator('[data-gallery-archive-grid] .gs-archive-card').count()==8
  page.locator('#media-filters [name=q]').fill('<img src=x onerror=alert(1)>');assert page.locator('#media-empty').is_visible()
  page.locator('#media-filters button[type=reset]').click();page.wait_for_function('document.querySelectorAll(".gs-archive-card").length===24');overflow()
  results.append({'width':width,'collections':True,'mixedAlbums':True,'paginationAndLegacyFilters':True,'viewerBounds':True,'overflow':False})
  print('Collections, mixed albums, format/category/equipment changes, archive, empty filter and layout:',width,'OK',flush=True)
 # Browser Back and Forward restore the viewer rather than losing the gallery.
 page.set_viewport_size({'width':1440,'height':1000});load();open_album('predvaritelnyy-izmelchitel');page.locator('[data-gallery-next]').click();item=current_id()
 page.go_back();page.locator('#gallery-viewer').wait_for(state='hidden');page.go_forward();page.locator('#gallery-viewer').wait_for(state='visible');assert current_id()==item
 assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused&&v.currentTime===0')
 page.mouse.click(2,2);page.locator('#gallery-viewer').wait_for(state='hidden')
 # Direct links use the same stable IDs; an old unprefixed product link still filters.
 load('?product=/catalog/equipment/predvaritelnyy-izmelchitel');assert page.locator('[data-gallery-showroom]').get_attribute('data-gallery-mode')=='all'
 assert 'Видео: 1' in page.locator('#media-result').inner_text()
 load('?'+urlencode({'collection':'nodes','album':'predvaritelnyy-izmelchitel','item':'predvaritelnyy-izmelchitel-film'}));assert current_id()=='predvaritelnyy-izmelchitel-film';assert page.locator('#gallery-viewer').is_visible();close()
 # Only an explicit request starts the photo slideshow; navigation/details/reduced motion stop it.
 page.emulate_media(reduced_motion='no-preference');load();page.locator('#gallery-raw .gs-collection-link').click();before=current_id();page.locator('[data-gallery-slideshow]').click()
 assert page.locator('[data-gallery-slideshow]').get_attribute('aria-pressed')=='true'
 page.wait_for_timeout(5300);assert current_id()!=before
 page.keyboard.press('ArrowRight');assert page.locator('[data-gallery-slideshow]').get_attribute('aria-pressed')=='false'
 page.locator('[data-gallery-slideshow]').click();page.locator('[data-gallery-viewer-details] summary').click();assert page.locator('[data-gallery-slideshow]').get_attribute('aria-pressed')=='false'
 page.locator('[data-gallery-viewer-details] summary').click();page.locator('[data-gallery-slideshow]').click();page.emulate_media(reduced_motion='reduce');page.wait_for_function('document.querySelector("[data-gallery-slideshow]").getAttribute("aria-pressed")==="false"');close()
 page.emulate_media(reduced_motion='no-preference');load();open_album('predvaritelnyy-izmelchitel');page.locator('[data-gallery-slideshow]').click();page.wait_for_timeout(5300)
 assert current_id()=='predvaritelnyy-izmelchitel-film';assert page.locator('[data-gallery-slideshow]').get_attribute('aria-pressed')=='false';assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused');close();page.emulate_media(reduced_motion='reduce')
 # Decode all four original videos, seek, preserve sound controls and unload on switch/close.
 for movie in [m for m in data['items'] if m['kind']=='video']:
  video_requests.clear();load('?'+urlencode({'collection':'videos','item':movie['id']}))
  assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused&&v.currentTime===0')
  page.locator('[data-gallery-play]').click();page.wait_for_function('document.querySelector("[data-gallery-viewer-video]").currentTime>.2')
  actual=page.locator('[data-gallery-viewer-video]').evaluate('v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,frames:v.getVideoPlaybackQuality().totalVideoFrames,controls:v.controls,muted:v.muted,paused:v.paused})')
  assert abs(actual['duration']-movie['durationSeconds'])<.3,actual
  assert (actual['width'],actual['height'])==(1920,1080) and actual['frames']>0 and actual['controls'] and not actual['muted'],actual
  seek=movie['durationSeconds']*.72;page.locator('[data-gallery-viewer-video]').evaluate('(v,t)=>{v.pause();v.currentTime=t;v.play()}',seek)
  page.wait_for_function('(t)=>document.querySelector("[data-gallery-viewer-video]").currentTime>t+.1',arg=seek)
  page.locator('[data-gallery-viewer-video]').evaluate('v=>{v.pause();v.focus()}');same=current_id();page.keyboard.press('ArrowRight');assert current_id()==same
  if movie['id']=='predvaritelnyy-izmelchitel-film':
   page.screenshot(path=str(out/'shredder-active-video-desktop.png'));screens.append('shredder-active-video-desktop.png')
   page.locator('[data-gallery-fullscreen]').click();page.wait_for_function('document.fullscreenElement?.matches("[data-gallery-viewer-video]")');page.evaluate('document.exitFullscreen()');page.wait_for_function('!document.fullscreenElement')
  page.locator('[data-gallery-next]').click();assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused&&v.currentTime===0')
  close();assert page.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused&&!v.hasAttribute("src")')
  print('Original video, manual play, decoded frames, duration, sound, seek and cleanup:',movie['id'],'OK',flush=True)
 # Recover from an empty linked set and from source failures without crashing.
 load('?'+urlencode({'view':'all','type':'video','product':'/catalog/equipment/vintovoy-press','scope':'archive','collection':'nodes','item':'removed-material'}))
 assert page.locator('[data-gallery-viewer-counter]').inner_text()=='0 / 0'
 page.locator('[data-gallery-viewer-album]').select_option('ballisticheskiy-separator');assert page.locator('[data-gallery-viewer-counter]').inner_text()!='0 / 0';close()
 image=byid['predvaritelnyy-izmelchitel-photo-02'];expected_failures.add(prefix+'/assets/'+image['file']);page.route('**/assets/'+image['file'],lambda route:route.fulfill(status=404,body='Not found'))
 load('?'+urlencode({'collection':'nodes','album':'predvaritelnyy-izmelchitel','item':image['id']}));page.locator('[data-gallery-viewer-error]').wait_for(state='visible');page.locator('[data-gallery-next]').click();close();page.unroute('**/assets/'+image['file'])
 movie=byid['predvaritelnyy-izmelchitel-film'];expected_failures.add(prefix+'/assets/'+movie['file']);page.route('**/assets/'+movie['file'],lambda route:route.fulfill(status=404,body='Not found'))
 load('?'+urlencode({'collection':'videos','item':movie['id']}));page.locator('[data-gallery-play]').click();page.locator('[data-gallery-viewer-error]').wait_for(state='visible');assert page.locator('[data-gallery-video-file]').get_attribute('href').endswith(movie['file']);close();page.unroute('**/assets/'+movie['file'])
 # Existing lightboxes on the homepage, technology and node pages retain their old API.
 for route in ['/','/catalog/equipment/predvaritelnyy-izmelchitel/','/catalog/equipment/ballisticheskiy-separator/']:
  page.goto(base+route);opener=page.locator('[data-media]:not([data-type=video]) .media-open').first;opener.click();assert page.locator('#media-viewer').is_visible();assert page.locator('#gallery-viewer').count()==0
  page.keyboard.press('Escape');assert not page.locator('#media-viewer').is_visible();assert opener.evaluate('e=>e===document.activeElement')
 page.goto(base+'/technology/');kair_opener=page.locator('[data-kair-inspect]');kair_opener.click();assert page.locator('[data-kair-viewer]').is_visible();page.locator('[data-kair-close]').click();page.locator('[data-kair-viewer]').wait_for(state='hidden');assert kair_opener.evaluate('e=>e===document.activeElement')
 # Touch swiping is limited to the photo; video controls are independent.
 touch=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mobile=touch.new_page();mobile.on('pageerror',lambda e:errors.append(str(e)));mobile.goto(base+'/media/');mobile.wait_for_selector('[data-gallery-ready=true]');mobile.locator('[data-gallery-album-card=predvaritelnyy-izmelchitel] .gs-album-open').tap()
 mobile.wait_for_function('document.querySelector("[data-gallery-viewer-image]").complete&&document.querySelector("[data-gallery-viewer-image]").naturalWidth>0')
 imagebox=mobile.locator('[data-gallery-viewer-image]').bounding_box();session=touch.new_cdp_session(mobile);x=imagebox['x']+imagebox['width']*.7;y=imagebox['y']+imagebox['height']*.5
 session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 for step in range(1,6):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-step*23,'y':y}]})
 session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});mobile.wait_for_function('new URLSearchParams(location.search).get("item")=="predvaritelnyy-izmelchitel-film"');assert parse_qs(urlparse(mobile.url).query)['item']==['predvaritelnyy-izmelchitel-film']
 assert mobile.locator('[data-gallery-viewer-video]').evaluate('v=>v.paused');mobile.locator('[data-gallery-prev]').tap();mobile.wait_for_function('new URLSearchParams(location.search).get("item")==="predvaritelnyy-izmelchitel-photo-02"')
 mobile.locator('[data-gallery-next]').tap();mobile.wait_for_function('new URLSearchParams(location.search).get("item")==="predvaritelnyy-izmelchitel-film"');mobile.locator('[data-gallery-prev]').tap();mobile.wait_for_function('new URLSearchParams(location.search).get("item")==="predvaritelnyy-izmelchitel-photo-02"')
 mobile.locator('[data-gallery-filmstrip] img').evaluate_all('es=>es.forEach(e=>e.loading="eager")');mobile.wait_for_timeout(300);mobile.screenshot(path=str(out/'viewer-mobile.png'));screens.append('viewer-mobile.png')
 mobile.locator('[data-gallery-close]').tap();assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth');touch.close()
 assert not errors,errors;assert not failures,failures
 (out/'results.json').write_text(json.dumps({'responsive':results,'counts':data['counts'],'albums':len(data['albums']),'screenshots':screens,'fourOriginalVideos':'OK','manualSlideshow':'OK','historyAndDeepLinks':'OK','emptyAndFailedSources':'OK','legacyLightboxes':'OK','touch':'OK','errors':errors,'failures':failures},ensure_ascii=False,indent=2)+'\n')
 print('History, slideshow, formats, four videos, failure recovery, legacy lightboxes and touch: OK',flush=True)
 browser.close()
