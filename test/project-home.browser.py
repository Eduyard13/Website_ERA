"""Responsive homepage, native map, project links and owner-supplied video."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3193/Website_ERA').rstrip('/')
out = Path(os.environ.get('ERA_SCREENSHOT_DIR', '/tmp/era-homepage/browser'))
out.mkdir(parents=True, exist_ok=True)
widths = [320, 360, 390, 768, 1024, 1280, 1440]
title = 'От нефти к полимерам. От полимеров — снова к нефти.'
subtitle = 'Отходы одного цикла — сырьё для следующего.'
sections = ['hero', 'problem', 'feedstocks', 'process', 'strengths', 'products', 'market', 'business',
            'integration', 'equipment', 'kair', 'contact']
video_manifest = json.loads(Path('docs/homepage-media-assets-0.31.json').read_text())
errors, failed, requested_videos, submitted = [], [], [], []


def load(page, fragment=''):
    page.goto(base + '/' + fragment)
    page.wait_for_selector('[data-market-ready=true]')


def assert_selection(page, key, name, volume=None):
    panel = page.locator('[data-market-record]:visible')
    assert panel.count() == 1 and panel.get_attribute('data-market-record') == key
    assert panel.locator('[data-market-name]').inner_text() == name
    assert page.locator(f'[data-market-feature={key}]').get_attribute('aria-pressed') == 'true'
    if volume:
        assert ' '.join(panel.locator('[data-market-volume]').inner_text().split()) == volume


def feature_center(page, key):
    page.locator('[data-market-canvas]').scroll_into_view_if_needed()
    return page.locator(f'[data-market-feature={key}]').evaluate('''feature => {
        const [x,y] = feature.dataset.center.split(',').map(Number);
        const point = new DOMPoint(x, y).matrixTransform(feature.ownerSVGElement.getScreenCTM());
        return [point.x, point.y];
    }''')


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failed.append((response.status, response.url))
            if response.status >= 400 and response.url.startswith(base) else None)
    page.on('request', lambda request: requested_videos.append(request.url) if request.url.endswith('.mp4') else None)
    page.route('**/formsubmit.co/**', lambda route: (submitted.append(route.request.url), route.abort()))

    for width in widths:
        page.set_viewport_size({'width': width, 'height': 844 if width < 768 else 900})
        load(page)
        images = page.locator('[data-resource-home] img[src]')
        assert images.evaluate_all('''images => Promise.all(images.map(async img => {
            img.loading = 'eager';
            await img.decode();
            return !!img.alt && img.naturalWidth > 0 && img.width > 0;
        })).then(results => results.every(Boolean))'''), width
        hero = page.locator('#resource')
        page.evaluate('document.fonts.ready')
        assert page.locator('h1').count() == 1 and ' '.join(hero.locator('h1').inner_text().split()) == title
        quote = hero.locator('.resource-hero-subtitle')
        assert quote.inner_text() == subtitle
        assert quote.evaluate('''e => {
            const range = document.createRange();
            range.selectNodeContents(e);
            return getComputedStyle(e).fontStyle === 'italic' && range.getClientRects().length === 1;
        }'''), width
        assert page.evaluate('''[...document.fonts].filter(font => font.family === 'IBM Plex Sans' && font.status === 'loaded').length''') == 2
        art = hero.locator('.resource-hero-grid > img[data-media-slot=heroHook]')
        assert art.get_attribute('src').endswith('/polymers-cycle.webp') and art.get_attribute('fetchpriority') == 'high'
        assert hero.locator('figcaption').count() == 0
        assert art.evaluate('img => getComputedStyle(img).maskImage !== "none" && getComputedStyle(img).borderWidth === "0px"')
        picture, copy = art.bounding_box(), hero.locator('.resource-hero-copy').bounding_box()
        if width < 1024:
            assert picture['y'] >= copy['y'] + copy['height'], width
        else:
            header = hero.bounding_box()
            assert abs(picture['y'] - header['y']) < 1 and abs(picture['height'] - header['height']) < 1, width
            assert picture['x'] + picture['width'] / 2 > header['x'] + header['width'] / 2, width
        assert hero.get_by_role('link', name='Изучить технологию').get_attribute('href').endswith('/technology')
        assert hero.get_by_role('link', name='Смотреть оборудование').get_attribute('href').endswith('/catalog')
        assert page.locator('[data-home-block]').evaluate_all('nodes => nodes.map(e => e.dataset.homeBlock)') == sections
        assert page.locator('.page-progress-rail a').count() == len(sections)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        assert page.locator('.primary-nav a').all_text_contents() == ['О проекте', 'Технология', 'Оборудование', 'Экономика', 'КАИР']
        assert page.locator('[data-market-districts] path.market-district-area').count() == 8
        assert page.locator('[data-market-regions] .market-pin').count() == 10
        assert_selection(page, 'central', 'Центральный ФО', '1 350 720 т/год')
        layout = page.locator('.market-layout').evaluate('e => getComputedStyle(e).gridTemplateColumns.split(" ").length')
        assert layout == (1 if width < 900 else 2), width
        page.locator('[data-market-mode=regions]').click()
        page.locator('[data-market-select=regions]').select_option('moscow')
        assert_selection(page, 'moscow', 'Москва', '441 833 т/год')
        page.locator('[data-market-mode=districts]').click()
        page.locator('[data-market-select=districts]').select_option('far-east')
        assert_selection(page, 'far-east', 'Дальневосточный ФО')
        page.locator('[data-market-mode=regions]').click()
        assert_selection(page, 'moscow', 'Москва')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        assert not requested_videos, requested_videos
        if width in [390, 1440]:
            page.locator('#russia-market').screenshot(path=str(out / f'market-{width}.jpg'), quality=91)
            page.evaluate('window.scrollTo(0, 0)')
            page.screenshot(path=str(out / f'first-screen-{width}.jpg'), quality=91)
        print('Главная, два слоя карты, изображения и адаптивность:', width, 'OK', flush=True)

    load(page, '#russia-market')
    page.locator('[data-market-mode=districts]').click()
    tooltip = page.locator('[data-market-tooltip]')
    x, y = feature_center(page, 'volga')
    page.mouse.move(x, y)
    tooltip.wait_for(state='visible')
    assert 'Приволжский ФО' in tooltip.inner_text()
    page.mouse.click(x, y)
    assert_selection(page, 'volga', 'Приволжский ФО')
    assert not tooltip.is_visible()
    region_mode = page.locator('[data-market-mode=regions]')
    region_mode.focus()
    page.keyboard.press('Enter')
    moscow = page.get_by_role('button', name='Москва', exact=True)
    moscow.focus()
    assert tooltip.is_visible() and 'Москва' in tooltip.inner_text()
    page.keyboard.press('Escape')
    assert not tooltip.is_visible()
    page.keyboard.press('Space')
    assert_selection(page, 'moscow', 'Москва', '441 833 т/год')
    page.locator('.market-method-details summary').first.click()
    assert '15 000 т' in ' '.join(page.locator('.market-method-details[open]').first.inner_text().split())
    assert page.locator('.market-method-details[open] > div').evaluate('e => getComputedStyle(e).position') == 'static'

    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    load(mobile, '#russia-market')
    mobile.locator('[data-market-mode=regions]').tap()
    mobile.touchscreen.tap(*feature_center(mobile, 'moscow'))
    assert_selection(mobile, 'moscow', 'Москва', '441 833 т/год')
    assert not mobile.locator('[data-market-tooltip]').is_visible()
    mobile.close()

    request = page.locator('.resource-hero a[data-project-request]')
    request.click()
    dialog = page.locator('#project-request')
    assert dialog.is_visible() and dialog.locator('[data-request-files]').count() == 1
    assert dialog.locator('[data-request-topic]').input_value() == 'Проект переработки плёночного сырья'
    page.keyboard.press('Escape')
    assert not dialog.is_visible() and request.evaluate('e => e === document.activeElement')
    page.locator('[data-home-economics=complex]').scroll_into_view_if_needed()
    page.get_by_role('link', name='Подробнее об экономике проекта').click()
    assert page.locator('[data-economics-page]').count() == 1
    assert page.locator('.primary-nav [aria-current=page]').inner_text() == 'Экономика'

    for anchor in ['market', 'economics', 'econ-curve-title', 'econ-monthly-price', 'market-tab-film']:
        page.goto(base + '/#' + anchor)
        page.wait_for_url(lambda url: '/economics' in str(url) and str(url).endswith('#' + anchor))
    for anchor in ['control-title', 'material-balance']:
        page.goto(base + '/#' + anchor)
        page.wait_for_url(lambda url: '/technology' in str(url) and str(url).endswith('#' + anchor))

    load(page)
    page.locator('.resource-video-details summary').click()
    for item in video_manifest['inputs']:
        if item['format'] == 'MP4':
            source = page.locator(f'[data-video-slot={item["slot"]}] source').first
            assert source.get_attribute('src').endswith('/assets/' + item['file'])
    play = page.locator('[data-resource-play]')
    play.focus()
    page.keyboard.press('Enter')
    page.wait_for_function('document.querySelector("[data-video-slot=promo] video").currentTime > .15')
    assert not play.is_visible()
    for slot, duration, seek in [('promo', 296, 75), ('cleaningDemo', 100.08, 30)]:
        video = page.locator(f'[data-video-slot={slot}] video')
        assert video.get_attribute('preload') == 'none' and video.get_attribute('autoplay') is None
        assert video.get_attribute('controls') is not None and video.get_attribute('loop') is None
        video.evaluate('e => e.play()')
        page.wait_for_function('(slot) => document.querySelector(`[data-video-slot=${slot}] video`).currentTime > .15', arg=slot)
        assert abs(video.evaluate('e => e.duration') - duration) < .1 and not video.evaluate('e => e.muted')
        video.evaluate('(e,t) => {e.pause();e.currentTime=t;}', seek)
        page.wait_for_function('([slot,t]) => Math.abs(document.querySelector(`[data-video-slot=${slot}] video`).currentTime-t)<.5', arg=[slot, seek])
    page.locator('[data-video-slot=promo] video').evaluate('e => e.play()')
    page.locator('[data-video-slot=cleaningDemo] video').evaluate('e => e.play()')
    assert page.locator('[data-video-slot=promo] video').evaluate('e => e.paused')

    zoomed = browser.new_page(viewport={'width': 450, 'height': 900}, device_scale_factor=3.2)
    load(zoomed)
    assert zoomed.evaluate('document.documentElement.scrollWidth <= innerWidth')
    zoomed.close()

    plain = browser.new_page(java_script_enabled=False, viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    plain.goto(base + '/#russia-market')
    assert plain.locator('[data-home-block]').count() == len(sections)
    assert plain.locator('[data-market-record]:visible [data-market-name]').inner_text() == 'Центральный ФО'
    plain.get_by_text('Оценки по всем округам и регионам', exact=True).press('Enter')
    assert plain.locator('.market-table-wrap tbody tr:visible').count() == 18
    assert plain.get_by_role('link', name='Подробнее об экономике проекта').get_attribute('href').endswith('/economics')
    assert plain.evaluate('document.documentElement.scrollWidth <= innerWidth')
    plain.close()

    assert not errors, errors
    assert not failed, failed
    assert not submitted, submitted
    (out / 'results.json').write_text(json.dumps({'widths': widths, 'sections': sections, 'districts': 8, 'regions': 10,
        'pointer': True, 'keyboard': True, 'touch': True, 'legacyAnchors': True, 'noJS': True, 'videos': True}, ensure_ascii=False, indent=2))
    browser.close()
    print('Карта, клавиатура, касание, прежние якоря, форма и оба видеоролика: OK', flush=True)
