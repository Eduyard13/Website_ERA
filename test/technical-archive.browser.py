"""Compact categories, Technical Archive and proven in-site back navigation. No screenshots."""
from pathlib import Path
from urllib.parse import urlparse, quote
import json,os
from playwright.sync_api import sync_playwright
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3049/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_ARCHIVE_REPORT_DIR','/tmp/era-technical-archive-0361/browser'));out.mkdir(parents=True,exist_ok=True)
errors=[];report={'widths':[],'history':[],'screenshots':False}

def ready(page):
 page.wait_for_function('!!document.querySelector("[data-context-navigation][data-context-ready=true]")')

def plain_path(page):return urlparse(page.url).path.rstrip('/')

def same_path(page,path):assert plain_path(page)==urlparse(base+path).path.rstrip('/'),page.url

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,360,390,768,900,1280,1440]:
  context=browser.new_context(viewport={'width':width,'height':720},reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/documents/');assert page.locator('.dl-hero').count()==1 and page.locator('.dl-category-grid .dl-category').count()==5
  assert page.locator('[data-context-navigation]').count()==0
  page.locator('[data-library-category=brochures]').click();ready(page);same_path(page,'/documents/brochures/')
  assert page.locator('.dl-hero,.dl-category-grid').count()==0 and page.locator('.dl-compact-intro').count()==1
  assert page.locator('[data-library-document]:visible').count()==13
  first=page.locator('.dl-cover').first.bounding_box();assert first['y']<700,(width,first)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert page.locator('.dl-tab-list a').count()==6 and page.locator('.dl-tab-list [aria-current=page]').count()==1
  options=page.locator('[data-library-options]');assert (options.get_attribute('open') is not None)==(width>=768)
  cover=page.locator('.dl-cover').first;cover.scroll_into_view_if_needed();page.locator('.dl-cover img').first.wait_for()
  page.wait_for_function('document.querySelector(".dl-cover img").complete&&document.querySelector(".dl-cover img").naturalWidth>0')
  style=cover.evaluate('(e)=>{const s=getComputedStyle(e),a=getComputedStyle(e,"::before"),b=getComputedStyle(e,"::after"),r=e.getBoundingClientRect(),i=e.querySelector("img").getBoundingClientRect();return {bg:s.backgroundImage,before:a.content,after:b.content,top:parseFloat(a.top),bottom:parseFloat(b.bottom),imageTop:i.top-r.top,imageBottom:r.bottom-i.bottom,fit:getComputedStyle(e.querySelector("img")).objectFit};}')
  assert '216, 222, 229' in style['bg'] and style['before']=='""' and style['after']=='""',(width,style)
  assert style['imageTop']>style['top'] and style['imageBottom']>style['bottom'] and style['fit']=='contain',(width,style)
  page.locator('[data-library-view=list]').click();assert page.locator('.dl-cover').first.evaluate('(e)=>getComputedStyle(e,"::before").content')=='""'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.evaluate('scrollTo(0,1000)');page.wait_for_timeout(80)
  header=page.locator('.site-header').bounding_box();bar=page.locator('[data-context-navigation]').bounding_box()
  assert abs(bar['y']-(header['y']+header['height']))<1.5,(width,header,bar)
  assert 44<=bar['height']<=56
  page.goto(base+'/documents/investments/');ready(page);page.wait_for_timeout(100)
  active=page.locator('.dl-tab-list [aria-current=page]').bounding_box();tabs=page.locator('.dl-tab-list').bounding_box()
  assert active['x']>=tabs['x']-1 and active['x']+active['width']<=tabs['x']+tabs['width']+1,(width,active,tabs)
  assert page.locator('[data-library-empty-title]').inner_text()=='Материалы готовятся'
  page.locator('[data-library-empty-request]').click();assert page.locator('#project-request').is_visible();page.keyboard.press('Escape');same_path(page,'/documents/investments/')
  for category,count in [('technical',14),('layouts',0),('drawings',0)]:
   page.goto(base+'/documents/'+category+'/');ready(page);assert page.locator('[data-library-document]:visible').count()==count
   assert page.locator('.dl-category-grid').count()==0
  report['widths'].append({'width':width,'firstCoverY':first['y'],'barHeight':bar['height']});context.close()
 print('Compact categories, first-screen results, steel guides, tabs, empty states and sticky geometry: OK',flush=True)
 context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/documents/?q='+quote('Баллистический'))
 page.wait_for_function('document.querySelectorAll("[data-library-document]:not([hidden])").length===2')
 tile=page.locator('[data-library-category=technical]');tile.scroll_into_view_if_needed();source_y=page.evaluate('scrollY');tile.click();ready(page)
 assert page.evaluate('history.state.eraContext.verified') is True
 assert page.locator('[name=q]').input_value()=='Баллистический' and page.locator('[data-library-document]:visible').count()==1
 page.locator('[data-library-document]:visible .dl-related').click();ready(page);assert page.evaluate('history.state.eraContext.verified') is True
 page.locator('[data-context-back]').click();ready(page);same_path(page,'/documents/technical/')
 page.locator('[data-context-back]').click();same_path(page,'/documents/')
 page.wait_for_function('document.querySelectorAll("[data-library-document]:not([hidden])").length===2')
 assert 'q=' in page.url
 report['history'].append({'case':'library → category → node → back → back','scrollBefore':source_y,'scrollAfter':page.evaluate('scrollY')})
 for target in ['separatsiya-01','separatsiya-02']:
  page.goto(base+'/catalog/lines/?group='+quote('Сепарация'));page.wait_for_function('document.querySelector("#line-result").textContent.includes("3")')
  page.locator('[data-line-id='+target+']').click();ready(page);assert page.evaluate('history.state.eraContext.verified') is True
  page.locator('[data-context-back]').click();same_path(page,'/catalog/lines/');assert 'group=' in page.url
  report['history'].append({'case':'filtered lines → '+target+' → back'})
 page.goto(base+'/catalog/equipment/?q='+quote('флотатор'));page.wait_for_function('document.querySelectorAll("[data-node]:not([hidden])").length===1')
 page.locator('[data-node]:visible').click();ready(page);assert page.evaluate('history.state.eraContext.verified') is True
 page.locator('.equipment-anchor-nav a[href="#specs"]').click();page.wait_for_function('(()=>{const b=document.querySelector("[data-context-navigation]").getBoundingClientRect().bottom,y=document.querySelector("#specs").getBoundingClientRect().top;return y>=b-1&&y<b+100})()')
 bar=page.locator('[data-context-navigation]').bounding_box();section=page.locator('#specs').bounding_box();assert section['y']>=bar['y']+bar['height']-1,(bar,section)
 page.locator('[data-context-back]').click();same_path(page,'/catalog/equipment/');assert 'q=' in page.url
 page.wait_for_function('document.querySelectorAll("[data-node]:not([hidden])").length===1')
 report['history'].append({'case':'filtered equipment → node → anchor → safe parent with filters'})
 page.goto(base+'/technology/');page.locator('a[href$="/catalog/lines/separatsiya-02"]').first.click();ready(page)
 assert page.evaluate('history.state.eraContext.verified') is True
 page.locator('[data-context-back]').click();same_path(page,'/technology/')
 report['history'].append({'case':'technology → line → previous internal page'})
 page.goto(base+'/documents/technical/?objectType=line&product=separatsiya-02');ready(page)
 assert page.locator('[data-library-options]').get_attribute('open') is not None and page.locator('[name=product]').input_value()=='line:separatsiya-02'
 page.locator('.dl-tab-list [data-library-category=brochures]').click();ready(page);same_path(page,'/documents/brochures/')
 assert 'product=separatsiya-02' in page.url and page.locator('[data-library-document]:visible').count()==1
 page.locator('[data-library-home]').click();same_path(page,'/documents/');assert 'product=separatsiya-02' in page.url
 page.goto(base+'/documents/technical/');ready(page);before=page.url;page.locator('[data-pdf-open=separatsiya-02-technical]').click()
 page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 1 из 32"');page.locator('[data-pdf-next]').click();page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 2 из 32"');page.locator('[data-pdf-zoom-in]').click();page.keyboard.press('Escape');assert page.url==before
 assert page.locator('[data-pdf-open=separatsiya-02-technical]').evaluate('(e)=>document.activeElement===e')
 page.locator('[data-menu-toggle]').click();assert page.locator('#site-menu').is_visible();page.keyboard.press('Escape')
 report['modal']='PDF pages, zoom, Escape/focus and menu remain above the sticky panel'
 context.close()
 # A genuine external entry has history, but no controlled transition evidence.
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');page=context.new_page()
 context.route('https://external.example/**',lambda route:route.fulfill(content_type='text/html; charset=utf-8',body='<a href="'+base+'/catalog/equipment/ballisticheskiy-separator/">Открыть узел</a>'))
 page.goto('https://external.example/mail');page.get_by_role('link',name='Открыть узел').click();ready(page)
 assert page.evaluate('history.length')>1 and page.evaluate('history.state.eraContext.verified') is False
 page.locator('[data-context-back]').click();same_path(page,'/catalog/equipment/')
 page.goto(base+'/catalog/lines/separatsiya-02/',referer=base+'/catalog/lines/');ready(page);assert page.evaluate('history.state.eraContext.verified') is False
 page.locator('[data-context-back]').click();same_path(page,'/catalog/lines/');context.close()
 report['external']='External history and a same-origin referrer without proof both use safe parents'
 # Storage denial keeps the ordinary parent links usable.
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');context.add_init_script("Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('blocked','SecurityError')}})");page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/documents/brochures/');ready(page);page.locator('[data-context-back]').click();same_path(page,'/documents/');context.close()
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=context.new_page();page.goto(base+'/documents/brochures/')
 assert page.locator('.dl-category-grid').count()==0 and page.locator('[data-library-document]').count()==13
 page.locator('[data-context-back]').click();same_path(page,'/documents/');context.close();browser.close()
assert not errors,errors
report['pageErrors']=errors;out.joinpath('results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Safe history, parent fallbacks, filters, anchors, modals and no-JS acceptance passed:',out/'results.json',flush=True)
