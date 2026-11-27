#!/usr/bin/env python3
"""Hash a tested build and prepare a patch against a recorded Reg.ru baseline."""

import argparse
import hashlib
import json
import re
import shutil
import stat
from pathlib import Path, PurePosixPath
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile, ZipInfo

DOMAIN = 'https://era-cycle.ru'
INITIAL = '0.47.0'
PROTECTED = {
    'api/request.php', 'data/cbr.json', 'privacy/index.html', 'privacy/consent/index.html',
}
SYSTEM = {'.htaccess', '.user.ini', '.well-known', 'era-private', 'era-deploy', 'era-staging', 'cgi-bin', 'logs'}
SAFE_COMPONENT = re.compile(r'[A-Za-z0-9][A-Za-z0-9._-]*\Z')
PUBLIC_EXT = set('.html .css .js .mjs .webp .png .jpg .jpeg .gif .avif .svg .ico .mp4 .webm .pdf .woff .woff2 .ttf .wasm .bcmap .pfb .json .txt .xml .map .vtt'.split())
STORED_EXT = set('.webp .png .jpg .jpeg .gif .avif .mp4 .webm .woff2'.split())
HEX = re.compile(r'[a-f0-9]{64}\Z')
COMMIT = re.compile(r'[a-f0-9]{40}\Z')
VERSION = re.compile(r'\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?\Z')
SENSITIVE_NAME = re.compile(r'(?:secret|credential|token|password|smtp|private[-_.]?key)s?(?:[-_.]|$)', re.I)
SECRET_BYTES = re.compile(
    rb'-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{36,}|'
    rb'github_pat_[A-Za-z0-9_]{45,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})\b|'
    rb'["\'](?:password|rate_secret|access_token|client_secret)["\']\s*:\s*["\'][^"\']{1,512}["\']',
    re.I,
)
TEXT_EXT = set('.html .css .js .mjs .json .txt .xml .map .vtt .md .svg'.split())
ZIP_METADATA = {'PATCH_MANIFEST.md', 'BEFORE.json', 'RELEASE.json', 'PLAN.json'}


def protected(path):
    parts = path.split('/')
    return path.lower() in PROTECTED or any(part.lower() in SYSTEM for part in parts)


def public_path(path):
    if not isinstance(path, str) or len(path) > 512 or not all(SAFE_COMPONENT.fullmatch(p) for p in path.split('/')):
        raise ValueError('The manifest contains an invalid relative path')
    parsed = PurePosixPath(path)
    lower = parsed.name.lower()
    if (protected(path) or any(re.fullmatch(r'(?:mail-)?config.*\.(?:json|php)', part, re.I) for part in parsed.parts)
        or SENSITIVE_NAME.search(lower)
        or lower in {'package.json', 'package-lock.json', 'composer.json', 'phpinfo.php'}
        or any(part.lower() in {'node_modules', 'scripts', 'server', 'test', 'docs'} for part in parsed.parts)):
        raise ValueError('The manifest contains a protected or development path')
    pdf_license = path.startswith('vendor/pdfjs/') and (lower == 'license' or lower.startswith('license_'))
    if parsed.suffix.lower() not in PUBLIC_EXT and not pdf_license and path != 'assets/brands/README.md':
        raise ValueError('The manifest contains an unsupported file type')
    return path


def verified_payload(stream, path):
    hasher = hashlib.sha256()
    tail = b''
    is_text = PurePosixPath(path).suffix.lower() in TEXT_EXT
    for block in iter(lambda: stream.read(128 * 1024), b''):
        hasher.update(block)
        if is_text:
            window = tail + block
            if SECRET_BYTES.search(window):
                raise ValueError(f'Possible credential in {path}. Remove it from the public build')
            tail = window[-2048:]
    return hasher.hexdigest()


def digest_file(file):
    with file.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def json_bytes(data):
    return (json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def read_json(path):
    if path.stat().st_size > 4_000_000:
        raise ValueError('Manifest is too large')
    return json.loads(path.read_text(encoding='utf-8'))


def validate(manifest):
    if (not isinstance(manifest, dict) or set(manifest) != {'schema', 'domain', 'release', 'commit', 'files'}
        or manifest['schema'] != 1 or manifest['domain'] != DOMAIN
        or not isinstance(manifest['release'], str) or not VERSION.fullmatch(manifest['release'])
        or not isinstance(manifest['commit'], str) or not COMMIT.fullmatch(manifest['commit'])
        or not isinstance(manifest['files'], dict)):
        raise ValueError('Invalid release manifest')
    for path, item in manifest['files'].items():
        public_path(path)
        if (not isinstance(item, dict) or set(item) != {'size', 'sha256'} or type(item['size']) is not int
            or item['size'] < 0 or not isinstance(item['sha256'], str) or not HEX.fullmatch(item['sha256'])):
            raise ValueError('Invalid file size or checksum in manifest')
    return manifest


def make_manifest(release, commit, files):
    return validate({'schema': 1, 'domain': DOMAIN, 'release': release, 'commit': commit, 'files': files})


def source_file(root, path):
    public_path(path)
    current = root
    for part in path.split('/'):
        current = current / part
        if current.is_symlink():
            raise ValueError('Symbolic links are not deployable')
    if not current.is_file():
        raise ValueError('Expected a regular release file')
    return current


def build_manifest(root, release, commit):
    if root.is_symlink() or not root.is_dir():
        raise ValueError('Expected a real build directory')
    home = root / 'index.html'
    if not home.is_file() or home.is_symlink():
        raise ValueError('Build is missing index.html')
    html = home.read_text(encoding='utf-8')
    if f'<link rel="canonical" href="{DOMAIN}/"' not in html or 'data-request-preview' in html:
        raise ValueError('Expected a root production build for era-cycle.ru')
    files = {}
    for file in sorted(root.rglob('*')):
        path = file.relative_to(root).as_posix()
        if file.is_symlink():
            raise ValueError('Build contains a symbolic link')
        if file.is_dir():
            continue
        if protected(path):
            continue
        file = source_file(root, path)
        files[path] = {'size': file.stat().st_size, 'sha256': digest_file(file)}
    return make_manifest(release, commit, files)


def archived_manifest(path, release, commit):
    with ZipFile(path) as archive:
        files = {}
        if len(archive.namelist()) != len(set(archive.namelist())):
            raise ValueError('Duplicate file in baseline archive')
        for item in archive.infolist():
            if item.is_dir() or protected(item.filename):
                continue
            public_path(item.filename)
            if stat.S_ISLNK(item.external_attr >> 16):
                raise ValueError('The baseline archive contains a symbolic link')
            with archive.open(item) as stream:
                sha = hashlib.file_digest(stream, 'sha256').hexdigest()
            files[item.filename] = {'size': item.file_size, 'sha256': sha}
    return make_manifest(release, commit, files)


def changes(before, after):
    old, new = validate(before)['files'], validate(after)['files']
    return {
        'ADD': sorted(new.keys() - old.keys()),
        'UPDATE': sorted(path for path in old.keys() & new.keys() if old[path] != new[path]),
        'UNCHANGED': sorted(path for path in old.keys() & new.keys() if old[path] == new[path]),
        'REMOVE_CANDIDATE': sorted(old.keys() - new.keys()),
    }


def installed(before, after):
    return make_manifest(after['release'], after['commit'], before['files'] | after['files'])


def upload_order(paths, added=()):
    def phase(path):
        if path in {'robots.txt', 'sitemap.xml'}:
            return 2
        return int(path.endswith('.html'))
    new_paths = set(added)
    return sorted(paths, key=lambda path: (phase(path), path not in new_paths, path))


def plan(before, after, verified):
    diff = changes(before, after)
    transfer = upload_order(diff['ADD'] + diff['UPDATE'], diff['ADD'])
    return {
        'baseline_verified': verified,
        'baseline_sha256': hashlib.sha256(json_bytes(before)).hexdigest(),
        'target_sha256': hashlib.sha256(json_bytes(after)).hexdigest(),
        'diff': diff,
        'order': transfer,
        'upload_bytes': sum(after['files'][path]['size'] for path in transfer),
        'backup_bytes': sum(before['files'][path]['size'] for path in diff['UPDATE']),
    }


def report(before, target, result):
    change = result['diff']
    origin = 'сверенный файл состояния' if result['baseline_verified'] else 'эталонный архив, требуется сверка с файлами на хостинге'
    lines = [f'# Патч ЭРА {target["release"]}', '',
             f'База {before["release"]} · {origin}.',
             f'Коммит `{target["commit"]}`. Передача {len(result["order"])} файлов, {result["upload_bytes"]} байт.',
             f'ADD {len(change["ADD"])} · UPDATE {len(change["UPDATE"])} · UNCHANGED {len(change["UNCHANGED"])} · REMOVE_CANDIDATE {len(change["REMOVE_CANDIDATE"])}.',
             f'Для резервной копии SFTP прочитает и сохранит до {result["backup_bytes"]} байт предыдущих версий затронутых файлов.',
             'Порядок установки — ресурсы, новые страницы, обновлённый HTML, затем robots.txt и sitemap.xml. Защищённые пути и кандидаты на удаление остаются на сервере.', '',
             '| Действие | Путь от корня сайта | Байт | SHA-256 |', '|---|---|---:|---|']
    for path in result['order']:
        item = target['files'][path]
        action = 'ADD' if path in change['ADD'] else 'UPDATE'
        lines.append(f'| {action} | `{path}` | {item["size"]} | `{item["sha256"]}` |')
    if change['REMOVE_CANDIDATE']:
        lines += ['', 'Кандидаты на удаление требуют отдельного решения владельца.', '']
        lines += [f'- `{path}`' for path in change['REMOVE_CANDIDATE']]
    return '\n'.join(lines) + '\n'


def write_patch(root, output, before, after, verified):
    result = plan(before, after, verified)
    output.mkdir(parents=True, exist_ok=True)
    text = report(before, after, result)
    (output / 'PATCH_MANIFEST.md').write_text(text, encoding='utf-8')
    path = output / f'ERA_UPDATE_{after["release"]}.zip'
    staged = path.with_suffix('.tmp')
    try:
        with ZipFile(staged, 'w', compression=ZIP_DEFLATED) as archive:
            for name, contents in [('PATCH_MANIFEST.md', text), ('BEFORE.json', json_bytes(before)),
                                   ('RELEASE.json', json_bytes(after)), ('PLAN.json', json_bytes(result))]:
                archive.writestr(ZipInfo(name), contents, compress_type=ZIP_DEFLATED)
            for name in result['order']:
                file = source_file(root, name)
                entry = ZipInfo('files/' + name)
                entry.external_attr = 0o100644 << 16
                entry.compress_type = ZIP_STORED if file.suffix in STORED_EXT else ZIP_DEFLATED
                with file.open('rb') as current, archive.open(entry, 'w') as destination:
                    shutil.copyfileobj(current, destination)
        with ZipFile(staged) as archive:
            read_patch(archive)
        staged.replace(path)
    finally:
        staged.unlink(missing_ok=True)
    (output / 'LIVE_AFTER.json').write_bytes(json_bytes(installed(before, after)))
    (output / 'SHA256SUMS').write_text(f'{digest_file(path)}  {path.name}\n', encoding='utf-8')
    return path, result


def read_patch(archive):
    names = archive.namelist()
    if len(set(names)) != len(names) or not ZIP_METADATA.issubset(names):
        raise ValueError('Invalid patch members')
    if any(archive.getinfo(name).file_size > 4_000_000 for name in ZIP_METADATA):
        raise ValueError('Oversized patch metadata')
    before = validate(json.loads(archive.read('BEFORE.json')))
    target = validate(json.loads(archive.read('RELEASE.json')))
    recorded = json.loads(archive.read('PLAN.json'))
    verified = recorded.get('baseline_verified')
    if type(verified) is not bool or recorded != plan(before, target, verified):
        raise ValueError('Patch transfer plan does not match its manifests')
    expected = ZIP_METADATA | {'files/' + path for path in recorded['order']}
    if set(names) != expected:
        raise ValueError('Unexpected file in patch')
    for name in recorded['order']:
        item = archive.getinfo('files/' + name)
        if stat.S_ISLNK(item.external_attr >> 16) or item.file_size != target['files'][name]['size']:
            raise ValueError('Invalid patch payload type or size')
        with archive.open(item) as stream:
            if verified_payload(stream, name) != target['files'][name]['sha256']:
                raise ValueError('Patch payload checksum mismatch')
    return before, target, recorded


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    modes = cli.add_subparsers(dest='mode', required=True)
    archive = modes.add_parser('archive-baseline')
    archive.add_argument('archive', type=Path)
    archive.add_argument('output', type=Path)
    archive.add_argument('--commit', required=True)
    prepare = modes.add_parser('prepare')
    prepare.add_argument('--dist', type=Path, default=Path('dist'))
    prepare.add_argument('--base', type=Path, required=True)
    prepare.add_argument('--output', type=Path, required=True)
    prepare.add_argument('--release', required=True)
    prepare.add_argument('--commit', required=True)
    prepare.add_argument('--verified-baseline', action='store_true')
    args = cli.parse_args()
    try:
        if args.mode == 'archive-baseline':
            args.output.write_bytes(json_bytes(archived_manifest(args.archive, INITIAL, args.commit)))
        else:
            if args.output.resolve().is_relative_to(args.dist.resolve()):
                raise ValueError('Write patches outside the public build')
            current = validate(read_json(args.base))
            path, result = write_patch(args.dist, args.output, current, build_manifest(args.dist, args.release, args.commit), args.verified_baseline)
            print(f'{path.name}: {len(result["order"])} files, {result["upload_bytes"]} bytes of site payload')
    except (OSError, ValueError) as error:
        cli.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
