"""One production scenario: monthly/yearly finance, transparent payback and responsive UX."""
from pathlib import Path
from functools import lru_cache
from urllib.parse import urlparse, parse_qs
import json, os, subprocess
from playwright.sync_api import sync_playwright

repo = Path(__file__).resolve().parents[1]
if not (repo / 'package.json').exists():
    repo = Path('/workspace/Website_ERA')
base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3000/Website_ERA').rstrip('/')
out = Path(os.environ.get('ERA_CHECK_DIR', '/workspace/work/era-brand/economics-037'))
out.mkdir(parents=True, exist_ok=True)
widths = [int(w) for w in os.environ.get('ERA_TEST_WIDTHS', '320,360,390,768,1024,1280,1440,1920').split(',')]
node = """import {calculateEconomics} from './public/economics-model.js';import {normalizeProductionScenario} from './public/economics-page-state.js';import {financialValues,scenarioTopic} from './public/economics-page-view.js';const r=calculateEconomics(normalizeProductionScenario({mode:"full",...JSON.parse(process.argv[1])}));console.log(JSON.stringify({values:financialValues(r),mode:r.state.mode,capacity:r.capacity,net:r.net,yearNet:r.yearNet,pie:r.donutAvailable,payback:r.payback,topic:scenarioTopic(r)}))"""
@lru_cache(None)
def expected(state):
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', node, state], cwd=repo, text=True))
def compact(s):
    return ''.join(s.split())

errors, failures, results = [], [], []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failures.append([response.status, response.url]) if response.status >= 400 and response.url.startswith(base) else None)
    page.route('**/api/request.php', lambda route: route.abort())
    def load():
        assert page.goto(base + '/economics/').status == 200
        page.wait_for_function('document.querySelector("[data-economics-page]").dataset.economicsReady === "true"')
    def verify(state):
        r = expected(json.dumps(state, sort_keys=True))
        page.wait_for_function("""(values) => ['profit','yearNet','grossPrice','input'].every(key => [...document.querySelectorAll('[data-value="'+key+'"]')].every(e => e.textContent.replace(/\\s/g,'') === values[key].replace(/\\s/g,'')))""", arg=r['values'])
        actual = page.locator('[data-economics-page]').evaluate("""root => ({mode:root.dataset.econMode,month:root.dataset.econState,year:root.dataset.econYearState,values:[...root.querySelectorAll('[data-value]')].map(e=>[e.dataset.value,e.textContent]),text:root.innerText})""")
        assert actual['mode'] == r['mode']
        for key, text in actual['values']:
            if key in r['values']:
                assert compact(text) == compact(r['values'][key]), (key, state, text, r['values'][key])
        assert (actual['month'] == 'loss') == (r['net'] < 0)
        assert (actual['year'] == 'loss') == (r['yearNet'] < 0)
        assert r['net'] >= 0 and r['yearNet'] >= 0, ('Public scenario must cover both periods',state)
        assert bool(page.locator('.econ-ring').count()) == r['pie']
        assert not any(word in actual['text'] for word in ['NaN', 'Infinity', 'undefined'])
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (page.viewport_size, state)
        assert page.locator('.ec-financial-table').evaluate('e => e.scrollWidth <= e.clientWidth + 1'), (page.viewport_size, state)
        assert bool(page.locator('[data-product-passport]').get_by_text('30–70 ppm', exact=True).count()) == (r['mode'] == 'full')
        label = page.locator('[data-point-label]:visible')
        assert r['values']['profit'] in label.inner_text()
        plot, tip = page.locator('.econ-curve-plot:visible').bounding_box(), label.bounding_box()
        assert tip['x'] >= plot['x'] - 1 and tip['x'] + tip['width'] <= plot['x'] + plot['width'] + 1, (plot, tip)
        return r
    def preset(value):
        page.locator(f'[data-econ-preset="{value}"]').click()
    def slider(fraction):
        page.locator('[data-econ-range]').evaluate('(e,v)=>{e.value=100*v;e.dispatchEvent(new Event("input",{bubbles:true}))}', fraction)
    def reveal(field):
        field.evaluate("e => {for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true}")

    for width in widths:
        page.set_viewport_size({'width': width, 'height': 950 if width >= 768 else 844})
        load(); verify({})
        assert page.locator('.ec-section').count() == 11
        assert page.locator('.page-progress-rail a').count() == 11
        assert page.locator('button[data-econ-mode]').count() == 0
        assert page.locator('[data-price-presets]').count() == 1
        assert page.locator('[data-econ-range]').count() == 1
        assert page.locator('.ec-details[open]').count() == 0
        for fraction in [0, .5, .8, 1]:
            slider(fraction)
            verify({'input': expected('{}')['capacity'] * fraction})
        assert page.locator('[data-product-image]').get_attribute('src').startswith(urlparse(base).path + '/assets/')
        assert page.locator('[data-econ-preset]').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().height>=44)')
        results.append({'width': width, 'monthlyAndAnnual': True, 'minimumHalf80Full': True, 'overflow': False})
        print('Responsive finance, diagrams, break-even boundary and granule quality:', width, 'OK', flush=True)

    page.set_viewport_size({'width': 1440, 'height': 1000})
    load()
    hook = page.locator('.ec-value-flow figcaption strong')
    assert hook.all_text_contents() == ['6 ₽/кг', '90 ₽/кг']
    for price in [80000, 90000, 100000, 110000]:
        preset(price); verify({'salePrices': {'full': price}})
        assert hook.all_text_contents() == ['6 ₽/кг', '90 ₽/кг']
    assert 'Текущий сценарий' in page.locator('[data-hero-basis]').inner_text()
    assert '110 ₽/кг' in page.locator('[data-hero-basis]').inner_text()
    price = page.locator('[data-econ-price]'); reveal(price)
    price.fill('99,5'); assert price.evaluate('e=>document.activeElement===e')
    verify({'mode': 'full', 'salePrices': {'full': 99500}})
    price.fill(''); verify({'mode': 'full', 'salePrices': {'full': 99500}})
    price.press('Tab'); assert price.input_value() == '99.5'
    exact = page.locator('[data-econ-number]'); reveal(exact)
    exact.fill('777,123456'); verify({'mode': 'full', 'input': 777.123456, 'salePrices': {'full': 99500}})
    assert page.locator('.ec-investment-payback').get_attribute('data-payback-status') == 'individual'
    assert '777,123456' in page.locator('[data-econ-range]').get_attribute('aria-valuetext')
    for lines in [2, 3, 1]:
        page.locator(f'[data-econ-lines="{lines}"]').click()
        verify({'mode': 'full', 'lines': lines, 'input': 777.123456 * lines, 'salePrices': {'full': 99500}})
    page.locator('[data-econ-reset]').click(); verify({})
    assert page.locator('[data-econ-price]').input_value() == '90'
    assert 'Базовый сценарий' in page.locator('[data-hero-basis]').inner_text()
    assert page.locator('[data-econ-lines="1"]').get_attribute('aria-pressed') == 'true'
    page.evaluate("""() => {
        const button = document.createElement('button');
        button.dataset.econMode = 'separation';
        document.querySelector('[data-economics-page]').append(button);
        button.click();
        button.remove();
    }""")
    verify({})
    assert page.goto(base + '/economics/?mode=separation').status == 200
    page.wait_for_selector('[data-economics-ready="true"]', state='attached')
    verify({})

    # Keyboard and touch-style selection of the native financial ring.
    segment = page.locator('.econ-legend button').first
    segment.focus(); segment.press('Enter')
    assert segment.get_attribute('aria-pressed') == 'true'
    segment.press('Enter'); assert segment.get_attribute('aria-pressed') == 'false'
    segment.click(); preset(100000); verify({'mode': 'full', 'salePrices': {'full': 100000}})
    assert page.locator('.econ-legend button[aria-pressed="true"]').count() == 1
    page.locator('[data-open-conditions]').first.click()
    assert page.locator('#calculation-conditions').get_attribute('open') is not None
    page.locator('[data-open-offers]').first.click()
    before = page.locator('#market-offers').inner_html()
    price = page.locator('[data-econ-price]'); reveal(price); price.fill('90')
    r = verify({'mode': 'full'})
    assert page.locator('#market-offers').inner_html() == before
    assert page.locator('#market-offers').get_attribute('open') is not None
    assert page.locator('#calculation-conditions').get_attribute('open') is not None
    link = page.locator('[data-economics-request]').last
    href = link.get_attribute('href')
    assert urlparse(href).path == urlparse(base).path + '/contacts'
    assert parse_qs(urlparse(href).query)['topic'][0] == r['topic']
    assert len(r['topic']) <= 200
    link.click(); assert page.locator('#project-request').is_visible()
    assert page.locator('#project-request [data-request-topic]').input_value() == r['topic']
    page.keyboard.press('Escape')
    page.goto(base + '/contacts?topic=' + href.split('topic=')[1])
    assert page.locator('#project-form [data-request-topic]').input_value() == r['topic']

    # Original deep links, one semantic H1, and the server-rendered fallback.
    load()
    anchors = ['economic-case','raw-material','material-balance','product-quality','market','market-offers','economics','monthly-result','production-constructor','calculation-conditions','project-resilience','production-growth','business-quality-title','econ-month-title','econ-tonne-title','econ-curve-title','econ-monthly-price','econ-per-tonne-price','econ-volume']
    for anchor in anchors:
        assert page.locator('[id="'+anchor+'"]').count() == 1, anchor
    assert page.locator('h1').count() == 1
    for anchor in ['market-offers','calculation-conditions','econ-volume']:
        page.goto(base+'/economics/#'+anchor)
        page.wait_for_function('document.querySelector("[data-economics-page]").dataset.economicsReady === "true"')
        assert page.locator('[id="'+anchor+'"]').is_visible()
    static = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
    plain = static.new_page(); plain.goto(base + '/economics/')
    assert plain.locator('.ec-hero [data-value="profitMillions"]').inner_text() == '10,70'
    assert plain.locator('.ec-hero [data-value="yearNetMillions"]').inner_text() == '123,73'
    assert plain.locator('.ec-section').count() == 11
    assert plain.locator('[data-economics-page]').get_attribute('data-econ-mode') == 'full'
    assert plain.locator('[data-econ-price]').input_value() == '90'
    assert '558 т/мес.' in plain.locator('[data-hero-basis]').inner_text()
    assert plain.locator('.ec-investment-payback [data-value]').inner_text() == '6,5–8,2'
    assert plain.locator('[data-value="yield"]').inner_text() == '57,50%'
    assert '57,5% входящей смеси' in plain.locator('#raw-material').inner_text()
    assert plain.locator('button[data-econ-mode]').count() == 0
    assert plain.locator('[data-product-quality-copy]').is_visible()
    assert plain.locator('.econ-ring').count() == 1
    assert plain.locator('[data-economics-page] noscript').count() == 1
    static.close()
    for route in ['/', '/documents/', '/catalog/', '/catalog/lines/separatsiya-02/', '/contacts/']:
        assert page.goto(base+route).status == 200, route
        assert page.locator('h1').count() == 1, route
        assert page.locator('.site-header .brand img').evaluate('e=>e.complete&&e.naturalWidth>0'), route
    assert not errors, errors
    assert not failures, failures
    (out/'results.json').write_text(json.dumps({'responsive':results,'presets':4,'fullCycleLock':'OK','basePriceHook':'OK','exactVolume':'OK','reset':'OK','ringKeyboard':'OK','requestContext':'OK','deepLinks':'OK','staticFallback':'OK','relatedRoutes':'OK','errors':errors,'httpFailures':failures},ensure_ascii=False,indent=2))
    print('All presets, exact inputs, full-cycle lock, reset, keyboard ring, form, sources, deep links and no-JS: OK', flush=True)
    browser.close()
