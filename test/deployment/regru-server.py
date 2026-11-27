"""Exercise the real PHP endpoint, TLS SMTP and the no-JavaScript form locally."""

import base64
import contextlib
import email.policy
import http.client
import http.server
import io
import json
import os
import secrets
import shutil
import socket
import socketserver
import ssl
import subprocess
import tempfile
import threading
import time
import unittest
import zipfile
from email.parser import BytesParser
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
DIST = Path(os.environ.get('ERA_DIST', REPO / 'dist'))
PHP = os.environ.get('ERA_PHP', 'php')
ORIGIN = 'https://era-cycle.ru'
PDF = b'%PDF-1.4\n% sample test attachment\n%%EOF\n'
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j0uoAAAAASUVORK5CYII=')


class MailPeer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(self, context):
        self.context = context
        self.messages = []
        self.mode = 'accept'
        self.auth = []
        self.password = secrets.token_hex(16)
        super().__init__(('127.0.0.1', 0), MailHandler)

    def get_request(self):
        connection, address = super().get_request()
        connection.settimeout(15)
        try:
            return self.context.wrap_socket(connection, server_side=True), address
        except ssl.SSLError:
            connection.close()
            raise OSError('TLS handshake rejected') from None


class MailHandler(socketserver.StreamRequestHandler):
    def write(self, line):
        self.wfile.write(line + b'\r\n')

    def handle(self):
        envelope = []
        try:
            self.write(b'220 localhost ESMTP fixture')
            for line in self.rfile:
                command = line.rstrip(b'\r\n')
                if command.startswith(b'EHLO '):
                    self.wfile.write(b'250-localhost\r\n250 AUTH LOGIN\r\n')
                elif command == b'AUTH LOGIN':
                    self.write(b'334 VXNlcm5hbWU6')
                    user = base64.b64decode(self.rfile.readline())
                    self.write(b'334 UGFzc3dvcmQ6')
                    password = base64.b64decode(self.rfile.readline())
                    valid = user == b'noreply@era-cycle.ru' and password == self.server.password.encode()
                    self.server.auth.append(valid)
                    self.write(b'235 authenticated' if valid else b'535 authentication failed')
                elif command.startswith((b'MAIL FROM:', b'RCPT TO:')):
                    envelope.append(command)
                    self.write(b'250 OK')
                elif command == b'DATA':
                    self.write(b'354 End with dot')
                    data = []
                    for row in self.rfile:
                        if row == b'.\r\n':
                            break
                        data.append(row[1:] if row.startswith(b'..') else row)
                    if self.server.mode == 'timeout':
                        time.sleep(10)
                    elif self.server.mode == 'fail':
                        self.write(b'451 Mailbox temporarily unavailable')
                    else:
                        self.server.messages.append((envelope, BytesParser(policy=email.policy.default).parsebytes(b''.join(data))))
                        self.write(b'250 Queued')
                elif command == b'QUIT':
                    self.write(b'221 Close')
                    return
                else:
                    self.write(b'250 OK')
        except (OSError, TimeoutError):
            pass


def bundle(entries, compression=zipfile.ZIP_STORED):
    data = io.BytesIO()
    with zipfile.ZipFile(data, 'w', compression=compression) as archive:
        for filename, payload in entries:
            archive.writestr(filename, payload)
    return data.getvalue()


def port():
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        return listener.getsockname()[1]


@contextlib.contextmanager
def browser_gateway(backend):
    # Keep Chrome's native multipart body intact while testing the production Origin policy.
    class Gateway(http.server.BaseHTTPRequestHandler):
        def relay(self):
            headers = dict(self.headers)
            for key in ('Origin', 'Referer'):
                if value := self.headers.get(key):
                    headers[key] = value.replace(base, ORIGIN, 1)
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            status, response_headers, response = backend(self.command, body, headers, self.path)
            self.send_response(status)
            for key, value in response_headers.items():
                if key.lower() not in {'connection', 'content-length', 'date', 'server', 'transfer-encoding'}:
                    self.send_header(key, value)
            self.send_header('Content-Length', str(len(response)))
            self.end_headers()
            self.wfile.write(response)

        do_GET = do_POST = relay

        def log_message(self, *args):
            pass

    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), Gateway) as proxy:
        base = f'http://127.0.0.1:{proxy.server_port}'
        threading.Thread(target=proxy.serve_forever, daemon=True).start()
        try:
            yield base
        finally:
            proxy.shutdown()


class ServiceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.addClassCleanup(cls.stack.close)
        work = Path(cls.stack.enter_context(tempfile.TemporaryDirectory(prefix='era-regru-test-', dir=DIST.resolve().parent)))
        cls.web = work / 'www' / 'era-cycle.ru'
        cls.private = work / 'era-private'
        shutil.copytree(DIST, cls.web, copy_function=os.link)
        shutil.copytree(REPO / 'server/regru/private', cls.private, ignore=shutil.ignore_patterns('config.json', 'state'))
        cls.private.chmod(0o700)
        cls.legal = {}
        for path in ('privacy/index.html', 'privacy/consent/index.html'):
            document = cls.web / path
            cls.legal[document] = document.read_text()
            document.unlink()
        cls.cert, cls.key = work / 'certificate.pem', work / 'key.pem'
        subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
                        '-addext', 'subjectAltName=DNS:localhost', '-keyout', str(cls.key), '-out', str(cls.cert)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cls.cert, cls.key)
        cls.mail = cls.stack.enter_context(MailPeer(context))
        threading.Thread(target=cls.mail.serve_forever, daemon=True).start()
        cls.stack.callback(cls.mail.shutdown)
        cls.http_port = port()
        cls.base = f'http://127.0.0.1:{cls.http_port}'
        cls.settings = {
            'web_root': str(cls.web), 'requests_enabled': True, 'privacy_version': 'ERA-PD-1.3',
            'rate_secret': secrets.token_hex(32),
            'smtp': {'host': 'localhost', 'port': cls.mail.server_address[1], 'password': cls.mail.password},
        }
        cls.log = cls.stack.enter_context((work / 'php.log').open('w+'))
        cls.php = subprocess.Popen([PHP, '-d', f'openssl.cafile={cls.cert}', '-d', 'post_max_size=6M',
                                    '-d', 'upload_max_filesize=5M', '-d', 'max_file_uploads=21',
                                    '-S', f'127.0.0.1:{cls.http_port}', '-t', str(cls.web)], stdout=cls.log, stderr=cls.log)
        cls.stack.callback(cls.stop_php)
        for _ in range(60):
            try:
                if cls.request('GET')[0] == 405:
                    break
            except OSError:
                time.sleep(.05)
        else:
            raise RuntimeError('PHP server did not start')

    @classmethod
    def stop_php(cls):
        cls.php.terminate()
        cls.php.wait(timeout=10)

    @classmethod
    def request(cls, method, body=None, headers=None, path='/api/request.php'):
        conn = http.client.HTTPConnection('127.0.0.1', cls.http_port, timeout=25)
        try:
            conn.request(method, path, body, headers or {})
            response = conn.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            conn.close()

    def setUp(self):
        self.mail.mode = 'accept'
        self.mail.messages.clear()
        self.mail.auth.clear()
        shutil.rmtree(self.private / 'state', ignore_errors=True)
        self.write_config()
        for document, original in self.legal.items():
            document.write_text(original)

    def write_config(self, **override):
        path = self.private / 'config.json'
        path.write_text(json.dumps(self.settings | override))
        path.chmod(0o600)

    def post(self, fields=None, files=(), **headers):
        selected = {'Имя': 'Иван <Клиент>', 'email': 'fixture@example.test', 'Задача': 'Задача ЭРА & эскиз',
                    'Согласие': '1', 'consent_revision': 'ERA-PD-1.3', 'Ссылки': 'https://example.test/video', 'Интересует': 'Линия BASE'}
        selected.update(fields or {})
        boundary = 'Era-' + secrets.token_hex(12)
        chunks = []
        for name, value in selected.items():
            if value is None:
                continue
            if isinstance(value, str):
                value = value.encode()
            chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n'.encode() + value + b'\r\n')
        for name, payload in files:
            chunks.append((f'--{boundary}\r\nContent-Disposition: form-data; name="attachment[]"; filename="{name}"\r\n'
                           'Content-Type: application/octet-stream\r\n\r\n').encode() + payload + b'\r\n')
        chunks.append(f'--{boundary}--\r\n'.encode())
        return self.request('POST', b''.join(chunks), {'Content-Type': f'multipart/form-data; boundary={boundary}', 'Origin': ORIGIN} | headers)

    def test_methods_and_headers(self):
        status, headers, body = self.request('GET')
        self.assertEqual((status, headers['Allow'], headers['Cache-Control']), (405, 'POST', 'no-store'))
        self.assertIn('noindex', headers['X-Robots-Tag'])
        self.assertNotIn(b'<?php', body)
        self.assertEqual(self.request('POST', '{}', {'Content-Type': 'application/json'})[0], 415)
        self.assertEqual(self.post(Origin='https://elsewhere.test')[0], 403)
        self.assertEqual(self.request('GET', path='/era-private/config.json')[0], 404)

    def test_fields_and_policy_block(self):
        for data in [{'Имя': ''}, {'Задача': '  '}, {'email': 'nope'}, {'Согласие': '0'}, {'Согласие': None},
                     {'consent_revision': 'ERA-PD-1.2'}, {'consent_revision': None}, {'_honey': 'robot'},
                     {'email': 'a@example.test\r\nBcc: x@y.test'}, {'Имя': b'\xff'}, {'Имя': 'A' * 101}]:
            with self.subTest(data=data):
                self.assertEqual(self.post(data)[0], 422)
        self.write_config(requests_enabled=False)
        self.assertEqual(self.post()[0], 503)
        self.write_config(privacy_version='ERA-PD-1.2')
        self.assertEqual(self.post()[0], 503)
        self.write_config()
        for document, original in self.legal.items():
            document.write_text(original.replace('data-policy-status="approved"', 'data-policy-status="pending"'))
            self.assertEqual(self.post()[0], 503)
            document.write_text(original)
        self.assertFalse(self.mail.messages)

    def test_smtp_headers_attachment_deduplication(self):
        status, headers, body = self.post({'Страница обращения': '/catalog/lines/separatsiya-01'}, [('эскиз.pdf', PDF)])
        self.assertEqual((status, headers['Location'], headers['Cache-Control']), (303, '/contacts/sent/', 'no-store'))
        self.assertEqual(self.post({'Страница обращения': '/catalog/'}, [('эскиз.pdf', PDF)])[0], 409)
        self.assertEqual(self.mail.auth, [True])
        envelope, mail = self.mail.messages[0]
        self.assertEqual(envelope, [b'MAIL FROM:<noreply@era-cycle.ru>', b'RCPT TO:<info@era-cycle.ru>'])
        self.assertEqual(mail['From'].addresses[0].addr_spec, 'noreply@era-cycle.ru')
        self.assertEqual(mail['To'].addresses[0].addr_spec, 'info@era-cycle.ru')
        self.assertEqual(mail['Reply-To'].addresses[0].addr_spec, 'fixture@example.test')
        self.assertEqual(mail['Subject'], 'Заявка с сайта ЭРА')
        text = mail.get_body(preferencelist=('plain',)).get_content()
        for value in ['Иван <Клиент>', 'Задача ЭРА & эскиз', 'https://example.test/video', 'https://era-cycle.ru/catalog/lines/separatsiya-01']:
            self.assertIn(value, text)
        self.assertRegex(text, r'Подтверждено отдельной галочкой\s+·\s+ERA-PD-1\.3\s+·\s+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00')
        attachment, = mail.iter_attachments()
        self.assertEqual((attachment.get_filename(), attachment.get_content_type(), attachment.get_payload(decode=True)), ('эскиз.pdf', 'application/pdf', PDF))
        self.assertEqual(len(self.mail.messages), 1)
        state = (self.private / 'state/requests.json').read_text()
        events = (self.private / 'state/events.log').read_text()
        for token in ('127.0.0.1', 'fixture@example.test', 'Клиент', 'эскиз.pdf', self.mail.password, self.settings['rate_secret']):
            self.assertNotIn(token, state + events + body.decode())

    def test_uploads_and_rate_limit(self):
        valid = bundle([('сырьё.png', PNG), ('схема.pdf', PDF)])
        self.assertEqual(self.post(files=[('Материалы_ЭРА.zip', valid)])[0], 303)
        self.assertEqual(self.post(files=[('сырьё.png', PNG), ('схема.pdf', PDF)])[0], 303)
        self.assertEqual(self.post(files=[('wrong.jpg', PDF)])[0], 422)
        self.assertEqual(self.post(files=[('plan.php.pdf', PDF)])[0], 422)
        self.assertEqual(self.post(files=[('plan.pdf', PDF + b'x' * (5_000_001 - len(PDF)))])[0], 413)
        self.assertEqual(self.post(files=[('archive.zip', bundle([('nested/plan.pdf', PDF)]))])[0], 422)
        status, headers, _ = self.post({'Задача': 'Повторная серия обращений'})
        self.assertEqual(status, 429)
        self.assertEqual(headers['Retry-After'], '600')
        _, mail = self.mail.messages[0]
        attachment, = mail.iter_attachments()
        self.assertEqual(attachment.get_payload(decode=True), valid)

    def test_archive_constraints(self):
        for archive in [bundle([('test.pdf', PDF)], zipfile.ZIP_DEFLATED), bundle([('../schema.pdf', PDF)]),
                        bundle([('payload.exe', b'fixture')]), bundle([(f'{i}.pdf', PDF) for i in range(21)])]:
            self.assertEqual(self.post(files=[('archive.zip', archive)])[0], 422)
        self.assertFalse(self.mail.messages)

    def test_smtp_failure_and_timeout(self):
        for mode in ['fail', 'timeout']:
            self.mail.mode = mode
            start = time.monotonic()
            status, headers, body = self.post({'Задача': 'SMTP scenario ' + mode})
            self.assertEqual(status, 502)
            self.assertNotIn('Location', headers)
            self.assertNotIn(self.mail.password.encode(), body)
            if mode == 'timeout':
                self.assertGreater(time.monotonic() - start, 6)
        self.assertEqual(self.mail.messages, [])

    def test_tls_hostname_is_verified(self):
        self.write_config(smtp=self.settings['smtp'] | {'host': '127.0.0.1'})
        self.assertEqual(self.post()[0], 502)
        self.assertFalse(self.mail.auth)

    @unittest.skipUnless(os.environ.get('ERA_BROWSER') == '1', 'Set ERA_BROWSER=1 for Chromium')
    def test_native_form_without_js(self):
        from playwright.sync_api import sync_playwright

        with sync_playwright() as playwright, browser_gateway(self.request) as base:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
            page = browser.new_page(java_script_enabled=False, reduced_motion='reduce', viewport={'width': 390, 'height': 900})
            page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
            page.goto(base + '/catalog/lines/separatsiya-01/')
            page.locator('#main a[data-project-request]').last.click()
            form = page.locator('#project-form form')
            form.locator('[name="Имя"]').fill('Тест без JavaScript')
            form.locator('[name="email"]').fill('native@example.test')
            form.locator('[name="Задача"]').fill('Передать исходный контекст и два файла')
            checkbox = form.locator('[name="Согласие"]')
            self.assertTrue(checkbox.evaluate('input => input.required && !input.checked'))
            checkbox.check()
            form.locator('[data-request-files]').set_input_files([{'name': 'schema.pdf', 'mimeType': 'application/pdf', 'buffer': PDF},
                                                               {'name': 'photo.png', 'mimeType': 'image/png', 'buffer': PNG}])
            with page.expect_navigation(wait_until='domcontentloaded', timeout=10000) as navigation:
                form.locator('[data-request-submit]').click()
            self.assertEqual(page.url, base + '/contacts/sent/', (navigation.value.status, page.locator('main').inner_text()))
            _, mail = self.mail.messages[0]
            content = mail.get_body(preferencelist=('plain',)).get_content()
            self.assertIn('Линия сухой сепарации плёнок', content)
            self.assertIn('https://era-cycle.ru/catalog/lines/separatsiya-01', content)
            self.assertEqual({a.get_filename() for a in mail.iter_attachments()}, {'schema.pdf', 'photo.png'})
            browser.close()

    @unittest.skipUnless(os.environ.get('ERA_BROWSER') == '1', 'Set ERA_BROWSER=1 for Chromium')
    def test_browser_sends_real_zip_for_equipment_modal(self):
        from playwright.sync_api import sync_playwright

        with sync_playwright() as playwright, browser_gateway(self.request) as base:
            browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
            page = browser.new_page(reduced_motion='reduce', viewport={'width': 1440, 'height': 900})
            page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
            page.goto(base + '/catalog/equipment/ballisticheskiy-separator/')
            page.get_by_role('link', name='Запросить предложение', exact=True).click()
            form = page.locator('#project-request form')
            self.assertIn('Баллистический сепаратор', form.locator('[data-request-topic]').input_value())
            form.locator('[name="Имя"]').fill('Тест комплектования')
            form.locator('[name="email"]').fill('bundle@example.test')
            form.locator('[name="Задача"]').fill('Проверить архив двух материалов')
            checkbox = form.locator('[name="Согласие"]')
            self.assertTrue(checkbox.evaluate('input => input.required && !input.checked'))
            checkbox.check()
            form.locator('[data-request-files]').set_input_files([{'name': 'эскиз.pdf', 'mimeType': 'application/pdf', 'buffer': PDF},
                                                               {'name': 'сырьё.png', 'mimeType': 'image/png', 'buffer': PNG}])
            with page.expect_navigation(wait_until='domcontentloaded', timeout=10000) as navigation:
                form.locator('[data-request-submit]').click()
            self.assertEqual(page.url, base + '/contacts/sent/', (navigation.value.status, page.locator('main').inner_text()))
            _, mail = self.mail.messages[0]
            files = list(mail.iter_attachments())
            self.assertEqual(len(files), 1)
            self.assertEqual(files[0].get_filename(), 'Материалы_ЭРА.zip')
            with zipfile.ZipFile(io.BytesIO(files[0].get_payload(decode=True))) as archive:
                self.assertEqual(archive.read('эскиз.pdf'), PDF)
                self.assertEqual(archive.read('сырьё.png'), PNG)
            browser.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
