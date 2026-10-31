"""Check player mechanics with a generated clip, independently of customer media."""
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from playwright.sync_api import sync_playwright
import os
import subprocess

repo=Path(__file__).resolve().parents[1]
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-video-screenshots'));out.mkdir(parents=True,exist_ok=True)
with TemporaryDirectory(prefix='era-player-test-') as temp:
 root=Path(temp);clip=root/'test-clip.mp4'
 subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','testsrc2=size=640x360:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','8','-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','32','-c:a','aac','-b:a','64k','-movflags','+faststart',str(clip)],check=True)
 server=subprocess.Popen(['node','test/video-fixture.mjs',str(root/'site'),str(clip)],cwd=repo,env={**os.environ,'BASE_PATH':'/Website_ERA'},stdout=subprocess.PIPE,text=True)
 try:
  for line in server.stdout:
   if line.startswith('FIXTURE:'):
    base=line.strip().removeprefix('FIXTURE:');break
  else:raise RuntimeError('Fixture server failed to start')
  video_url=base+'/assets/videos/__player-test.mp4'
  payload=clip.read_bytes();size=len(payload)
  for header,start,end in [('bytes=0-127',0,127),('bytes=1000-1999',1000,1999),('bytes=-64',size-64,size-1),('bytes=1000-',1000,size-1)]:
   with urlopen(Request(video_url,headers={'Range':header})) as response:
    assert response.status==206 and response.headers['Content-Type']=='video/mp4'
    assert response.headers['Content-Range']==f'bytes {start}-{end}/{size}'
    assert response.read()==payload[start:end+1]
  with urlopen(Request(video_url,method='HEAD')) as response:
   assert response.status==200 and int(response.headers['Content-Length'])==size and response.read()==b''
  try:urlopen(Request(video_url,headers={'Range':f'bytes={size}-'}))
  except HTTPError as error:assert error.code==416 and error.headers['Content-Range']==f'bytes */{size}'
  else:raise AssertionError('An impossible range must return 416')
  print('MP4 MIME, streaming ranges, suffix, seek ranges and HEAD: OK',flush=True)
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   page=browser.new_page();errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda r:requests.append(r.url) if '.mp4' in r.url else None)
   for width in [360,768,1440]:
    page.set_viewport_size({'width':width,'height':1000});requests.clear()
    assert page.goto(base+'/catalog/equipment/predvaritelnyy-izmelchitel').status==200
    assert page.locator('#video').count()==1
    assert page.locator('.equipment-anchor-nav a[href="#video"]').count()==1
    assert not requests,'The film must not download before the user presses play'
    assert page.locator('#viewer-video').get_attribute('src') is None
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
    page.locator('#video').scroll_into_view_if_needed();page.screenshot(path=str(out/f'cinema-block-{width}.png'))
    opener=page.locator('.cinema-screen');opener.click()
    page.wait_for_function("document.querySelector('#viewer-video').currentTime>0.15")
    assert page.locator('#media-viewer').is_visible()
    assert not page.locator('#viewer-image').is_visible()
    assert page.locator('#viewer-video').evaluate('(v)=>v.controls&&v.playsInline&&!v.muted')
    assert page.locator('#viewer-video').evaluate('(v)=>v.duration')>7
    assert not page.locator('#viewer-video-error').is_visible()
    page.locator('#viewer-video').evaluate('(v)=>{v.pause();v.currentTime=5;v.play()}')
    page.wait_for_function("document.querySelector('#viewer-video').currentTime>5.1")
    page.screenshot(path=str(out/f'cinema-viewer-{width}.png'))
    if width==1440:
     page.locator('[data-video-fullscreen]').click()
     page.wait_for_function("document.fullscreenElement?.id==='viewer-video'")
     page.evaluate('document.exitFullscreen()')
     page.wait_for_function('!document.fullscreenElement')
    page.keyboard.press('Escape');assert not page.locator('#media-viewer').is_visible()
    assert page.locator('#viewer-video').evaluate('(v)=>v.paused&&!v.hasAttribute("src")')
    assert opener.evaluate('(e)=>e===document.activeElement')
    # Switching from a film to a photo must also stop and unload the film.
    opener.click();page.wait_for_function("document.querySelector('#viewer-video').currentTime>0.1")
    page.locator('[data-next]').click()
    assert page.locator('#viewer-image').is_visible()
    assert page.locator('#viewer-video').evaluate('(v)=>v.paused&&!v.hasAttribute("src")')
    page.keyboard.press('Escape')
    print('Cinema block, deferred loading, play with audio, seek, close and photo switch:',width,'OK',flush=True)
   page.goto(base+'/media?type=video')
   assert page.locator('[data-media]:visible').count()==1
   page.locator('[data-media]:visible .media-open').click()
   page.wait_for_function("document.querySelector('#viewer-video').currentTime>0.1")
   page.keyboard.press('Escape')
   page.goto(base+'/catalog/equipment/vintovoy-press')
   assert page.locator('#video').count()==0
   assert page.locator('.equipment-anchor-nav a[href="#video"]').count()==0
   # A failed source gives a useful fallback and leaves the page usable.
   page.route('**/assets/videos/__player-test.mp4',lambda route:route.fulfill(status=404,body='Not found'))
   page.goto(base+'/catalog/equipment/predvaritelnyy-izmelchitel');page.locator('.cinema-screen').click()
   page.wait_for_function("!document.querySelector('#viewer-video-error').hidden")
   assert page.locator('#viewer-video-file').get_attribute('href').endswith('/__player-test.mp4')
   page.locator('[data-close]').click();assert not page.locator('#media-viewer').is_visible()
   assert not errors,errors
   print('Video library filter, optional equipment sections and failure fallback: OK',flush=True)
   browser.close()
 finally:
  server.terminate()
  try:server.wait(timeout=5)
  except subprocess.TimeoutExpired:server.kill();server.wait()
