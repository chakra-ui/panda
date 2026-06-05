# Agent Guide for Panda CSS

This guide helps AI assistants understand the Panda CSS codebase structure, conventions, and best practices.

## Project Overview

Panda CSS is a CSS-in-JS framework with static extraction capabilities. The project is a monorepo managed by **pnpm**
with workspace support.

## Key Architecture

### Monorepo Structure

```
/packages/          # Core packages published to npm
  /core/           # CSS processing, rule generation, optimization (PostCSS/LightningCSS)
  /node/           # Node.js APIs, config resolution, file watching
  /cli/            # CLI tool (@pandacss/dev package)
  /parser/         # Static analysis and extraction
  /generator/      # Code generation for styled-system
  /fixture/        # Shared test fixtures and utilities
  /postcss/        # PostCSS plugin
  /preset-*/       # Design system presets
  /compiler/       # @pandacss/compiler — NAPI wrapper around Rust engine
    /crate/        # compiler_napi cdylib (NAPI boundary only)
  /compiler-wasm/  # @pandacss/compiler-wasm — browser wasm-bindgen wrapper
    /crate/        # compiler_wasm cdylib (wasm32-unknown-unknown)

/crates/           # Rust workspace — the v2 Oxc-based compiler engine
  /extractor/      # Oxc-based AST scanning + extraction
  /engine/         # Orchestrator (extract → encode → emit → optimize → cache)
  /encoder/        # Style usage → atomic rules
  /stylesheet/     # Native CSS emission (replaces planned emitter/optimizer split)
  /project/        # Project lifecycle, recipes, config resolution
  /optimizer/      # lightningcss wrapper (placeholder)
  /cache/          # File/rule caches
  /config/         # Serializable config types

/bench/            # Rust + TS benchmark harness for the OSS-2400 spike

/sandbox/          # Integration tests and examples
  /codegen/        # Generated code validation tests
  /vite-ts/        # Vite integration example
  /next-js-*/      # Next.js examples

/playground/       # Interactive playground application

/website/          # Documentation site
```

### Key Concepts

1. **Static Extraction**: Panda analyzes source files to extract styles at build time
2. **Design Tokens**: Type-safe design tokens defined in config
3. **Recipes**: Reusable component style patterns (like variants)
4. **Conditions**: Responsive and state-based styling (e.g., `_hover`, `md:`, `_dark`)
5. **CSS Optimization**: Uses PostCSS (default) or LightningCSS (optional) for CSS processing

## Critical Rules

### 🚨 CSS Output is Sacred

**NEVER** accept changes that modify CSS output snapshots without explicit user approval:

- Run tests BEFORE and AFTER any dependency updates
- If snapshots change, investigate why and get user confirmation
- The test `packages/core/__tests__/atomic-rule.test.ts` is the primary CSS output validator
- CSS output consistency is more important than using latest package versions

Recent Rust parity work (P1-6 / P2-7) tightened TS alignment — treat these as CSS contracts when reviewing diffs:

- **Eager compound variants** — emitted by default at build time (`emit_eager_compounds`); runtime combo classes still
  apply for dynamic usage.
- **`smartCompoundVariants`** — opt-in via `optimize.smartCompoundVariants: true`; narrows compound CSS to selected
  variant combos instead of emitting every permutation.
- **Grouped `@media` emit** — rules that share `@media` / `@supports` wrapper prefixes are tree-grouped
  (`pandacss_stylesheet::grouped`) before writing CSS.
- **Modern breakpoint syntax** — responsive conditions normalize to `@media (width >= Nrem)` via
  `pandacss_shared::to_rem` (px/em → rem; rem/%/vh pass through).

### Testing Workflow

**Always run tests from the project root:**

```bash
# ✅ Correct
pnpm test packages/core
pnpm test packages/parser

# ❌ Incorrect
cd packages/core && pnpm test
```

**Key test commands:**

```bash
pnpm test <path>              # Run tests for specific package/file
pnpm test packages/core       # Test all core package tests
pnpm build                    # Build all packages
pnpm build-fast               # Fast build without type definitions
```

### Package Management

**Use `--ignore-scripts` for dependency updates:**

```bash
pnpm install --ignore-scripts
pnpm update <package> --ignore-scripts
```

**When updating PostCSS or browserslist-related packages:**

1. Update package.json versions
2. Run `pnpm install --ignore-scripts`
3. Run `pnpm test packages/core` to verify CSS output unchanged
4. Check for browserslist warnings in sandbox projects
5. Create changeset if changes affect users

### Dependency Strategy

- **PostCSS ecosystem**: Coordinate updates across all PostCSS plugins to avoid CSS output changes
- **browserslist**: Updates affect `postcss-merge-rules` behavior - test thoroughly
- **lightningcss**: Used optionally via `config.lightningcss` flag, depends on browserslist for targets
- **Node.js packages**: Core packages (`@pandacss/core`, `@pandacss/node`, etc.) must stay in sync

## Common Workflows

### Making Code Changes

1. Read relevant source files in `/packages/<name>/src/`
2. Understand the change impact (does it affect CSS output?)
3. Make changes
4. Run tests: `pnpm test packages/<name>`
5. If tests fail, investigate and fix (don't just update snapshots)
6. Create changeset for user-facing changes

### Updating Dependencies

1. Check current versions in package.json
2. Research latest compatible versions
3. Update package.json files
4. Run `pnpm install --ignore-scripts`
5. **Run CSS output tests first**: `pnpm test packages/core/__tests__/atomic-rule.test.ts`
6. If snapshots change, investigate the root cause
7. Run broader test suite: `pnpm test packages/core`
8. Create changeset documenting the update

### Creating Changesets

```bash
# Changesets are in .changeset/ directory
# Create a new file: .changeset/<descriptive-name>.md
```

**Format:**

```markdown
---
'@pandacss/package-name': patch|minor|major
---

Brief description of the change and its impact.

- Detail 1
- Detail 2
```

**Changeset types:**

- `patch`: Bug fixes, dependency updates, non-breaking changes
- `minor`: New features, backwards-compatible changes
- `major`: Breaking changes

## Important Files & Patterns

### Configuration Flow

1. User config → `packages/config/` → Config resolution
2. Config hooks → `packages/types/src/config.ts`
3. Context creation → `packages/node/src/` → `PandaContext`
4. Code generation → `packages/generator/`

### CSS Processing Flow

1. Style objects → `packages/core/src/rule-processor.ts`
2. CSS generation → `packages/core/src/stylesheet.ts`
3. Optimization → `packages/core/src/optimize.ts`
   - PostCSS path: `optimize-postcss.ts`
   - LightningCSS path: `optimize-lightningcss.ts`

### Test Fixtures

- `packages/fixture/` contains shared test utilities
- `createContext()` and `createRuleProcessor()` are used throughout tests
- Fixtures provide a base config with design tokens and recipes

## Debugging Tips

### Understanding Test Failures

**Snapshot mismatches:**

- Compare expected vs received CSS output carefully
- Look for media query ordering, selector merging, or whitespace changes
- Identify which dependency update caused the change
- Common culprits: `postcss-merge-rules`, `postcss-nested`, `browserslist`

**Build failures:**

- Check TypeScript errors in `packages/*/src/`
- Run `pnpm build-fast` for faster iteration without type checking
- Use `pnpm typecheck` for type-only validation

### Finding Code

**Use search tools strategically:**

- Grep for function names, class names, or specific strings
- Check both `/src/` and `/__tests__/` directories
- Look in `/packages/types/src/` for type definitions
- Config options are defined in `packages/types/src/config.ts`

## Watch Out For

1. **Circular dependencies**: Be careful when adding imports between core packages
2. **Browser compatibility**: Changes to browserslist affect CSS transformation
3. **PostCSS plugin order**: Order matters in `optimize-postcss.ts`
4. **Workspace protocol**: Internal packages use `workspace:*` in dependencies
5. **Multiple package.json**: Each package has its own, plus root package.json
6. **Sandbox warnings**: Even if main packages are fine, check sandbox projects for warnings
7. **TypeScript version sync**: The TypeScript version in the root `package.json` must match the version used by
   `ts-morph`'s dependency. Mismatches can cause parsing errors and type issues. Always verify `ts-morph` compatibility
   when updating TypeScript.

## Package Relationships

```
@pandacss/dev (CLI)
  ├─ @pandacss/node (core runtime)
  │   ├─ @pandacss/core (CSS processing)
  │   ├─ @pandacss/parser (static analysis)
  │   ├─ @pandacss/generator (codegen)
  │   └─ @pandacss/config (config resolution)
  └─ @pandacss/postcss (PostCSS plugin)

@pandacss/core
  ├─ postcss (CSS processing)
  ├─ lightningcss (optional, faster CSS processing)
  ├─ browserslist (browser targets)
  └─ postcss-* plugins (optimization)

@pandacss/compiler (v2, NAPI)
  └─ crates/* (Rust workspace, all `pandacss_*`-prefixed)
      ├─ pandacss_extractor (Oxc parsing + scan_imports + match_imports)
      ├─ pandacss_encoder, pandacss_recipes, pandacss_tokens, pandacss_project
      ├─ pandacss_stylesheet (native CSS emission), pandacss_engine, pandacss_cache, pandacss_config
      ├─ packages/compiler/crate (compiler_napi cdylib — native NAPI)
      └─ packages/compiler-wasm/crate (compiler_wasm cdylib — browser wasm-bindgen)
```

## Rust / Oxc Engine (v2 migration)

The repo is in the middle of porting the compiler hot path from `ts-morph` + `ts-evaluator` to a Rust/Oxc engine.
JS-facing APIs stay stable; Rust ships behind `@pandacss/compiler`.

**Read first** before touching Rust:

- `design-notes/README.md` — index of durable Rust architectural decisions (crate layering, extraction pipeline, literal
  evaluator, project lifecycle, NAPI boundary, performance budget, scope and boundaries, publish namespace). **Skim the
  index on the first Rust task in any session and consult the specific note before any change in that area.** When you
  change the underlying design, update the matching note in the same PR.
- `design-notes/rust-testing.md` — full Rust testing strategy (consolidated harness, insta workflow, fast iteration).
- `RUST_OXC_MIGRATION.md` — the master plan, phase breakdown, data contract, hook semantics.
- `RUST_ENGINE_SPIKE.mdx` — OSS-2400 spike spec + porting rules (crate boundaries, comment markers, unsafe policy,
  output rules).

### Toolchain

- Rust pinned to `1.93.0` via `rust-toolchain.toml` (matches Oxc 0.130 MSRV).
- Oxc crates: `oxc_allocator`, `oxc_ast`, `oxc_diagnostics`, `oxc_parser`, `oxc_span` at `0.130.0`.
- Test deps: `insta` (inline YAML snapshots) + `indoc` (dedented multi-line source fixtures).

### Commands

**Workspace-wide (pre-PR / CI):**

```sh
pnpm rust:check      # cargo check --workspace --locked
pnpm rust:test       # cargo test --workspace --locked (+ doc tests)
pnpm rust:fmt        # cargo fmt --all --check
pnpm rust:clippy     # cargo clippy --all-targets --locked -- -D warnings
pnpm bench:rust-spike                          # TS baseline benchmark
pnpm --filter @pandacss/compiler build:native   # build the NAPI .node artifact
pnpm --filter @pandacss/compiler test           # binding round-trip Vitest tests
```

**During iteration — prefer crate-scoped commands over `pnpm rust:test`:**

```sh
# Typecheck test targets only — fast feedback after edits
cargo check -p pandacss_stylesheet --tests --locked

# Run one test (consolidated crates: module::test_name)
cargo test -p pandacss_stylesheet atomic::emits_dynamic_atomic_css --locked

# Run all tests in one suite module
cargo test -p pandacss_project config_recipes --locked

# Full integration binary for a consolidated crate
cargo test -p pandacss_stylesheet --locked
cargo test -p pandacss_project --locked

# Autodiscovered crates — filter by file stem
cargo test -p pandacss_extractor extract --locked
```

Run workspace tests when touching shared types (`pandacss_config`, `pandacss_shared`), workspace `Cargo.toml` /
`rust-toolchain.toml`, or anything that could change a downstream crate's contract.

Run these from the repo root via `pnpm`. Cargo binaries live in `~/.cargo/bin`; user shells (zsh) load `.zshenv` which
adds it to PATH, so pnpm child processes inherit it.

### Test Conventions

See `design-notes/rust-testing.md` for the full testing strategy.

- **Public-API tests live in `crates/<name>/tests/`** — not in `src/`. Inline `#[cfg(test)] mod tests` is reserved for
  private helpers (rare), e.g. `pandacss_shared::unit_conversion::to_rem`.
- **Consolidated harness** — `pandacss_stylesheet` and `pandacss_project` use one integration binary (`tests/main.rs`
  - `autotests = false` in `Cargo.toml`). Suite files are submodules (`mod atomic;`, …), not separate binaries. Shared
    helpers live under `tests/common/` and are imported via `use crate::common::…`.
- **Autodiscovered layout** — lighter crates (`pandacss_extractor`, `pandacss_encoder`, `pandacss_config`, etc.) keep
  Cargo's default one-binary-per-`tests/*.rs` layout for targeted filtering without `main.rs` bookkeeping.
- Use **inline snapshots**: `assert_yaml_snapshot!(value, @"…")` for structured results; `assert_snapshot!(text, @"…")`
  for CSS output (primary regression guard).
- Update snapshots with `cargo insta review -p <crate>` after reading every diff. Never bulk-accept CSS snapshot changes
  without inspection. `cargo insta test --accept -p <crate>` only when diffs are already verified.
- Use `indoc! {"..."}` for multi-line source fixtures so spans match plain unindented source.
- For tests where output text isn't part of the contract (e.g. Oxc parse error messages), assert shape only.
- **Fix compiler warnings during iteration** — CI runs clippy with `-D warnings`; unfixed warnings force a full rebuild
  cycle later.

### Porting Comment Markers

Use these exact strings so audits can run with `rg`:

```rust
// TODO(port): unsupported or uncertain behavior — must be behind TS fallback.
// PERF(port): known performance-sensitive translation; needs benchmark before default flip.
// SAFETY: invariant that makes an unsafe block valid (mandatory next to every unsafe).
// PORT NOTE: intentional reshaping from the TypeScript implementation.
```

### Workspace Lints

`Cargo.toml` enables `clippy::all` + `clippy::pedantic` workspace-wide, plus warn on `dbg_macro` / `todo` /
`unimplemented` / `print_stdout` / `print_stderr`. CI runs with `-D warnings`, so anything clippy flags blocks the
build. Per-function `#[allow(...)]` is fine when justified — include a `reason = "..."` (e.g. NAPI requires owned
`String` parameters so `clippy::needless_pass_by_value` must be allowed on `#[napi]` entry points).

### Native Binding (`@pandacss/compiler`)

- `packages/compiler/crate/src/lib.rs` is the NAPI boundary — thin mirror types only, no compiler logic.
- TS wrapper `packages/compiler/src/index.ts` defines the public API + a no-op fallback for unsupported platforms.
- Loader `src/load-binary.ts` looks for `compiler.node` next to the package root, then falls back to
  `@pandacss/compiler-native`.
- Native artifact (`compiler.node`) and auto-generated `native.d.ts` are gitignored.
- **NAPI quirks**: `#[napi]` functions can't take `&str` — use owned `String` with
  `#[allow(clippy::needless_pass_by_value, reason = "...")]`. `Option<T>` accepts `undefined`/omitted in JS but **not
  `null`** — TS callers should leave the field off, not pass `null`.

### Current State

- ✅ Workspace scaffold, CI, NAPI binding skeleton (OSS-2400/2401).
- ✅ `scan_imports()` over Oxc — full named/default/namespace/side-effect/type-only coverage.
- ✅ `match_imports()` — ports `ImportMap.match()` semantics from `packages/core/src/import-map.ts`.
- ✅ `extract_calls()` — literal object/array/primitive extraction from `css({...})`, namespace member calls
  (`p.css({...})`), multi-arg patterns. Positional `Option<Literal>` so non-extractable args don't shift indices.
- ✅ `extract_jsx()` — `<Box>`, `<styled.div>`, `<JSX.Stack>` style-prop extraction with boolean-shorthand +
  literal-spread merge.
- ✅ `extract()` (combined hot path) + `extract_debug()` (kitchen-sink) — single parse per file; lean result strips
  `imports`/`matched` for production callers.
- ⬜ Next: Phase 5 — same-file static evaluator (identifier resolution, `token()` resolution, conditionals).

### Parse-error contract

Oxc recovers from parse errors and returns a partial AST. All four entrypoints (`scan_imports`, `extract_calls`,
`extract_jsx`, `extract`) run their visitors on whatever AST Oxc produces, so a result can include extractions **and**
non-empty `diagnostics` simultaneously. **Treat `diagnostics` as authoritative**: code that needs strict correctness
should bail when `!diagnostics.is_empty()`. Build pipelines that already tolerate ts-morph's recovery don't need to
change behaviour.

### Package Naming for Publishing

All Rust crates use the `pandacss_*` prefix (e.g. `pandacss_extractor`, `pandacss_encoder`). Directories and
`[package] name` both. Underscore, not hyphen — the package name and the `use` path are identical. The `compiler_napi`
cdylib at `packages/compiler/crate/` is a deliberate exception (its output `compiler.node` is loaded by name on the TS
side). All crates are `publish = false` today. See `design-notes/publish-namespace.md` for the full rationale.

## Useful References

- **Main documentation**: `/website/` (documentation source)
- **Type definitions**: `packages/types/src/` (comprehensive types)
- **Integration examples**: `/sandbox/` (real-world usage)
- **Test patterns**: `packages/fixture/` and `packages/core/__tests__/`
- **Rust migration**: `RUST_OXC_MIGRATION.md` and `RUST_ENGINE_SPIKE.mdx`
- **Rust testing**: `design-notes/rust-testing.md`

## Best Practices for AI Assistants

1. **Always read before writing**: Understand existing patterns before making changes
2. **Test incrementally**: Run tests after small changes, not just at the end
3. **Preserve CSS output**: When in doubt, prioritize CSS output stability
4. **Use workspace knowledge**: Remember this is a monorepo - changes may affect multiple packages
5. **Document breaking changes**: If CSS output must change, explain why clearly
6. **Check sandboxes**: Don't just test main packages - verify sandbox projects too

## Emergency Rollback

If a change breaks things:

```bash
git checkout packages/          # Revert package.json changes
pnpm install --ignore-scripts   # Restore dependencies
pnpm test packages/core         # Verify tests pass
```

---

**Last Updated**: 2026-06-05 **Project Version**: v2 branch (Rust/Oxc migration in progress)
