#!/usr/bin/env bash
# Rebuilds tests/corpus from every .astro input that withastro/compiler-rs and
# its Oxc fork feed their parsers while running their own test suites.
# Usage: harvest.sh <compiler-rs ref> <output dir>
set -euo pipefail

ref="${1:?compiler-rs git ref, e.g. @astrojs/compiler-rs@0.5.1}"
out="$(mkdir -p "${2:?output dir}" && cd "$2" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

dump='    if let Some(dir) = std::env::var_os("ASTRO_CORPUS_DIR") {
        let hash = SOURCE.bytes().fold(0xcbf2_9ce4_8422_2325_u64, |hash, byte| (hash ^ u64::from(byte)).wrapping_mul(0x0100_0000_01b3));
        let _ = std::fs::write(std::path::Path::new(&dir).join(format!("{hash:016x}.astro")), SOURCE);
    }'

git clone -q https://github.com/withastro/compiler-rs "$work/compiler-rs"
git -C "$work/compiler-rs" checkout -q "$ref"
rev="$(grep -m1 -o 'withastro/oxc", rev = "[0-9a-f]*"' "$work/compiler-rs/Cargo.toml" | grep -o '[0-9a-f]\{40\}')"
git clone -q --filter=blob:none https://github.com/withastro/oxc "$work/oxc"
git -C "$work/oxc" checkout -q "$rev"

insert_after() {
  printf '%s\n' "${dump//SOURCE/$3}" > "$work/snippet"
  sed -i.bak "/$2/r $work/snippet" "$1"
  grep -q ASTRO_CORPUS_DIR "$1"
}
insert_after "$work/oxc/crates/oxc_parser/src/astro/parse.rs" '^) -> AstroParserReturn<.a> {$' source_text
insert_after "$work/compiler-rs/crates/astro2tsx/src/lib.rs" '^pub fn convert_to_tsx(source: &str, options: ConvertOptions) -> ConvertResult {$' source

(cd "$work/compiler-rs" && cargo generate-lockfile -q)
{
  echo
  echo '[patch."https://github.com/withastro/oxc"]'
  grep -A2 '^name = "oxc' "$work/compiler-rs/Cargo.lock" | paste - - - - | grep 'withastro/oxc' \
    | sed 's/name = "\([^"]*\)".*/\1/' | sort -u | while read -r name; do
      manifest="$(grep -l "^name *= *\"$name\"" "$work"/oxc/crates/*/Cargo.toml | head -1)"
      echo "$name = { path = \"$(dirname "$manifest")\" }"
    done
} >> "$work/compiler-rs/Cargo.toml"

export ASTRO_CORPUS_DIR="$out"
(cd "$work/oxc" && cargo test -q -p oxc_parser --features astro --lib astro) || true
(cd "$work/compiler-rs" && cargo test -q --workspace)
(cd "$work/compiler-rs" && pnpm install --ignore-scripts >/dev/null && pnpm run build:napi >/dev/null && pnpm run build:compiler >/dev/null && pnpm test >/dev/null)

printf 'compiler-rs %s (%s)\nwithastro/oxc %s\n' "$ref" "$(git -C "$work/compiler-rs" rev-parse HEAD)" "$rev" > "$out/SOURCE"
echo "harvested $(find "$out" -name '*.astro' | wc -l | tr -d ' ') inputs into $out"
