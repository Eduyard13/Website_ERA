from io import BytesIO
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / 'scripts' / 'build'), str(ROOT / 'scripts' / 'deploy')]
from regru_cleanup import cleanup_plan, transfer
from regru_release import build_manifest, make_manifest, PINNED_PDF_VIEWER, verified_payload
from validate_structure import check_dist, verify_tree


class Architecture(unittest.TestCase):
    def setUp(self):
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.web = self.root / 'www'
        self.backup = self.root / 'quarantine'
        self.web.mkdir()
        self.registry = {
            'paths': {'style.css': 'assets/css/core/style.css', 'map.js': 'assets/js/core/map.js'},
            'legacyLegal': {'style.css': '0.47.0'}, 'legacyDependencies': [],
            'retired': ['obsolete.js'],
        }
        self.home = '<link rel="canonical" href="https://era-cycle.ru/">'

    def put(self, path, content):
        file = self.web / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(content, encoding='utf-8')
        return file

    def test_rejects_root_assets_bad_types_and_symlinks(self):
        for path in self.registry['paths'].values():
            self.put(path, '')
        verify_tree(self.web, self.registry, source=True)
        for path, error in [('extra.js','Unapproved root'), ('example.tmp','Forbidden public file')]:
            file = self.put(path, '')
            with self.assertRaisesRegex(ValueError, error):
                verify_tree(self.web, self.registry, source=True)
            file.unlink()
        file = self.web / 'example.txt'
        file.symlink_to(self.root / 'example.txt')
        with self.assertRaisesRegex(ValueError, 'Symbolic link'):
            verify_tree(self.web, self.registry, source=True)

    def test_rejects_case_errors_missing_anchors_and_duplicate_prefix(self):
        for path in self.registry['paths'].values():
            self.put(path, '')
        self.put('style.css', '')
        self.put('projects/index.html', '<main id="details"></main>')
        for url, error in [
            ('/Website_ERA/Projects/', 'Broken local URL'),
            ('/Website_ERA/projects/#detail', 'Broken local URL'),
            ('/Website_ERA/Website_ERA/projects/', 'Duplicate base path'),
        ]:
            self.put('index.html', f'<a href="{url}">Details</a>')
            with self.assertRaisesRegex(ValueError, error):
                check_dist(self.web, self.registry, '/Website_ERA', [])

    def test_only_the_reviewed_vendor_bytes_can_bypass_the_literal_check(self):
        viewer = 'vendor/pdfjs/pdf.mjs'
        with (ROOT / 'node_modules/pdfjs-dist/build/pdf.mjs').open('rb') as source:
            self.assertEqual(verified_payload(source, viewer), PINNED_PDF_VIEWER)
        with self.assertRaisesRegex(ValueError, 'reviewed npm dependency'):
            verified_payload(BytesIO(b'const changed=true;'), viewer)
        with self.assertRaisesRegex(ValueError, 'Possible credential'):
            verified_payload(BytesIO(b'{"password": "fixture-only"}'), 'assets/data.json')

    def test_quarantine_and_restore_are_idempotent_and_keep_other_paths(self):
        self.put('index.html', self.home)
        self.put('privacy/index.html', '<script src="../map.js?v=old"></script>')
        self.put('privacy/consent/index.html', '<link rel="stylesheet" href="/style.css">')
        self.put('privacy/cookies/index.html', '<p>Current cookies</p>')
        self.put('assets/js/core/map.js', 'new')
        release = build_manifest(self.web, '0.50.0', 'b' * 40)
        for file in ('obsolete.js', 'map.js', 'style.css', 'unknown.js'):
            self.put(file, 'old')
        recorded = build_manifest(self.web, '0.50.0', 'b' * 40)
        plan = cleanup_plan(self.web, release, recorded, self.registry)
        self.assertEqual(list(plan['files']), ['obsolete.js'])
        self.assertEqual(plan['retained'], ['map.js','style.css','unknown.js'])
        self.put('obsolete.js', 'drift')
        with self.assertRaisesRegex(ValueError, 'Unexpected contents'):
            transfer(self.web, self.backup, plan, release, self.registry)
        self.put('obsolete.js', 'old')
        self.assertEqual(transfer(self.web, self.backup, plan, release, self.registry), 1)
        self.assertEqual(transfer(self.web, self.backup, plan, release, self.registry), 0)
        self.assertEqual(transfer(self.web, self.backup, plan, release, self.registry, restore=True), 1)
        self.assertEqual(transfer(self.web, self.backup, plan, release, self.registry, restore=True), 0)
        self.assertEqual(build_manifest(self.web, '0.50.0', 'b' * 40), recorded)
        stale = make_manifest('0.49.29', 'a' * 40, recorded['files'])
        with self.assertRaisesRegex(ValueError, 'verified live manifest'):
            cleanup_plan(self.web, release, stale, self.registry)
        unapproved = plan | {'files': {'unknown.js': recorded['files']['unknown.js']}}
        with self.assertRaisesRegex(ValueError, 'unapproved legacy path'):
            transfer(self.web, self.backup, unapproved, release, self.registry)


if __name__ == '__main__':
    unittest.main()
