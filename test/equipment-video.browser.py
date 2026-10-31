"""Play the published customer media, not the synthetic player fixture."""
from pathlib import Path
from urllib.request import Request, urlopen
from playwright.sync_api import sync_playwright
import json
import os
import subprocess

repo=Path(__file__).resolve().parents[1]
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3006/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-equipment-video'));out.mkdir(parents=True,exist_ok=True)
films=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {equipmentVideos} from './content/equipment-videos.mjs';console.log(JSON.stringify(equipmentVideos.filter(v=>v.ready)))"],cwd=repo,text=True))
assert films,'No ready customer videos to verify'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page();errors=[];requests=[];failures=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:requests.append(r.url) if '.mp4' in r.url else None)
 page.on('response',lambda r:failures.append((r.status,r.url)) if r.status>=400 else None)
 for film in films:
  movie_url=base+'/assets/'+film['file']
  with urlopen(Request(movie_url,headers={'Range':'bytes=0-255'})) as response:
   assert response.status==206 and response.headers['Content-Type']=='video/mp4'
   assert response.headers['Content-Range']==f"bytes 0-255/{film['bytes']}"
   assert len(response.read())==256
  for width in [360,768,1440]:
   page.set_viewport_size({'width':width,'height':1000});requests.clear()
   assert page.goto(base+'/catalog/equipment/'+film['slug']).status==200
   assert not requests,'No movie request before an explicit play action'
   assert page.locator('#viewer-video').get_attribute('src') is None
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
   page.get_by_role('link',name='Смотреть видео',exact=True).click()
   page.locator('.cinema-screen img').wait_for(state='visible')
   page.wait_for_function("document.querySelector('.cinema-screen img').naturalWidth>0")
   assert page.url.endswith('#video')
   page.locator('#video').screenshot(path=str(out/f"{film['slug']}-block-{width}.png"))
   opener=page.locator('.cinema-screen');opener.click()
   page.wait_for_function("document.querySelector('#viewer-video').currentTime>0.2")
   actual=page.locator('#viewer-video').evaluate('(v)=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,controls:v.controls,inline:v.playsInline,muted:v.muted,frames:v.getVideoPlaybackQuality().totalVideoFrames})')
   assert abs(actual['duration']-film['durationSeconds'])<0.25,actual
   assert (actual['width'],actual['height'])==(film['width'],film['height']),actual
   assert actual['controls'] and actual['inline'] and not actual['muted'] and actual['frames']>0
   assert not page.locator('#viewer-video-error').is_visible()
   assert page.locator('#viewer-video').get_attribute('src').endswith('/assets/'+film['file'])
   target=film['durationSeconds']*0.72
   page.locator('#viewer-video').evaluate('(v,t)=>{v.pause();v.currentTime=t;v.play()}',target)
   page.wait_for_function('(t)=>document.querySelector("#viewer-video").currentTime>t+0.1',arg=target)
   page.screenshot(path=str(out/f"{film['slug']}-viewer-{width}.png"))
   if width==1440:
    page.locator('[data-video-fullscreen]').click()
    page.wait_for_function("document.fullscreenElement?.id==='viewer-video'")
    page.evaluate('document.exitFullscreen()');page.wait_for_function('!document.fullscreenElement')
   page.keyboard.press('Escape')
   assert not page.locator('#media-viewer').is_visible()
   assert page.locator('#viewer-video').evaluate('(v)=>v.paused&&!v.hasAttribute("src")')
   assert opener.evaluate('(e)=>e===document.activeElement')
   print('Full customer clip, decoded frames, duration, 1080p, sound controls, seek and close:',width,'OK',flush=True)
  page.goto(base+'/media?type=video')
  card=page.locator(f'[data-media][data-video$="/{film["file"]}"]')
  assert card.is_visible();card.locator('.media-open').click()
  page.wait_for_function("document.querySelector('#viewer-video').currentTime>0.1")
  page.locator('[data-close]').click()
  assert page.locator('#viewer-video').evaluate('(v)=>v.paused&&!v.hasAttribute("src")')
 page.goto(base+'/catalog/equipment/vintovoy-press')
 assert page.locator('#video').count()==0
 assert not errors,errors;assert not failures,failures
 print('Customer video in the library, unaffected equipment and no failed media: OK',flush=True)
 browser.close()
