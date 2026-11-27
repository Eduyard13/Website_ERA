"""Exercise the manual 0.48.2 Shell commands on an isolated copy of 0.48.1."""
import argparse
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
from zipfile import ZipFile

from sys import path
ROOT = Path(__file__).resolve().parents[2]
path.insert(0, str(ROOT / 'scripts' / 'deploy'))
from regru_cookie_0482 import ASSETS, BASE, BASE_COMMIT
from regru_release import digest_file, read_patch

cli = argparse.ArgumentParser(description=__doc__)
cli.add_argument('--baseline', type=Path, required=True)
cli.add_argument('--release', type=Path, required=True)
args = cli.parse_args()
baseline, staging = args.baseline.resolve(), args.release.resolve()
php = os.environ.get('ERA_PHP', 'php')
cache_keys = re.compile(rb'((?:legal\.css|cookie-consent\.js)\?v=)([a-f0-9]{12})')


def run(*argv, failure=False):
    result = subprocess.run(argv, text=True, capture_output=True)
    assert (result.returncode != 0) == failure, (argv, result.stdout, result.stderr)
    return result.stdout or result.stderr


# The host verifier requires each directory component to start with a letter or digit.
with tempfile.TemporaryDirectory(prefix='era-0482-fixture-', dir=Path('/tmp').resolve()) as temp:
    root = Path(temp)
    web = root / 'www' / 'era-cycle.ru'
    backups = root / 'era-backups'
    local = root / 'era-staging'
    shutil.copytree(baseline, web, copy_function=os.link if baseline.stat().st_dev == root.stat().st_dev else shutil.copy2)
    shutil.copytree(staging, local)
    backups.mkdir()
    archive = local / 'ERA_UPDATE_0.48.2.zip'
    with ZipFile(archive) as package:
        before, after, plan = read_patch(package)
        assert package.testzip() is None and before['commit'] == BASE_COMMIT
        assert (local / 'BEFORE.json').read_bytes() == BASE.read_bytes() == package.read('BEFORE.json')
        assert (local / 'PLAN.json').read_bytes() == package.read('PLAN.json')
        assert not plan['baseline_verified']
        assert len(before['files']) == len(after['files']) == 1076
        changed, difference = plan['order'], plan['diff']
        assert not difference['ADD'] and not difference['REMOVE_CANDIDATE']
        assert set(changed) == set(difference['UPDATE'])
        assert {name for name in changed if not name.endswith('.html')} == ASSETS
        for name in changed:
            if not name.endswith('.html'):
                continue
            new, old = package.read('files/' + name), (web / name).read_bytes()
            assert len(cache_keys.findall(new)) == 2 and cache_keys.findall(new) != cache_keys.findall(old)
            assert cache_keys.sub(rb'\1REV', new) == cache_keys.sub(rb'\1REV', old), name
        package.extractall(local / 'patch')

    def verify(manifest):
        return run(php, local / 'regru_verify.php', web, local / manifest).strip()

    def commands(phase, failure=False):
        return run('bash', local / 'regru_0482_files.sh', phase, web, local, backups, failure=failure)

    def legal():
        result = subprocess.run(['sha256sum', '-c', local / 'LEGAL_SHA256SUMS'], cwd=web, check=True, capture_output=True)
        assert result.stdout.count(b': OK') == 6

    print(verify('BEFORE.json'))
    legal()
    original = {name: digest_file(web / name) for name in ('api/request.php', 'data/cbr.json')}
    rights = {name: stat.S_IMODE((web / name).stat().st_mode) for name in changed}
    source = local / 'patch/files' / changed[0]
    correct = source.read_bytes()
    source.write_bytes(b'corrupt staging fixture')
    assert 'Unexpected patch SHA-256' in commands('preflight', failure=True)
    source.write_bytes(correct)
    assert commands('preflight').count('UPDATE ') == len(changed) + 1
    assert commands('backup').count('BACKED UP ') == len(changed)
    assert commands('dry-run').count('UPDATE ') == len(changed) + 1
    assert verify('BEFORE.json').startswith('Verified 0.48.1')

    # Copy one file atomically to emulate an earlier interrupted apply.
    first = web / changed[0]
    temporary = first.with_suffix('.fixture')
    temporary.write_bytes(correct)
    temporary.chmod(rights[changed[0]])
    temporary.replace(first)
    assert commands('apply').count('ALREADY CORRECT ') == 1
    print(verify('LIVE_AFTER.json'))
    legal()
    assert commands('apply').count('ALREADY CORRECT ') == len(changed)
    assert commands('rollback').count('rollback ') == len(changed) + 1
    print(verify('BEFORE.json'))
    legal()
    assert all(stat.S_IMODE((web / name).stat().st_mode) == mode for name, mode in rights.items())
    assert all(digest_file(web / name) == sha for name, sha in original.items())
    print(f'{len(changed)} UPDATE, 0 ADD, 0 REMOVE. Shell preflight, backup, dry-run, resume, repeat, and rollback passed.')
