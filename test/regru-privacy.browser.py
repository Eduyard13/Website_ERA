"""Test actual network activity before consent, refusal, opt-in and withdrawal."""
import os
from playwright.sync_api import expect, sync_playwright

base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3225').rstrip('/')
services = ('https://www.google.com/maps/', 'https://yandex.com/map-widget/')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('ERA_CHROME_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    seen = []
    context = browser.new_context(reduced_motion='reduce', viewport={'width': 390, 'height': 850})
    # A 0.47.0 provider preference is not permission to load its iframe.
    context.add_init_script("localStorage.setItem('era-contact-map-provider', 'yandex')")

    def network(route):
        url = route.request.url
        if url.startswith(services):
            seen.append(url)
            route.fulfill(status=200, content_type='text/html', body='<title>Provider fixture</title>')
        elif url.startswith(base + '/'):
            route.continue_()
        else:
            route.abort()

    context.route('**/*', network)
    page = context.new_page()
    page.goto(base + '/contacts/')
    map_region = page.locator('[data-contact-maps]')
    map_region.scroll_into_view_if_needed()
    expect(page.locator('[data-map-cookie-panel]')).to_be_visible()
    expect(map_region.locator('iframe')).to_have_count(0)
    assert not seen
    deny = page.get_by_role('button', name='Отклонить карты')
    expect(deny).to_be_visible()
    page.get_by_role('button', name='Отклонить карты').press('Enter')
    expect(map_region).to_have_attribute('data-map-cookie-state', 'denied')
    page.reload()
    map_region.scroll_into_view_if_needed()
    expect(page.locator('[data-map-cookie-panel]')).to_be_hidden()
    expect(page.locator('[data-map-external]')).to_have_count(2)
    assert not seen
    page.get_by_role('button', name='Настройки cookies').click()
    page.get_by_role('button', name='Разрешить карты').click()
    expect(map_region.locator('iframe')).to_have_count(1)
    map_region.locator('iframe').scroll_into_view_if_needed()
    map_region.locator('iframe').content_frame.locator('title').wait_for(state='attached')
    page.wait_for_function("document.querySelector('.cp-map iframe').getAttribute('src').startsWith('https://yandex.com/')")
    page.get_by_role('button', name='Google Maps', exact=True).click()
    expect(map_region.locator('iframe')).to_have_attribute('referrerpolicy', 'no-referrer')
    expect(map_region.locator('iframe')).to_have_attribute('src', page.locator('[data-map-panel=google]').get_attribute('data-map-embed'))
    map_region.locator('iframe').scroll_into_view_if_needed()
    map_region.locator('iframe').content_frame.locator('title').wait_for(state='attached')
    assert any(url.startswith(services[0]) for url in seen)
    assert any(url.startswith(services[1]) for url in seen)
    page.get_by_role('button', name='Настройки cookies').click()
    deny.click()
    expect(map_region.locator('iframe')).to_have_count(0)
    expect(page.locator('[data-map-external=google]')).to_be_visible()
    expect(page.locator('input[name="Согласие"]')).not_to_be_checked()
    expect(page.locator('input[name="Согласие"]')).to_have_attribute('required', '')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.goto(base + '/privacy/cookies/')
    expect(page.locator('h1')).to_have_text('Cookies и хранилище браузера')
    context.close()
    context = browser.new_context(java_script_enabled=False, reduced_motion='reduce')
    context.route('**/*', network)
    page = context.new_page()
    page.goto(base + '/contacts/')
    expect(page.locator('.cp-map iframe')).to_have_count(0)
    expect(page.locator('[data-map-external=yandex]')).to_be_visible()
    expect(page.locator('form[data-request-form]')).to_have_attribute('enctype', 'multipart/form-data')
    browser.close()
print('Chromium: no provider requests before the choice or after refusal; opt-in, withdrawal, mobile and no-JS checked.')
