"""Verify the real CBR feed, fixed layout, automatic refresh and dated fallback."""
from pathlib import Path
from datetime import datetime,timezone
from urllib.request import urlopen
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright
import json
import os

base=os.environ.get('ERA_PREVIEW_URL','http://127.0.0.1:3007/Website_ERA').rstrip('/')
feed='https://raw.githubusercontent.com/Eduyard13/Website_ERA/refs/heads/data/cbr-rates/cbr.json'
out=Path(os.environ.get('ERA_SCREENSHOT_DIR','/tmp/era-fx-screenshots'));out.mkdir(parents=True,exist_ok=True)
with urlopen(feed) as response:live=json.load(response)
def fixture(day='2026-11-01',effective='2026-10-31'):
 return {'schemaVersion':1,'source':'CBR','sourceUrl':'https://www.cbr.ru/scripts/XML_daily.asp?'+urlencode({'date_req':'/'.join(reversed(day.split('-')))}),'requestedDate':day,'effectiveDate':effective,'fetchedAt':day+'T01:00:00Z','rates':{'USD':{'nominal':1,'value':90.1234,'rate':90.1234},'EUR':{'nominal':1,'value':100.5678,'rate':100.5678},'CNY':{'nominal':10,'value':125,'rate':12.5}}}
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [360,768,1440]:
  page.set_viewport_size({'width':width,'height':1000})
  for route in ['/','/catalog/equipment/ballisticheskiy-separator','/contacts']:
   page.goto(base+route)
   page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='live'")
   for code in ['USD','EUR','CNY']:
    expected=f"{live['rates'][code]['rate']:.4f}".replace('.',',')
    assert expected in page.locator(f'[data-fx-value={code}]').inner_text()
   assert page.locator('[data-fx-date]').get_attribute('datetime')==live['requestedDate']
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,route)
   assert page.locator('[data-fx-bar]').evaluate('(e)=>Math.abs(e.getBoundingClientRect().bottom-innerHeight)<1')
   page.evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})')
   assert page.locator('[data-fx-bar]').is_visible()
   assert page.locator('footer').evaluate('(e)=>e.getBoundingClientRect().bottom<=document.querySelector("[data-fx-bar]").getBoundingClientRect().top+1')
   if route=='/':page.screenshot(path=str(out/f'footer-with-rates-{width}.png'))
  if width==360:
   page.goto(base+'/contacts');page.get_by_role('button',name='Меню').click()
   page.locator('#mobile-nav details').evaluate_all('items=>items.forEach(e=>e.open=true)')
   assert page.locator('#mobile-nav').evaluate('(e)=>e.getBoundingClientRect().bottom<=document.querySelector("[data-fx-bar]").getBoundingClientRect().top+1')
   page.keyboard.press('Escape')
  page.goto(base+'/catalog/equipment/ballisticheskiy-separator#video')
  page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='live'")
  page.screenshot(path=str(out/f'ballistic-and-rates-{width}.png'))
  print('Actual official feed, all pages, date, fixed panel, footer and layout:',width,'OK',flush=True)
 page.goto(base+'/missing-page')
 page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='live'")
 assert page.locator('h1').inner_text()=='404'
 assert not errors,errors
 page.close()
 # Controlled snapshots below are test data; the production feed is unchanged.
 context=browser.new_context();page=context.new_page()
 page.clock.install(time=datetime(2026,11,1,12,0,tzinfo=timezone.utc))
 calls=[];data=fixture();poll_change=True
 def deliver(route):
  calls.append(route.request.url);payload=json.loads(json.dumps(data))
  if poll_change and len(calls)>1:payload['rates']['USD']={'nominal':1,'value':90.5678,'rate':90.5678}
  route.fulfill(json=payload,headers={'access-control-allow-origin':'*'})
 page.route('**/refs/heads/data/cbr-rates/cbr.json*',deliver)
 page.goto(base+'/contacts');page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='live'")
 assert '12,5000' in page.locator('[data-fx-value=CNY]').inner_text()
 assert '31.10.2026' in page.locator('[data-fx-status]').inner_text()
 page.bring_to_front()
 assert page.evaluate('document.visibilityState')=='visible'
 page.clock.run_for(15*60*1000+1000)
 page.wait_for_function("document.querySelector('[data-fx-value=USD]').textContent.includes('90,5678')")
 poll_change=False
 assert len(calls)>=2,'An open page must check for updated rates automatically'
 # Cached data survives an outage and is visibly marked as cached.
 page.unroute('**/refs/heads/data/cbr-rates/cbr.json*')
 page.route('**/refs/heads/data/cbr-rates/cbr.json*',lambda r:r.fulfill(status=503,body='Unavailable',headers={'access-control-allow-origin':'*'}))
 page.reload();page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='cached'")
 assert '90,5678' in page.locator('[data-fx-value=USD]').inner_text()
 assert 'Сохранённые' in page.locator('[data-fx-status]').inner_text()
 page.evaluate('localStorage.clear()');page.reload()
 page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='unavailable'")
 assert all(v=='—' for v in page.locator('[data-fx-value]').all_inner_texts())
 # An old payload is never labelled as today's rate.
 page.unroute('**/refs/heads/data/cbr-rates/cbr.json*');data=fixture('2026-10-31','2026-10-31')
 page.route('**/refs/heads/data/cbr-rates/cbr.json*',deliver)
 page.reload();page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='stale'")
 assert 'данные за 31.10.2026'==page.locator('[data-fx-date]').inner_text()
 # Recover automatically after a network-online event, with no page reload.
 data=fixture();page.evaluate("window.dispatchEvent(new Event('online'))")
 page.wait_for_function("document.querySelector('[data-fx-bar]').dataset.state==='live'")
 assert page.locator('[data-fx-date]').inner_text()=='на 01.11.2026'
 print('Nominal normalization, 15-minute refresh, cache, outage, stale dates and online recovery: OK',flush=True)
 context.close();browser.close()
