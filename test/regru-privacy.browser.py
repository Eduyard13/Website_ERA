"""Validate the global cookie controls and the independent operator gate in Chromium."""
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3231').rstrip('/')
reference = os.environ.get('ERA_REFERENCE_URL', '').rstrip('/')
visual = Path(os.environ.get('ERA_PRIVACY_SCREENSHOTS', '/tmp/era-0482-visual'))
visual.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]
fixtures = subprocess.check_output(['node', '--input-type=module', '-e', """
    import {productionSite} from './content/contact.mjs';
    import {productionMap} from './scripts/contact-maps.mjs';
    process.stdout.write(productionMap({...productionSite, operatorApprovedMapEmbeds:['google','yandex']}));
"""], cwd=root, text=True)
versions = {'/privacy/':'ERA-PRIVACY-1.3', '/privacy/consent/':'ERA-PD-1.3', '/privacy/cookies/':'ERA-COOKIES-1.3'}


def footer_settings(page):
    return page.locator('#site-footer').get_by_role('button', name='Настройки cookies', exact=True)


def save_choice(page, action):
    dialog = page.get_by_role('dialog', name='Настройки cookies')
    dialog.get_by_role('radio', name=action).check()
    dialog.get_by_role('button', name='Сохранить выбор').click()
    expect(dialog).to_be_hidden()


def map_fixture(route):
    response = route.fetch()
    html, count = re.subn(r'<div class="cp-map" data-contact-maps>.*?(?=</div><a class="cp-gallery-link")',
                          lambda _: fixtures, response.text(), count=1, flags=re.S)
    assert count == 1
    route.fulfill(response=response, body=html)


def protect_network(context, requests):
    def handle(route):
        url = urlsplit(route.request.url)
        if 'google' in url.hostname or 'yandex' in url.hostname or 'gstatic' in url.hostname:
            requests.append(url)
            route.fulfill(status=200, content_type='text/html', body='<title>Map fixture</title>')
        elif url.netloc in {urlsplit(base).netloc, urlsplit(reference).netloc}:
            route.continue_()
        else:
            route.abort()
    context.route('http**/*', handle)


def geometry(page):
    return page.evaluate("""() => ['.site-header','#main','#resource-title'].map(selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return [r.x, r.top + scrollY, r.width, selector === '#main' ? 0 : r.height];
    })""")


def asset_keys(page):
    return page.evaluate("""() => Array.from(document.querySelectorAll('head [href*="/legal.css?"],head [src*="/cookie-consent.js?"]'),
        element => new URL(element.href || element.src).search)""")


def actions_clear(notice):
    assert notice.get_by_role('button').evaluate_all("""buttons => buttons.every(button => {
        const r = button.getBoundingClientRect();
        return r.height >= 44 && r.left >= 0 && r.right <= innerWidth
          && button.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })""")


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ERA_CHROME_PATH','/usr/bin/chromium'), args=['--no-sandbox'])
    requests, errors = [], []
    widths = [(320, 640), (375, 812), (390, 844), (768, 900), (1024, 768), (1440, 900), (1920, 1080)]
    for width, height in widths:
        context = browser.new_context(viewport={'width':width,'height':height}, reduced_motion='reduce',
                                      is_mobile=width <= 390, has_touch=width <= 390)
        protect_network(context, requests)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        assert page.goto(base + '/').status == 200
        notice = page.locator('[data-cookie-notice]')
        expect(notice).to_be_visible()
        assert notice.get_by_role('button').all_text_contents() == ['Принять', 'Отклонить', 'Настроить']
        expect(notice).to_contain_text('включая IP-адрес')
        expect(notice.get_by_role('link', name='О cookies')).to_have_attribute('href', re.compile(r'/privacy/cookies/$'))
        assert notice.evaluate("e=>getComputedStyle(e).position==='fixed' && e.scrollWidth<=e.clientWidth")
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        box = notice.bounding_box()
        assert abs(box['x']) < 1 and abs(box['width'] - width) < 1
        assert abs(box['y'] + box['height'] - height) < 1
        assert 44 <= box['height'] <= height * .45
        if width >= 1440:
            assert 76 <= box['height'] <= 105, box
            assert len({button.bounding_box()['y'] for button in notice.get_by_role('button').all()}) == 1
        first = geometry(page)
        actions_clear(notice)
        take_comparison = width in (390,1440)
        if take_comparison:
            page.screenshot(path=visual / f'after-{width}.png', animations='disabled')
            if reference:
                old = context.new_page()
                old.goto(reference + '/')
                old_notice = old.locator('[data-cookie-notice]')
                expect(old_notice).to_be_visible()
                assert old_notice.evaluate("e=>getComputedStyle(e).position==='static'")
                assert asset_keys(page) != asset_keys(old)
                old.screenshot(path=visual / f'before-{width}.png', animations='disabled')
                old_notice.get_by_role('button', name='Отклонить', exact=True).click()
                expect(old_notice).to_be_hidden()
                assert first == geometry(old), (width, first, geometry(old))
                old.close()

        quick = page.locator('#quick-contact')
        toggle = quick.locator('[data-quick-contact-toggle]')
        expect(toggle).to_be_visible()
        assert quick.bounding_box()['y'] + quick.bounding_box()['height'] < box['y']
        toggle.click()
        panel = quick.locator('#quick-contact-panel')
        expect(panel).to_be_visible()
        panel_box = panel.bounding_box()
        assert panel_box['y'] >= -1 and panel_box['y'] + panel_box['height'] < box['y']
        actions_clear(notice)
        page.keyboard.press('Escape')
        expect(panel).to_be_hidden()
        expect(toggle).to_be_focused()

        menu_toggle = page.locator('[data-menu-toggle]')
        menu_toggle.click()
        menu = page.locator('#site-menu')
        assert menu.evaluate("node=>node.matches(':modal')")
        expect(quick).to_be_hidden()
        page.keyboard.press('Escape')
        expect(menu).to_be_hidden()
        expect(menu_toggle).to_be_focused()

        configure = notice.get_by_role('button', name='Настроить')
        configure.focus()
        page.keyboard.press('Enter')
        settings = page.get_by_role('dialog', name='Настройки cookies')
        expect(settings).to_be_visible()
        assert settings.evaluate("dialog=>dialog.contains(document.activeElement)")
        for _ in range(9):
            page.keyboard.press('Tab')
            assert page.evaluate("document.activeElement===document.body || document.querySelector('#cookie-settings').contains(document.activeElement)")
        if width == 390:
            page.screenshot(path=visual / 'settings-390.png', animations='disabled')
        settings.get_by_role('radio', name='Разрешить карты').check()
        page.keyboard.press('Escape')
        expect(settings).to_be_hidden()
        expect(configure).to_be_focused()
        assert page.evaluate("localStorage.getItem('era-map-consent-v1')") is None
        configure.click()
        settings.get_by_role('radio', name='Отклонить').check()
        settings.get_by_role('button', name='Закрыть настройки cookies').click()
        expect(settings).to_be_hidden()
        expect(configure).to_be_focused()
        assert page.evaluate("localStorage.getItem('era-map-consent-v1')") is None

        page.evaluate("scrollTo({top:document.body.scrollHeight,behavior:'instant'})")
        footer = page.locator('#site-footer')
        assert footer.bounding_box()['y'] + footer.bounding_box()['height'] <= notice.bounding_box()['y'] + 1
        page.evaluate("scrollTo({top:180,behavior:'instant'})")
        y = page.evaluate('scrollY')
        action, choice = ('Принять','allow') if width in (375,1440) else ('Отклонить','deny')
        notice.get_by_role('button', name=action, exact=True).press('Enter')
        expect(notice).to_be_hidden()
        assert page.evaluate("localStorage.getItem('era-map-consent-v1')") == choice
        assert page.evaluate('scrollY') == y
        page.evaluate("scrollTo({top:0,behavior:'instant'})")
        assert first == geometry(page), (width, first, geometry(page))
        assert page.evaluate("!document.documentElement.hasAttribute('data-cookie-bar-open') && getComputedStyle(document.body).paddingBottom==='0px'")
        expect(page.locator('#main')).to_be_focused()

        other = context.new_page()
        other.goto(base + '/contacts/')
        expect(other.locator('[data-cookie-notice]')).to_be_hidden()
        expect(other.locator('[data-map-external]')).to_have_count(2)
        expect(other.locator('[data-map-embed], .cp-map iframe')).to_have_count(0)
        footer_settings(page).click()
        expect(settings.get_by_role('radio', name='Разрешить карты' if choice == 'allow' else 'Отклонить')).to_be_checked()
        save_choice(page, 'Разрешить карты')
        expect(footer_settings(page)).to_be_focused()
        other.reload()
        expect(other.locator('[data-cookie-notice]')).to_be_hidden()
        expect(other.locator('[data-map-embed], .cp-map iframe')).to_have_count(0)
        expect(other.locator('#contact-consent')).not_to_be_checked()
        assert other.evaluate("localStorage.getItem('era-map-consent-v1')") == 'allow'
        assert not requests, requests
        context.close()
        print(f'{width}x{height}: fixed edges, stable first screen, reachable actions, quick contact, footer and keyboard settings', flush=True)

    context = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
    protect_network(context, requests)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/contacts/')
    notice = page.locator('[data-cookie-notice]')
    expect(notice).to_be_visible()
    email = page.locator('#contact-email')
    email.tap()
    expect(email).to_be_focused()
    expect(notice).to_be_hidden()
    page.set_viewport_size({'width':390,'height':430})
    assert email.evaluate("node=>node.inputMode==='email'")
    email.fill('fixture@example.test')
    expect(email).to_have_value('fixture@example.test')
    expect(notice).to_be_hidden()
    email.blur()
    page.set_viewport_size({'width':640,'height':270})
    expect(notice).to_be_visible()
    assert notice.evaluate('e=>Math.abs(e.getBoundingClientRect().bottom-innerHeight)<1 && e.scrollHeight>e.clientHeight')
    quick = page.locator('#quick-contact')
    quick.locator('[data-quick-contact-toggle]').click()
    panel = quick.locator('#quick-contact-panel')
    expect(panel).to_be_visible()
    assert panel.bounding_box()['y'] >= 0
    assert panel.bounding_box()['y'] + panel.bounding_box()['height'] < notice.bounding_box()['y']
    page.keyboard.press('Escape')
    expect(panel).to_be_hidden()
    configure = notice.get_by_role('button', name='Настроить')
    configure.click()
    settings = page.get_by_role('dialog', name='Настройки cookies')
    expect(settings).to_be_visible()
    assert settings.evaluate('d=>d.getBoundingClientRect().height<innerHeight && d.scrollHeight>d.clientHeight')
    settings.get_by_role('radio',name='Отклонить').check()
    page.keyboard.press('Escape')
    expect(configure).to_be_focused()
    page.set_viewport_size({'width':390,'height':844})
    actions_clear(notice)
    for route in versions:
        page.goto(base + route)
        expect(page.locator('[data-cookie-notice]').get_by_role('button',name='Принять')).to_be_visible()
        assert page.locator('[data-cookie-notice]').evaluate("e=>getComputedStyle(e).position==='fixed'")
    context.close()
    print('Touch focus, simulated keyboard viewport, landscape overflow, and preserved legal pages', flush=True)

    for choice in ('allow', 'deny'):
        context = browser.new_context()
        protect_network(context, requests)
        context.add_init_script(f"localStorage.setItem('era-map-consent-v1', '{choice}')")
        page = context.new_page()
        page.goto(base + '/')
        expect(page.locator('[data-cookie-notice]')).to_be_hidden()
        page.reload()
        expect(page.locator('[data-cookie-notice]')).to_be_hidden()
        assert not page.evaluate("document.documentElement.hasAttribute('data-cookie-bar-open')")
        context.close()
    print('Both saved choices from 0.48.1 survive the UI update and reload', flush=True)

    context = browser.new_context(accept_downloads=True, java_script_enabled=False)
    protect_network(context, requests)
    page = context.new_page()
    for route, revision in versions.items():
        page.goto(base + route)
        expect(page.locator('.legal-document')).to_be_visible()
        expect(page.locator('.legal-edition')).to_contain_text(revision)
        assert len(page.locator('.legal-document').inner_text()) > 2000
        button = page.get_by_role('link', name='Скачать PDF')
        href = button.get_attribute('href')
        result = page.request.get(base.removesuffix('/Website_ERA') + href)
        assert result.status == 200 and result.headers['content-type'].startswith('application/pdf')
        with page.expect_download() as response:
            button.click()
        assert response.value.path().read_bytes() == result.body()
        assert response.value.suggested_filename == href.rsplit('/',1)[1]
        expect(page.locator('.footer-legal-links a')).to_have_count(3)
    page.goto(base + '/contacts/')
    assert page.locator('#contact-consent').get_attribute('required') is not None
    expect(page.locator('#contact-consent')).not_to_be_checked()
    expect(page.locator('.request-consent a')).to_have_count(2)
    expect(page.locator('.cp-map iframe')).to_have_count(0)
    context.close()
    print('All HTML documents, footer links, PDF downloads with the correct MIME, and native form without JS', flush=True)

    context = browser.new_context(viewport={'width':1440,'height':900}, reduced_motion='reduce')
    protect_network(context, requests)
    test_url = base + '/contacts/?map-test=1'
    context.route(test_url, map_fixture)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(test_url)
    map_region = page.locator('[data-contact-maps]')
    map_region.scroll_into_view_if_needed()
    expect(map_region.locator('[data-map-embed]')).to_have_count(2)
    expect(map_region.locator('iframe')).to_have_count(0)
    assert not requests, requests
    page.locator('[data-cookie-choice=allow]').click()
    frame = map_region.locator('iframe')
    expect(frame).to_have_count(1)
    frame.scroll_into_view_if_needed()
    frame.content_frame.locator('title').wait_for(state='attached')
    expect(frame).to_have_attribute('src', re.compile(r'^https://www\.google\.com/maps/embed'))
    select = map_region.locator('[data-map-select=yandex]')
    select.focus()
    page.keyboard.press('Enter')
    expect(select).to_have_attribute('aria-pressed', 'true')
    expect(frame).to_have_attribute('src', re.compile(r'^https://yandex\.com/map-widget/'))
    frame.scroll_into_view_if_needed()
    frame.content_frame.locator('title').wait_for(state='attached')
    page.reload()
    expect(frame).to_have_attribute('src', re.compile(r'^https://yandex\.com/'))
    expect(frame).to_have_attribute('referrerpolicy', 'no-referrer')
    frame.evaluate("node=>node.dispatchEvent(new Event('error'))")
    expect(frame).to_have_count(0)
    expect(map_region.get_by_text('Карта недоступна.', exact=False)).to_be_visible()
    second = context.new_page()
    second.goto(test_url)
    expect(second.locator('.cp-map iframe')).to_have_count(1)
    second.locator('.cp-map iframe').scroll_into_view_if_needed()
    second.locator('.cp-map iframe').content_frame.locator('title').wait_for(state='attached')
    before_revoke = len(requests)
    assert {url.hostname for url in requests} == {'www.google.com', 'yandex.com'}
    footer_settings(page).click()
    save_choice(page, 'Отклонить')
    expect(frame).to_have_count(0)
    expect(second.locator('.cp-map iframe')).to_have_count(0)
    assert page.evaluate("localStorage.getItem('era-contact-map-provider')") is None
    second.reload()
    second.locator('[data-contact-maps]').scroll_into_view_if_needed()
    expect(second.locator('.cp-map iframe')).to_have_count(0)
    assert len(requests) == before_revoke, requests
    context.close()
    print('Mock operator approval: both providers, preference, fallback, revocation across tabs, zero further map requests', flush=True)

    for blocked in ('getItem','setItem'):
        context = browser.new_context()
        protect_network(context, requests)
        context.route(test_url, map_fixture)
        context.add_init_script(f"Storage.prototype.{blocked}=()=>{{throw new Error('Blocked by browser')}};")
        page = context.new_page()
        page.goto(test_url)
        footer_settings(page).click()
        save_choice(page, 'Разрешить карты')
        expect(page.locator('.cp-map iframe')).to_have_count(0)
        assert len(requests) == before_revoke
        context.close()
    assert not errors, errors
    browser.close()
    print('Blocked storage fails closed. No uncaught browser errors.', flush=True)
