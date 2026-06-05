#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/tmp/mold-2.36.0-x86_64-linux/bin:/tmp/sccache-v0.8.2-x86_64-unknown-linux-musl:$PATH"

FILTER='not test(generates_artifacts_from_resolved_project_state)'
RESULTS="$ROOT/BENCHMARK-build-perf-results.txt"

bench() {
  local label="$1"
  shift

  # shellcheck disable=SC2068
  env "$@" bash -c "
    set -euo pipefail
    cd \"$ROOT\"
    cargo clean -q
  "

  local start end finished summary
  start=$(date +%s%3N)

  # shellcheck disable=SC2068
  local out
  out=$(env "$@" cargo nextest run --workspace --locked --no-fail-fast -E "$FILTER" 2>&1) || true

  end=$(date +%s%3N)
  finished=$(echo "$out" | rg "Finished" | tail -1 || true)
  summary=$(echo "$out" | rg "Summary" | tail -1 || true)

  {
    echo "=== $label ==="
    echo "wall_ms=$((end - start))"
    echo "$finished"
    echo "$summary"
    echo
  } | tee -a "$RESULTS"

  if [[ -n "${RUSTC_WRAPPER:-}" ]] && command -v sccache >/dev/null; then
    sccache --show-stats 2>&1 | rg "Compile requests|Cache hits|Cache hits rate|Non-cacheable" | tee -a "$RESULTS" || true
    echo | tee -a "$RESULTS"
  fi
}

: >"$RESULTS"
echo "Rust build perf benchmark — $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$RESULTS"
echo | tee -a "$RESULTS"

# A — stock config
bench "A-baseline" \
  RUSTC_WRAPPER= \
  CARGO_PROFILE_TEST_OPT_LEVEL=0 \
  CARGO_PROFILE_TEST_CODEGEN_UNITS=16

# B — profile tuning via cargo env
bench "B-profile-tuning" \
  RUSTC_WRAPPER= \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  CARGO_PROFILE_TEST_OPT_LEVEL=1 \
  CARGO_PROFILE_TEST_CODEGEN_UNITS=256

# C — profile + mold linker
bench "C-profile-mold" \
  RUSTC_WRAPPER= \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  CARGO_PROFILE_TEST_OPT_LEVEL=1 \
  CARGO_PROFILE_TEST_CODEGEN_UNITS=256 \
  RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=mold -C debuginfo=line-tables-only"

# D — populate sccache
export SCCACHE_DIR="/tmp/sccache-bench-store"
sccache --stop-server 2>/dev/null || true
rm -rf "$SCCACHE_DIR"
bench "D-sccache-populate" \
  RUSTC_WRAPPER=sccache \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  CARGO_PROFILE_TEST_OPT_LEVEL=1 \
  CARGO_PROFILE_TEST_CODEGEN_UNITS=256 \
  RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=mold -C debuginfo=line-tables-only"

# E — sccache hit (target clean, compiler cache warm)
bench "E-sccache-hit" \
  RUSTC_WRAPPER=sccache \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  CARGO_PROFILE_TEST_OPT_LEVEL=1 \
  CARGO_PROFILE_TEST_CODEGEN_UNITS=256 \
  RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=mold -C debuginfo=line-tables-only"

echo "Done. Results: $RESULTS"
