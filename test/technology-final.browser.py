"""Exercise Technology layout and public controls without submitting a request."""
import os
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3181').rstrip('/')
widths = [320, 390, 768, 1024, 1440, 1920]
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
    page.wait_for_selector('[data-tf-scenario="50"]:not([disabled])', state='attached')
    page.wait_for_selector('.page-progress-rail a')


def assert_fit(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    components = page.locator('.tf-container,.tf-contaminant,.tf-process-route,.tf-products,.tf-quality-metrics,.tf-applications-grid,.tf-balance')
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
    choices = page.locator('[data-tf-scenario]')
    assert choices.evaluate_all('buttons => buttons.map(b => b.dataset.tfScenario)') == ['30', '40', '50']
    expect(choices.last).to_have_attribute('aria-pressed', 'true')
    for index, (value, polymer, inclusions) in enumerate([(30, 1050, 450), (40, 900, 600), (50, 750, 750)]):
        button = choices.nth(index)
        if value == 30:
            button.press('Enter')
        else:
            button.click()
        expect(button).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('[data-tf-scenario][aria-pressed="true"]')).to_have_count(1)
        for selector, expected in [('[data-tf-polymer]', polymer), ('[data-tf-inclusions]', inclusions)]:
            assert int(''.join(page.locator(selector).inner_text().split())) == expected
        expect(page.locator('.tf-balance-input strong')).to_have_text('1 500 кг/ч')
        expect(page.locator('.tf-baseline > strong')).to_have_text('750 кг/ч')
        assert page.locator('.tf-balance-bar').evaluate('bar => bar.style.getPropertyValue("--polymer")') == str(100 - value) + '%'


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
        expect(page.locator('main h1')).to_have_text('Загрязнение не определяет будущее полимера.')
        hero = page.locator('#technology-intro')
        expect(hero.locator('.tf-hero-hook')).to_have_text('Его будущее определяет технология.')
        expect(hero.locator('figure, figcaption')).to_have_count(0)
        hero.get_by_role('link', name='Как работает технология').click()
        anchor_visible(page, '#raw-material')
        expect(page.locator('[data-feedstock-type]')).to_have_count(5)
        expect(page.locator('[data-contaminant-row]:visible')).to_have_count(9)
        expect(page.locator('[data-technology-output]')).to_have_count(3)
        expect(page.locator('[data-technology-application]:visible')).to_have_count(5)
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
        expect(page.locator('#material-balance summary,.web-balance-table')).to_have_count(0)
        assert_fit(page)
        print(f'{width}px. Route, images, sticky navigation and mass balance OK', flush=True)

    page.set_viewport_size({'width': 390, 'height': 844})
    check_gallery(page)
    load(page, '#contaminant-surface')
    anchor_visible(page, '#contaminant-surface')
    expect(page.locator('#contaminant-surface details')).to_have_count(0)
    page.locator('#contaminant-surface a').press('Enter')
    anchor_visible(page, '#hot-washing')
    expect(page.locator('#hot-washing .tf-water-loop > li')).to_have_count(4)
    expect(page.locator('#granulation .tf-scale-grid article')).to_have_count(2)
    load(page, '#granule-quality')
    quality = page.locator('#granule-quality')
    expect(quality.locator('.tf-quality-metrics')).to_contain_text('190 °C / 2,16 кг')
    expect(quality.locator('.tf-quality-metrics')).to_contain_text('3–5%')
    expect(quality.locator('details')).to_have_count(0)
    load(page, '#applications')
    expect(page.locator('#applications details')).to_have_count(0)
    expect(page.locator('[data-technology-application]:visible')).to_have_count(5)
    load(page, '#about-era')
    anchor_visible(page, '#about-era')
    launch = page.locator('#discuss [data-project-request]')
    target = urlsplit(launch.evaluate('a => a.href'))
    assert target.path.endswith('/contacts') and target.fragment == 'project-form' and parse_qs(target.query)['topic']
    expect(launch).to_have_text('Подобрать решение под ваше сырьё')

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
    expect(no_js.locator('[data-tf-scenario="50"]')).to_be_disabled()
    expect(no_js.locator('[data-tf-scenario="50"]')).to_have_attribute('aria-pressed', 'true')
    expect(no_js.locator('.tf-baseline > strong')).to_have_text('750 кг/ч')
    expect(no_js.locator('[data-technology-application]:visible')).to_have_count(5)
    no_js.locator('.tf-outline a[href="#applications"]').press('Enter')
    no_js.wait_for_url(base + '/technology/#applications')
    assert_fit(no_js)
    assert not errors, errors
    assert not failed, failed
    browser.close()
    print('KAIR navigation, pause, original and fullscreen, all local links and no-JS content OK', flush=True)
