#!/usr/bin/env python3
"""Validate source layout and the local URL graph of a generated site."""

import argparse
import json
import os
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

SOURCE = Path(__file__).resolve().parents[2]
CODE = {'.css', '.js', '.mjs'}
URL_ATTR = {'href','src','poster','data-product','data-image','data-video','data-poster',
            'data-engineering-src','data-engineering-full','data-gallery-base','data-assembly-pdf'}
INTERNAL = {'docs','content','scripts','test','node_modules','server','era-private','era-deploy','era-staging'}
FORBIDDEN = {'.log','.zip','.ini','.env','.md','.xlsx','.psd','.ai','.bak','.tmp','.py','.sh'}
POLICY = 'https://architecture.local'


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links = []
        self.ids = set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if not value:
                continue
            if key == 'id':
                self.ids.add(value)
            elif key in URL_ATTR:
                # Equipment cards also use data-product as an application ID.
                if key == 'data-product' and '/' not in value:
                    continue
                self.links.append((tag, key, value))
            elif key == 'srcset':
                self.links.extend((tag,'src',item.split()[0]) for item in value.split(',') if item.strip())


def files(root):
    names = set()
    for file in sorted(root.rglob('*')):
        if file.is_symlink():
            raise ValueError(f'Symbolic link in public tree: {file.relative_to(root)}')
        if file.is_file():
            name = file.relative_to(root).as_posix()
            if name.casefold() in names:
                raise ValueError(f'Case collision in public tree: {name}')
            names.add(name.casefold())
            yield name, file


def verify_tree(root, registry, *, source):
    browser_paths = set()
    root_scripts = set()
    legacy = set(registry['legacyLegal']) | set(registry['legacyDependencies'])
    for name, file in files(root):
        parts = file.relative_to(root).parts
        if source and name.endswith('/.gitkeep'):
            continue
        if (any(p.startswith('.') or p.casefold() in INTERNAL for p in parts)
                or file.suffix.lower() in FORBIDDEN
                or (file.suffix == '.php' and name != 'api/request.php')):
            raise ValueError(f'Forbidden public file: {name}')
        if file.suffix in CODE:
            if len(parts) == 1 and (source or name not in legacy):
                raise ValueError(f'Unapproved root browser resource: {name}')
            if len(parts) == 1:
                root_scripts.add(name)
            if name.startswith(('assets/css/','assets/js/')):
                browser_paths.add(name)
    expected = set(registry['paths'].values())
    if len(expected) != len(registry['paths']) or browser_paths != expected:
        raise ValueError(f'Browser asset registry mismatch: {sorted(expected ^ browser_paths)}')
    if not source and root_scripts != legacy:
        raise ValueError(f'Missing compatibility assets: {sorted(legacy - root_scripts)}')


def reference(raw, origin, base_path):
    if raw.startswith(('data:','blob:','mailto:','tel:','javascript:','//')):
        return None
    url = urlsplit(urljoin(POLICY+base_path+origin, raw))
    if url.scheme != 'https' or url.netloc != 'architecture.local':
        return None
    path = unquote(url.path)
    if base_path and not (path == base_path or path.startswith(base_path+'/')):
        raise ValueError(f'Local URL lacks its base path: {raw}')
    path = path.removeprefix(base_path)
    if base_path and (path == base_path or path.startswith(base_path+'/')):
        raise ValueError(f'Duplicate base path: {raw}')
    if '..' in path.split('/') or '\\' in path:
        raise ValueError(f'Invalid local URL: {raw}')
    return path.lstrip('/'), unquote(url.fragment)


def check_dist(dist, registry, base_path, known):
    verify_tree(dist, registry, source=False)
    all_files = {name for name,_ in files(dist)}
    pages = {name:Page((dist/name).read_text(encoding='utf-8')) for name in all_files if name.endswith('.html')}
    allowed = {(item['page'],item['url']) for item in known}
    failures=[]
    for name,page in sorted(pages.items()):
        origin = '/'+name.removesuffix('index.html')
        for tag, kind, raw in page.links:
            found=reference(raw,origin,base_path)
            if found is None:
                continue
            path, fragment = found
            if path not in all_files:
                path=path.rstrip('/')+'/index.html' if path else 'index.html'
            if path not in all_files:
                failures.append((name,raw))
            elif fragment and tag=='a' and path in pages and not ('=' in fragment or '&' in fragment) and fragment not in pages[path].ids:
                failures.append((name,raw))
    invalid=sorted(set(failures)-allowed)
    if invalid:
        raise ValueError('Broken local URLs:\n'+'\n'.join(page+' → '+link for page,link in invalid[:45]))
    print(f'{len(all_files)} public files, {len(pages)} HTML files, {len(set(failures))} recorded historical links')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=SOURCE)
    parser.add_argument('--dist', type=Path)
    parser.add_argument('--base-path', default=os.environ.get('BASE_PATH',''))
    args=parser.parse_args()
    shared=args.root/'content/shared'
    registry=json.loads((shared/'browser-assets.json').read_text())
    if not (args.root/'AGENTS.md').is_file():
        raise ValueError('Architecture standard is missing')
    for directory in ('content','scripts','test','docs'):
        for path in (args.root/directory).iterdir():
            if path.is_file():
                raise ValueError(f'Use a thematic directory: {path.relative_to(args.root)}')
    verify_tree(args.root/'public', registry,source=True)
    if args.dist:
        known=shared/'legacy-link-exceptions.json'
        check_dist(args.dist,registry,args.base_path,json.loads(known.read_text()) if known.exists() else [])
    print('Architecture validation passed')


if __name__=='__main__':
    main()
