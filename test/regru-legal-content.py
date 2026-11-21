"""Check the approved source, final HTML, and the original PDFs."""
import hashlib
from html import unescape
from pathlib import Path
import re
import subprocess

from sys import path
ROOT = Path(__file__).resolve().parents[1]
path.insert(0, str(ROOT / 'scripts'))
from regru_legal_0481 import PDFS

dist = ROOT / 'dist'
source = (ROOT / 'content/era-legal-0481.md').read_bytes()
assert hashlib.sha256(source).hexdigest() == '44562a73c520bb0c8c52ca3d3653d6195dc480ea5cac7ce6f070a2a55e7eac0b'
sections = re.split(r'^# 0[1-3]\. [^\n]+\n\n', source.decode(), flags=re.M)[1:]
paths = ('privacy/index.html', 'privacy/consent/index.html', 'privacy/cookies/index.html')
revisions = ('ERA-PRIVACY-1.3', 'ERA-PD-1.3', 'ERA-COOKIES-1.3')
apartment = re.compile(r'\b(?:кв\.?|квартира)\s*(?:№\s*)?\d|номер\s+квартиры', re.I)


def plain(text):
    return ' '.join(text.split())


for section, route, revision, (pdf_name, sha) in zip(sections, paths, revisions, PDFS.items(), strict=True):
    approved = re.split(r'^---$|^## Подпись под формой заявки$', section, maxsplit=1, flags=re.M)[0]
    original = plain(re.sub(r'^## ', '', approved, flags=re.M))
    html = (dist / route).read_text()
    rendered = re.search(r'<div class="legal-document">(.*?)</div>', html, flags=re.S)[1]
    actual = plain(unescape(re.sub(r'<[^>]+>', '', re.sub(r'</(?:p|h2)>', '\n', rendered))))
    assert original == actual, route
    assert f'data-pd-revision="{revision}"' in html and pdf_name in html and 'Скачать PDF' in html, route
    pdf = dist / pdf_name
    assert hashlib.sha256(pdf.read_bytes()).hexdigest() == sha
    text = subprocess.check_output(['pdftotext', '-nopgbrk', str(pdf), '-'], text=True)
    header = f'• {revision} • 21.11.2026'
    assert header in text and 'Крупская Елена Владимировна' in text
    legal_text = text.split(header, 1)[1]
    layout = r'^ЭРА(?: / era-cycle\.ru)?$|^/ ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ$|^Стр\. \d+$'
    assert original == plain(re.sub(layout, '', legal_text, flags=re.M)), pdf_name
    metadata = subprocess.check_output(['pdfinfo', str(pdf)], text=True)
    assert not apartment.search(text + metadata), pdf_name
    print(f'{route}: {revision}, exact HTML and PDF content, original PDF SHA-256')

assert {p.relative_to(dist).as_posix() for p in (dist / 'privacy').rglob('*') if p.is_file()} == set(paths) | set(PDFS)
assert not apartment.search(source.decode())
expected_footer = ('/privacy/', '/privacy/consent/', '/privacy/cookies/')
checked = 0
for file in dist.rglob('*'):
    if not file.is_file() or file.suffix not in {'.html', '.js', '.mjs', '.css', '.json', '.txt', '.xml', '.svg', '.php'}:
        continue
    html = file.read_text(errors='replace')
    assert not apartment.search(html), file
    if file.suffix != '.html' or '<footer id="site-footer"' not in html:
        continue
    checked += 1
    footer = re.search(r'<nav class="footer-legal-links".*?</nav>', html, flags=re.S)[0]
    assert all(re.search(r'href="(?:/Website_ERA)?' + route + '"', footer) for route in expected_footer), file
    assert 'Настройки cookies' in footer and 'data-cookie-notice' in html and 'id="cookie-settings"' in html, file
    if 'data-request-form' in html:
        box = re.search(r'<input[^>]*name="Согласие"[^>]*>', html)[0]
        assert ' required' in box and ' checked' not in box, file
        assert 'name="consent_revision" value="ERA-PD-1.3"' in html, file
        assert html.count('Полный текст согласия</a>') == 1, file
assert checked >= 38
print(f'{checked} HTML pages, shared privacy footer and cookies, approved documents only')
