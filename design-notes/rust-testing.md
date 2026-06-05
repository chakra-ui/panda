# Rust Testing Strategy

## Summary

The Rust engine is validated through **public-API integration tests** in `crates/<name>/tests/`, not through
`#[cfg(test)]` modules in `src/`. Tests assert behavioral contracts — extraction shapes, encoding, project lifecycle,
and especially **CSS output** — using inline `insta` snapshots. CSS snapshots are sacred: a diff is a product change,
not a housekeeping update.

Heavy crates (`pandacss_stylesheet`, `pandacss_project`) consolidate their integration suites into **one test binary**
to avoid linking the same dev-deps (notably `pandacss_project`) dozens of times. Lighter crates keep Cargo's default
one-binary-per-`tests/*.rs` layout because compile cost and artifact lock contention are acceptable.

## Integration test harness (consolidated crates)

`pandacss_stylesheet` and `pandacss_project` use a single integration binary named `integration`:

```toml
# Cargo.toml
autotests = false

[[test]]
name = "integration"
path = "tests/main.rs"
```

`tests/main.rs` is the root module. Each former top-level test file (`atomic.rs`, `config_recipes.rs`, …) is a
**submodule**, not a separate binary:

```rust
// tests/main.rs
mod atomic;
mod common;
mod config_recipes;
// …
```

**Why `autotests = false` is mandatory.** Cargo autodiscovers every `tests/*.rs` as its own integration-test binary.
Without disabling autodiscovery, `main.rs` would compile *and* every suite file would still compile as a standalone
binary — doubling (or worse) link work and defeating the consolidation. Only `[[test]]` entries are built.

Run the full consolidated suite for one crate:

```sh
cargo test -p pandacss_stylesheet --locked
cargo test -p pandacss_project --locked
```

## Module layout and shared helpers

Shared fixtures live under `tests/common/` (a `mod.rs` tree). Suite modules import helpers via the integration crate
root — **not** `mod common;` in each file:

```rust
// tests/atomic.rs
use crate::common::{compile_css, config};
```

`main.rs` owns `mod common;` once. Suite files must not re-declare it; duplicate `mod common` would be a separate module
instance per file in the old multi-binary layout, but in the consolidated harness it would fail to compile.

Helper conventions:

- `indoc! { "..." }` for multi-line source fixtures so Oxc spans match unindented source.
- `tests/common/` builds end-to-end paths (e.g. stylesheet helpers that construct `Project` + `System` and emit CSS).

## Which crates use which layout

| Layout | Crates | Rationale |
| --- | --- | --- |
| **Consolidated** (`main.rs` + `autotests = false`) | `pandacss_stylesheet`, `pandacss_project` | Large suite surface; dev-deps pull in downstream tiers (`pandacss_project` for stylesheet, `pandacss_fs` memory for project). Many binaries ⇒ slow compiles and `target/` lock contention during parallel `cargo test`. |
| **Autodiscovered** (one `tests/<feature>.rs` binary each) | `pandacss_extractor`, `pandacss_encoder`, `pandacss_codegen`, `pandacss_config`, `pandacss_tokens`, `pandacss_recipes`, `pandacss_fs`, `pandacss_shared`, `pandacss_utility`, `pandacss_tracing` | Fewer files and/or lighter dev-dep graphs; separate binaries aid targeted `cargo test -p … <file_stem>` filtering without maintaining `main.rs` module lists. |

Adopt the consolidated harness when a crate's integration suite grows enough that **link time dominates iteration** or
parallel test runs fight over the same test-binary artifacts. Do not consolidate crates with only a handful of small
test files — the `main.rs` bookkeeping cost isn't worth it.

## Snapshot testing (`insta`)

Public contracts are asserted with inline snapshots:

- `assert_yaml_snapshot!(value, @"…")` — structured extraction/encoding results.
- `assert_snapshot!(text, @"…")` — CSS and other text output (primary regression guard for [stylesheet](./stylesheet.md)).

Review workflow:

```sh
# After intentional output changes — inspect every diff
cargo insta review -p pandacss_stylesheet
cargo insta review -p pandacss_project

# Or accept all pending snapshots for a crate (use only when diffs are already verified)
cargo insta test --accept -p pandacss_stylesheet
INSTA_UPDATE=1 cargo test -p pandacss_stylesheet --locked
```

Never bulk-accept CSS snapshot changes without reading the diff. A green test with wrong CSS is worse than a red test.

## Fast iteration workflow

Prefer **crate-scoped, filtered** commands over `pnpm rust:test` (full workspace + doc tests) during development.

```sh
# Typecheck test targets only — fast feedback after edits
cargo check -p pandacss_stylesheet --tests --locked

# Run one test (names are module::test_name in consolidated crates)
cargo test -p pandacss_stylesheet atomic::emits_dynamic_atomic_css --locked

# Run all tests in one suite module
cargo test -p pandacss_project config_recipes --locked

# Full integration binary for the crate
cargo test -p pandacss_stylesheet --locked
```

For autodiscovered crates, the filter is often the file stem:

```sh
cargo test -p pandacss_extractor extract --locked
```

**Stop on compiler warnings during iteration.** CI runs `clippy` with `-D warnings`; a warning left unfixed forces a
full rebuild cycle later. Fix warnings before continuing to the next change.

## When to run full workspace tests

| When | Command |
| --- | --- |
| Local iteration on one crate | `cargo check/test -p <crate> …` (above) |
| Pre-PR / cross-crate change | `pnpm rust:check` then `pnpm rust:test` |
| CI | Same as pre-PR — workspace `cargo nextest run --workspace --locked` + doc tests |

Run workspace tests when touching shared types (`pandacss_config`, `pandacss_shared`), workspace `Cargo.toml` /
`rust-toolchain.toml`, or anything that could change a downstream crate's contract.

## Private unit tests in `src/`

`#[cfg(test)] mod tests` inside `src/` is **rare** and reserved for private helpers that are awkward to reach from
integration tests — pure functions with no public API surface. Example: `pandacss_shared::unit_conversion::to_rem`.

Default to `tests/` for anything that exercises the crate's public API or documents expected behavior for porting
parity. If a `src/` test starts needing dev-deps or sibling crates, move it to integration tests.

## Unresolved Questions

- Whether `pandacss_extractor` should consolidate once its suite + dev-deps cross a compile-time threshold (it has the
  largest file count today but lighter deps than stylesheet/project).
- Standardizing `tests/common/` helpers that are duplicated across `pandacss_stylesheet` and `pandacss_project`.

## Related

- [Crate layering](./crate-layering.md) — tier model; explains why stylesheet tests dev-depend on `pandacss_project`.
- [Native stylesheet compiler](./stylesheet.md) — CSS emission contracts guarded by `assert_snapshot!`.
- [Project lifecycle](./project-lifecycle.md) — `Project` / `System` semantics exercised by `pandacss_project` tests.
- [Performance budget](./performance-budget.md) — `PERF(port)` markers; benchmark before changing hot-path behavior tests assert.
