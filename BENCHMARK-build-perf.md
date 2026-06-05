# Rust build perf experiments (Linux, Rust 1.93, nextest)

Measured with `cargo clean` + full workspace `cargo nextest run` (930 tests),
excluding the known flaky `generates_artifacts_from_resolved_project_state` snapshot.

Tools used (downloaded to `/tmp` on the agent VM):
- mold 2.36.0
- sccache 0.8.2

## Results summary

| Config | Wall time | `Finished` compile | Test run |
|---|---:|---:|---:|
| **A — baseline** | 53.9 s | 48.7 s | 4.75 s |
| B — `opt-level=1` + `codegen-units=256` | **158.7 s** | 155 s | 3.20 s |
| B2 — `split-debuginfo=unpacked` only | 60.3 s | 54.7 s | 5.06 s |
| C2 — split-debuginfo + mold | 61.0 s | 55.6 s | 4.90 s |
| **E2 — sccache hit** (target clean, compiler cache warm) | **44.2 s** | 38.9 s | 4.86 s |
| sccache hit (confirmation run) | **44.3 s** | 39.2 s | 4.70 s |
| mold only (no sccache) | 56.4 s | 51.0 s | 4.82 s |
| baseline repeat | 52.6 s | 47.5 s | 4.65 s |

Run-to-run variance is ~2–4 s; treat differences under ~5 s as noise.

## Conclusions

### sccache — **worth it** (~15–20% on `cargo clean` rebuilds)

With a warm sccache store but empty `target/`, compile dropped **48.7 s → ~39 s**.
~50% of rustc invocations were cache hits; ~50% were non-cacheable (incremental artifacts, crate-type metadata, etc.).

**Best for:** CI when the `target/` cache is invalidated but sccache persists; local `cargo clean` workflows.

### mold (faster linker) — **no clear win here**

mold-only was not faster than baseline in any run (56.4 s vs 52.6 s repeat baseline).
With 88 test binaries, we expected a link-time win; on this VM it was within noise or offset by other variance.

**Verdict:** optional nice-to-have for dev machines; not proven on this benchmark. Still reasonable for CI Linux if already installing mold for other reasons.

### Test profile `opt-level = 1` — **avoid for this workspace**

`CARGO_PROFILE_TEST_OPT_LEVEL=1` **tripled** compile time (48 s → 155 s) to save ~1.5 s on test execution.
Wrong tradeoff for 900+ tests across a large dependency tree.

### `split-debuginfo = "unpacked"` — **inconclusive / possibly slower**

Single run was ~6 s slower than baseline. Needs more trials; not recommended without further measurement.

## Recommended rollout

1. **CI: add sccache** (mozilla-actions/sccache-action + `RUSTC_WRAPPER=sccache`) — proven ~15–20% here.
2. **Do not** set `opt-level = 1` on `[profile.test]`.
3. **mold**: document as optional dev setup; optional Linux CI install.
4. Keep `debuginfo=line-tables-only` (already in `.cargo/config.toml`).

## Reproduce

```bash
./scripts/bench-rust-build.sh        # includes opt-level=1 round (shows regression)
./scripts/bench-rust-build-round2.sh # compile-focused round
```

Raw output: `BENCHMARK-build-perf-results.txt`
