"""Responsive homepage, native map, project links and owner-supplied video."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3193/Website_ERA').rstrip('/')
out = Path(os.environ.get('ERA_SCREENSHOT_DIR', '/tmp/era-homepage/browser'))
out.mkdir(parents=True, exist_ok=True)
widths = [320, 360, 390, 768, 1024, 1280, 1440, 1920]
categories = ['household', 'packaging', 'agro', 'construction', 'bigbags']
title = 'От нефти к полимерам. От полимеров — снова к нефти.'
subtitle = 'Отходы одного цикла — сырьё для следующего.'
sections = ['hero', 'problem', 'feedstocks', 'process', 'strengths', 'products', 'market', 'business',
            'integration', 'equipment', 'kair', 'contact']
video_manifest = json.loads(Path('docs/homepage-media-assets-0.31.json').read_text())
errors, failed, requested_videos, submitted = [], [], [], []
screenshot_style = '.site-header,.page-progress-rail,#quick-contact { visibility:hidden !important; }'


def load(page, fragment=''):
    page.goto(base + '/' + fragment)
    page.wait_for_selector('[data-market-ready=true]')
    page.wait_for_selector('[data-feedstock-ready=true]')


def assert_selection(page, key, name, volume=None):
    panel = page.locator('[data-market-record]:visible')
    assert panel.count() == 1 and panel.get_attribute('data-market-record') == key
    assert panel.locator('[data-market-name]').inner_text() == name
    selected = page.locator('[data-market-feature][aria-pressed=true]')
    if key == 'national':
        assert selected.count() == 0 and page.locator('[data-market-reset]').get_attribute('aria-pressed') == 'true'
    else:
        assert selected.count() == 1 and selected.get_attribute('data-market-feature') == key
    if volume:
        assert ' '.join(panel.locator('[data-market-volume]').inner_text().split()) == volume


def feature_center(page, key):
    page.locator('[data-market-canvas]').scroll_into_view_if_needed()
    return page.locator(f'[data-market-feature={key}]').evaluate('''feature => {
        const [x,y] = feature.dataset.center.split(',').map(Number);
        const point = new DOMPoint(x, y).matrixTransform(feature.ownerSVGElement.getScreenCTM());
        return [point.x, point.y];
    }''')


def assert_feedstock(page, key):
    assert page.locator('[data-feedstock-chart]').get_attribute('data-view') == key
    assert page.locator('[data-feedstock-detail][data-active]').get_attribute('data-feedstock-detail') == key
    assert page.locator('[data-feedstock-center]:visible').get_attribute('data-feedstock-center') == key


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
        assert_selection(page, 'national', 'Вся Россия', '≈ 5 млн т/год')
        assert_feedstock(page, 'all')
        assert page.locator('.feedstock-legend button').count() == 5
        assert page.locator('[data-home-economics]').count() == 5
        assert page.locator('.feedstock-legend button').evaluate_all('es=>es.every(e=>e.getBoundingClientRect().height>=44)'), width
        layout = page.locator('.market-layout').evaluate('e => getComputedStyle(e).gridTemplateColumns.split(" ").length')
        assert layout == (1 if width < 900 else 2), width
        page.locator('[data-market-mode=regions]').click()
        page.locator('[data-market-select=regions]').select_option('moscow')
        assert_selection(page, 'moscow', 'Москва', '441 833 т/год')
        page.locator('[data-market-mode=districts]').click()
        page.locator('[data-market-select=districts]').select_option('far-east')
        assert_selection(page, 'far-east', 'Дальневосточный ФО')
        page.locator('[data-market-mode=regions]').click()
        assert_selection(page, 'national', 'Вся Россия')
        page.locator('[data-market-mode=districts]').click()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
        assert not requested_videos, requested_videos
        if width in [390, 1440]:
            for selector, name in [('#russia-market','market'),('#russia-feedstocks','feedstocks'),('[data-home-block=business]','economics')]:
                page.locator(selector).screenshot(path=str(out / f'{name}-{width}.jpg'), quality=91, style=screenshot_style)
            page.evaluate('window.scrollTo(0, 0)')
            page.screenshot(path=str(out / f'first-screen-{width}.jpg'), quality=91)
        print('Главная, два слоя карты, изображения и адаптивность:', width, 'OK', flush=True)

    page.set_viewport_size({'width': 1440, 'height': 900})
    load(page)
    chart = page.locator('[data-feedstock-chart]')
    panel = chart.locator('.feedstock-details')
    height = panel.bounding_box()['height']
    live = chart.locator('[data-feedstock-announcement]')
    assert 'button "Бытовые плёнки и пакеты' in chart.locator('.feedstock-legend').aria_snapshot()
    for key in categories:
        choice = chart.locator(f'[data-feedstock-choice={key}]')
        saved_announcement = live.text_content()
        choice.hover()
        assert_feedstock(page, key)
        assert live.text_content() == saved_announcement
        assert abs(panel.bounding_box()['height'] - height) < 1
        choice.click()
        page.mouse.move(0, 0)
        assert_feedstock(page, key)
        assert choice.get_attribute('aria-pressed') == 'true'
        assert 'Что входит' in live.text_content() and 'Где образуется' in live.text_content()
        assert_selection(page, 'national', 'Вся Россия')

    chart.locator('[data-feedstock-choice=all]').press('Enter')
    for key in categories:
        sector=chart.locator(f'[data-feedstock-sector={key}]')
        sector.press('Enter')
        assert_feedstock(page, key)
        sector.press('Space')
        assert_feedstock(page, 'all')

    focused = chart.locator('[data-feedstock-sector=agro]')
    focused.focus()
    page.keyboard.press('Enter')
    assert_feedstock(page, 'agro')
    chart.locator('[data-feedstock-choice=construction]').hover()
    assert_feedstock(page, 'construction')
    page.mouse.move(0, 0)
    assert_feedstock(page, 'agro')
    focused.focus()
    page.keyboard.press('Space')
    assert_feedstock(page, 'all')
    assert focused.evaluate('e=>getComputedStyle(e).transitionDuration') == '0s'

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
    ural = page.locator('[data-market-feature=ural]')
    page.mouse.click(*feature_center(page, 'ural'))
    assert_selection(page, 'ural', 'Уральский ФО', '392 840 т/год')
    assert ural.evaluate('e=>getComputedStyle(e).outlineStyle') == 'none'
    assert ural.evaluate('e=>getComputedStyle(e).webkitTapHighlightColor') == 'rgba(0, 0, 0, 0)'
    ural.press('Tab')
    ural.focus()
    assert ural.evaluate('e=>e.matches(":focus-visible") && getComputedStyle(e.querySelector("path")).strokeDasharray !== "none"')
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
    page.locator('[data-market-select=regions]').select_option('national')
    assert_selection(page, 'national', 'Вся Россия')

    for group in ('districts','regions'):
        page.locator(f'[data-market-mode={group}]').click()
        select=page.locator(f'[data-market-select={group}]')
        for option in select.locator('option').all()[1:]:
            select.select_option(option.get_attribute('value'))
            assert_selection(page, option.get_attribute('value'), option.inner_text())
        page.locator('[data-market-reset]').click()
        assert_selection(page, 'national', 'Вся Россия')

    national_cards = page.locator('.resource-finance-grid').inner_text()
    for key, name, annual, complexes in [('central','Центральный ФО','16,2 млрд ₽',90),('volga','Приволжский ФО','12,1 млрд ₽',67)]:
        link=page.locator(f'[data-market-district-link={key}]')
        link.focus()
        page.keyboard.press('Enter')
        assert_selection(page, key, name)
        record = page.locator('[data-market-record]:visible')
        page.wait_for_function('document.activeElement === document.querySelector("[data-market-record]:not([hidden]) [data-market-name]")')
        assert ' '.join(record.locator('[data-market-annual]').inner_text().split()) == annual
        assert record.locator('[data-market-complexes]').inner_text() == str(complexes)
        assert page.locator('[data-market-select=districts]').input_value() == key
        assert page.locator('.resource-finance-grid').inner_text() == national_cards
        assert page.url.endswith('#russia-market')

    page.locator('.market-method-link').click()
    method = page.locator('#feedstock-methodology[open]')
    assert method.count() == 1 and method.locator('.feedstock-source-grid li').count() == 4
    assert '15 000 т' in ' '.join(method.inner_text().split())
    assert method.locator('a[href^="https:"]').evaluate_all('els=>els.every(a=>a.target==="_blank"&&a.rel.includes("noopener"))')
    assert page.url.endswith('#feedstock-methodology')

    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    load(mobile, '#russia-market')
    mobile.locator('[data-market-mode=regions]').tap()
    mobile.touchscreen.tap(*feature_center(mobile, 'moscow'))
    assert_selection(mobile, 'moscow', 'Москва', '441 833 т/год')
    assert not mobile.locator('[data-market-tooltip]').is_visible()
    assert mobile.locator('[data-market-feature=moscow]').evaluate('e=>getComputedStyle(e).outlineStyle') == 'none'
    mobile.locator('[data-market-reset]').tap()
    assert_selection(mobile, 'national', 'Вся Россия')
    for key in categories:
        sector=mobile.locator(f'[data-feedstock-sector={key}]')
        mobile.locator('.feedstock-ring svg').scroll_into_view_if_needed()
        x,y=sector.evaluate('''e=>{const p=e.getPointAtLength(e.getTotalLength()/2).matrixTransform(e.getScreenCTM());return [p.x,p.y];}''')
        mobile.touchscreen.tap(x,y)
        assert_feedstock(mobile, key)
    mobile.locator('[data-feedstock-choice=all]').tap()
    assert_feedstock(mobile, 'all')
    mobile.close()

    request = page.locator('.resource-hero a[data-project-request]')
    request.click()
    dialog = page.locator('#project-request')
    assert dialog.is_visible() and dialog.locator('[data-request-files]').count() == 1
    assert dialog.locator('[data-request-topic]').input_value() == 'Проект переработки плёночного сырья'
    page.keyboard.press('Escape')
    assert not dialog.is_visible() and request.evaluate('e => e === document.activeElement')
    page.locator('[data-home-economics=profit]').scroll_into_view_if_needed()
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
    assert plain.locator('[data-market-record]:visible [data-market-name]').inner_text() == 'Вся Россия'
    assert plain.locator('.feedstock-legend button:visible').count() == 5
    assert '≈ 250 тыс. т/год' in ' '.join(plain.locator('.feedstock-legend').inner_text().split())
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
