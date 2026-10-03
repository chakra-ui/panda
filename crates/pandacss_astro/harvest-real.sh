#!/usr/bin/env bash
# Usage: harvest-real.sh <output dir, e.g. tests/corpus/real>
set -euo pipefail

out="$(mkdir -p "${1:?output dir}" && cd "$1" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
: > "$out/SOURCE"

for pin in astro:4c1470a starlight:e45162c; do
  repo="${pin%%:*}"
  rev="${pin##*:}"
  git clone -q --filter=blob:none "https://github.com/withastro/$repo" "$work/$repo"
  git -C "$work/$repo" checkout -q "$rev"
  (cd "$work/$repo" && find . -type f -name '*.astro' -not -path '*/node_modules/*') | while read -r file; do
    mkdir -p "$out/$repo/$(dirname "$file")"
    cp "$work/$repo/$file" "$out/$repo/$file"
  done
  printf 'withastro/%s %s\n' "$repo" "$(git -C "$work/$repo" rev-parse HEAD)" >> "$out/SOURCE"
done

echo "copied $(find "$out" -name '*.astro' | wc -l | tr -d ' ') files into $out"
