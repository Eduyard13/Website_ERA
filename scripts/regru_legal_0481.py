#!/usr/bin/env python3
"""Build the manual ERA 0.48.1 release from the pinned 0.48.0 baseline."""

import argparse
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from regru_release import (SECRET_BYTES, build_manifest, digest_file, json_bytes,
                           plan, read_json, validate, write_patch)

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs/regru/installed-0.48.0.json'
BASE_SHA256 = '38e3929e99c23ca6e2e64802d428381ba66f6fd14a7ff69bf7399a9a7440aa83'
RELEASE = '0.48.1'
PDFS = {
    'privacy/files/ERA_Personal_Data_Policy.pdf': 'a67b42cb996f936c636c9789db1cfd83db80357b001b914ce76e8f2d80d13793',
    'privacy/files/ERA_Consent_Personal_Data.pdf': 'f2b2176d9beb22ec685feadb0e1553d7f19b39c5e80d100a62e85b687f141256',
    'privacy/files/ERA_Cookies_Policy.pdf': '1a1a9809964ac183d17f1956aa10c32d441e7fd8533694072df7a1debd4c885e',
}


def protected_bundle(dist, output, before, commit):
    payload = {
        'public/privacy/index.html': dist / 'privacy/index.html',
        'public/privacy/consent/index.html': dist / 'privacy/consent/index.html',
        'private/request-handler.php': ROOT / 'server/regru/private/request-handler.php',
    }
    manifest = {'schema': 1, 'release': RELEASE, 'commit': commit, 'base_commit': before['commit'], 'files': {}}
    content = {}
    for name, path in payload.items():
        content[name] = path.read_bytes()
        if SECRET_BYTES.search(content[name]):
            raise ValueError(f'Possible credential in {name}')
        manifest['files'][name] = {'sha256': digest_file(path), 'size': len(content[name])}
    archive_path = output / f'ERA_PROTECTED_{RELEASE}.zip'
    with ZipFile(archive_path, 'w', ZIP_DEFLATED) as archive:
        for name, data in {'MANIFEST.json': json_bytes(manifest), **content}.items():
            archive.writestr(ZipInfo(name), data, compress_type=ZIP_DEFLATED)
    with ZipFile(archive_path) as archive:
        if set(archive.namelist()) != {'MANIFEST.json', *payload} or archive.testzip() is not None:
            raise ValueError('Invalid protected archive')
    return archive_path, manifest


def prepare(dist, output, commit):
    if output.resolve().is_relative_to(dist.resolve()):
        raise ValueError('Store the release outside the public build directory')
    if digest_file(BASE) != BASE_SHA256:
        raise ValueError('The installed 0.48.0 baseline checksum differs')
    before = validate(read_json(BASE))
    after = build_manifest(dist, RELEASE, commit)
    review = plan(before, after, False)
    allowed_assets = set(PDFS) | {'cookie-consent.js', 'legal.css', 'contact-maps.js', 'contact-premium.css'}
    changed_assets = {path for path in review['order'] if not path.endswith('.html')}
    if changed_assets != allowed_assets or review['diff']['REMOVE_CANDIDATE']:
        raise ValueError('Unexpected public asset changes or removals in ERA 0.48.1')
    for path, sha256 in PDFS.items():
        if after['files'][path]['sha256'] != sha256:
            raise ValueError(f'The approved PDF differs: {path}')

    patch, _ = write_patch(dist, output, before, after, False)
    protected, manifest = protected_bundle(dist, output, before, commit)
    report = output / 'PATCH_MANIFEST.md'
    with report.open('a', encoding='utf-8') as summary:
        summary.write('\n## Отдельное подтверждение владельца\n\n')
        summary.write(f'Файлы из `{protected.name}` указаны относительно соответствующего корня.\n\n')
        summary.write('| Корень и путь | Байт | SHA-256 |\n|---|---:|---|\n')
        for path, item in manifest['files'].items():
            summary.write(f'| `{path}` | {item["size"]} | `{item["sha256"]}` |\n')
    for path in ('scripts/regru_verify.php', 'scripts/regru_verify_0481_protected.php', 'docs/ERA_0481_REG_RU_UPDATE.md'):
        shutil.copyfile(ROOT / path, output / Path(path).name)
    outputs = [patch, protected, report, *(output / path for path in (
        'LIVE_AFTER.json', 'regru_verify.php', 'regru_verify_0481_protected.php', 'ERA_0481_REG_RU_UPDATE.md'))]
    (output / 'SHA256SUMS').write_text(''.join(f'{digest_file(path)}  {path.name}\n' for path in outputs), encoding='utf-8')
    print(f'{patch.name}: {patch.stat().st_size} bytes, {len(review["order"])} files')
    print(f'{protected.name}: {protected.stat().st_size} bytes, {len(manifest["files"])} files')


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
