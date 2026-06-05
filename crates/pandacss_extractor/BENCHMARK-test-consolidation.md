# Test binary consolidation benchmark (`pandacss_extractor`)

Measured on Linux / Rust 1.93.0 / `cargo nextest`.

## Setup

- **Baseline**: 18 integration-test binaries (`tests/*.rs`, one per file)
- **Consolidated**: 1 integration-test binary (`tests/suite.rs` + `tests/suite/*.rs` modules)

343 tests, identical assertions.

## Results

| Scenario | Baseline (18 bins) | Consolidated (1 bin) | Delta |
|---|---:|---:|---|
| Extractor compile-only (cold, 3-run avg) | **4240 ms** | **2986 ms** | **~30% faster** |
| Extractor cold compile + run | 7002 ms | 5699 ms | ~19% faster |
| Extractor test execution only | ~2.1 s | ~2.0 s | ~same |
| Touch `calls.rs` → compile-only | 1754 ms (1.56 s) | 754 ms (0.59 s) | consolidated faster |
| Full workspace cold (`cargo clean`) | 53.3 s wall / 48.3 s compile | 51.8 s wall / 46.7 s compile | **~3% faster** |
| Workspace test binaries | 88 | 71 | −17 |

## Takeaways

1. **Compile/link is the bottleneck**, not test execution (~2 s for 343 extractor tests).
2. Consolidating binaries helps most for **crate-local cold builds** (~30% on `pandacss_extractor`).
3. **Full-workspace `cargo clean` gains are modest (~3%)** because most time is compiling shared library crates (Oxc stack), not the 17 extra extractor links.
4. **Incremental single-file edits** also favor consolidation here: one link beats linking a separate integration binary that still pulls the full Oxc dependency tree.
5. **Inlining tests in `src/`** would produce the same binary count (1 per crate) and similar compile wins, but requires changing `pandacss_extractor::` imports to `crate::` in test modules.

## Filter change

```bash
# before
cargo nextest run -p pandacss_extractor calls::

# after
cargo nextest run -p pandacss_extractor suite::calls::
```
