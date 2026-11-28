"""Read-only HTTPS smoke checks for a completed ERA file transfer."""

from datetime import date, datetime
import json
import math
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from xml.etree import ElementTree
from zoneinfo import ZoneInfo

from regru_release import DOMAIN


class SmokeError(RuntimeError):
    pass


def https_host(parsed):
    if parsed.scheme == 'https':
        for host in ('era-cycle.ru', 'www.era-cycle.ru'):
            if parsed.netloc.lower() in (host, host + ':443'):
                return host
    return None


class SameSiteRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, url):
        if not https_host(urlsplit(url)):
            raise SmokeError('Unexpected HTTPS redirect destination')
        return super().redirect_request(request, response, code, message, headers, url)


def require(condition, description):
    if not condition:
        raise SmokeError(f'HTTPS smoke check failed for {description}')


def valid_cbr(snapshot, today):
    if not isinstance(snapshot, dict) or snapshot.get('source') != 'CBR':
        return False
    try:
        effective = date.fromisoformat(snapshot['effectiveDate'])
        requested = date.fromisoformat(snapshot['requestedDate'])
        rates = [snapshot['rates'][code]['rate'] for code in ('USD', 'EUR', 'CNY')]
    except (KeyError, TypeError, ValueError):
        return False
    return (effective.isoformat() == snapshot['effectiveDate'] and requested.isoformat() == snapshot['requestedDate']
            and effective <= requested <= today
            and all(type(rate) in (float, int) and math.isfinite(rate) and rate > 0 for rate in rates))


def production_smoke():
    opener = build_opener(SameSiteRedirect())

    def request(path, status=200, *, method='GET', prefix=DOMAIN, headers=None, limit=1_000_000):
        merged = {'Cache-Control': 'no-cache', 'User-Agent': 'ERA release verification'} | (headers or {})
        req = Request(prefix + path, method=method, headers=merged)
        try:
            response = opener.open(req, timeout=18)
        except HTTPError as error:
            response = error
        with response:
            require(response.status == status, path)
            final, expected = urlsplit(response.geturl()), urlsplit(path)
            require(https_host(final) == 'era-cycle.ru' and (final.path, final.query) == (expected.path, expected.query), path)
            return response.headers, response.read(limit)

    pages = {
        '/': 'data-resource-home', '/catalog/': 'id="catalog-lines-title"',
        '/catalog/lines/': 'data-line-id=', '/catalog/equipment/': 'data-node data-title=',
        '/catalog/lines/separatsiya-01/': 'data-line-leader=',
        '/catalog/lines/separatsiya-02/': 'data-line-leader=',
        '/catalog/lines/separatsiya-03/': 'data-line-leader=',
        '/catalog/lines/moyka-plenki/': 'data-line-leader=',
        '/technology/': 'data-technology-final', '/economics/': 'data-economics-page',
        '/contacts/': 'data-request-form', '/automation/': 'КАИР',
        '/documents/': 'data-document-library', '/media/': 'data-gallery-showroom',
    }
    for path, marker in pages.items():
        headers, data = request(path)
        require(headers.get_content_type() == 'text/html' and marker.encode() in data, path)
        require(f'rel="canonical" href="{DOMAIN}{path}"'.encode() in data and b'content="noindex' not in data, path)
    for alias in ('http://era-cycle.ru', 'https://www.era-cycle.ru', 'http://www.era-cycle.ru'):
        for path in ('/', '/economics/?era_redirect_test=1', '/robots.txt'):
            request(path, prefix=alias, method='HEAD')
    for path in ('/assets/project-home/video/era_promo_full.mp4', '/assets/project-home/evidence/cleaning_demo.mp4',
                 '/assets/videos/ballisticheskiy-separator.mp4', '/assets/videos/predvaritelnyy-izmelchitel.mp4'):
        headers, data = request(path, 206, headers={'Range': 'bytes=1024-1087'}, limit=65)
        require(headers.get_content_type() == 'video/mp4' and len(data) == 64
                and headers.get('Content-Range', '').startswith('bytes 1024-1087/'), path)
    for path, mime in {'/assets/technology/final/raw-household.webp': 'image/webp',
                        '/documents/brochures/era-separatsiya-02-overview.pdf': 'application/pdf'}.items():
        require(request(path, method='HEAD')[0].get_content_type() == mime, path)
    for path in ('/assets/js/equipment/shared/line-callout-layout.mjs', '/line-callout-layout.mjs',
                 '/vendor/pdfjs/pdf.mjs', '/vendor/pdfjs/pdf.worker.mjs'):
        headers, body = request(path, limit=4096)
        require(headers.get_content_type() in {'text/javascript', 'application/javascript'}
                and body.strip() and not body.lstrip().startswith(b'<'), path)
    require(b'Sitemap: https://era-cycle.ru/sitemap.xml' in request('/robots.txt')[1], '/robots.txt')
    xml = ElementTree.fromstring(request('/sitemap.xml')[1])
    namespace = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    urls = [location.text for location in xml.iter(namespace + 'loc')]
    require(len(urls) == len(set(urls)) and all(DOMAIN + path in urls for path in pages), '/sitemap.xml')
    rates = json.loads(request('/data/cbr.json')[1])
    require(valid_cbr(rates, datetime.now(ZoneInfo('Europe/Moscow')).date()), '/data/cbr.json')
    headers, _ = request('/api/request.php', 405)
    require(headers.get('Allow') == 'POST' and 'no-store' in headers.get('Cache-Control', ''), '/api/request.php')
    request('/era-missing-release-check/', 404)
    for path in ('/.git/config', '/config.json', '/era-private/config.json', '/era-deploy/live-manifest.json'):
        try:
            response = opener.open(Request(DOMAIN + path, method='HEAD'), timeout=18)
        except HTTPError as error:
            require(error.code in {403, 404}, path)
            error.close()
        else:
            response.close()
            raise SmokeError(f'Protected path is publicly reachable at {path}')
    print('HTTPS, canonical pages, catalog, range requests, four JS module MIME types, PDF, XML, rates and protected paths verified.')
