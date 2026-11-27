#!/usr/bin/env bash
# Publish only the verified manifest to a separate history ref, without moving main.
set -euo pipefail
manifest=$1
state_ref=refs/heads/regru/live-state
python - "$manifest" <<'PY'
import sys
from pathlib import Path
sys.path.insert(0, 'scripts')
from regru_release import read_json, validate
validate(read_json(Path(sys.argv[1])))
PY
old=$(git ls-remote --heads origin "$state_ref" | cut -f1)
parents=()
if [ -n "$old" ]; then
  git fetch --no-tags --depth=1 origin "$state_ref"
  if [ "$(git rev-parse FETCH_HEAD)" != "$old" ]; then
    echo 'The state branch advanced. Verify the latest release before retrying.' >&2
    exit 1
  fi
  parents=(-p "$old")
fi
blob=$(git hash-object -w "$manifest")
tree=$(printf '100644 blob %s\tlive-manifest.json\n' "$blob" | git mktree)
if [ -n "$old" ] && [ "$(git rev-parse "$old^{tree}")" = "$tree" ]; then
  echo 'The same verified manifest is already recorded on GitHub.'
  exit 0
fi
commit=$(git -c user.name='ERA release state' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
  commit-tree "$tree" "${parents[@]}" -m 'Record the verified Reg.ru release manifest')
if [ -n "${GH_TOKEN:-}" ]; then
  GIT_TERMINAL_PROMPT=0 git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push origin "$commit:$state_ref"
else
  git push origin "$commit:$state_ref"
fi
