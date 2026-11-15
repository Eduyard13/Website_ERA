"""Engineering library acceptance: actual PDF pages/downloads/ZIP, no screenshots."""
from pathlib import Path
from urllib.parse import quote, urlparse
from hashlib import sha256
from zipfile import ZipFile
from io import BytesIO
import json, os, time, subprocess
from playwright.sync_api import sync_playwright
base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3047/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_DOCUMENT_REPORT_DIR','/tmp/era-document-library-0360/browser'));out.mkdir(parents=True,exist_ok=True)
documents=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {publicLibraryDocuments} from './content/document-library.mjs';console.log(JSON.stringify(publicLibraryDocuments))"],text=True))
total_docs=len(documents)
category_counts={c:sum(d['category']==c for d in documents) for c in ['brochures','technical','layouts','drawings','investments']}
full_count=sum(d['objectType']=='line' and d['objectSlug']=='separatsiya-02' for d in documents)
errors=[];report={'responsive':[],'pdf':[],'screenshots':False}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width in [320,390,768,900,1200,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':1000},reduced_motion='reduce');page=context.new_page();requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda request:requests.append(request.url))
  page.goto(base+'/documents/');page.wait_for_function('(n)=>document.querySelectorAll("[data-library-document]:not([hidden])").length===n',arg=total_docs)
  assert page.locator('h1').inner_text()=='Инженерная библиотека ЭРА.'
  assert page.locator('[data-library-category]').count()==5 and page.locator('[data-library-document]:visible').count()==total_docs
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert not any('/vendor/' in url or urlparse(url).path.endswith('.pdf') for url in requests),'PDF/vendor downloaded before opening'
  boxes=page.locator('.dl-category').evaluate_all('es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width};})')
  if width>=1200:
   assert abs(boxes[0]['y']-boxes[2]['y'])<1 and abs(boxes[3]['y']-boxes[4]['y'])<1 and boxes[3]['y']>boxes[0]['y']
  elif width>=768:assert abs(boxes[0]['y']-boxes[1]['y'])<1 and boxes[2]['y']>boxes[0]['y']
  else:assert all(boxes[i+1]['y']>boxes[i]['y'] for i in range(4))
  assert page.locator('.dl-document:visible').evaluate_all('es=>es.every(e=>e.scrollWidth<=e.clientWidth+1)')
  page.locator('[data-library-view=list]').click();assert page.locator('[data-document-library]').get_attribute('data-view')=='list'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),('list',width)
  page.locator('[data-library-view=cards]').click()
  if width in [390,1440]:
   page.locator('[data-pdf-open=separatsiya-02-technical]').click()
   page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 1 из 32"',timeout=30000)
   dialog=page.locator('#pdf-viewer');assert dialog.bounding_box()['x']>=0
   assert dialog.locator('[data-pdf-close]').bounding_box()['height']>=44
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   initial=dialog.locator('[data-pdf-scale]').inner_text();dialog.locator('[data-pdf-zoom-in]').click()
   page.wait_for_function('(old)=>document.querySelector("[data-pdf-scale]").textContent!==old',arg=initial)
   dialog.locator('[data-pdf-fit]').click();dialog.locator('[data-pdf-next]').click()
   page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 2 из 32"')
   dialog.locator('[data-pdf-page]').fill('32');dialog.locator('[data-pdf-page]').press('Enter')
   page.wait_for_function('document.querySelector("[data-pdf-status]").textContent==="Страница 32 из 32"')
   assert dialog.locator('[data-pdf-next]').is_disabled()
   dialog.locator('[data-pdf-reset]').click();page.wait_for_function('document.querySelector("[data-pdf-scale]").textContent==="100%"')
   dialog.locator('[data-pdf-close]').focus();page.keyboard.press('Shift+Tab')
   assert dialog.locator('[data-pdf-original]').evaluate('(e)=>document.activeElement===e')
   page.keyboard.press('Tab');assert dialog.locator('[data-pdf-close]').evaluate('(e)=>document.activeElement===e')
   page.keyboard.press('Escape');assert not dialog.is_visible()
   assert page.locator('[data-pdf-open=separatsiya-02-technical]').evaluate('(e)=>document.activeElement===e')
  report['responsive'].append(width);context.close()
 print('Responsive categories, lazy loading and 32-page PDF controls: OK',flush=True)
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 scenarios=[('',total_docs),('?product=ballisticheskiy-separator',2),('?product=ballisticheskiy-separator&kind='+quote('Брошюра'),1),('?objectType=line&product=separatsiya-01',1),('?objectType=line&product=separatsiya-02',full_count),('?objectType=line&product=separatsiya-02&category=technical',1),('?q='+quote('пленочный-флотатор'),2)]
 for query,count in scenarios:
  page.goto(base+'/documents/'+query);page.wait_for_function('(n)=>document.querySelectorAll("[data-library-document]:not([hidden])").length===n',arg=count)
  if 'separatsiya-01' in query:assert page.locator('[data-library-document]:visible').get_attribute('data-library-document')=='separatsiya-01-mini-technical'
  if 'separatsiya-02' in query and 'technical' in query:assert page.locator('[data-library-document]:visible a[download]').get_attribute('href').endswith('/technical/era-separatsiya-01-technical-description.pdf')
 page.goto(base+'/documents/?product=ballisticheskiy-separator');page.wait_for_function('document.querySelectorAll("[data-library-document]:not([hidden])").length===2')
 page.locator('[data-library-object-link]').click();assert '/catalog/equipment/ballisticheskiy-separator' in page.url
 page.go_back();page.wait_for_function('document.querySelectorAll("[data-library-document]:not([hidden])").length===2')
 page.locator('[name=q]').fill('несуществующийдокумент');page.wait_for_function('!document.querySelector("#document-empty").hidden')
 assert 'не найдены' in page.locator('[data-library-empty-title]').inner_text()
 page.locator('button[type=reset]').click();page.wait_for_function('(n)=>document.querySelectorAll("[data-library-document]:not([hidden])").length===n',arg=total_docs)
 page.locator('[name=product]').select_option('line:separatsiya-02');page.wait_for_function('(n)=>document.querySelectorAll("[data-library-document]:not([hidden])").length===n',arg=full_count)
 page.locator('[name=category]').select_option('technical');page.wait_for_url(base+'/documents/technical/**')
 page.wait_for_function('document.querySelectorAll("[data-library-document]:not([hidden])").length===1');assert 'separatsiya-02' in page.url
 page.goto(base+'/documents/')
 for category,count in category_counts.items():
  page.goto(base+'/documents/'+category+'/');page.wait_for_function('(n)=>document.querySelectorAll("[data-library-document]:not([hidden])").length===n',arg=count)
  assert page.locator('.site-header [data-menu-toggle]').get_attribute('data-current-section')=='true'
  if not count:
   assert page.locator('[data-library-empty-title]').inner_text()=='Материалы готовятся'
   page.locator('[data-library-empty-request]').click();assert page.locator('#project-request').is_visible()
   assert 'Документация:' in page.locator('#project-request [data-request-topic]').input_value()
   page.keyboard.press('Escape')
 print('Legacy URLs, combined filters, category routes, history and request forms: OK',flush=True)
 page.goto(base+'/documents/');data=page.locator('#document-library-data').evaluate('(e)=>JSON.parse(e.textContent)');docs=data['documents']
 for d in docs:
  link=page.locator('[data-pdf-open="'+d['id']+'"]');link.click()
  page.wait_for_function('(pages)=>document.querySelector("[data-pdf-status]").textContent==="Страница 1 из "+pages',arg=d['pages'],timeout=30000)
  assert page.locator('[data-pdf-canvas]').evaluate('(e)=>e.width>100&&e.height>100')
  assert len(page.workers)<=1
  with page.expect_download() as download_info:page.locator('#pdf-viewer [data-pdf-download]').click()
  download=download_info.value;path=out/(d['id']+'.pdf');download.save_as(path)
  assert sha256(path.read_bytes()).hexdigest()==d['sha256'];path.unlink()
  page.locator('[data-pdf-close]').click()
  for attempt in range(50):
   if not page.workers:break
   page.wait_for_timeout(50)
  assert len(page.workers)==0,('worker leaked',d['id'])
  report['pdf'].append(d['id']);print('PDF checked:',d['id'],flush=True)
 print(f'All {len(docs)} PDF first pages rendered; downloads preserve SHA; workers released: OK',flush=True)
 page.locator('[data-select-mode]').click();small=[next(d for d in docs if d['id']=='separatsiya-02-dimensions-a0'),min((d for d in docs if d['id']!='separatsiya-02-dimensions-a0'),key=lambda d:d['bytes'])]
 for d in small:page.locator('[data-select-document="'+d['id']+'"]').check()
 with page.expect_download() as download_info:page.locator('[data-download-selected]').click()
 download=download_info.value;zip_path=out/'selected.zip';download.save_as(zip_path)
 with ZipFile(zip_path) as archive:
  assert len(archive.namelist())==2
  assert {sha256(archive.read(n)).hexdigest() for n in archive.namelist()}=={d['sha256'] for d in small}
 zip_path.unlink();page.locator('[data-clear-selected]').click();total=0;oversized=[]
 for d in sorted(docs,key=lambda d:d['bytes'],reverse=True):
  page.locator('[data-select-document="'+d['id']+'"]').check();oversized.append(d);total+=d['bytes']
  if total>50_000_000:break
 pdf_requests=[];page.on('request',lambda request:pdf_requests.append(request.url) if urlparse(request.url).path.endswith('.pdf') else None)
 page.locator('[data-download-selected]').click();page.wait_for_timeout(150)
 assert 'Лимит архива' in page.locator('[data-archive-status]').inner_text()
 assert page.locator('[data-selected-files] a').count()==len(oversized)
 assert not pdf_requests
 assert page.locator('[data-select-document]:checked').count()==len(oversized)
 print('ZIP contains original bytes; 50 MB limit retains selection and individual links: OK',flush=True)
 context.close()
 context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 first=docs[0];broken=base+'/documents/'+first['file'];context.route(broken,lambda route:route.fulfill(status=200,content_type='application/pdf',body=b'not a PDF'))
 page.goto(base+'/documents/');page.locator('[data-pdf-open="'+first['id']+'"]').click()
 page.wait_for_function('document.querySelector("[data-pdf-status]").classList.contains("is-error")',timeout=30000)
 assert page.locator('[data-pdf-original]').get_attribute('href')==broken
 page.keyboard.press('Escape');assert not page.locator('#pdf-viewer').is_visible();context.close()
 fixture=Path(os.environ.get('ERA_DOCUMENT_FIXTURE_DIR','/tmp/era-document-library-0360/fixture'))
 if fixture.joinpath('index.html').exists():
  context=browser.new_context(viewport={'width':900,'height':1000},reduced_motion='reduce');page=context.new_page()
  context.route(base+'/documents/layouts/',lambda route:route.fulfill(status=200,content_type='text/html',body=fixture.joinpath('index.html').read_bytes()))
  fixture_pdf=Path(__file__).resolve().parents[1]/'dist/documents/layouts/fixture.pdf'
  fixture_cover=Path(__file__).resolve().parents[1]/'dist/assets/document-covers/fixture-line-layout.webp'
  assert not fixture_pdf.exists() and not fixture_cover.exists()
  fixture_pdf.write_bytes(fixture.joinpath('fixture.pdf').read_bytes());fixture_cover.write_bytes(fixture.joinpath('fixture.webp').read_bytes())
  page.goto(base+'/documents/layouts/');page.wait_for_function('document.querySelectorAll("[data-library-document]:not([hidden])").length===1')
  assert page.locator('[data-library-document]:visible').get_attribute('data-library-document')=='fixture-line-layout'
  page.locator('[name=product]').select_option('line:separatsiya-02');assert page.locator('[data-library-document]:visible').count()==1
  page.locator('[data-pdf-open=fixture-line-layout]').click();page.wait_for_function('document.querySelector("[data-pdf-status]").textContent.startsWith("Страница 1 из")')
  with page.expect_download() as download_info:page.locator('[data-pdf-download]').click()
  path=out/'fixture.pdf';download_info.value.save_as(path);assert path.read_bytes()==fixture.joinpath('fixture.pdf').read_bytes();path.unlink();context.close();fixture_pdf.unlink();fixture_cover.unlink();report['futureCategory']='Validated, filtered, rendered and downloaded from an isolated registry fixture'
 context=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=context.new_page();page.goto(base+'/documents/')
 assert page.locator('[data-library-document]').count()==total_docs and page.locator('[data-library-document] a[download]').count()==total_docs
 page.goto(base+'/documents/layouts/');assert page.locator('#document-empty').is_visible();assert page.locator('[data-library-empty-request]').get_attribute('href').startswith(urlparse(base).path+'/contacts?topic=')
 context.close();browser.close()
assert not errors,errors
report['pageErrors']=errors;report['zip']='Original bytes verified; oversized selection blocked';report['brokenPdf']='Error and direct PDF fallback work'
out.joinpath('results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Engineering library acceptance passed:',out/'results.json',flush=True)
