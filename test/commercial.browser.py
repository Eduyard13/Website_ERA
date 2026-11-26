"""Browser acceptance of the Economics page at its normal static entry point."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from zoneinfo import ZoneInfo
import json
import os
import re
import subprocess

from playwright.sync_api import sync_playwright

repo = Path(__file__).resolve().parents[1]
base = os.environ.get('ERA_PREVIEW_URL', 'http://127.0.0.1:3000/Website_ERA').rstrip('/')
url = base + '/economics/'
widths = [(1920, 1080), (1440, 900), (1280, 800), (768, 1024), (390, 844), (360, 800)]
prices = {'conservative': 80000, 'base': 90000, 'development': 100000, 'premium': 110000}
sections = ['economic-case', 'raw-material', 'material-balance', 'product-quality', 'market', 'economics',
            'production-constructor', 'project-resilience', 'production-growth', 'economic-conditions', 'economics-project']
anchors = ['monthly-result', 'market-offers', 'calculation-conditions', 'econ-per-tonne-price',
           'econ-monthly-price', 'business-quality-title', 'econ-tonne-title', 'econ-curve-title', 'econ-volume']
today = datetime.now(ZoneInfo('Europe/Moscow')).date()
nb = '\u00a0'


def finance(price, annual=False):
    """Independent working-book control with the revised input mass and its purchase price."""
    hours = 8760 if annual else 744
    months = 12 if annual else 1
    cost = (Decimal('11648915.449213509') + Decimal('1961047.8954266747')) * months
    running_before_feed = Decimal('13281090.775100213') - Decimal('970.4347826086957') * 6000
    cost += hours * (running_before_feed / 744 + 9000)
    revenue = Decimal('0.75') * hours * price / Decimal('1.22')
    tax = max(revenue - cost, 0) * Decimal('0.25')
    return revenue - cost - tax, [part / revenue * 100 for part in (cost, tax, revenue - cost - tax)]


def money(amount, unit='млн ₽', divisor=1000000):
    return f'{amount/divisor:.2f}'.replace('.', ',') + ' ' + unit


def cbr(day):
    iso = day.isoformat()
    return {
        'schemaVersion': 1, 'source': 'CBR', 'requestedDate': iso, 'effectiveDate': iso,
        'fetchedAt': datetime.now(timezone.utc).isoformat(),
        'sourceUrl': 'https://www.cbr.ru/scripts/XML_daily.asp?date_req=' + day.strftime('%d/%m/%Y'),
        'rates': {'USD': {'nominal': 2, 'value': 160, 'rate': 80}, 'EUR': {'nominal': 1, 'value': 95, 'rate': 95},
                  'CNY': {'nominal': 10, 'value': 115, 'rate': 11.5}}
    }


def setup(context, snapshot=None):
    values = ['localStorage.setItem("era-map-consent-v1", "deny")']
    if snapshot is not None:
        values.append('localStorage.setItem("era-cbr-rates-v1", ' + json.dumps(json.dumps(snapshot)) + ')')
    context.add_init_script('\n'.join(values))


def await_model(page):
    page.wait_for_selector('[data-economics-ready=true]', state='attached')


def value(page, name, scope=''):
    return page.locator(f'{scope} [data-econ-value="{name}"]').first.text_content()


def check_fit(page, width):
    result = page.evaluate("""() => {
        const clipped = [...document.querySelectorAll('.economics-page [data-econ-value]')].filter(el => {
          if (!el.getClientRects().length || el.closest('details:not([open]),[hidden]')) return false;
          const range = document.createRange();
          range.selectNodeContents(el);
          return [...range.getClientRects()].some(rect => rect.left < -0.5 || rect.right > innerWidth+0.5);
        });
        return {width: document.documentElement.scrollWidth, clipped: clipped.map(el=>el.dataset.econValue)};
    }""")
    assert result == {'width': width, 'clipped': []}, (width, result)


def request_context(page, scope, price, count):
    cta = page.locator(f'[data-economics-request={scope}]')
    topic = parse_qs(urlsplit(cta.get_attribute('href')).query)['topic'][0]
    assert f'{price} ₽/кг с НДС · загрузка 100% · выход 50%' in topic
    assert f'· {count} комплекс' in topic
    assert len(topic) <= 200
    cta.click()
    dialog = page.locator('#project-request')
    dialog.wait_for()
    assert dialog.locator('[data-request-topic]').input_value() == topic
    assert dialog.locator('[name="Имя"]').evaluate('(el) => document.activeElement === el')
    assert not dialog.locator('input[type=checkbox]').first.is_checked()
    page.keyboard.press('Escape')
    assert not dialog.is_visible()
    assert cta.evaluate('(el) => document.activeElement === el')


with sync_playwright() as p:
    chromium = p.chromium.launch(executable_path=os.getenv('ERA_CHROME_PATH', '/usr/bin/chromium'),
                                  args=['--no-sandbox', '--disable-dev-shm-usage'])
    context = chromium.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    setup(context)
    requests = []
    errors = []
    console_errors = []
    broken = []

    def serve_rates(route):
        requests.append(route.request.url)
        route.fulfill(status=200, json=cbr(today), headers={'Access-Control-Allow-Origin': '*'})

    context.route('**/cbr.json*', serve_rates)
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
    page.on('response', lambda r: broken.append((r.status, r.url)) if r.url.startswith(base) and r.status >= 400 else None)
    assert page.goto(url).status == 200
    await_model(page)
    page.wait_for_function("document.querySelector('[data-econ-value=rate]').textContent.includes('1 USD')")
    assert today.strftime('%d.%m.%Y') in value(page, 'rate')
    assert value(page, 'monthUsd') == '≈ 125,62 тыс. $'
    assert page.locator('[data-econ-chart] .ec-bar-column').count() == 4
    assert page.locator('[data-economics-page] > section').evaluate_all('items => items.map(e=>e.id)') == sections
    assert page.locator('[data-growth-mode=separation]').count() == 1
    assert page.locator('[data-econ-range],.econ-ring,button[data-econ-mode]').count() == 0

    for scenario, price in prices.items():
        net, shares = finance(price)
        year, _ = finance(price, annual=True)
        page.locator(f'[data-econ-price={scenario}]').click()
        assert page.locator('[data-econ-network-price]').input_value() == scenario
        assert value(page, 'monthNet', '.ec-hero') == money(net)
        assert value(page, 'monthNet', '.ec-unit-result') == money(net)
        assert value(page, 'yearNet') == money(year)
        assert page.locator('[data-econ-chart] .ec-bar-column[data-active=true]').count() == 1
        parts = page.locator('.ec-allocation-track >span').evaluate_all('items => items.map(e=>parseFloat(e.style.flexBasis))')
        assert len(parts) == 3 and all(abs(a - float(b)) < 0.0001 for a, b in zip(parts, shares))
        for count in (1, 2, 3, 5):
            page.locator(f'[data-econ-network="{count}"]').click()
            assert value(page, 'networkMonth') == money(net * count)
            assert value(page, 'networkYear') == money(year * count)
            assert value(page, 'monthNet') == money(net)
            assert value(page, 'networkMargin') == value(page, 'margin')

    network = page.locator('[data-econ-network-price]')
    network.select_option('base')
    assert page.locator('[data-econ-price=base]').get_attribute('aria-pressed') == 'true'
    assert value(page, 'networkMonthUsd') == '≈ 628,10 тыс. $'
    assert value(page, 'networkOutput') == f'2{nb}790 т'
    assert value(page, 'networkYearOutput') == f'32{nb}850 т'
    assert len(requests) == 1, requests
    request_context(page, 'complex', 90, 1)
    request_context(page, 'network', 90, 5)

    for period, feed, output in [('hour', f'1{nb}500 кг/ч', '750 кг/ч'),
                                 ('month', f'1{nb}116 т', '558 т'), ('year', f'13{nb}140 т', f'6{nb}570 т')]:
        control = page.locator(f'[data-econ-period={period}]')
        control.focus()
        page.keyboard.press('Enter')
        assert control.get_attribute('aria-pressed') == 'true'
        assert value(page, 'balanceInput') == feed
        assert value(page, 'balanceOutput') == output == value(page, 'balanceOther')
    for anchor in anchors:
        assert page.locator('#' + anchor).count() == 1, anchor
    for anchor in ('calculation-conditions', 'market-offers'):
        page.evaluate('(id) => location.hash = id', anchor)
        page.wait_for_function('(id) => document.getElementById(id).open', arg=anchor)
    assert page.locator('.ec-international').get_by_text('950 €/т').is_visible()
    assert page.locator('.ec-international').get_by_text(f'1{nb}368 €/т').is_visible()
    assert not errors and not console_errors and not broken, (errors, console_errors, broken)
    print('PASS: 4 prices × 4 network sizes, both price controls, all periods, allocation, live dated USD, 2 CTAs, deep links and browser console', flush=True)
    context.close()

    for width, height in widths:
        ctx = chromium.new_context(viewport={'width': width, 'height': height}, is_mobile=width < 768,
                                   has_touch=width < 768, reduced_motion='reduce')
        setup(ctx)
        ctx.route('**/cbr.json*', serve_rates)
        responsive = ctx.new_page()
        assert responsive.goto(url).status == 200
        await_model(responsive)
        assert responsive.locator('[data-section-navigation] a').count() == 7
        check_fit(responsive, width)
        assert responsive.locator('#market-offers').get_attribute('open') is None
        responsive.locator('#market-offers summary').focus()
        responsive.keyboard.press('Enter')
        assert responsive.locator('#market-offers').get_attribute('open') is not None
        check_fit(responsive, width)
        responsive.locator('[data-econ-price=premium]').click()
        responsive.locator('[data-econ-network="5"]').click()
        check_fit(responsive, width)
        assert value(responsive, 'networkYear') == '984,00 млн ₽'
        assert responsive.locator('.ec-hero-art img').evaluate('(img) => img.complete && img.naturalWidth > 0')
        print(f'PASS: responsive {width}×{height}, expanded market, primary and network figures', flush=True)
        ctx.close()

    plain = chromium.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    html_only = plain.new_page()
    assert html_only.goto(url).status == 200
    assert html_only.locator('[data-economics-page]').get_attribute('data-econ-mode') == 'full'
    assert value(html_only, 'monthNet') == '10,05 млн ₽'
    assert value(html_only, 'yearNet') == '116,02 млн ₽'
    assert value(html_only, 'balanceInput') == f'1{nb}500 кг/ч'
    assert html_only.locator('.ec-scenario-picker').is_hidden()
    assert html_only.locator('#market-offers summary').is_visible()
    assert html_only.locator('#economics-project [data-economics-request]').is_visible()
    plain.close()

    for cached in (None, cbr(today - timedelta(days=3))):
        ctx = chromium.new_context()
        setup(ctx, cached)
        ctx.route('**/cbr.json*', lambda route: route.abort())
        fallback = ctx.new_page()
        assert fallback.goto(url).status == 200
        await_model(fallback)
        if cached:
            assert 'последний доступный курс' in value(fallback, 'rate')
            assert (today - timedelta(days=3)).strftime('%d.%m.%Y') in value(fallback, 'rate')
            assert value(fallback, 'monthUsd') == '≈ 125,62 тыс. $'
        else:
            assert value(fallback, 'rate') == 'Курс ЦБ РФ недоступен'
            assert value(fallback, 'monthUsd') == 'USD недоступен'
        assert value(fallback, 'monthNet') == '10,05 млн ₽'
        ctx.close()
    print('PASS: no-JavaScript full-cycle HTML, missing and stale exchange rates', flush=True)

    # Intercept a test copy of the compiled config and substitute matching SSR HTML.
    # No production inputs or repository files are written.
    alternate = """import {economicsPage} from './scripts/economics-page.mjs';
import {economicsConfig} from './public/economics-config.js';
const config = structuredClone(economicsConfig);
config.feedstockPrice = 7000; config.modes.full.defaultGrossPrice = 50000;
process.stdout.write(economicsPage({config}));"""
    changed = subprocess.check_output(['node', '--input-type=module', '-e', alternate], cwd=repo, text=True)
    prefix = urlsplit(base).path
    changed = re.sub(r'(\b(?:href|src|srcset)="|,\s*)/(?=[a-z])', r'\1' + prefix + '/', changed)
    ctx = chromium.new_context(viewport={'width': 390, 'height': 844})
    setup(ctx)
    ctx.route('**/cbr.json*', serve_rates)

    def amend_config(route):
        res = route.fetch()
        copy = res.text().replace('feedstockPrice:6000', 'feedstockPrice:7000')
        copy = copy.replace('defaultGrossPrice:90000', 'defaultGrossPrice:50000')
        route.fulfill(response=res, body=copy)

    def amend_html(route):
        res = route.fetch()
        html = re.sub(r'<div class="story commercial-page economics-page"[\s\S]*?</main>',
                      lambda _: changed + '</main>', res.text(), count=1)
        assert changed in html
        route.fulfill(response=res, body=html)

    ctx.route('**/economics-config.js*', amend_config)
    ctx.route(url, amend_html)
    loss = ctx.new_page()
    assert loss.goto(url).status == 200
    await_model(loss)
    assert value(loss, 'price') == '50 ₽/кг'
    assert value(loss, 'monthNet').startswith('−')
    assert loss.locator('[data-econ-price=base]').get_attribute('aria-pressed') == 'true'
    assert loss.locator('.ec-allocation-track').count() == 0
    assert loss.locator('.ec-scale-reserve[data-negative=true]').is_visible()
    assert loss.locator('.ec-bar-column[data-loss=true]').count() == 1
    assert '×7,14' in loss.locator('.ec-value-band').inner_text()
    loss.locator('[data-econ-price=premium]').click()
    assert loss.locator('.ec-allocation-track >span').count() == 3
    check_fit(loss, 390)
    ctx.close()
    chromium.close()
    print('PASS: altered config, SSR/hydration, negative reserve, negative profit, switch to profit', flush=True)
