#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/tmp/mold-2.36.0-x86_64-linux/bin:/tmp/sccache-v0.8.2-x86_64-unknown-linux-musl:$PATH"
export SCCACHE_DIR="/tmp/sccache-bench-store-r2"

FILTER='not test(generates_artifacts_from_resolved_project_state)'
RESULTS="$ROOT/BENCHMARK-build-perf-results.txt"

bench() {
  local label="$1"
  shift
  env "$@" bash -c "cd \"$ROOT\" && cargo clean -q"
  local start end out finished summary
  start=$(date +%s%3N)
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
  if [[ "${1:-}" == *sccache* ]] || [[ "${RUSTC_WRAPPER:-}" == "sccache" ]]; then
    sccache --show-stats 2>&1 | rg "Compile requests|Cache hits|Cache hits rate|Non-cacheable|Errors" | tee -a "$RESULTS" || true
    echo | tee -a "$RESULTS"
  fi
}

{
  echo
  echo "--- Round 2 (no test opt-level; compile-focused) ---"
  echo
} | tee -a "$RESULTS"

bench "B2-split-debuginfo-only" \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked

bench "C2-split-debuginfo-mold" \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=mold -C debuginfo=line-tables-only"

sccache --stop-server 2>/dev/null || true
rm -rf "$SCCACHE_DIR"

bench "D2-sccache-populate" \
  RUSTC_WRAPPER=sccache \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=mold -C debuginfo=line-tables-only"

bench "E2-sccache-hit" \
  RUSTC_WRAPPER=sccache \
  CARGO_PROFILE_DEV_SPLIT_DEBUGINFO=unpacked \
  RUSTFLAGS="-C linker=clang -C link-arg=-fuse-ld=mold -C debuginfo=line-tables-only"

sccache --show-stats | tee -a "$RESULTS"
