"""Exercise the actual manifest, patch and SFTP transaction logic with a file transport."""
from datetime import date
import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import unittest
from urllib.parse import urlsplit
from zipfile import ZipFile

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts' / 'deploy'))
from regru_release import build_manifest, changes, json_bytes, read_patch, validate, write_patch
from regru_smoke import https_host, valid_cbr
from regru_sync import Host, LocalFiles, Release, SyncError


class RecordedTransport(LocalFiles):
    def __init__(self):
        self.transfers = []
        self.failure = None

    def posix_rename(self, source, target):
        path = Path(target)
        if self.failure == path:
            raise PermissionError('mock transfer interruption or permission error')
        super().posix_rename(source, target)
        if '/www/era-cycle.ru/' in target:
            self.transfers.append(path.name)


class Incremental(unittest.TestCase):
    def setUp(self):
        self.scratch = TemporaryDirectory()
        self.addCleanup(self.scratch.cleanup)
        root = Path(self.scratch.name)
        self.web = root / 'account/www/era-cycle.ru'
        self.state = root / 'account/era-deploy'
        self.dist = root / 'dist'
        self.output = root / 'artifact'
        self.web.mkdir(parents=True)
        self.state.mkdir(mode=0o700)
        self.dist.mkdir()
        self.baseline_copy = root / 'archive'
        self.baseline_copy.mkdir()
        self.original = b'<link rel="canonical" href="https://era-cycle.ru/">\n<p>Old</p>'
        self.current = self.original.replace(b'Old', b'New')
        for root, html in [(self.web, self.original), (self.baseline_copy, self.original), (self.dist, self.current)]:
            self.put(root, 'index.html', html)
            self.put(root, 'assets/film.mp4', b'fixed real-sized media buffer' * 100_000)
            self.put(root, 'api/request.php', b'protected server bootstrap')
            self.put(root, 'privacy/index.html', b'owner-approved policy')
            self.put(root, 'privacy/consent/index.html', b'owner-approved consent')
            self.put(root, 'data/cbr.json', b'latest live snapshot')
            self.put(root, '.htaccess', b'protected local settings')
        self.before = build_manifest(self.baseline_copy, '0.47.0', 'a' * 40)
        (self.state / 'live-manifest.json').write_bytes(json_bytes(self.before))
        self.transport = RecordedTransport()
        self.host = Host(self.transport, str(self.web))
        self.checks = 0
        self.release = Release(self.host, self.smoke)

    def smoke(self):
        self.checks += 1

    def put(self, root, path, value):
        file = root / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(value)

    def pack(self, verified=True):
        after = build_manifest(self.dist, '0.48.0', 'b' * 40)
        return write_patch(self.dist, self.output, self.before, after, verified)

    def apply(self, package, remote=True):
        with ZipFile(package) as archive:
            return self.release.apply(archive, remote=remote)

    def test_one_changed_file_large_unchanged_asset_protected_paths_and_zero_retry(self):
        self.put(self.dist, 'privacy/index.html', b'new unreleased policy')
        self.put(self.dist, 'api/request.php', b'new unreleased php')
        self.put(self.dist, 'data/cbr.json', b'older copy')
        bundle, plan = self.pack()
        self.assertEqual(plan['order'], ['index.html'])
        self.assertEqual(plan['upload_bytes'], len(self.current))
        self.assertEqual(plan['diff']['UNCHANGED'], ['assets/film.mp4'])
        with ZipFile(bundle) as archive:
            self.assertEqual([name for name in archive.namelist() if name.startswith('files/')], ['files/index.html'])
            read_patch(archive)
        deployed = self.apply(bundle)
        self.assertEqual(changes(deployed, deployed)['UPDATE'], [])
        self.assertEqual(self.checks, 1)
        self.assertEqual(self.transport.transfers, ['index.html'])
        self.assertEqual((self.web / 'index.html').read_bytes(), self.current)
        self.assertEqual((self.web / 'privacy/index.html').read_bytes(), b'owner-approved policy')
        self.assertEqual((self.web / 'privacy/consent/index.html').read_bytes(), b'owner-approved consent')
        self.assertEqual((self.web / 'data/cbr.json').read_bytes(), b'latest live snapshot')
        self.assertEqual(deployed, self.apply(bundle))
        self.assertEqual(self.transport.transfers, ['index.html'])

    def test_empty_diff(self):
        (self.dist / 'index.html').write_bytes(self.original)
        bundle, plan = self.pack()
        self.assertEqual((plan['order'], plan['upload_bytes']), ([], 0))
        result = self.apply(bundle)
        self.assertEqual(self.transport.transfers, [])
        self.assertEqual(result['release'], '0.48.0')

    def test_verified_baseline_can_upgrade_directly_to_1_0_0_and_roll_back(self):
        before = build_manifest(self.baseline_copy, '0.50.2', 'a' * 40)
        (self.state / 'live-manifest.json').write_bytes(json_bytes(before))
        after = build_manifest(self.dist, '1.0.0', 'b' * 40)
        bundle, _ = write_patch(self.dist, self.output, before, after, True)
        self.assertEqual(self.apply(bundle), after)
        self.assertEqual(self.release.rollback(after['commit']), before)
        self.assertEqual((self.web / '.htaccess').read_bytes(), b'protected local settings')
        self.assertEqual((self.web / 'data/cbr.json').read_bytes(), b'latest live snapshot')

    def test_interruption_retries_and_rollback_preserve_existing_and_new_files(self):
        self.put(self.dist, 'a-new.js', b'new resource')
        self.put(self.dist, 'b-new.css', b'new styles')
        archive, plan = self.pack()
        self.assertEqual(plan['order'], ['a-new.js', 'b-new.css', 'index.html'])
        self.transport.failure = self.web / 'index.html'
        with self.assertRaises(PermissionError):
            self.apply(archive)
        self.assertEqual((self.web / 'index.html').read_bytes(), self.original)
        record = json.loads((self.state / 'transaction.json').read_text())
        self.assertEqual((record['status'], record['done']), ('pending', ['a-new.js', 'b-new.css']))
        self.assertEqual(json.loads((self.state / 'live-manifest.json').read_text()), self.before)
        self.transport.failure = None
        self.apply(archive)
        self.assertEqual(self.transport.transfers, ['a-new.js', 'b-new.css', 'index.html'])
        restored = self.release.rollback('b' * 40)
        self.assertEqual((self.web / 'index.html').read_bytes(), self.original)
        self.assertEqual((self.web / 'a-new.js').read_bytes(), b'new resource')
        self.assertEqual(restored['release'], '0.47.0')
        self.assertIn('a-new.js', restored['files'])
        self.assertEqual(restored, self.release.rollback('b' * 40))

    def test_smoke_failure_cannot_advance_baseline(self):
        archive, _ = self.pack()

        def failed_smoke():
            raise RuntimeError('mock HTTP failure')

        self.release.smoke = failed_smoke
        with self.assertRaises(RuntimeError):
            self.apply(archive)
        self.assertEqual(json.loads((self.state / 'live-manifest.json').read_text()), self.before)
        self.release.smoke = self.smoke
        self.release.rollback('b' * 40)
        self.assertEqual((self.web / 'index.html').read_bytes(), self.original)

    def test_remove_candidates_are_reported_and_preserved(self):
        (self.dist / 'assets/film.mp4').unlink()
        archive, plan = self.pack()
        self.assertEqual(plan['diff']['REMOVE_CANDIDATE'], ['assets/film.mp4'])
        live = self.apply(archive)
        self.assertTrue((self.web / 'assets/film.mp4').exists())
        self.assertIn('assets/film.mp4', live['files'])

    def test_unverified_archive_requires_owner_baseline_for_sftp(self):
        archive, _ = self.pack(verified=False)
        with self.assertRaisesRegex(SyncError, 'verify the installed site'):
            self.apply(archive)
        self.assertEqual(self.transport.transfers, [])
        self.apply(archive, remote=False)
        self.assertEqual(self.transport.transfers, ['index.html'])

    def test_live_content_drift_does_not_write_any_web_files(self):
        self.put(self.dist, 'first.js', b'new content')
        archive, _ = self.pack()
        self.put(self.web, 'index.html', b'manually modified')
        with self.assertRaisesRegex(SyncError, 'Unexpected version'):
            self.apply(archive)
        self.assertEqual(self.transport.transfers, [])
        self.assertEqual((self.web / 'index.html').read_bytes(), b'manually modified')

    def test_rejects_symbolic_link_on_host(self):
        archive, _ = self.pack()
        outside = Path(self.scratch.name) / 'outside.html'
        outside.write_bytes(self.original)
        (self.web / 'index.html').unlink()
        (self.web / 'index.html').symlink_to(outside)
        with self.assertRaisesRegex(SyncError, 'symbolic links'):
            self.apply(archive)
        self.assertEqual(outside.read_bytes(), self.original)

    def test_rejects_traversal_secrets_and_non_public_types(self):
        for path in ('../index.html', '/etc/passwd', 'dir//x.html', 'dir/../x.html', 'dir\\x.html',
                     'era-private/config.json', 'credentials.json', 'malicious.php', '.env', 'logs/site.log'):
            with self.subTest(path=path):
                bad = dict(self.before, files={path: {'size': 1, 'sha256': 'a' * 64}})
                with self.assertRaises(ValueError):
                    validate(bad)
        self.put(self.dist, 'ordinary.txt', b'"password": "synthetic-test-value"')
        with self.assertRaisesRegex(ValueError, 'Possible credential'):
            self.pack()

    def test_rejects_extra_member_and_incorrect_payload(self):
        archive_path, _ = self.pack()
        with ZipFile(archive_path, 'a') as archive:
            archive.writestr('files/config.json', '{}')
        with ZipFile(archive_path) as archive, self.assertRaises(ValueError):
            read_patch(archive)

    def test_refuses_concurrent_transaction(self):
        archive, _ = self.pack()
        (self.state / 'release.lock').mkdir()
        with self.assertRaisesRegex(SyncError, 'locked'):
            self.apply(archive)
        self.assertEqual(self.transport.transfers, [])


class SmokeInputs(unittest.TestCase):
    def test_only_site_https_hosts_and_standard_port(self):
        for host in ('era-cycle.ru', 'www.era-cycle.ru'):
            for port in ('', ':443'):
                self.assertEqual(https_host(urlsplit(f'https://{host}{port}/economics/?test=1')), host)
        for url in ('http://era-cycle.ru/', 'https://era-cycle.ru:444/', 'https://era-cycle.ru:/',
                    'https://user@era-cycle.ru/', 'https://era-cycle.ru.example/', 'https://example.org:443/'):
            self.assertIsNone(https_host(urlsplit(url)), url)

    def test_cbr_dates_and_positive_numeric_rates(self):
        today = date(2026, 11, 28)
        snapshot = {'source': 'CBR', 'requestedDate': '2026-11-28', 'effectiveDate': '2026-11-27',
                    'rates': {code: {'rate': value} for code, value in [('USD', 81.2), ('EUR', 95), ('CNY', 11.2)]}}
        self.assertTrue(valid_cbr(snapshot, today))
        for effective in ('2026-11-31', '2026-11-29', '20261127', None):
            self.assertFalse(valid_cbr(snapshot | {'effectiveDate': effective}, today))
        for invalid in (0, -1, True, '82', float('inf'), float('nan'), None):
            self.assertFalse(valid_cbr(snapshot | {'rates': snapshot['rates'] | {'USD': {'rate': invalid}}}, today))


if __name__ == '__main__':
    unittest.main()
