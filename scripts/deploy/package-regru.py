#!/usr/bin/env python3
"""Build the two Reg.ru archives from a checked production dist and pinned PHP sources."""

import argparse
import hashlib
import io
import json
import shutil
import tarfile
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath
from regru_release import build_manifest, protected, verified_payload

REPO = Path(__file__).resolve().parents[2]
SERVER = REPO / 'server' / 'regru'
PRIVATE = SERVER / 'private'
PIN = SERVER / 'phpmailer-release.json'
PUBLIC = REPO / 'dist'


def install_mailer(archive=None):
    pin = json.loads(PIN.read_text())
    if archive:
        data = archive.read_bytes()
    else:
        with urllib.request.urlopen(pin['url'], timeout=30) as response:
            data = response.read(5_000_000)
    if hashlib.sha256(data).hexdigest() != pin['sha256']:
        raise SystemExit('PHPMailer SHA-256 does not match the pinned release')
    prefix = f"PHPMailer-{pin['version']}/"
    destination = PRIVATE / 'vendor' / 'phpmailer'
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as bundled:
        for member in bundled:
            if not member.isfile() or not member.name.startswith(prefix):
                continue
            relative = PurePosixPath(member.name[len(prefix):])
            is_source = len(relative.parts) == 2 and relative.parts[0] == 'src' and relative.suffix == '.php'
            if relative.name in ('.', '..') or (relative.as_posix() != 'LICENSE' and not is_source):
                continue
            target = destination.joinpath(*relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundled.extractfile(member) as source, target.open('wb') as output:
                shutil.copyfileobj(source, output)
    for name in ('LICENSE', 'src/PHPMailer.php', 'src/SMTP.php', 'src/Exception.php'):
        if not (destination / name).is_file():
            raise SystemExit(f'PHPMailer release omitted {name}')
    return destination


def digest(path):
    with path.open('rb') as file:
        return hashlib.file_digest(file, 'sha256').hexdigest()


def write_zip(output, files):
    staged = output.with_suffix('.zip.tmp')
    compressed = {'.avif', '.gif', '.jpg', '.jpeg', '.mp4', '.png', '.webm', '.webp', '.woff2'}
    try:
        with zipfile.ZipFile(staged, 'w') as archive:
            for name, file in sorted(files):
                if file.is_symlink() or not file.is_file():
                    raise ValueError(f'Unexpected release input: {name}')
                entry = zipfile.ZipInfo(name)
                entry.external_attr = 0o100644 << 16
                entry.compress_type = zipfile.ZIP_STORED if file.suffix.lower() in compressed else zipfile.ZIP_DEFLATED
                with file.open('rb') as source, archive.open(entry, 'w') as destination:
                    shutil.copyfileobj(source, destination, 1024 * 1024)
        with zipfile.ZipFile(staged) as archive:
            failure = archive.testzip()
            if failure:
                raise ValueError(f'Corrupt ZIP entry: {failure}')
        staged.replace(output)
    finally:
        staged.unlink(missing_ok=True)
    print(f'{output.name} {output.stat().st_size} bytes · SHA-256 {digest(output)}')


def package(output, archive, public_only=False):
    home = (PUBLIC / 'index.html').read_text()
    if 'rel="canonical" href="https://era-cycle.ru/"' not in home or 'data-request-preview' in home:
        raise SystemExit('Build DEPLOY_TARGET=regru before packaging')
    for name in ('api/request.php', 'data/cbr.json', 'robots.txt', 'sitemap.xml', 'privacy/index.html', '404.html'):
        if not (PUBLIC / name).is_file():
            raise SystemExit(f'Production file missing: {name}')
    output.mkdir(parents=True, exist_ok=True)
    public_files = [(file.relative_to(PUBLIC).as_posix(), file) for file in PUBLIC.rglob('*') if file.is_file()]
    for name, _ in public_files:
        path = PurePosixPath(name)
        if (any(part.startswith('.') or part in ('node_modules', 'state') for part in path.parts)
            or path.suffix.lower() in ('.zip', '.log', '.ini') or (path.suffix.lower() == '.php' and name != 'api/request.php')):
            raise SystemExit(f'Non-public file in dist: {name}')
    if public_only:
        from subprocess import check_output
        release = json.loads((REPO / 'package.json').read_text())['version']
        commit = check_output(['git','rev-parse','HEAD'], cwd=REPO, text=True).strip()
        manifest = build_manifest(PUBLIC, release, commit)
        managed = [(name, file) for name, file in public_files if not protected(name)]
        if {name for name, _ in managed} != set(manifest['files']):
            raise SystemExit('Public ZIP and release manifest disagree')
        for name, file in managed:
            with file.open('rb') as stream:
                if verified_payload(stream, name) != manifest['files'][name]['sha256']:
                    raise ValueError(f'Public file changed while packaging: {name}')
        write_zip(output / 'ERA_SITE_PUBLIC.zip', managed)
        (output / 'RELEASE_MANIFEST.json').write_text(json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2)+'\n')
        return
    mailer = install_mailer(archive)
    components = [
        'attachment-types.json', 'cbr.php', 'config.example.json', 'cron/update_cbr.php',
        'request-handler.php', 'runtime.php', 'uploads.php',
    ]
    private_files = [(name, PRIVATE / name) for name in components]
    private_files += [(file.relative_to(PRIVATE).as_posix(), file) for file in [mailer / 'LICENSE', *sorted((mailer / 'src').glob('*.php'))]]
    private_files += [
        ('phpmailer-release.json', PIN),
        ('README.txt', SERVER / 'PRIVATE_README.txt'),
        ('ERA_PERSONAL_DATA_TEMPLATE.md', REPO / 'docs/instructions/ERA_PERSONAL_DATA_TEMPLATE.md'),
    ]
    write_zip(output / 'ERA_SITE_PUBLIC.zip', public_files)
    write_zip(output / 'ERA_SERVER_PRIVATE.zip', private_files)
    print(f"dist: {len(public_files)} files, {sum(file.stat().st_size for _, file in public_files)} bytes")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phpmailer-archive', type=Path, help='Use a local copy of the pinned upstream release')
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--vendor-only', action='store_true')
    action.add_argument('--output', type=Path, help='Directory for the two ZIP files, outside dist')
    parser.add_argument('--public-only', action='store_true', help='Package managed public files for an existing host')
    args = parser.parse_args()
    if args.public_only and not args.output:
        parser.error('--public-only requires --output')
    if args.vendor_only:
        print(install_mailer(args.phpmailer_archive))
    else:
        output = args.output.resolve()
        if output.is_relative_to(PUBLIC):
            parser.error('ZIP files must be written outside dist')
        package(output, args.phpmailer_archive, args.public_only)
