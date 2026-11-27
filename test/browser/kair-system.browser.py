"""KAIR visual acceptance, all interactive states and preserved legacy links."""
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3289/Website_ERA').rstrip('/')
out = Path(os.environ.get('ERA_SCREENSHOT_DIR', '/tmp/era-kair-stage2'))
out.mkdir(parents=True, exist_ok=True)
viewport_sizes = [(1920, 1080), (1640, 900), (1440, 900), (1280, 800), (768, 1024), (390, 844), (360, 800)]
sections = ['value', 'logic', 'scenarios', 'process', 'screens', 'functions', 'hardware', 'project', 'contact']
case_groups = {
    'control': [1, 2, 3, 12], 'protection': [6, 7, 8, 9, 10, 24], 'quality': [4, 5, 22, 23],
    'service': [11, 13, 17, 18], 'washing': [14, 15, 16], 'water': [19, 20, 21],
}
function_groups = {'process': 5, 'protection': 6, 'visibility': 5, 'washing': 6, 'water': 4, 'local': 3}
screens = ['01', '25', '26', '27', '28', '22', '24']
nav = '[data-kair-section-nav]'
rail = '.page-progress-rail'
ready = '[data-kair-system][data-ready=true]'
screenshot_style = '.site-header,.ka-outline,.page-progress-rail,.page-progress-tooltip,#quick-contact { visibility:hidden!important; }'
rates_source = 'https://raw.githubusercontent.com/Eduyard13/Website_ERA/refs/heads/data/cbr-rates/cbr.json'
errors, failed, external, results = [], [], [], []
state_checks = {'logic': [], 'scenarios': [], 'routes': [], 'functions': [], 'screens': []}


def load(page, fragment=''):
    response = page.goto(base + '/automation/' + fragment, wait_until='domcontentloaded')
    if response:
        assert response.status == 200
    page.wait_for_selector(ready)


def check_nav(page, section):
    upper = 'project' if section == 'contact' else section
    page.wait_for_function("""({top, side}) =>
        document.querySelector('[data-kair-section-nav] [aria-current=location]')?.hash === '#kair-' + top &&
        document.querySelector('.page-progress-rail [aria-current=location]')?.hash === '#kair-' + side
        """, arg={'top': upper, 'side': section})
    assert page.evaluate("""() => {
        const bar = document.querySelector('[data-kair-section-nav]').getBoundingClientRect();
        const head = document.querySelector('.site-header').getBoundingClientRect();
        const link = document.querySelector('[data-kair-section-nav] [aria-current=location]');
        const item = link.getBoundingClientRect(), row = link.parentElement.getBoundingClientRect();
        return Math.abs(bar.top-head.bottom)<1 && item.left>=row.left-1 && item.right<=row.right+1;
    }""")


def check_anchor(page, anchor):
    page.wait_for_function("""id => {
        const target = document.getElementById(id);
        const nav = document.querySelector('[data-kair-section-nav]').getBoundingClientRect();
        return Math.abs(target.getBoundingClientRect().top-nav.bottom-16)<2;
    }""", arg=anchor, timeout=7000)


def capture(page, section, width):
    block = page.locator('#kair-' + section)
    block.locator('img:visible').evaluate_all('imgs=>Promise.all(imgs.map(i=>{i.loading="eager";return i.decode()}))')
    page.evaluate('document.fonts.ready')
    folder = out / f'{width}x{page.viewport_size["height"]}'
    folder.mkdir(exist_ok=True)
    if section in ['screens', 'functions'] and width in [1640, 390]:
        page.screenshot(path=str(folder / f'{section}-with-nav.jpg'), quality=86)
    block.screenshot(path=str(folder / f'{section}.jpg'), quality=87, style=screenshot_style, animations='disabled')


def assert_fit(page):
    assert page.evaluate('document.documentElement.scrollWidth === innerWidth'), page.viewport_size
    assert page.locator('#kair-logic button:visible,#kair-scenarios button:visible,#kair-process button:visible,#kair-functions button:visible').evaluate_all(
        'els=>els.every(e=>e.getBoundingClientRect().height>=44)')


def rgb_colors(css):
    colors = [re.findall(r'[\d.]+', match) for match in re.findall(r'rgba?\(([^)]+)\)', css)]
    return [tuple(map(float, components[:3])) for components in colors if len(components) == 3 or float(components[3]) > 0]


def luminance(rgb):
    linear = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in (channel/255 for channel in rgb)]
    return sum(a*b for a, b in zip(linear, [.2126, .7152, .0722]))


def contrast(element, surface, limit=4.5):
    color = element.evaluate('e=>getComputedStyle(e).color')
    backgrounds = surface.evaluate('e=>{const s=getComputedStyle(e);return s.backgroundColor+" "+s.backgroundImage}')
    foreground = luminance(rgb_colors(color)[0])
    stops = [luminance(rgb) for rgb in rgb_colors(backgrounds)]
    assert stops, backgrounds
    minimum = min((max(foreground, b)+.05)/(min(foreground, b)+.05) for b in stops)
    assert minimum >= limit, (element.inner_text(), color, backgrounds, minimum)
    return {'color': color, 'backgrounds': backgrounds, 'contrast': round(minimum, 2)}


def check_composition(page, width):
    return page.evaluate("""width => {
      const el=sel=>document.querySelector(sel),rect=sel=>el(sel).getBoundingClientRect();
      const plane=el('.ka-station-plane'), screen=el('.ka-station-display');
      const matrix=new DOMMatrix(getComputedStyle(screen).transform);
      const w=screen.offsetWidth,h=screen.offsetHeight;
      const corners=[[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>new DOMPoint(x,y,0,1).matrixTransform(matrix));
      const expected=[[934,184],[1730,142],[1733,631],[934,617]];
      const maxError=Math.max(...corners.map((point,i)=>Math.hypot(
        point.x/point.w-expected[i][0]*plane.clientWidth/1824,
        point.y/point.w-expected[i][1]*plane.clientHeight/862)));
      const surface=rect('.ka-station-display'), aperture=rect('.ka-station-window'), pager=rect('.ka-studio .kair-controls');
      const titleRange=document.createRange();titleRange.selectNodeContents(el('.ka-studio-copy h2'));
      const title=titleRange.getBoundingClientRect();
      const graph=rect('.ka-efficiency-chart'), intro=rect('.ka-efficiency-main .ka-stage-heading');
      const last=rect('.ka-efficiency-benefits article:last-child'), finale=rect('.ka-efficiency-finale');
      const contact=rect('.ka-project-contact'), plate=rect('.ka-contact-plate'), label=rect('.ka-contact-screen-label');
      return {projection:matrix.is2D?null:maxError, screenFits:surface.left>=aperture.left-1 && surface.right<=aperture.right+1,
        pagerBelow:pager.top>=surface.bottom, headlineFits:width<1151||title.right<=surface.left-6,
        graphGap:graph.top-intro.bottom, graphBottomDifference:Math.abs(last.bottom-graph.bottom),
        finaleGap:finale.top-Math.max(last.bottom,graph.bottom),
        contactFits:contact.left===0&&contact.right===innerWidth&&Math.abs(plate.right-contact.right)<1,
        fullHeightPhoto:width<=1150||(Math.abs(plate.top-contact.top)<2&&Math.abs(plate.bottom-contact.bottom)<2),
        contactLabelInside:label.left>=plate.left+plate.width*.21&&label.right<=plate.left+plate.width*.75&&label.bottom<plate.top+plate.height*.77};
    }""", width)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width, height in viewport_sizes:
        context = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce',
                                      has_touch=width < 500, is_mobile=width < 500)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda response: failed.append((response.status, response.url))
                if response.status >= 400 and response.url.startswith(base) else None)
        page.on('request', lambda request: external.append(request.url)
                if request.url.startswith(('http:', 'https:')) and not request.url.startswith(base) else None)
        load(page)
        assert page.locator('main h1').count() == 1
        assert page.locator('.kair-system > section').evaluate_all('es=>es.slice(1).map(e=>e.id)') == ['kair-' + s for s in sections]
        assert page.locator(nav + ' a').count() == 8
        assert page.locator(rail + ' a').count() == 10
        assert page.locator(nav + ' [aria-current]').count() == 0
        assert page.locator('.ka-value-card').count() == 6
        assert page.locator('[data-kair-scenario]').count() == 24
        assert page.locator('[data-kair-function]').count() == 29
        ids = page.locator('[id]').evaluate_all('es=>es.map(e=>e.id)')
        assert len(ids) == len(set(ids))
        assert page.locator('[data-kair-function-form],[data-kair-pause],[data-kair-inspect],#kair-scenarios details,#kair-functions details').count() == 0
        if page.locator('[data-cookie-choice=deny]').is_visible():
            page.locator('[data-cookie-choice=deny]').click()
        for section in sections:
            link = page.locator((nav if section != 'contact' else rail) + f' a[href="#kair-{section}"]')
            if width < 500:
                link.tap()
            else:
                link.click()
            assert urlsplit(page.url).fragment == 'kair-' + section
            check_anchor(page, 'kair-' + section)
            check_nav(page, section)
            assert_fit(page)
            if section != 'value':
                capture(page, section, width)
        compact = page.locator('[data-kair-compact]')
        assert compact.get_attribute('data-autoplay') == 'false'
        assert compact.locator('[data-kair-slide]').count() == len(screens)
        assert compact.locator('.kair-controls button').count() == 2
        assert page.locator('[data-kair-hardware]').count() == 8
        assert page.locator('#kair-hardware button,#kair-hardware a,#kair-process a,#kair-project a').count() == 0
        assert page.locator('#kair-contact a[href^="tel:"]').count() == 1
        assert page.locator('#kair-contact a[href^="mailto:"]').count() == 1
        assert page.locator('#kair-contact figcaption,.ka-contact-meta,.ka-hardware-note,.ka-graph figcaption').count() == 0
        assert page.locator('#kair-contact .ka-contact-screen-label').inner_text() == 'Демонстрационные данные'
        assert page.locator('.ka-hardware-frame .ka-hardware-footer li').all_text_contents() == ['Измерение', 'Обработка', 'Управление']
        assert page.locator('.ka-efficiency-chart circle').count() == 8
        assert page.locator('.ka-graph-line').first.evaluate('e=>getComputedStyle(e).animationName') == 'none'
        composition = check_composition(page, width)
        assert composition['projection'] is not None and composition['projection'] < 2, composition
        assert all(composition[key] for key in ['screenFits', 'pagerBelow', 'headlineFits', 'contactFits', 'fullHeightPhoto', 'contactLabelInside']), composition
        if width >= 1440:
            assert composition['graphBottomDifference'] <= 16 and composition['graphGap'] <= 34, composition
            assert 22 <= composition['finaleGap'] <= 33, composition
        if width not in [390, 1640]:
            results.append({'width': width, 'height': height, 'sticky_links': 9, 'composition': composition})
            context.close()
            print(f'{width}×{height}: rendering, anchors, navigation and overflow OK', flush=True)
            continue

        details = out / f'states-{width}'
        details.mkdir(exist_ok=True)
        for i, mode in enumerate(['coordination', 'protection', 'memory', 'washing']):
            choice = page.locator('#ka-logic-tab-' + mode)
            choice.click()
            panel = page.locator('#ka-logic-' + mode)
            assert panel.is_visible() and panel.locator('.ka-signal-stages li').count() == 4
            assert panel.locator('.ka-signal-stages li').nth(2).locator('.ka-technical-label').text_content() == 'Действие'
            assert page.locator('#kair-logic [data-ka-count]').inner_text() == f'{i+1} из 4'
            tiles = []
            for index, tile in enumerate(panel.locator('.ka-signal-stages li').all()):
                expected = 'rgb(48, 55, 72)' if index == 2 else 'rgb(220, 226, 237)'
                paragraphs = tile.locator('p')
                readings = [contrast(p, tile) for p in paragraphs.all()]
                assert readings and all(value['color'] == expected for value in readings)
                tiles.append({'heading': contrast(tile.locator('h4'), tile), 'body': readings,
                              'label': contrast(tile.locator('.ka-technical-label'), tile)})
            active = contrast(choice.locator('strong'), choice)
            inactive = page.locator('#kair-logic [role=tab][aria-selected=false]').first
            note = panel.locator('.ka-logic-diagram > .ka-technical')
            assert note.evaluate('e=>getComputedStyle(e).color') == 'rgb(217, 224, 237)'
            result_box = panel.locator('.ka-stage-result')
            state_checks['logic'].append({'width': width, 'mode': mode, 'tiles': tiles, 'active': active,
                'inactive': contrast(inactive.locator('strong'), inactive),
                'result': contrast(result_box.locator('p'), result_box)})
            panel.screenshot(path=str(details / f'logic-{mode}.jpg'), quality=87, style=screenshot_style)
        page.locator('#kair-logic [data-ka-next]').click()
        assert page.locator('#ka-logic-coordination').is_visible()
        page.locator('#ka-logic-tab-coordination').press('ArrowRight')
        assert page.locator('#ka-logic-protection').is_visible()
        assert page.locator('#ka-logic-tab-protection').evaluate('e=>document.activeElement===e')
        assert 'персонал' in page.locator('#ka-logic-protection .ka-technical').inner_text() or 'проверки' in page.locator('#ka-logic-protection .ka-technical').inner_text()

        for category, ids in case_groups.items():
            page.locator('#ka-case-category-tab-' + category).click()
            group = page.locator('#ka-case-category-' + category)
            assert group.locator('[data-kair-scenario]').count() == len(ids)
            for index, number in enumerate(ids):
                page.locator(f'#ka-scenario-tab-{number}').click()
                case = page.locator(f'[data-kair-scenario="{number}"]')
                assert case.is_visible()
                assert page.locator('[data-kair-scenario]:visible').count() == 1
                assert case.locator('.ka-case-compare h4').all_text_contents() == ['Без возможностей КАИР', 'С системой КАИР']
                assert group.locator('[data-ka-count]').inner_text() == f'{index+1} из {len(ids)}'
                left, right = case.locator('.ka-case-compare article').all()
                read = contrast(right.locator('p'), right)
                assert read['color'] == 'rgb(225, 230, 240)'
                state_checks['scenarios'].append({'width': width, 'scenario': number, 'category': category, 'kair': read,
                    'heading': contrast(right.locator('h4'), right), 'plain': contrast(left.locator('p'), left)})
                if width == 1640 or number in [1, 24]:
                    case.screenshot(path=str(details / f'scenario-{number:02}.jpg'), quality=86, style=screenshot_style)
            group.locator('[data-ka-next]').click()
            assert page.locator(f'[data-kair-scenario="{ids[0]}"]').is_visible()

        for mode in ['separation', 'washing']:
            page.locator('#ka-process-tab-' + mode).click()
            route = page.locator(f'#ka-process-{mode}')
            assert route.locator('.ka-route-stations li:visible').count() == 4
            assert route.locator('.ka-material-route > .ka-technical').count() == 0
            assert route.locator('.ka-route-outcomes li svg').count() == 3
            assert route.locator('.ka-route-outcomes li').evaluate_all('es=>es.every(e=>parseFloat(getComputedStyle(e).fontSize)>=18)')
            state_checks['routes'].append({'width': width, 'route': mode, 'stations': 4, 'benefits': 3})
            route.screenshot(path=str(details / f'route-{mode}.jpg'), quality=87, style=screenshot_style)
        assert page.locator('.ka-water-circuits li:visible').count() == 4
        assert 'Стоки → очистка → бак возврата → основная мойка.' in page.locator('.ka-water-circuits').inner_text()
        assert 'Чистая вода из резервуара → второй флотатор → ополаскивание.' in page.locator('.ka-water-circuits').inner_text()

        panels = page.locator('.ka-function-panels')
        panel_heights = []
        outcomes = set()
        for group, count in function_groups.items():
            page.locator('#ka-function-tab-' + group).click()
            panel = page.locator('#kair-functions-' + group)
            assert panel.is_visible() and panel.locator('[data-kair-function]').count() == count
            assert page.locator('[data-ka-architecture]').get_attribute('data-direction') == group
            assert page.locator('[data-kair-function-group]:visible').count() == 1
            assert panel.locator('.ka-function-row p').count() == count
            assert panel.locator('.ka-function-result h4').inner_text() == 'Результат для предприятия'
            result = panel.locator('.ka-function-result p').inner_text()
            outcomes.add(result)
            assert panels.evaluate('e=>e.scrollHeight<=e.clientHeight+1 && e.scrollWidth<=e.clientWidth+1')
            panel_heights.append(panels.bounding_box()['height'])
            state_checks['functions'].append({'width': width, 'group': group, 'functions': count, 'outcome': result})
            panel.screenshot(path=str(details / f'functions-{group}.jpg'), quality=86, style=screenshot_style)
        assert len(outcomes) == 6 and (width < 1001 or max(panel_heights)-min(panel_heights)<1), panel_heights
        assert 'Собственный цикл пресса' in page.locator('#kair-functions-local').inner_text()
        for group in function_groups:
            load(page, '#kair-functions-' + group)
            assert page.locator('#kair-functions-' + group).is_visible()
            assert page.locator('#ka-function-tab-' + group).get_attribute('aria-selected') == 'true'
            check_anchor(page, 'kair-functions-' + group)
            check_nav(page, 'functions')

        load(page, '#kair-screens')
        viewer = compact.locator('dialog')
        for index, screen in enumerate(screens):
            page.wait_for_function('index=>document.querySelector("[data-kair-counter]").textContent===index+" из 7"', arg=index+1)
            image = compact.locator('[data-kair-slide][data-current=true] img')
            image.evaluate('i=>{i.loading="eager";return i.decode()}')
            assert image.get_attribute('src').endswith(f'/kair/{screen}.webp')
            assert image.evaluate('i=>getComputedStyle(i).objectFit') == 'contain'
            opening = compact.locator('[data-kair-slide][data-current=true] a')
            source = opening.get_attribute('href')
            assert source.startswith(urlsplit(base).path + '/assets/kair/originals/')
            if width == 1640 or index in [0, 6]:
                compact.locator('.ka-station-window').screenshot(path=str(details / f'screen-{index+1}.jpg'), quality=86, style=screenshot_style)
            opening.click()
            assert viewer.is_visible()
            page.wait_for_function('document.fullscreenElement===document.querySelector(".kair-viewer-shell")')
            page.wait_for_function('src=>{const img=document.querySelector("[data-kair-viewer-image]");return img.getAttribute("src")===src&&img.naturalWidth>0}', arg=source)
            assert viewer.locator('[data-kair-original]').get_attribute('href') == source
            if width == 1640 or index in [0, 6]:
                page.screenshot(path=str(details / f'fullscreen-{index+1}.jpg'), quality=86)
            page.keyboard.press('Escape')
            page.wait_for_function('!document.querySelector("[data-kair-viewer]").open')
            expect(opening).to_be_focused()
            state_checks['screens'].append({'width': width, 'index': index+1, 'image': screen, 'original': source, 'fullscreen': True})
            if index+1 < len(screens):
                compact.locator('[data-kair-next]').click()
        compact.locator('[data-kair-next]').click()
        page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="1 из 7"')
        compact.evaluate("""m=>{const next=m.querySelector('[data-kair-next]'),prev=m.querySelector('[data-kair-prev]');
            next.click();next.click();prev.click();
        }""")
        page.wait_for_function('document.querySelector("[data-kair-counter]").textContent==="2 из 7"')
        opener = compact.locator('[data-kair-slide][data-current=true] a')
        opener.click()
        viewer = compact.locator('dialog')
        assert viewer.is_visible()
        page.wait_for_function('document.fullscreenElement===document.querySelector(".kair-viewer-shell")')
        page.wait_for_function('document.querySelector("[data-kair-viewer-image]").naturalWidth>0')
        assert viewer.locator('[data-kair-viewer-image]').get_attribute('src').endswith('KAIR_25_Screen_Current_Monitoring.jpg')
        page.keyboard.press('End')
        page.wait_for_function('document.querySelector("[data-kair-viewer-counter]").textContent==="7 из 7"')
        page.keyboard.press('Escape')
        page.wait_for_function('!document.querySelector("[data-kair-viewer]").open')
        expect(compact.locator('[data-kair-slide][data-current=true] a')).to_be_focused()

        load(page, '#kair-contact')
        cta = page.locator('#kair-contact').get_by_role('link', name='Оставить заявку', exact=True)
        cta.click()
        dialog = page.locator('#project-request')
        assert dialog.is_visible() and dialog.locator('[data-request-submit]').is_disabled()
        assert dialog.locator('[data-request-topic]').input_value() == 'Запрос ЭРА: система управления КАИР'
        page.keyboard.press('Escape')
        assert cta.evaluate('e=>e===document.activeElement') and not dialog.is_visible()
        assert_fit(page)
        results.append({'width': width, 'height': height, 'sticky_links': 9,
                        'logic': 4, 'cases': 24, 'maps': 2, 'functions': 29, 'images': 7, 'composition': composition})
        context.close()
        print(f'{width}×{height}: all interactions, full screen, anchors and request modal OK', flush=True)

    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    load(page)
    page.locator(nav + ' a[href="#kair-project"]').click()
    check_anchor(page, 'kair-project')
    page.wait_for_selector('.ka-graph[data-in-view]')
    assert page.locator('.ka-graph-line').first.evaluate('e=>getComputedStyle(e).animationName') == 'ka-graph-draw'
    page.wait_for_function('document.querySelector(".ka-graph-line").getAnimations().every(a=>a.playState==="finished")')
    page.reload()
    check_anchor(page, 'kair-project')
    page.goto(base + '/ai/?source=legacy')
    page.wait_for_url(base + '/automation?source=legacy')
    assert page.locator('[data-kair-system]').count() == 1
    page.close()
    plain = browser.new_page(viewport={'width': 390, 'height': 844}, java_script_enabled=False)
    assert plain.goto(base + '/automation/').status == 200
    assert plain.locator('[data-kair-scenario]:visible').count() == 24
    assert plain.locator('[data-kair-function]:visible').count() == 29
    assert plain.locator('#kair-process .ka-panel:visible').count() == 2
    assert plain.locator('.ka-station-display a:visible').count() == 1
    assert plain.locator('[data-kair-compact] .kair-controls').is_hidden()
    plain.close()
    browser.close()
    assert not errors, errors
    assert not failed, failed
    extra_requests = sorted({url for url in external if url.split('?', 1)[0] != rates_source})
    assert not extra_requests, extra_requests
    (out / 'acceptance.json').write_text(json.dumps({
        'viewports': results, 'states': state_checks, 'errors': errors, 'failed': failed, 'extra_requests': extra_requests,
        'existing_rates_source': rates_source,
    }, ensure_ascii=False, indent=2) + '\n')
