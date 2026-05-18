# Rust and Oxc Migration Plan

## Goal

Move Panda's compiler-heavy work from TypeScript to Rust, using Oxc for JavaScript, TypeScript, JSX, and TSX parsing. Keep the public Node/CLI/PostCSS API stable while replacing the hottest internals piece by piece.

The target state is not "rewrite every package in Rust." The target state is:

- Rust owns source parsing, static extraction, style encoding, flat CSS emission, CSS optimization, and compiler caches.
- TypeScript owns package ergonomics, CLI command wiring, config authoring, framework plugins, and compatibility glue.
- The migration ships behind stable JS-facing APIs so each phase can be benchmarked, tested, released, and rolled back independently.

This document incorporates the Linear plan under:

- `OSS-2399`: Rust engine parent.
- `OSS-2400` through `OSS-2406`: phase tickets.
- `OSS-2352`: parser abstraction prerequisite.
- `OSS-2355`: first-class design-system support, which affects cache/buildinfo design.

## Current Architecture Summary

The current build path is:

1. `@pandacss/cli` calls into `@pandacss/node`.
2. `PandaContext` in `packages/node/src/create-context.ts` creates a `Project` from `@pandacss/parser`.
3. `Project` in `packages/parser/src/project.ts` creates a `ts-morph` project, reads all source files, applies parser hooks and Vue/Svelte transforms, then calls `createParser`.
4. `createParser` in `packages/parser/src/parser.ts` gathers Panda imports, calls `@pandacss/extractor`, and converts low-level extraction results into `ParserResult`.
5. `@pandacss/extractor` traverses `ts-morph` nodes, resolves identifiers, evaluates static expressions through `ts-evaluator`, and boxes results.
6. `ParserResult` immediately feeds `StyleEncoder` in `@pandacss/core`.
7. `@pandacss/generator` and `@pandacss/node` write CSS, JS, and type artifacts.

The practical migration boundary is therefore `Project.parseSourceFile(filePath, encoder)`: it is already the single place that turns a file into encoded styles.

## Why Oxc

Oxc is a Rust JavaScript toolchain with a fast parser, transformer, resolver, linter, formatter, and minifier. Its parser supports JavaScript, TypeScript, JSX, and TSX, returns module information directly, and is designed as the foundation for Rust-side tools.

Relevant references:

- Oxc home: https://oxc.rs/
- Oxc parser usage: https://oxc.rs/docs/guide/usage/parser
- Oxc parser architecture: https://oxc.rs/docs/learn/architecture/parser
- Oxc transformer usage: https://oxc.rs/docs/guide/usage/transformer
- NAPI-RS: https://napi.rs/

## Migration Principles

- Keep the JS API stable first. Existing package exports should continue to work while Rust implementations are selected internally.
- Start with extraction, not CLI or presets. Extraction has the highest `ts-morph` coupling and the largest likely performance win.
- Preserve existing semantics before optimizing. The parser test suite should pass through both TS and Rust paths during the transition.
- Do not expose Oxc ASTs across the Node boundary. Serialize Panda-specific extraction facts instead.
- Keep Node calls coarse-grained. One Rust call per file or batch is acceptable; one call per AST node is not.
- Prefer a native Node addon via NAPI-RS for the CLI/build path. Consider WASM later only if browser execution becomes a product requirement.
- Treat config loading separately. User `panda.config.ts` currently benefits from dynamic Node imports and should not block parser migration.
- Keep the architecture recognizable. Bun's Rust PR explicitly kept the same architecture and data structures; we should do the same for Panda's compiler boundaries rather than redesigning while porting.
- Every uncertain port should be searchable. Use `TODO(port)`, `PERF(port)`, `SAFETY`, and `PORT NOTE` comments with consistent meanings.

## Lessons from Bun's Rust Migration

Bun merged a large Zig-to-Rust port on May 14, 2026 in `oven-sh/bun#30412`. The useful takeaways for Panda are process and discipline, not scale.

Sources reviewed:

- Bun PR: https://github.com/oven-sh/bun/pull/30412
- Bun porting guide: https://github.com/oven-sh/bun/blob/claude/phase-a-port/docs/PORTING.md
- Bun root Cargo workspace: https://github.com/oven-sh/bun/blob/main/Cargo.toml
- Bun Rust toolchain file: https://github.com/oven-sh/bun/blob/main/rust-toolchain.toml

What to copy:

- **Same architecture first.** Bun's PR note says the codebase stayed largely the same: same architecture, same data structures, few third-party libraries, and no async Rust. For Panda, this means `extract -> encode -> emit -> optimize` should stay recognizable while the implementation changes.
- **Two-step porting.** Bun's guide splits translation into a draft phase and a compile phase. Panda should do the same inside each crate: first preserve semantics behind tests, then make it idiomatic and fast.
- **Detailed porting rules.** Bun wrote a concrete translation guide covering naming, crate mapping, memory ownership, unsafe blocks, borrow-checker reshaping, and performance markers. Panda needs a smaller equivalent before extractor work begins.
- **Searchable debt markers.** Bun uses `TODO(port)` for uncertainty, `PERF(port)` for known performance follow-up, `SAFETY` for unsafe invariants, and notes for borrow-checker reshaping. These markers let reviewers audit the migration mechanically.
- **Workspace-level discipline.** Bun centralizes workspace lints, profiles, dependencies, and target/toolchain setup. Panda should avoid per-crate drift from the start.
- **Release profiles matter.** Bun's Cargo config uses `lto`, `codegen-units`, `panic = "abort"`, and line-table debug info intentionally. Panda does not need Bun's exact settings on day one, but native package size and stack traces should be treated as product concerns.
- **Canary/default separation.** Bun landed the Rust port in a canary-style path with follow-up optimization and cleanup work. Panda should keep `engine: 'rust'` opt-in until ecosystem CI and fixture equivalence are boring.

What not to copy:

- **Do not big-bang the user-visible engine.** Bun can ship a runtime canary; Panda should keep TS and Rust engines side by side until Phase 5.
- **Do not mechanically translate TypeScript package by package.** Panda's win comes from compiler hot paths, not from rewriting CLI, presets, docs, or framework plugins.
- **Do not add broad dependencies just because Rust makes them easy.** Bun's guide explicitly bans major async/runtime libraries for its domain. Panda should similarly ban unnecessary runtime frameworks in compiler crates.
- **Do not treat AI-generated code as done.** If agents help with porting, every generated slice still needs fixture equivalence, benchmarks, and explicit TODO/PERF/SAFETY review.

Panda-specific rule derived from Bun:

> First preserve output and architecture, then improve internals. Any PR that changes both semantics and architecture should be split.

## Porting Comment Conventions

Use these exact markers in Rust code so audits can be automated with `rg`.

```rust
// TODO(port): explain the unsupported or uncertain behavior.
// PERF(port): explain the known performance-sensitive translation and benchmark needed.
// SAFETY: explain the invariant that makes this unsafe block valid.
// PORT NOTE: explain intentional reshaping from the TypeScript implementation.
```

Rules:

- `TODO(port)` must block default-on Rust unless it is behind TS fallback.
- `PERF(port)` must have a benchmark or follow-up issue before default flip.
- Every `unsafe` block must have a nearby `SAFETY` comment.
- `PORT NOTE` is for reviewer orientation only; it should not hide missing behavior.

## Non-Goals for the First Migration Wave

- Rewriting presets. Presets are authored as ordinary JS/TS configuration and are not the performance bottleneck.
- Rewriting the CLI UX. Command parsing, prompts, and setup flows can stay in TypeScript.
- Replacing the TypeScript declaration generator immediately. Generated `.d.ts` output is compatibility-sensitive and should move only after extraction and encoding are stable.
- Implementing a full TypeScript checker in Rust. Panda needs syntax-driven constant extraction for most cases, not complete type inference.
- Native parsing for Vue and Svelte in the first wave. Existing plugin transforms can continue to produce TSX-like source for the compiler.
- Exposing a public Rust API. The initial Rust crates should be internal implementation details.
- Introducing async Rust runtimes. The compiler path is CPU-bound batch work; keep it synchronous internally unless profiling proves otherwise.

## Package Migration Map

| Package | Current role | Migration recommendation |
| --- | --- | --- |
| `@pandacss/parser` | `ts-morph` project, parser hooks, high-level Panda result shaping | Keep public API; route to Rust compiler internally |
| `@pandacss/extractor` | AST traversal, boxing, static evaluation | Primary Rust rewrite target |
| `@pandacss/core` | context, conditions, recipes, encoder/decoder, CSS processing | Port encoder and hot CSS processing after extractor |
| `@pandacss/generator` | output artifacts, JS factories, types, CSS files | Port CSS generation core later; keep templates/types in TS initially |
| `@pandacss/node` | build orchestration, watch mode, output writes | Keep in TS until compiler internals are stable |
| `@pandacss/config` | config discovery/loading/merge | Keep in TS initially; native config diffing is optional later |
| `@pandacss/cli` | user command surface | Keep in TS |
| `@pandacss/postcss` | build-tool integration wrapper | Keep in TS |
| `@pandacss/token-dictionary` | token processing and CSS var resolution | Candidate for later Rust port if profiling shows it matters |
| `@pandacss/shared`, `@pandacss/logger`, `@pandacss/reporter` | utilities and UX | Keep in TS unless required by native diagnostics |
| framework plugins | Vue/Svelte/Astro integrations | Keep as preprocessing/integration packages |

## Proposed Target Shape

The Linear plan uses a root Cargo workspace and a single native npm package:

```txt
Cargo.toml                  # workspace = ["bench", "crates/*", "packages/binding/crate"]
rust-toolchain.toml
.cargo/config.toml
bench/
crates/
  engine/                   # orchestrator
  extractor/                # Oxc-based AST visitor
  encoder/                  # style object -> encoded atomic rules
  emitter/                  # encoded rules -> flat CSS
  optimizer/                # lightningcss wrapper
  cache/                    # file/rule caches
  config/                   # serialized config structs
packages/binding/
  package.json              # @pandacss/binding
  src/index.ts              # JS wrapper around native binary
  src/load-binary.ts
  src/preprocess.ts         # Vue/Svelte/Astro preprocessing
  npm/                      # per-platform optional packages
  build-binding.ts
  crate/
    Cargo.toml
    src/lib.rs              # napi cdylib
```

Rust-side crates:

- `engine`: orchestrates parse, encode, emit, optimize, and cache.
- `extractor`: Oxc-based source extraction.
- `encoder`: deterministic atomic rule generation.
- `emitter`: flat CSS string generation.
- `optimizer`: `lightningcss` wrapper.
- `cache`: content hash, file, and rule caches.
- `config`: JSON-shaped config passed over the NAPI boundary.
- `binding_napi`: the `packages/binding/crate` cdylib. This is the only crate that should know about NAPI.

Likely Rust dependencies:

- `oxc_allocator`, `oxc_parser`, `oxc_ast`, `oxc_ast_visit`, and `oxc_span` for parsing, traversal, and source locations.
- `oxc_semantic` if same-file scope analysis needs more than syntax.
- `oxc_resolver` later if cross-file import resolution moves into Rust.
- `lightningcss` for optimization, minification, and prefixing.
- `serde` and `serde_json` for stable interchange formats.
- `napi` and `napi-derive` in the NAPI bridge only.

TypeScript-side wrappers:

- `@pandacss/binding`: native package consumed by the TS packages.
- `@pandacss/parser-interface`: temporary parser adapter contract from `OSS-2352`.
- `@pandacss/ts-morph`: temporary adapter for the existing engine.
- `@pandacss/parser`: initially remains the public compatibility layer or becomes a shim depending on the adapter split.
- Existing `ParserResult` and `StyleEncoder`: remain in TS until Rust has matching output.

The hot-path native API should be batched, not one call per file:

```ts
type CompileInput = {
  files: Array<{ path: string; content: string }>
  config: SerializedConfig
  cwd: string
  cacheDir?: string
}

type CompileOutput = {
  css: string
  sourceMap?: string
  manifest: { hashes: string[]; tokens: string[] }
  diagnostics: Diagnostic[]
}
```

Granular APIs can exist for tooling and tests: `parseFiles`, `encode`, `emit`, and `optimize`. Do not return generic Oxc AST nodes. Return Panda extraction, rule, CSS, and diagnostic facts.

## Data Contract

The Rust extractor should produce a serializable form of `ResultItem`, not `BoxNode`.

```ts
type ExtractedItem =
  | { type: 'css'; name: string; data: StyleObject[]; range: Range }
  | { type: 'cva'; name: string; data: RecipeObject[]; range: Range }
  | { type: 'sva'; name: string; data: SlotRecipeObject[]; range: Range }
  | { type: 'token'; name: string; data: unknown[]; range: Range }
  | { type: 'jsx'; name: string; data: StyleObject[]; range: Range }
  | { type: 'pattern'; name: string; data: StyleObject[]; range: Range; patternName: string }
  | { type: 'recipe'; name: string; data: StyleObject[]; range: Range; recipeName: string }

type Range = {
  line: number
  column: number
  endLine: number
  endColumn: number
}
```

This mirrors what downstream code actually consumes: style data, result category, names, and source ranges for reporting/debugging.

## Step-by-Step Backlog

The Linear issues are already good phase containers. The work below splits each phase into small PR-sized steps. Each step should either add no behavior, add a flagged behavior, or add a comparison harness. Avoid mixing infrastructure, behavior, and cleanup in the same PR.

### 0. Spike and Measurement (`OSS-2400`)

Goal: decide whether to proceed using hard data. No production code should depend on this phase.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 0.1 | Create `bench/` workspace skeleton and document benchmark targets | `bench/README.md` explains how to run the baseline |
| 0.2 | Add TS baseline benchmark for `ctx.parseFiles()` and full build | Captures cold build, warm rebuild, RSS, files/sec |
| 0.3 | Add output-equivalence harness for existing engine | Can snapshot CSS and parser output for fixture corpus |
| 0.4 | Audit `packages/parser` and `packages/extractor` for type-checker dependencies | Table lists each `ts-morph`/checker capability and Rust strategy |
| 0.5 | Evaluate the external prototype from GitHub discussion 3522 | Report includes perf, output diffs, scope, license, maintainer commitment |
| 0.6 | Write `RUST_ENGINE_SPIKE.mdx` | Go/no-go recommendation is explicit |

Phase gate:

- End-to-end build is at least 10x faster on a representative medium app.
- Fixture corpus has zero unexplained CSS output diff.
- At least one committed Rust contributor is identified.
- No type-checker dependency blocks an Oxc-based extractor.

### 1. Parser Abstraction Prep (`OSS-2352`)

Goal: make parser implementations swappable before introducing Rust behavior.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 1.1 | Add `@pandacss/parser-interface` with adapter types only | No dependency on `ts-morph`, `typescript`, or `@pandacss/core` internals |
| 1.2 | Move current `Project` behavior behind a `@pandacss/ts-morph` adapter | Existing parser tests pass unchanged |
| 1.3 | Keep `@pandacss/parser` as the compatibility facade | Public imports keep working |
| 1.4 | Replace `ts.resolveModuleName()` usage in config with `oxc-resolver` or a lightweight resolver | `@pandacss/config` no longer requires TypeScript for module resolution |
| 1.5 | Add adapter-level fixture tests | Same fixture output through facade and adapter |

Phase gate:

- Existing `ts-morph` behavior is unchanged.
- The engine can select a parser adapter from config.
- No AST nodes are exposed through the adapter interface.

### 2. Native Binding Skeleton (`OSS-2401`)

Goal: make the Rust/NAPI package build and publish before adding compiler logic.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 2.1 | Add root `Cargo.toml`, `rust-toolchain.toml`, `.cargo/config.toml`, `.clippy.toml`, and `deny.toml` | `cargo metadata --locked` works |
| 2.2 | Add porting rules section in `RUST_ENGINE_SPIKE.mdx` inspired by Bun | Defines crate map, banned dependencies, comment markers, unsafe policy |
| 2.3 | Add empty crates: `engine`, `extractor`, `encoder`, `emitter`, `optimizer`, `cache`, `config` | `cargo test --workspace --locked` passes |
| 2.4 | Add workspace-level lint/profile settings | All crates opt into workspace lints; release profile is intentional |
| 2.5 | Add `packages/binding` with NAPI cdylib and TS loader | `@pandacss/binding` imports in a Node test |
| 2.6 | Export no-op `compile()` returning empty CSS and diagnostics | Vitest can call the native function |
| 2.7 | Add CI lint/test jobs for Rust | `cargo fmt`, `cargo clippy`, `cargo test`, `cargo deny`, `cargo shear` pass |
| 2.8 | Add release workflow for platform packages | Manual workflow builds all target artifacts |
| 2.9 | Add WASI fallback package or documented fallback strategy | Fresh install does not crash on unsupported platforms |

Phase gate:

- `@pandacss/binding@alpha` can be installed on macOS, Linux, and Windows.
- CI is green on the native skeleton.
- No Panda behavior has changed yet.

### 3. Import Scanner Slice

Goal: prove Oxc parsing and NAPI serialization with the smallest useful compiler feature.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 3.1 | Add `extractor::scan_imports(source, path)` | Rust unit tests cover named, alias, namespace, and ignored imports |
| 3.2 | Keep Rust data structures close to current `ImportResult` shape | Reviewer can diff TS and Rust records directly |
| 3.3 | Expose `scanImports()` from `@pandacss/binding` | Node test calls Rust and receives JSON |
| 3.4 | Add compare test against `getImportDeclarations()` | Existing parser import fixtures match |
| 3.5 | Wire scanner behind internal compare flag only | Builds still use TS result |
| 3.6 | Add source range diagnostics for parse errors | Invalid source returns diagnostics, not a panic |

Phase gate:

- Import scanning matches current behavior for all import-map fixture cases.
- Oxc parse errors are surfaced as structured diagnostics.

### 4. Extractor MVP (`OSS-2402`)

Goal: add Rust extraction behind `experimental.engine: 'rust'`, with output equivalence tests.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 4.1 | Implement `css({})` extraction for literal object arguments | Rust fixture covers strings, numbers, booleans, null, arrays, nested objects |
| 4.2 | Add `TODO(port)` diagnostics for every unsupported expression kind | Compare report shows why fallback happened |
| 4.3 | Add TS adapter bridge from Rust `Extractions` to current `ParserResult` | Existing encoder receives equivalent style objects |
| 4.4 | Add `cva({})` and `sva({})` extraction | Recipe fixtures match TS output |
| 4.5 | Add pattern and recipe function extraction | Pattern and recipe parser fixtures match |
| 4.6 | Add `token()` and `token.var()` special cases | Token tests match raw value vs CSS var semantics |
| 4.7 | Add JSX style prop extraction | JSX fixtures match for direct props and boolean props |
| 4.8 | Add JSX spreads from inline object literals | Spread fixtures match for simple object literals |
| 4.9 | Add local `const` object resolution | Same-file constant fixtures match |
| 4.10 | Add simple conditionals: ternary and `&&` | Conditional fixtures match for extractable branches |
| 4.11 | Add SFC preprocessing in TS for Vue/Svelte/Astro before Rust extraction | Existing SFC fixtures match |
| 4.12 | Add whole-file fallback to `ts-morph` adapter for unsupported cases | Full suite passes with Rust-first fallback |
| 4.13 | Add `pnpm test:engine-equivalence` | CI compares TS and Rust extraction output |

Phase gate:

- `experimental.engine: 'rust'` works for the fixture corpus through fallback.
- Rust-only path handles the common happy path without fallback.
- Parser-only benchmark meets the Phase 2 Linear target: cold extract under 1s on medium app, warm single-file extract under 50ms, peak memory under 100MB.

### 5. Static Evaluator Expansion

Goal: shrink fallback usage until the Rust extractor is the normal path.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 5.1 | Add identifier scope table for same-file `const` declarations | No cross-file behavior yet |
| 5.2 | Add property access and element access on known objects/arrays | `colors.red[500]`-style fixtures match |
| 5.3 | Add template literal resolution with static interpolations | Template literal fixtures match |
| 5.4 | Add unary/binary expression evaluation for static operands | Numeric and string concatenation fixtures match |
| 5.5 | Add object and array spread evaluation for known values | Spread fixtures match without TS fallback |
| 5.6 | Add two-pass exported constant resolution for included source files | Cross-file constant fixtures match for explicit safe cases |
| 5.7 | Add unsupported-expression diagnostics | Fallback reason is visible in compare reports |

Phase gate:

- Most parser fixtures pass without TS fallback.
- Fallback rate is measured and low enough to enable opt-in user testing.

### 6. Encoder Port (`OSS-2403`)

Goal: port atomic rule encoding after extraction data is stable.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 6.1 | Finish or consume `OSS-2348` encoder/decoder decoupling | TS encoder has a pure input/output contract |
| 6.2 | Define `StyleUsage`, `SerializedConfig`, and `EncodedRule` structs | Serde round-trip tests pass |
| 6.3 | Port token resolution and utility expansion | Fixture style objects match TS normalized output |
| 6.4 | Port condition expansion | Responsive, pseudo, and theme conditions match |
| 6.5 | Port class-name/hash generation | Atomic class names are byte-identical to TS |
| 6.6 | Add encoder-level dedup | Duplicate rule fixtures produce one encoded rule |
| 6.7 | Expose `encode()` from binding | Node tests compare TS and Rust encoded rules |
| 6.8 | Add `pnpm test:encoder-equivalence` | CI compares hashes, selectors, properties, values, layers |

Phase gate:

- Atomic class names are stable.
- Encoder equivalence is green on the full fixture corpus.
- Encoder benchmark meets the Linear target: 10,000 style usages under 50ms.

### 7. Emitter and Optimizer (`OSS-2404`)

Goal: produce final CSS from Rust for the Rust engine path.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 7.1 | Finish or consume `OSS-2361` flat CSS generation work | Rust emitter only targets flat CSS |
| 7.2 | Finish or consume `OSS-2362` cascade-layer polyfill removal | Rust optimizer does not reimplement that polyfill |
| 7.3 | Implement `emitter` string builder | Encoded-rule fixtures emit deterministic CSS |
| 7.4 | Add layer grouping and ordering | Atomic rule snapshots match accepted order |
| 7.5 | Add media/supports grouping | Responsive fixtures match accepted order |
| 7.6 | Implement `optimizer` with `lightningcss` | Minify/prefix tests pass |
| 7.7 | Expose `emit()` and `optimize()` from binding | Node tests can run each phase independently |
| 7.8 | Add CSS divergence report | Every snapshot diff is classified as TS bug, accepted improvement, or blocker |

Phase gate:

- Rust engine can produce final CSS end-to-end while still opt-in.
- No unexplained CSS output diffs.
- Full pipeline benchmark target from Linear is met: cold build under 500ms, warm rebuild under 100ms, peak memory under 150MB on a medium app.

### 8. Cache and Design-System Buildinfo (`OSS-2355`, `OSS-2399`)

Goal: make the Rust engine compatible with first-class design-system support and monorepo workflows.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 8.1 | Define native-compatible buildinfo schema | Existing `StyleEncoder.toJSON()` can hydrate or migrate |
| 8.2 | Add content-hash file cache in `cache` | Unchanged files are skipped |
| 8.3 | Add rule cache keyed by serialized config and style usage | Repeated design-system rules dedupe safely |
| 8.4 | Ensure `designSystem` manifest buildinfo can seed Rust encoder/cache | App does not re-extract library styles |
| 8.5 | Add bare package `include` fixture using `panda.lib.json` | Manifest mode wins over re-extraction |
| 8.6 | Add monorepo benchmark with app plus local design-system package | Measures avoided extraction and CSS prepend behavior |

Phase gate:

- Rust cache model supports prebuilt design-system CSS and buildinfo hydration.
- Monorepo/design-system fixtures do not regress versus the TS path.

### 9. Default Flip (`OSS-2405`)

Goal: make Rust the default only after real downstream validation.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 9.1 | Promote `experimental.engine` to `engine` | Config defaults remain TS until final flip PR |
| 9.2 | Add `panda doctor` engine reporting | Users can see active engine and fallback reasons |
| 9.3 | Add migration guide `docs/migration/v2-rust-engine.md` | Documents opt-back, hook changes, CSS divergences |
| 9.4 | Add `ecosystem-ci/` targets | Pandabox, eslint-plugin-panda, sandboxes, and curated apps run with Rust |
| 9.5 | Add legacy parity CI job | Both engines are tested during dual-engine window |
| 9.6 | Flip default to Rust in a minor release | TS engine remains selectable for one minor cycle |

Phase gate:

- Ecosystem CI is green for two consecutive scheduled runs.
- No P0/P1 Rust-engine issues remain open.
- Users can opt back to the TS engine for one minor release.

### 10. Cleanup (`OSS-2406`)

Goal: remove the old engine in v3 after the dual-engine window.

| Step | Deliverable | Gate |
| --- | --- | --- |
| 10.1 | Audit external dependents of `@pandacss/parser` and adapter packages | Decide delete vs shim |
| 10.2 | Remove `packages/extractor` and `ts-morph` adapter | `pnpm why ts-morph` returns no package result |
| 10.3 | Remove TypeScript parser fallback code paths | Engine config no longer offers TS path |
| 10.4 | Remove PostCSS optimization plugins from `@pandacss/core` | `pnpm why postcss` only points to integration adapter |
| 10.5 | Keep `@pandacss/postcss` as an integration wrapper | It calls binding; it does not own optimization |
| 10.6 | Remove `packages/plugin-lightningcss` if redundant | Docs updated |
| 10.7 | Remove legacy parity CI job | `ci-result` aggregator updated |
| 10.8 | Update architecture docs and changelog | v3 breaking changes are explicit |

Phase gate:

- Full sandbox and ecosystem CI remain green after deletion.
- `cargo shear`, `cargo deny`, and package dependency audits are clean.

### First Week Plan

Start here. These are the smallest useful steps that do not require solving extraction semantics yet.

1. Create `RUST_ENGINE_SPIKE.mdx` with benchmark targets, fixture list, and type-checker audit template.
2. Add `bench/README.md` and a no-op benchmark command placeholder.
3. Add TS baseline benchmark for `ctx.parseFiles()` on `sandbox/vite-ts`.
4. Add parser/CSS snapshot fixture selection for the equivalence harness.
5. Audit `packages/parser/src` and `packages/extractor/src` for `ts-morph` and type-checker usage.
6. Confirm the external prototype scope and record whether it is extractor-only or full pipeline.
7. Draft the porting rules section in `RUST_ENGINE_SPIKE.mdx` before writing Rust compiler logic. Keep it short, but include crate boundaries, banned dependencies, comment markers, unsafe policy, and fixture requirements.

The first implementation PR should not add Rust. It should make the measurement harness and audit real, because every later decision depends on those gates.

### First Five PRs

These PRs are intentionally small and serial. They create the starting surface without committing us to the whole migration.

| PR | Scope | Files likely touched | Done when |
| --- | --- | --- | --- |
| 1 | Spike spec and audit template | `RUST_ENGINE_SPIKE.mdx` | The spec has benchmark targets, fixture list, and audit table |
| 2 | Baseline benchmark harness | `bench/`, root scripts if needed | `sandbox/vite-ts` baseline numbers can be produced locally |
| 3 | Equivalence fixture harness | `packages/parser/__tests__`, `packages/core/__tests__`, maybe `packages/fixture` | Current TS engine snapshots are reproducible |
| 4 | Type-checker dependency audit | `RUST_ENGINE_SPIKE.mdx` | Every `ts-morph`/checker dependency has a strategy |
| 5 | Rust porting guide draft | `RUST_ENGINE_SPIKE.mdx` | Contributors have rules before crate skeleton work starts |

After these, start `OSS-2401` with the Cargo workspace and `@pandacss/binding` skeleton.

## Compatibility Plan

Expose feature flags during migration:

```txt
experimental.engine = "ts-morph"  # current implementation
experimental.engine = "rust"      # rust first, fallback according to phase
PANDA_ENGINE_COMPARE=1            # run both, diff output, use TS result
```

Use `compare` mode in CI and local benchmarking. It should:

- Run TS and Rust extraction for the same file.
- Normalize ordering where current behavior does not require order.
- Diff result type, name, data, and source ranges.
- Report missing, extra, and changed extraction items.
- Use TS output for build continuation.

## Hook and Plugin Semantics

The current parser hook model is a public extension point:

- `parser:before` can replace source content and configure tag matching.
- `parser:preprocess` can transform JSX factory results.
- `parser:after` can inspect or mutate the result.

Rust extraction must sit after `parser:before` and framework transforms, and before `parser:after`.

Important constraints:

- Custom `matchTag` and `matchTagProp` are JS callbacks today. Do not call JS callbacks per AST node from Rust.
- Convert matching configuration into serializable allowlists/patterns when possible.
- If a hook installs dynamic matchers that cannot be serialized, fallback to TS extraction for that file.

Vue and Svelte should remain preprocessing steps initially:

- Existing plugins transform `.vue` and `.svelte` content into TSX-friendly syntax.
- Rust receives transformed TSX source.
- Native Vue/Svelte parsing is a separate future project.

## Cross-File Resolution Strategy

Current `ts-morph` extraction resolves some identifiers across declarations and imported files. Oxc gives us parsing speed but not a TypeScript type checker replacement by default.

Use a staged approach:

1. Same-file constants first.
2. Explicit import resolution for files inside the user's source graph.
3. Cache export maps per file.
4. Resolve imported `const` object literals only when the target file is inside include globs and has no side effects needed for evaluation.
5. Keep TS fallback for type-system-dependent extraction.

Do not try to recreate the TypeScript checker early. Panda extraction mostly needs syntax-level constant folding, not full type inference.

## Packaging Plan

Native package options:

- NAPI-RS package with prebuilt binaries for common Node platforms.
- Optional WASM package later for browser-hosted playgrounds or environments where native addons are not allowed.

Recommended package layout:

- `@pandacss/binding`: JS wrapper around the native `.node` file.
- `@pandacss/binding-${platform}`: optional platform-specific native packages generated by NAPI-RS.
- `@pandacss/parser`: consumes the adapter interface during the dual-engine phase, then becomes a shim or is removed in v3.

Operational requirements:

- Always provide a TS fallback for unsupported platforms during the migration.
- Native import failure should emit one debug-level message, not crash normal builds.
- Release automation must build all native targets before making Rust the default.

## Testing Strategy

Unit tests:

- Rust unit tests for parser traversal, import scanning, evaluator, and extraction cases.
- Existing Vitest parser tests continue to run against TS implementation.
- Add Vitest matrix for `experimental.engine = "ts-morph"`, `experimental.engine = "rust"`, and compare mode.

Snapshot tests:

- `ParserResult.toJSON()` snapshots.
- `StyleEncoder.toJSON()` snapshots.
- Generated CSS snapshots.
- Source range snapshots for diagnostics/reporting.

Integration tests:

- Existing sandboxes for React, Next, Vue, Svelte, Solid, Qwik, Astro, Remix, and Waku.
- Watch mode file add/change/delete behavior.
- Config hook behavior.

Performance tests:

- Cold parse all files.
- Warm single-file reparse.
- Memory peak.
- Native addon startup cost.
- Large file stress case.
- Many small files stress case.

## Risk Register

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Static evaluation drift | Small differences create missing CSS | Compare mode, fixture snapshots, whole-file TS fallback |
| Source range drift | Reporter/debug output may degrade | Normalize range contract and test ranges explicitly |
| JS callback hooks | Dynamic hooks cannot run inside Rust cheaply | Serialize simple hook config; fallback for dynamic matchers |
| Cross-file constants | Current `ts-morph` can resolve more than same-file syntax | Stage resolution and fallback for type/checker-dependent cases |
| Native packaging | Prebuild failures can block installs | TS fallback, platform matrix, optional native package |
| Duplicate extraction in fallback | Rust plus TS may emit duplicates | Start with whole-file fallback, then selective fallback only with stable range ownership |
| Oxc AST changes | Rust APIs may evolve | Hide Oxc behind `extractor` and internal structs |
| Build complexity | Rust and TS release systems differ | Keep `@pandacss/binding` opt-in until CI/release flow is boring |

## Recommended Implementation Order

1. Add baseline fixtures and benchmark command.
2. Add parser abstraction and `@pandacss/ts-morph` adapter.
3. Add `@pandacss/binding` native skeleton.
4. Implement Oxc import scanner and compare it with current import scanning.
5. Implement Rust extraction for `css({})` with local literals.
6. Expand to `cva`, `sva`, patterns, recipes, and token calls.
7. Add JSX style prop extraction.
8. Add same-file static evaluator.
9. Enable Rust-first with whole-file fallback.
10. Add compare mode to CI.
11. Port style encoder after extraction correctness is high.
12. Port CSS emission and optimization only after encoder output is stable.

## First Implementation Slice

The first Rust behavior slice should be intentionally small and should happen after the first five PRs listed above:

- Create `@pandacss/binding` if `OSS-2401` is complete.
- Add native `scanImports(filePath, source, options)` using Oxc in `extractor`.
- Add TS wrapper with fallback.
- Add tests that compare `scanImports` with `getImportDeclarations`.
- Add `PANDA_ENGINE_COMPARE=imports` temporarily.

This proves the NAPI, Oxc, test, and fallback path without touching evaluation.

## Definition of Done for the Migration

The migration can be considered complete when:

- Normal extraction no longer depends on `ts-morph`.
- Common static evaluation no longer depends on `ts-evaluator`.
- Rust is the default compiler path for supported platforms.
- TS fallback exists only for unsupported platforms or intentionally unsupported edge cases.
- Parser, generator, sandbox, and watch-mode tests pass under Rust default.
- Benchmarks show a clear improvement in cold parse, warm reparse, and memory usage.
- Public package APIs and generated output remain compatible with the current release line.
