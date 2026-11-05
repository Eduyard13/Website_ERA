"""Mini-line catalogue, details, source media and download acceptance checks."""
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
import json
import os

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3020/Website_ERA').rstrip('/')
prefix = urlparse(base).path
out = Path(os.environ.get('ERA_SCREENSHOT_DIR', '/tmp/era-mini-review'))
out.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'],
                              proxy={'server': proxy, 'bypass': '127.0.0.1,localhost'} if proxy else None)
    for width in [320, 390, 768, 1024, 1440, 1920]:
        context = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/catalog/lines/')
        page.wait_for_function('document.querySelector("#line-result").textContent.includes("4")')
        cards = page.locator('[data-line]')
        assert cards.count() == 4
        assert cards.evaluate_all('es => es.map(e => e.tagName)') == ['A', 'A', 'ARTICLE', 'ARTICLE']
        boxes = [cards.nth(i).bounding_box() for i in range(4)]
        if width >= 768:
            assert abs(boxes[0]['y'] - boxes[1]['y']) < 1
            assert boxes[0]['x'] < boxes[1]['x']
            assert abs(boxes[2]['y'] - boxes[3]['y']) < 1
            assert boxes[2]['y'] >= boxes[0]['y'] + boxes[0]['height']
        else:
            assert all(boxes[i + 1]['y'] > boxes[i]['y'] for i in range(3))
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        mini = cards.nth(0)
        image = mini.locator('img')
        image.evaluate('(e) => e.decode()')
        # Width-descriptor srcsets expose rounded, density-corrected natural sizes.
        assert image.evaluate('(e) => Math.abs(e.naturalWidth - e.naturalHeight * 1.5) <= 1.5')
        assert image.evaluate('(e) => getComputedStyle(e).objectFit') == 'contain'
        rect = image.bounding_box()
        assert abs(rect['width'] / rect['height'] - 1.5) < .01
        assert mini.locator('dt').count() == 6
        if width in [390, 1440]:
            page.screenshot(path=str(out / f'catalogue-{width}.png'), full_page=True)
        # The image, heading and characteristics all activate the same native link.
        targets = ['img', 'h3', '.line-card-metrics'] if width == 1440 else ['h3']
        for target in targets:
            page.locator('[data-line-id="separatsiya-01"] ' + target).click()
            page.wait_for_url('**/catalog/lines/separatsiya-01*')
            assert page.locator('h1').inner_text() == 'Линия сухой сепарации плёнок и пакетов'
            page.go_back()
        # Native keyboard access and the existing elegant gold outline.
        mini = page.locator('[data-line-id="separatsiya-01"]')
        mini.focus()
        assert mini.evaluate('(e) => document.activeElement === e')
        assert mini.evaluate('(e) => Number(getComputedStyle(e, "::after").opacity)') == 1
        page.keyboard.press('Enter')
        page.wait_for_url('**/catalog/lines/separatsiya-01*')
        page.locator('main img').evaluate_all('es => es.forEach(e => e.loading = "eager")')
        page.wait_for_function('Array.from(document.querySelectorAll("main img")).every(e => e.complete && e.naturalWidth > 0)')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('.site-header .primary-link[data-current-section=true]').get_attribute('href') == prefix + '/catalog'
        assert page.locator('.film-line>section[id]').count() == 10
        for label in ['225 кВт', '157,5 кВт', '600–700 кг/ч', '17,75 × 11,75 м', '3 человека в смену']:
            assert label in page.locator('main').inner_text()
        if width in [390, 1440]:
            # Paint the long page's source pictures before the full-page capture.
            for img in page.locator('main img').all():
                img.scroll_into_view_if_needed()
                img.evaluate('(e) => e.decode()')
                page.wait_for_timeout(50)
            page.evaluate('window.scrollTo(0,0)')
            page.screenshot(path=str(out / f'mini-line-{width}.png'), full_page=True)
        page.locator('a[href="#composition"]').first.click()
        assert page.url.endswith('#composition')
        page.locator('[data-line-source-diagram] summary').click()
        layout = page.locator('#composition .line-layout .media-open')
        layout.click()
        viewer = page.locator('#media-viewer')
        assert viewer.is_visible()
        assert '01–11' in page.locator('#viewer-title').inner_text()
        assert 'стр. 5' in page.locator('#viewer-source').inner_text()
        assert page.locator('#viewer-product').get_attribute('href') == prefix + '/catalog/lines/separatsiya-01'
        page.keyboard.press('ArrowRight')
        assert page.locator('#viewer-title').inner_text() != 'Состав мини-линии с номерами позиций 01–11'
        page.keyboard.press('Escape')
        assert not viewer.is_visible()
        page.locator('#specs details summary').click()
        assert page.locator('.mini-specification-table').is_visible()
        assert page.locator('.mini-specification-table tbody tr').count() == 13
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#raw-materials details summary').click()
        assert page.locator('#raw-materials details').get_attribute('open') is not None
        assert page.locator('#specs details').get_attribute('open') is not None
        pdf = page.locator('#documents .document-links a')
        response = context.request.get(base + '/documents/technical/era-separatsiya-01-mini-technical-description.pdf')
        assert response.status == 200 and response.body().startswith(b'%PDF-')
        assert pdf.get_attribute('href') == prefix + '/documents/technical/era-separatsiya-01-mini-technical-description.pdf'
        assert page.locator('#documents a[download]').get_attribute('download').endswith('.pdf')
        assert page.locator('#documents .document-copy').bounding_box()['width'] >= 200
        if width in [390, 1440]:
            page.locator('#documents').screenshot(path=str(out / f'document-{width}.png'))
        # The two unfinished lines remain visible, non-interactive and unavailable.
        page.goto(base + '/catalog/lines/')
        page.locator('[name="group"]').select_option('Сепарация')
        assert page.locator('[data-line]:visible').count() == 3
        page.locator('[name="group"]').select_option('Мойка')
        assert page.locator('[data-line]:visible').count() == 1
        page.locator('[data-line-reset]').click()
        assert page.locator('[data-line]:visible').count() == 4
        for slug in ['separatsiya-03', 'moyka-plenki']:
            assert page.locator(f'[data-line-id="{slug}"] a, [data-line-id="{slug}"] button').count() == 0
            assert context.request.get(base + '/catalog/lines/' + slug + '/').status == 404
        assert not errors, errors
        results.append({'width': width, 'layout': 'two columns' if width >= 768 else 'stacked',
                        'images': 'loaded, proportional', 'viewer': 'passed', 'pdf': 'passed', 'errors': errors})
        context.close()
    browser.close()
(out / 'browser-results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(results, ensure_ascii=False))
