#!/usr/bin/env python3
"""Apply a reviewed ERA patch through SFTP. Live-site removals are never performed."""

import argparse
from contextlib import contextmanager
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import sys
import tempfile
from uuid import uuid4
from zipfile import ZipFile

from regru_release import (
    HEX, SAFE_COMPONENT, installed, json_bytes, make_manifest, plan, public_path,
    read_patch, upload_order, validate,
)


class SyncError(RuntimeError):
    pass


class LocalFiles:
    """Filesystem transport for testing or manual operation on the host."""

    lstat = staticmethod(os.lstat)
    mkdir = staticmethod(os.mkdir)
    rmdir = staticmethod(os.rmdir)
    open = staticmethod(open)
    remove = staticmethod(os.unlink)
    chmod = staticmethod(os.chmod)
    posix_rename = staticmethod(os.replace)


class Host:
    def __init__(self, io, web_root):
        self.io = io
        web = str(web_root).rstrip('/')
        parts = web.split('/')
        if (not web.startswith('/') or len(parts) < 3 or parts[-2:] != ['www', 'era-cycle.ru']
            or not all(SAFE_COMPONENT.fullmatch(part) for part in parts[1:])):
            raise SyncError('Provide the verified absolute Reg.ru path ending in /www/era-cycle.ru')
        self.web = PurePosixPath(web)
        self.state = self.web.parent.parent / 'era-deploy'
        self.check(self.web, directory=True)
        if self.check(self.state, directory=True).st_mode & 0o077:
            raise SyncError('The private era-deploy directory must have mode 0700')

    def info(self, path):
        try:
            return self.io.lstat(str(path))
        except FileNotFoundError:
            return None

    def check(self, path, *, directory=False, missing=False, create=False):
        current = PurePosixPath('/')
        parts = path.parts[1:]
        for i, segment in enumerate(parts):
            current /= segment
            folder = i < len(parts) - 1 or directory
            info = self.info(current)
            if info is None:
                if folder and create:
                    permission = 0o700 if current.is_relative_to(self.state) else 0o755
                    self.io.mkdir(str(current), permission)
                    info = self.info(current)
                elif missing:
                    return None
                else:
                    raise SyncError('An expected server path does not exist')
            check_type = stat.S_ISDIR if folder else stat.S_ISREG
            if info is None or not check_type(info.st_mode):
                raise SyncError('Server path is not a regular file or directory. Check symbolic links')
        return info

    def live(self, path):
        return self.web / public_path(path)

    def local_state(self, path):
        return self.state / path

    def contents(self, path):
        info = self.check(path, missing=True)
        if info is None:
            return None
        hasher = hashlib.sha256()
        with self.io.open(str(path), 'rb') as stream:
            for block in iter(lambda: stream.read(128 * 1024), b''):
                hasher.update(block)
        return {'size': info.st_size, 'sha256': hasher.hexdigest()}

    def read_state(self, path, optional=False):
        path = self.local_state(path)
        info = self.check(path, missing=optional)
        if info is None:
            return None
        if info.st_size > 12_000_000:
            raise SyncError('Remote release state is oversized')
        with self.io.open(str(path), 'rb') as stream:
            return json.loads(stream.read())

    def place(self, target, stream, expected, mode):
        self.check(target.parent, directory=True, create=True)
        self.check(target, missing=True)
        staged = self.local_state('staging/' + uuid4().hex)
        self.check(staged.parent, directory=True, create=True)
        try:
            with self.io.open(str(staged), 'wb') as remote:
                shutil.copyfileobj(stream, remote, 128 * 1024)
            if self.contents(staged) != expected:
                raise SyncError('Staged file did not pass remote SHA-256 verification')
            self.io.chmod(str(staged), mode)
            self.check(target, missing=True)
            self.io.posix_rename(str(staged), str(target))
        finally:
            try:
                self.io.remove(str(staged))
            except OSError:
                pass

    def write_state(self, path, value):
        raw = json_bytes(value)
        expected = {'size': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
        self.place(self.local_state(path), io.BytesIO(raw), expected, 0o600)

    @contextmanager
    def locked(self):
        lock = self.local_state('release.lock')
        self.check(lock.parent, directory=True)
        try:
            self.io.mkdir(str(lock), 0o700)
        except OSError:
            raise SyncError('Release state is locked. Check the last run before resuming') from None
        try:
            yield
        finally:
            try:
                self.io.rmdir(str(lock))
            except OSError:
                print('Release lock needs to be checked before another run.', file=sys.stderr)


class Release:
    def __init__(self, host, smoke):
        self.host = host
        self.smoke = smoke

    def save(self, entry):
        self.host.write_state(f'history/{entry["id"]}/record.json', entry)
        self.host.write_state('transaction.json', entry)

    def backup(self, entry, path):
        return self.host.local_state(f'backups/{entry["id"]}/' + public_path(path))

    def apply(self, archive, *, remote=False):
        before, target, review = read_patch(archive)
        if remote and not review['baseline_verified']:
            raise SyncError('First verify the installed site and prepare a release against its verified manifest')
        key = hashlib.sha256(json_bytes([before, target])).hexdigest()
        with self.host.locked():
            return self._apply(archive, before, target, review, key)

    def _apply(self, archive, before, target, review, key):
        host = self.host
        active = host.read_state('transaction.json', optional=True)
        live = validate(host.read_state('live-manifest.json'))
        expected_live = installed(before, target)
        if active and active.get('id') == key and active.get('status') == 'published' and live == expected_live:
            for path in review['order']:
                if host.contents(host.live(path)) != target['files'][path]:
                    raise SyncError(f'Installed file has drifted at {path}')
            self.smoke()
            print('This release is already installed. Transfer 0 files.')
            return live
        if active and active.get('status') == 'rolling-back':
            raise SyncError('Complete the pending rollback first')
        resuming = bool(active and active['status'] == 'pending')
        if resuming and active['id'] != key:
            raise SyncError('Resume or roll back the earlier unfinished release first')
        if live != before and not (resuming and live == expected_live):
            raise SyncError('Verified live manifest no longer matches this review. Prepare a new diff')
        entry = active if resuming else {'id': key, 'status': 'pending', 'done': [], 'modes': {}}
        old, new = before['files'], target['files']
        todo = []
        for path in review['order']:
            remote = host.live(path)
            now = host.contents(remote)
            if now == old.get(path):
                todo.append(path)
            elif resuming and now == new[path]:
                if path in old and host.contents(self.backup(entry, path)) != old[path]:
                    raise SyncError(f'Retry is missing the verified backup for {path}')
                if path not in entry['done']:
                    entry['done'].append(path)
            else:
                raise SyncError(f'Unexpected version or existing file at {path}. Verify the baseline')
        # Confirm writable private storage and atomic rename before changing the site.
        if not resuming:
            host.write_state(f'history/{key}/BEFORE.json', before)
            host.write_state(f'history/{key}/RELEASE.json', target)
        self.save(entry)
        try:
            for path in todo:
                remote = host.live(path)
                mode = 0o644
                if path in old:
                    backup = self.backup(entry, path)
                    current = host.check(remote)
                    mode = stat.S_IMODE(current.st_mode) & 0o777
                    entry['modes'][path] = mode
                    if host.contents(backup) != old[path]:
                        with host.io.open(str(remote), 'rb') as stream:
                            host.place(backup, stream, old[path], 0o600)
                    self.save(entry)
                with archive.open('files/' + path) as stream:
                    host.place(remote, stream, new[path], mode)
                if host.contents(remote) != new[path]:
                    raise SyncError(f'Post-upload checksum failed for {path}')
                if path not in entry['done']:
                    entry['done'].append(path)
                self.save(entry)
                print('UPLOADED', path, flush=True)
            self.smoke()
            host.write_state('live-manifest.json', expected_live)
            entry['status'] = 'published'
            self.save(entry)
        except Exception:
            print('Release still pending. Verified files:', ', '.join(entry['done']) or 'none', file=sys.stderr)
            raise
        return expected_live

    def rollback(self, expected_commit):
        host = self.host
        with host.locked():
            entry = host.read_state('transaction.json')
            key = entry.get('id', '')
            if not isinstance(key, str) or not HEX.fullmatch(key):
                raise SyncError('Invalid rollback checkpoint')
            before = validate(host.read_state(f'history/{key}/BEFORE.json'))
            target = validate(host.read_state(f'history/{key}/RELEASE.json'))
            if hashlib.sha256(json_bytes([before, target])).hexdigest() != key:
                raise SyncError('Rollback checkpoint checksum does not match')
            if target['commit'] != expected_commit or entry['status'] not in {'pending', 'published', 'rolling-back', 'rolled-back'}:
                raise SyncError('Rollback approval refers to a different release')
            if entry['status'] == 'rolled-back':
                return validate(host.read_state('live-manifest.json'))
            diff = plan(before, target, True)['diff']
            current_live = validate(host.read_state('live-manifest.json'))
            todo, remaining = [], {}
            for path in diff['UPDATE']:
                now = host.contents(host.live(path))
                if now == before['files'][path]:
                    continue
                if now != target['files'][path] or host.contents(self.backup(entry, path)) != before['files'][path]:
                    raise SyncError(f'Rollback cannot verify the current file and backup for {path}')
                todo.append(path)
            for path in diff['ADD']:
                now = host.contents(host.live(path))
                if now == target['files'][path]:
                    remaining[path] = now
                elif now is not None:
                    raise SyncError(f'An added file has changed since the reviewed release at {path}')
            restored = make_manifest(before['release'], before['commit'], before['files'] | remaining)
            if current_live not in (before, installed(before, target), restored):
                raise SyncError('Another release has replaced the current baseline')
            entry['status'] = 'rolling-back'
            self.save(entry)
            for path in upload_order(todo):
                remote = host.live(path)
                mode = entry['modes'].get(path)
                if type(mode) is not int or not 0 <= mode <= 0o777:
                    raise SyncError('Invalid previous file permissions in rollback checkpoint')
                with host.io.open(str(self.backup(entry, path)), 'rb') as stream:
                    host.place(remote, stream, before['files'][path], mode)
                if host.contents(remote) != before['files'][path]:
                    raise SyncError(f'Rollback checksum failed for {path}')
                print('RESTORED', path, flush=True)
            self.smoke()
            host.write_state('live-manifest.json', restored)
            entry['status'] = 'rolled-back'
            self.save(entry)
            if remaining:
                print('New files retained for manual review:', ', '.join(sorted(remaining)))
            return restored


@contextmanager
def sftp():
    import paramiko

    keys = ('SFTP_HOST', 'SFTP_PORT', 'SFTP_USER', 'SFTP_KEY', 'SFTP_KNOWN_HOSTS', 'REGRU_WEB_ROOT')
    if any(not os.environ.get(key) for key in keys):
        raise SyncError('Set all confirmed SFTP inputs before connecting')
    with tempfile.TemporaryDirectory(prefix='era-sftp-') as directory:
        root = Path(directory)
        key, hosts = root / 'identity', root / 'known_hosts'
        key.write_text(os.environ['SFTP_KEY'].rstrip() + '\n')
        key.chmod(0o600)
        hosts.write_text(os.environ['SFTP_KNOWN_HOSTS'].rstrip() + '\n')
        hosts.chmod(0o600)
        client = paramiko.SSHClient()
        try:
            client.load_host_keys(str(hosts))
            client.set_missing_host_key_policy(paramiko.RejectPolicy())
            client.connect(os.environ['SFTP_HOST'], port=int(os.environ['SFTP_PORT']), username=os.environ['SFTP_USER'],
                           key_filename=str(key), look_for_keys=False, allow_agent=False, timeout=12, auth_timeout=12,
                           banner_timeout=12)
            with client.open_sftp() as channel:
                channel.get_channel().settimeout(30)
                yield Host(channel, os.environ['REGRU_WEB_ROOT'])
        finally:
            client.close()


def main():
    from regru_smoke import SmokeError, production_smoke

    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('operation', choices=['apply', 'rollback'])
    cli.add_argument('input', help='Patch ZIP for apply, approved full commit SHA for rollback')
    cli.add_argument('--receipt', type=Path, required=True)
    cli.add_argument('--local-web-root', type=Path, help='Run manually on the host with local filesystem access')
    args = cli.parse_args()
    try:
        manager = local_host(args.local_web_root) if args.local_web_root else sftp()
        with manager as host:
            if args.local_web_root and args.receipt.resolve().is_relative_to(Path(str(host.web))):
                raise SyncError('Write the receipt outside the public root')
            release = Release(host, production_smoke)
            if args.operation == 'apply':
                with ZipFile(args.input) as archive:
                    result = release.apply(archive, remote=not args.local_web_root)
            else:
                result = release.rollback(args.input)
        args.receipt.write_bytes(json_bytes(result))
        print(f'Verified live release {result["release"]} ({result["commit"]})')
    except (SyncError, SmokeError) as error:
        cli.exit(1, f'{error}\n')
    except Exception:
        cli.exit(1, 'Release stopped on an I/O, SSH, permission or validation error. Check the protected transaction record.\n')


@contextmanager
def local_host(web_root):
    yield Host(LocalFiles(), str(web_root))


if __name__ == '__main__':
    main()
