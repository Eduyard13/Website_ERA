#!/usr/bin/env bash
# File operations for the reviewed, update-only ERA 0.48.2 patch. Run on the host as the site owner.
set -euo pipefail

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# == 4 ]] || fail 'Usage: bash regru_0482_files.sh preflight|backup|dry-run|apply|rollback WEB STAGING BACKUPS'
action=$1 web=$2 staging=$3 backups=$4
case "$action" in preflight|backup|dry-run|apply|rollback) ;; *) fail "Unknown phase: $action";; esac

for root in "$web" "$staging" "$backups"; do
 [[ -d "$root" && "$(realpath -e -- "$root")" == "$root" ]] || fail "Expected an absolute, canonical directory: $root"
done
for root in "$staging" "$backups"; do
 [[ "$root" != "$web" && "$root" != "$web/"* ]] || fail 'Keep staging and backups outside the web root'
done

backup="$backups/0.48.1-before-0.48.2"
if [[ -e "$backup" || -L "$backup" ]]; then
 [[ -d "$backup" && "$(realpath -e -- "$backup")" == "$backup" ]] || fail "Invalid backup directory: $backup"
fi
(cd "$staging" && sha256sum -c SHA256SUMS >/dev/null)
hash() { local result; result=$(sha256sum -- "$1") || return; printf '%s' "${result%% *}"; }
file_at() {
 [[ -f "$1" && "$(realpath -e -- "$1")" == "$1" ]] || fail "Expected a regular file at $1"
}

temp=''
lock=''
cleanup() {
 if [[ -n "$temp" ]]; then rm -f -- "$temp"; fi
 if [[ -n "$lock" ]]; then rmdir -- "$lock"; fi
}
case "$action" in
 backup|apply|rollback)
  mkdir -- "$backups/.era-0482.lock" || fail 'Another 0.48.2 file operation is in progress'
  lock="$backups/.era-0482.lock"
  trap cleanup EXIT
  trap 'exit 1' HUP INT TERM
  ;;
esac

paths=()
before=()
after=()
while IFS=$'\t' read -r path old new extra; do
 [[ ! "$extra" && "$old" =~ ^[0-9a-f]{64}$ && "$new" =~ ^[0-9a-f]{64}$ && "$old" != "$new" ]] || fail 'Invalid change manifest entry'
 [[ "$path" =~ ^([a-z0-9_-]+/)*[a-z0-9_-]+\.(html|css|js)$ && "$path" != privacy/* ]] || fail "Disallowed path: $path"
 case "$path" in *.html|cookie-consent.js|legal.css) ;; *) fail "Disallowed resource: $path";; esac
 target="$web/$path"
 source="$staging/patch/files/$path"
 file_at "$target"
 [[ "$(hash "$target")" == "$old" || ( "$action" != preflight && "$action" != backup && "$(hash "$target")" == "$new" ) ]] || fail "Unexpected installed SHA-256: $path"
 if [[ "$action" != rollback ]]; then
  file_at "$source"
  [[ "$(hash "$source")" == "$new" ]] || fail "Unexpected patch SHA-256: $path"
 fi
 if [[ "$action" != preflight && ( "$action" != backup || -e "$backup/$path" || -L "$backup/$path" ) ]]; then
  file_at "$backup/$path"
  [[ "$(hash "$backup/$path")" == "$old" ]] || fail "Unexpected backup SHA-256: $path"
 fi
 paths+=("$path")
 before+=("$old")
 after+=("$new")
done < "$staging/FILE_CHANGES.tsv"
count=${#paths[@]}
[[ "$count" -gt 0 ]] || fail 'The patch is empty'

for index in "${!paths[@]}"; do
 path=${paths[$index]}
 target="$web/$path"
 case "$action" in
  preflight|dry-run) printf 'UPDATE %s\n' "$path";;
  backup)
   destination="$backup/$path"
   directory=$(dirname -- "$destination")
   [[ "$(realpath -m -- "$directory")" == "$directory" ]] || fail "Invalid backup path: $path"
   mkdir -p -m 700 -- "$directory"
   if [[ ! -e "$destination" ]]; then
    temp=$(mktemp -- "$directory/.era-0482.XXXXXX")
    cp -pT -- "$target" "$temp"
    [[ "$(hash "$temp")" == "${before[$index]}" ]] || fail "Backup copy failed: $path"
    mv -fT -- "$temp" "$destination"
    temp=''
   fi
   printf 'BACKED UP %s\n' "$path"
   ;;
  apply|rollback)
   if [[ "$action" == apply ]]; then
    origin="$staging/patch/files/$path"
    expected=${after[$index]}
   else
    origin="$backup/$path"
    expected=${before[$index]}
   fi
   if [[ "$(hash "$target")" == "$expected" ]]; then
    printf 'ALREADY CORRECT %s\n' "$path"
    continue
   fi
   temp=$(mktemp -- "$(dirname -- "$target")/.era-0482.XXXXXX")
   cp -pT -- "$target" "$temp"
   cat -- "$origin" > "$temp"
   [[ "$(hash "$temp")" == "$expected" && "$(stat -c '%a %u %g' -- "$temp")" == "$(stat -c '%a %u %g' -- "$target")" ]] ||
    fail "Copy or permissions check failed: $path"
   mv -fT -- "$temp" "$target"
   temp=''
   printf '%s %s\n' "$action" "$path"
   ;;
 esac
done
printf '%s completed. UPDATE %d, ADD 0, REMOVE 0.\n' "$action" "$count"
