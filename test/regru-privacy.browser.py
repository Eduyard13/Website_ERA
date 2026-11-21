"""Validate the global cookie controls and the independent operator gate in Chromium."""
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3231').rstrip('/')
visual = Path(os.environ.get('ERA_PRIVACY_SCREENSHOTS', '/tmp/era-0481-visual'))
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
        elif url.netloc == urlsplit(base).netloc:
            route.continue_()
        else:
            route.abort()
    context.route('http**/*', handle)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ERA_CHROME_PATH','/usr/bin/chromium'), args=['--no-sandbox'])
    requests, errors = [], []
    for width, height in [(390, 844), (768, 900), (1440, 900)]:
        context = browser.new_context(viewport={'width':width,'height':height}, reduced_motion='reduce',
                                      is_mobile=width == 390, has_touch=width == 390)
        protect_network(context, requests)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        assert page.goto(base + '/').status == 200
        notice = page.locator('[data-cookie-notice]')
        expect(notice).to_be_visible()
        expect(notice.get_by_role('button')).to_have_count(3)
        assert notice.evaluate("e=>getComputedStyle(e).position==='static' && e.scrollWidth<=e.clientWidth")
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert notice.bounding_box()['y'] + notice.bounding_box()['height'] <= page.locator('#main').bounding_box()['y'] + 1
        assert notice.bounding_box()['y'] + notice.bounding_box()['height'] < page.locator('#quick-contact').bounding_box()['y']
        page.screenshot(path=visual / f'notice-{width}.png', animations='disabled')

        configure = notice.get_by_role('button', name='Настроить')
        configure.focus()
        page.keyboard.press('Enter')
        settings = page.get_by_role('dialog', name='Настройки cookies')
        expect(settings).to_be_visible()
        assert settings.evaluate("dialog=>dialog.contains(document.activeElement)")
        for _ in range(9):
            page.keyboard.press('Tab')
            assert page.evaluate("document.activeElement===document.body || document.querySelector('#cookie-settings').contains(document.activeElement)")
        page.screenshot(path=visual / f'settings-{width}.png', animations='disabled')
        page.keyboard.press('Escape')
        expect(settings).to_be_hidden()
        expect(configure).to_be_focused()

        notice.get_by_role('button', name='Отклонить', exact=True).click()
        expect(notice).to_be_hidden()
        assert page.evaluate("localStorage.getItem('era-map-consent-v1')") == 'deny'
        expect(page.locator('#main')).to_be_focused()

        other = context.new_page()
        other.goto(base + '/contacts/')
        expect(other.locator('[data-cookie-notice]')).to_be_hidden()
        expect(other.locator('[data-map-external]')).to_have_count(2)
        expect(other.locator('[data-map-embed], .cp-map iframe')).to_have_count(0)
        footer_settings(page).click()
        expect(settings.get_by_role('radio', name='Отклонить')).to_be_checked()
        save_choice(page, 'Разрешить карты')
        expect(footer_settings(page)).to_be_focused()
        other.reload()
        expect(other.locator('[data-cookie-notice]')).to_be_hidden()
        expect(other.locator('[data-map-embed], .cp-map iframe')).to_have_count(0)
        assert other.evaluate("localStorage.getItem('era-map-consent-v1')") == 'allow'
        assert not requests, requests
        if width == 390:
            other.locator('#contact-email').tap()
            assert other.evaluate("document.activeElement.id==='contact-email'")  # touch focus for the mobile keyboard
            assert other.locator('#contact-email').evaluate("node=>node.inputMode==='email'")
            other.locator('#contact-email').fill('fixture@example.test')
            assert other.locator('#contact-email').input_value() == 'fixture@example.test'
            expect(other.locator('#contact-consent')).not_to_be_checked()
        page.goto(base + '/privacy/consent/')
        page.screenshot(path=visual / f'legal-{width}.png', animations='disabled')
        context.close()
        print(f'Global notice, keyboard dialog, saved preference, external links and visual layout at {width}px', flush=True)

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
