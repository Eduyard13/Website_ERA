#!/usr/bin/env python3
"""Plan, quarantine and restore named obsolete files on the host filesystem."""

import argparse
import os
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from regru_release import digest_file, json_bytes, public_path, read_json, validate
from regru_sync import Host, LocalFiles


class LocalLinks(HTMLParser):
    def __init__(self, html_path):
        super().__init__()
        self.origin = 'https://era-cycle.ru/' + html_path.removesuffix('index.html')
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'src', 'href', 'poster'} and value:
                link = urlsplit(urljoin(self.origin, value))
                if link.netloc == 'era-cycle.ru':
                    self.paths.add(unquote(link.path).lstrip('/'))


def safe_file(root, path):
    public_path(path)
    node = root
    for part in path.split('/'):
        node /= part
        if node.is_symlink():
            raise ValueError(f'Symbolic link refused: {path}')
    if node.exists() and not node.is_file():
        raise ValueError(f'Expected a regular file: {path}')
    return node


def matches(file, description):
    return file.is_file() and file.stat().st_size == description['size'] and digest_file(file) == description['sha256']


def protected_links(web):
    paths = set()
    for name in ('privacy/index.html', 'privacy/consent/index.html', 'privacy/cookies/index.html'):
        page = web / name
        if not page.is_file() or page.resolve() != page:
            raise ValueError(f'Protected HTML must be readable: {name}')
        links = LocalLinks(name)
        links.feed(page.read_text(encoding='utf-8'))
        paths.update(links.paths)
    return paths


def obsolete_paths(registry):
    allowed = set(registry['paths']) | set(registry.get('retired', [])) | {'assets/brands/README.md'}
    return allowed - set(registry['legacyLegal']) - set(registry['legacyDependencies'])


def verify_release(web, release):
    for path, info in release['files'].items():
        if not matches(safe_file(web, path), info):
            raise ValueError(f'Installed release differs: {path}')


def cleanup_plan(web, release, installed, registry):
    if installed['commit'] != release['commit'] or installed['release'] != release['release']:
        raise ValueError('Use the verified live manifest recorded after installing this release')
    if any(installed['files'].get(path) != info for path, info in release['files'].items()):
        raise ValueError('The live manifest does not contain this release')
    verify_release(web, release)
    extra = set(installed['files']) - set(release['files'])
    files = {}
    for path in sorted(extra & obsolete_paths(registry) - protected_links(web)):
        info = installed['files'][path]
        if not matches(safe_file(web, path), info):
            raise ValueError(f'Obsolete file changed since inventory: {path}')
        files[path] = info
    return {'schema': 1, 'commit': release['commit'], 'release': release['release'],
            'files': files, 'retained': sorted(extra - set(files))}


def transfer(web, backup, plan, release, registry, *, restore=False):
    if backup == web or backup.is_relative_to(web):
        raise ValueError('Quarantine belongs outside the public web root')
    if plan.get('schema') != 1 or plan['commit'] != release['commit'] or plan['release'] != release['release']:
        raise ValueError('Plan and release do not match')
    validate({key: release[key] for key in ('schema','commit','release','domain')} | {'files':plan['files']})
    if set(plan['files']) - obsolete_paths(registry):
        raise ValueError('Plan contains an unapproved legacy path')
    if not restore:
        verify_release(web, release)
        if set(plan['files']) & (set(release['files']) | protected_links(web)):
            raise ValueError('A planned path is now active')
    source, destination = (backup, web) if restore else (web, backup)
    moves = []
    for path, info in plan['files'].items():
        src, dst = safe_file(source, path), safe_file(destination, path)
        if not src.exists() and matches(dst, info):
            continue
        if not matches(src, info) or dst.exists():
            raise ValueError(f'Unexpected contents at either end of {path}')
        moves.append((src, dst))
    moved = []
    try:
        for src, dst in moves:
            dst.parent.mkdir(parents=True, exist_ok=True)
            os.rename(src, dst)
            moved.append((src, dst))
    except OSError:
        for src, dst in reversed(moved):
            os.rename(dst, src)
        raise
    return len(moved)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['plan','quarantine','restore'])
    parser.add_argument('--web-root', type=Path, required=True)
    parser.add_argument('--release', type=Path, required=True)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--installed', type=Path)
    parser.add_argument('--registry', type=Path, required=True)
    parser.add_argument('--quarantine', type=Path)
    parser.add_argument('--approve-sha256')
    args = parser.parse_args()
    web = args.web_root.resolve(strict=True)
    release = validate(read_json(args.release))
    registry = read_json(args.registry)
    if args.action == 'plan':
        if not args.installed:
            parser.error('plan requires --installed')
        if args.plan.resolve().is_relative_to(web):
            parser.error('Save plans outside the public web root')
        result = cleanup_plan(web, release, validate(read_json(args.installed)), registry)
        args.plan.write_bytes(json_bytes(result))
        print(f"{len(result['files'])} paths · SHA-256 {digest_file(args.plan)}")
    else:
        if not args.quarantine or args.approve_sha256 != digest_file(args.plan):
            parser.error('Supply quarantine and the SHA-256 of the separately approved plan')
        with Host(LocalFiles(), str(web)).locked():
            result = transfer(web, args.quarantine.resolve(), read_json(args.plan), release, registry,
                              restore=args.action == 'restore')
        print(f'{result} files moved')


if __name__ == '__main__':
    main()
