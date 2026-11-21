#!/usr/bin/env python3
"""Prepare the manual 0.48.2 patch against the exact installed 0.48.1 manifest."""

import argparse
import shutil
from pathlib import Path
from zipfile import ZipFile

from regru_release import build_manifest, digest_file, plan, read_json, validate, write_patch

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/regru/installed-0.48.1.json'
BASE_SHA = 'a2b5cb0ae0596f4838878c18d282b42a7c6a112a45d48626e2323399c03f5bcf'
BASE_COMMIT = '03f07c9cae17c20091d2a80dfe44eb35f0d15d05'
ASSETS = {'legal.css', 'cookie-consent.js'}
PROTECTED_HTML = {
    'privacy/index.html': '9101549f0b50a11674a98451f71ec05afc2988de66ad492215c544cee1c97f2e',
    'privacy/consent/index.html': '4fc9fbf497484759bb6ca22a1d0d4b59f589f8f90cbb739fd9828b302e8cc8eb',
}
HANDLER_SHA = 'b8b055e9c12488419973b93afff014a44d711fb1e2029374d02dbfcf21afbcaf'


def prepare(dist, output, commit):
    if output.resolve().is_relative_to(dist.resolve()):
        raise ValueError('Store release files outside the public build')
    if digest_file(BASE) != BASE_SHA:
        raise ValueError('Use the original LIVE_AFTER.json from ERA_0.48.1_REVIEW')
    before = validate(read_json(BASE))
    if before['release'] != '0.48.1' or before['commit'] != BASE_COMMIT:
        raise ValueError('Unexpected installed release')
    after = build_manifest(dist, '0.48.2', commit)
    review = plan(before, after, False)
    diff = review['diff']
    if diff['ADD'] or diff['REMOVE_CANDIDATE'] or not ASSETS.issubset(diff['UPDATE']):
        raise ValueError('Expected an update-only patch based on 0.48.1')
    for path in set(diff['UPDATE']) - ASSETS:
        if not path.endswith('.html') or path.startswith('privacy/'):
            raise ValueError(f'Outside the cookie UI release scope: {path}')

    legal = {path: item['sha256'] for path, item in before['files'].items() if path.startswith('privacy/')}
    legal.update(PROTECTED_HTML)
    for path, sha in legal.items():
        if digest_file(dist / path) != sha:
            raise ValueError(f'Legal document differs from 0.48.1: {path}')
    if digest_file(ROOT / 'server/regru/private/request-handler.php') != HANDLER_SHA:
        raise ValueError('Private request handler differs from 0.48.1')

    archive, _ = write_patch(dist, output, before, after, False)
    with ZipFile(archive) as patch:
        for name in ('BEFORE.json', 'PLAN.json'):
            (output / name).write_bytes(patch.read(name))
    (output / 'LEGAL_SHA256SUMS').write_text(''.join(f'{sha}  {path}\n' for path, sha in sorted(legal.items())), encoding='utf-8')
    (output / 'FILE_CHANGES.tsv').write_text(''.join(
        f'{path}\t{before["files"][path]["sha256"]}\t{after["files"][path]["sha256"]}\n'
        for path in review['order']), encoding='utf-8')
    for path in ('scripts/regru_verify.php', 'scripts/regru_0482_files.sh', 'docs/ERA_0482_INSTALL.md'):
        shutil.copyfile(ROOT / path, output / Path(path).name)
    report = (ROOT / 'docs/ERA_0482_TEST_REPORT.md').read_text(encoding='utf-8')
    (output / 'ERA_0482_TEST_REPORT.md').write_text(
        report + f'\nПроверенный коммит `{commit}`.\n\nАрхив `{archive.name}` — {archive.stat().st_size} байт, SHA-256 `{digest_file(archive)}`.\n',
        encoding='utf-8')
    delivered = [archive, *(output / name for name in (
        'BEFORE.json', 'LIVE_AFTER.json', 'PLAN.json', 'PATCH_MANIFEST.md', 'LEGAL_SHA256SUMS',
        'FILE_CHANGES.tsv', 'regru_verify.php', 'regru_0482_files.sh', 'ERA_0482_INSTALL.md', 'ERA_0482_TEST_REPORT.md'))]
    (output / 'SHA256SUMS').write_text(''.join(f'{digest_file(path)}  {path.name}\n' for path in delivered), encoding='utf-8')
    print(f'{archive.name}: {archive.stat().st_size} bytes; UPDATE {len(diff["UPDATE"])}, ADD 0, REMOVE 0')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, default=ROOT / 'dist')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--commit', required=True)
    args = parser.parse_args()
    try:
        prepare(args.dist, args.output, args.commit)
    except (OSError, ValueError) as error:
        parser.exit(1, f'{error}\n')
