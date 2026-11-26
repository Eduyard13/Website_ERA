"""Grouped sticky navigation and legacy anchors on the three ERA pages."""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
pages = json.loads((root / 'content/section-navigation.json').read_text())['pages']
base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3287/Website_ERA').rstrip('/')
out = Path(os.environ.get('ERA_SCREENSHOT_DIR', '/tmp/era-section-navigation'))
out.mkdir(parents=True, exist_ok=True)
sizes = [(1920, 1080), (1440, 900), (1280, 800), (1024, 768), (768, 1024), (390, 844), (360, 800)]
nav = '[data-section-navigation]'
active = nav + ' [aria-current="location"]'
rail = '.page-progress-rail'
names = {'/': 'home', '/technology/': 'technology', '/economics/': 'economics'}
anchors = {
    '/technology/': {'material-balance': 'raw-material', 'technology-next': 'standalone-equipment',
                     'detail-title': 'standalone-equipment', 'discuss': 'standalone-equipment'},
    '/': {'resource-business-title': 'russia-market', 'feedstock-methodology': 'raw-material'},
    '/economics/': {'material-balance': 'raw-material', 'product-quality': 'raw-material', 'market': 'raw-material',
                    'monthly-result': 'production-constructor',
                    'econ-curve-title': 'project-resilience', 'calculation-conditions': 'economics-project'},
}
is_aligned = """id => {
    const item = document.getElementById(id).getBoundingClientRect();
    const bottom = document.querySelector('[data-section-navigation]').getBoundingClientRect().bottom;
    const atHero = id === 'economic-case' && scrollY < 2 && Math.abs(item.top - bottom) < 2;
    return atHero || Math.abs(item.top - bottom - 16) < 2;
}"""


def await_page(page, path):
    response = page.goto(base + path)
    if response is not None:
        assert response.status == 200
    page.wait_for_selector(rail + ' a', state='attached')


def check_group(page, target):
    if target is None:
        page.wait_for_function(f'document.querySelector({json.dumps(active)}) === null')
    else:
        page.wait_for_function(f"""target => {{
            const link = document.querySelector({json.dumps(active)});
            const marker = document.querySelector('.page-progress-rail [aria-current="location"]');
            if (link?.hash !== '#' + target || !marker) return false;
            const item = link.getBoundingClientRect(), track = link.parentElement.getBoundingClientRect();
            return link.dataset.sectionGroup.split(' ').includes(marker.hash.slice(1)) &&
                item.left >= track.left - 1 && item.right <= track.right + 1;
        }}""", arg=target)
        assert page.locator(active).count() == 1


def check_sticky(page):
    assert page.evaluate("""() => {
        const head = document.querySelector('.site-header').getBoundingClientRect();
        const menu = document.querySelector('[data-section-navigation]').getBoundingClientRect();
        return Math.abs(head.bottom - menu.top) < 1 && menu.height >= 44 &&
            document.documentElement.scrollWidth <= innerWidth;
    }""")


def check_target(page, target, height):
    assert urlsplit(page.url).fragment == target
    page.wait_for_function(is_aligned, arg=target, timeout=6000)
    heading = page.locator(f'#{target}').evaluate("""e => {
        const h = e.matches('h1,h2,h3,details') ? e : e.querySelector('h1,h2,h3');
        return h?.getBoundingClientRect().top;
    }""")
    if heading is not None:
        menu = page.locator(nav).bounding_box()
        assert menu['y'] + menu['height'] < heading < height, (target, heading)
    check_sticky(page)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    errors, bad_responses, tested = [], [], []
    for width, height in sizes:
        mobile = width <= 390
        context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce',
                                      has_touch=mobile, is_mobile=mobile)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda r: bad_responses.append((r.status, r.url)) if r.url.startswith(base) and r.status >= 400 else None)
        for spec in pages:
            route, groups = spec['route'], spec['groups']
            await_page(page, route)
            links = page.locator(nav + ' a')
            assert links.all_text_contents() == [g['label'] for g in groups]
            assert links.evaluate_all('as => as.map(a => a.hash.slice(1))') == [g['target'] for g in groups]
            assert page.locator(nav + ' + main').count() == 1
            assert page.locator('.tf-outline,.ec-toc').count() == 0
            assert page.locator(rail + ' a').count() == (11 if route == '/economics/' else 12)
            check_sticky(page)
            check_group(page, 'economic-case' if route == '/economics/' else None)
            if page.locator('[data-cookie-choice="deny"]').is_visible():
                page.locator('[data-cookie-choice="deny"]').click()
            for index, group in enumerate(groups):
                target = group['target']
                if mobile:
                    links.nth(index).tap()
                else:
                    links.nth(index).click()
                check_target(page, target, height)
                check_group(page, target)
                if width in [390, 1440] and index == 3:
                    page.mouse.move(0, 0)
                    page.screenshot(path=str(out / f'{names[route]}-{width}.png'))
            if width in [390, 1440]:
                # History restores the earlier section without changing the bookmarked hash.
                page.go_back()
                check_target(page, groups[-2]['target'], height)
                check_group(page, groups[-2]['target'])
                page.go_forward()
                check_target(page, groups[-1]['target'], height)
                check_group(page, groups[-1]['target'])
                for group in reversed(groups):
                    target = group['target']
                    for fragment in group['activeSections']:
                        if route == '/' and fragment == 'economics':
                            continue  # The rail uses resource-business-title on the homepage.
                        old_hash = urlsplit(page.url).fragment
                        page.evaluate("""id => {
                            const item = document.getElementById(id);
                            window.scrollBy(0,item.getBoundingClientRect().top -
                                document.querySelector('[data-section-navigation]').getBoundingClientRect().bottom - 16);
                        }""", fragment)
                        check_group(page, target)
                        assert urlsplit(page.url).fragment == old_hash
                        position = page.locator(nav + ' > div').evaluate('e => e.scrollLeft')
                        page.locator(f'{rail} a[href="#{fragment}"]').click()
                        check_group(page, target)
                        assert urlsplit(page.url).fragment == fragment
                        assert page.locator(nav + ' > div').evaluate('e => e.scrollLeft') == position
                for target in [g['target'] for g in groups]:
                    await_page(page, route + '#' + target)
                    check_target(page, target, height)
                    check_group(page, target)
                for fragment, target in anchors[route].items():
                    await_page(page, route + '#' + fragment)
                    check_group(page, target)
                    if fragment in ['feedstock-methodology', 'calculation-conditions']:
                        assert page.locator(f'#{fragment}').get_attribute('open') is not None
                page.evaluate('window.scrollTo(0,document.documentElement.scrollHeight)')
                check_group(page, groups[-1]['target'] if route != '/' else None)
            tested.append({'page': route, 'width': width, 'height': height, 'links': len(groups)})
        context.close()
        print(f'{width}×{height} passed all 21 links on the three pages', flush=True)

    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    await_page(page, '/technology/')
    link = page.locator(nav + ' a').last
    link.press('Tab')
    page.keyboard.press('Shift+Tab')
    assert link.evaluate('e => e.matches(":focus-visible") && getComputedStyle(e).outlineStyle === "solid"')
    assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior') == 'smooth'
    page.keyboard.press('Enter')
    check_target(page, 'standalone-equipment', 900)
    page.emulate_media(reduced_motion='reduce')
    page.set_viewport_size({'width': 768, 'height': 550})
    check_sticky(page)
    assert page.evaluate('getComputedStyle(document.documentElement).scrollBehavior') == 'auto'
    link.press('Enter')
    check_target(page, 'standalone-equipment', 550)
    check_group(page, 'standalone-equipment')
    await_page(page, '/')
    page.evaluate('location.hash = "economics"')
    page.wait_for_url(lambda url: urlsplit(url).path.rstrip('/').endswith('/economics') and urlsplit(url).fragment == 'economics')
    check_group(page, 'economics')
    page.locator('#economic-case').get_by_role('link', name='Условия расчёта', exact=True).click()
    check_target(page, 'calculation-conditions', 550)
    check_group(page, 'economics-project')
    assert page.locator('#calculation-conditions').get_attribute('open') is not None
    page.close()

    plain = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce', java_script_enabled=False)
    for spec in pages:
        assert plain.goto(base + spec['route']).status == 200
        for group in spec['groups']:
            target = group['target']
            plain.locator(f'{nav} a[href="#{target}"]').press('Enter')
            assert urlsplit(plain.url).fragment == target
            assert plain.evaluate(is_aligned, target), (spec['route'], target)
    browser.close()
    assert not errors, errors
    assert not bad_responses, bad_responses
    (out / 'acceptance.json').write_text(json.dumps({'viewports': tested, 'errors': errors, 'failed': bad_responses},
                                                  ensure_ascii=False, indent=2) + '\n')
