"""Exercise Technology layout and public controls without submitting a request."""
import os
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3181').rstrip('/')
widths = [320, 360, 390, 768, 1024, 1280, 1440]
sections = ['technology-intro', 'raw-material', 'contaminants', 'solution',
            'dry-separation', 'hot-washing', 'granulation', 'products',
            'granule-quality', 'applications', 'control-story', 'technology-next']
outline = {'raw-material': 'Сырьё', 'solution': 'Технология', 'products': 'Продукция',
           'granule-quality': 'Качество', 'applications': 'Применение'}
line_slugs = ['separatsiya-01', 'separatsiya-02', 'separatsiya-03', 'moyka-plenki']


class LinkParser(HTMLParser):
    in_link = False

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            assert not self.in_link, ('Nested links', attrs)
            self.in_link = True

    def handle_endtag(self, tag):
        if tag == 'a':
            self.in_link = False


def load(page, fragment=''):
    response = page.goto(base + '/technology/' + fragment)
    if response:
        assert response.status == 200
    page.wait_for_selector('[data-balance-range]:not([disabled])', state='attached')
    page.wait_for_selector('.page-progress-rail a')


def assert_fit(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    components = page.locator('.tf-container,.tf-contaminant,.tf-process-route,.tf-products,.tf-quality-metrics,.tf-applications-grid,.web-balance-layout')
    overflowing = components.evaluate_all("""items => items.filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth+2)
        .map(e => [e.closest('section')?.id, e.className, e.clientWidth, e.scrollWidth])""")
    assert not overflowing, overflowing


def anchor_visible(page, fragment):
    page.wait_for_function("""id => {
        const top = document.querySelector(id).getBoundingClientRect().top;
        const header = document.querySelector('.site-header').getBoundingClientRect().bottom;
        return top >= header && top < innerHeight;
    }""", arg=fragment)
    expect(page.locator(fragment)).to_be_visible()


def assert_balance(page):
    slider = page.locator('#material-contamination')
    assert [slider.get_attribute(k) for k in ('min', 'max', 'step')] == ['0', '50', '5']
    for key, value, polymer, inclusions in [('Home', 0, 1500, 0), ('End', 50, 750, 750), ('ArrowLeft', 45, 825, 675)]:
        slider.press(key)
        assert slider.input_value() == str(value)
        for selector, expected in [('[data-balance-polymer]', polymer), ('[data-balance-inclusions]', inclusions)]:
            assert int(''.join(page.locator(selector).inner_text().split())) == expected


def check_gallery(page):
    load(page, '#control-title')
    anchor_visible(page, '#control-title')
    monitor = page.locator('#control-story [data-kair]')
    expect(monitor.locator('[data-kair-slide]')).to_have_count(23)
    expect(monitor).to_have_attribute('data-autoplay', 'false')
    expect(monitor.locator('[data-kair-counter]')).to_have_text('1 из 23')
    monitor.locator('[data-kair-next]').click()
    expect(monitor.locator('[data-kair-counter]')).to_have_text('2 из 23')
    monitor.locator('[data-kair-prev]').click()
    expect(monitor.locator('[data-kair-counter]')).to_have_text('1 из 23')
    pause = monitor.locator('[data-kair-pause]')
    pause.click()
    expect(pause).to_have_attribute('aria-pressed', 'false')
    pause.click()
    expect(pause).to_have_attribute('aria-pressed', 'true')
    inspect = monitor.locator('[data-kair-inspect]')
    inspect.click()
    viewer = monitor.locator('[data-kair-viewer]')
    expect(viewer).to_be_visible()
    page.wait_for_function("!!document.fullscreenElement && document.querySelector('[data-kair-viewer-image]').naturalWidth>0")
    monitor.locator('[data-kair-viewer-next]').click()
    expect(monitor.locator('[data-kair-viewer-counter]')).to_have_text('2 из 23')
    original = monitor.locator('[data-kair-original]').evaluate('link => link.href')
    assert original.endswith('/assets/kair/originals/KAIR_02_Setup_Overview.jpg')
    assert page.request.get(original).status == 200
    monitor.locator('[data-kair-close]').press('Escape')
    expect(viewer).to_be_hidden()
    expect(inspect).to_be_focused()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(reduced_motion='reduce')
    errors, failed = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: failed.append((r.status, r.url)) if r.status >= 400 and r.url.startswith(base) else None)

    for width in widths:
        page.set_viewport_size({'width': width, 'height': 960})
        load(page)
        assert page.locator('.tf-page>section').evaluate_all('sections => sections.map(s => s.id)') == sections
        assert page.locator('.page-progress-rail a').count() == len(sections)
        expect(page.locator('main h1')).to_have_text('Из плёнки в плёнку.')
        expect(page.locator('[data-feedstock-type]')).to_have_count(5)
        expect(page.locator('[data-contaminant-row]:visible')).to_have_count(9)
        expect(page.locator('[data-technology-output]')).to_have_count(3)
        expect(page.locator('[data-technology-application]:visible')).to_have_count(3)
        assert page.locator('[data-technology-line]').evaluate_all('links => links.map(a => a.dataset.technologyLine)') == line_slugs
        assert page.locator('.tf-line-render img').evaluate_all("imgs => imgs.every(i => getComputedStyle(i).objectFit === 'contain')")
        images = page.locator('main img[src]')
        images.evaluate_all('imgs => Promise.all(imgs.map(i => { i.loading = "eager"; return i.decode(); }))')
        assert images.evaluate_all('imgs => imgs.every(i => i.naturalWidth && i.alt && Number(i.getAttribute("width")) > 0)')
        assert_fit(page)

        for section, label in outline.items():
            link = page.locator('.tf-outline').get_by_role('link', name=label, exact=True)
            link.click()
            anchor_visible(page, '#' + section)
            expect(link).to_have_attribute('aria-current', 'location')
        load(page, '#material-balance')
        anchor_visible(page, '#material-balance')
        assert_balance(page)
        summary = page.locator('#material-balance summary')
        summary.press('Enter')
        expect(page.locator('.web-balance-table tbody tr')).to_have_count(11)
        expect(page.locator('.web-balance-table')).to_be_visible()
        assert_fit(page)
        print(f'{width}px. Route, images, sticky navigation and mass balance OK', flush=True)

    page.set_viewport_size({'width': 390, 'height': 844})
    check_gallery(page)
    load(page, '#contaminant-surface')
    anchor_visible(page, '#contaminant-surface')
    page.locator('#contaminant-surface summary').press('Enter')
    expect(page.locator('#contaminant-surface details')).to_have_attribute('open', '')
    load(page, '#granule-quality')
    quality = page.locator('#granule-quality')
    expect(quality.locator('.tf-quality-metrics')).to_contain_text('190 °C / 2,16 кг')
    with page.expect_popup() as image:
        quality.locator('.quality-visual-open').press('Enter')
    assert image.value.url.endswith('/assets/presentation/quality-sequence.svg')
    image.value.close()
    quality.get_by_text('Методики и источники', exact=True).press('Enter')
    expect(quality.locator('.tf-sources a:visible')).to_have_count(5)
    load(page, '#applications')
    page.locator('#applications summary').press('Enter')
    expect(page.locator('[data-technology-application]:visible')).to_have_count(5)
    load(page, '#about-era')
    expect(page.locator('#about-era')).to_have_attribute('open', '')
    launch = page.locator('#discuss [data-project-request]')
    target = urlsplit(launch.evaluate('a => a.href'))
    assert target.path.endswith('/contacts') and target.fragment == 'project-form' and parse_qs(target.query)['topic']
    launch.press('Enter')
    request = page.locator('#project-request')
    expect(request).to_be_visible()
    expect(request.locator('[data-request-topic]')).to_have_value(parse_qs(target.query)['topic'][0])
    expect(request.locator('input[type=file]')).to_have_count(1)
    page.keyboard.press('Escape')
    expect(request).to_be_hidden()

    response = page.request.get(base + '/technology/')
    parser = LinkParser()
    parser.feed(response.text())
    assert not parser.in_link
    links = page.locator('.tf-page a[href]').evaluate_all('items => [...new Set(items.map(a => a.href))]')
    for href in links:
        parsed = urlsplit(href)
        if href.startswith(base + '/'):
            r = page.request.head(href)
            assert r.status == 200, (href, r.status)
            if parsed.fragment:
                destination = page.request.get(href)
                assert f'id="{parsed.fragment}"' in destination.text(), href

    no_js = browser.new_page(java_script_enabled=False, reduced_motion='reduce', viewport={'width': 390, 'height': 844})
    no_js.goto(base + '/technology/')
    expect(no_js.locator('[data-contaminant-row]:visible')).to_have_count(9)
    expect(no_js.locator('#material-balance input[type=range]')).to_be_disabled()
    no_js.locator('#material-balance summary').click()
    expect(no_js.locator('.web-balance-table')).to_be_visible()
    no_js.locator('.tf-outline a[href="#applications"]').press('Enter')
    no_js.wait_for_url(base + '/technology/#applications')
    assert_fit(no_js)
    assert not errors, errors
    assert not failed, failed
    browser.close()
    print('KAIR navigation, pause, original and fullscreen; native disclosures and request; all local links and no-JS fallback OK', flush=True)
