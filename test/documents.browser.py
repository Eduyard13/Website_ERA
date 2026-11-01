"""Verify categories, exact PDF downloads, names and product/library consistency."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from urllib.request import urlopen
import hashlib,json,os,subprocess

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3009/Website_ERA').rstrip('/')
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-documents'));out.mkdir(parents=True,exist_ok=True)
docs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {documentManifest} from './content/document-manifest.mjs';console.log(JSON.stringify(documentManifest))"],text=True))
for d in docs:
 with urlopen(base+'/documents/'+d['file']) as response:
  assert response.status==200 and response.headers.get_content_type()=='application/pdf'
  data=response.read();assert len(data)==d['bytes'];assert hashlib.sha256(data).hexdigest()==d['sha256']
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 page=browser.new_page(reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [360,768,1440]:
  page.set_viewport_size({'width':width,'height':1000});page.goto(base+'/documents')
  assert page.locator('[data-document-folder]').count()==2
  assert page.locator('[data-document]').count()==24
  assert page.locator('[data-document]:visible').count()==0
  page.screenshot(path=str(out/f'folders-{width}.png'))
  for category in ['brochures','technical']:
   folder=page.locator(f'[data-document-folder="{category}"]');folder.locator('summary').click()
   assert folder.locator('[data-document]:visible').count()==12
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(out/f'{category}-{width}.png'))
  page.locator('[name=product]').select_option('kapsulyator')
  assert page.locator('[data-document]:visible').count()==2
  page.locator('[name=kind]').select_option('Брошюра')
  assert page.locator('[data-document]:visible').count()==1
  assert page.locator('[data-document-folder=technical]').is_hidden()
  page.reload();assert page.locator('[data-document]:visible').count()==1
  page.get_by_role('searchbox').fill('нет такого узла')
  assert page.locator('#document-empty').is_visible()
  page.get_by_role('button',name='Сбросить',exact=True).click()
  page.wait_for_function('Array.from(document.querySelectorAll("[data-document]")).every(d=>!d.hidden)')
  assert page.locator('[data-document]').count()==24
 # Every real browser download must keep the new human-readable filename.
 page.goto(base+'/documents');page.locator('[data-document-folder] summary').evaluate_all('items=>items.forEach(e=>e.parentElement.open=true)')
 for d in docs:
  print('Checking download:',d['file'],flush=True)
  with page.expect_download() as info:
   page.locator(f'a[download][href$="/{d["file"]}"]').click()
  download=info.value;assert download.suggested_filename==d['downloadName'],(d['file'],download.suggested_filename)
  assert hashlib.sha256(Path(download.path()).read_bytes()).hexdigest()==d['sha256']
  # Pace individual clicks like a reader; Chrome limits rapid download bursts.
  page.wait_for_timeout(1100)
 page.goto(base+'/catalog/equipment/kapsulyator/#documents')
 assert page.locator('.equipment-document-grid [data-document]').count()==2
 assert page.locator('.equipment-document-grid a[download]').count()==2
 page.locator('.equipment-document-grid').scroll_into_view_if_needed();page.screenshot(path=str(out/'product-documents.png'))
 assert not errors,errors
 print('24 original PDFs, two folders, search, categories, deep links and 24 renamed browser downloads: OK',flush=True)
 browser.close()
