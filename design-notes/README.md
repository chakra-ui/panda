# Rust Design Notes

Architectural decisions for the Panda v2 Rust pipeline (`crates/*` and `packages/compiler/crate`). Each doc captures
_why_ something is shaped the way it is, not how to use it — for usage, read the rustdoc.

These docs are point-in-time records. When you change the underlying design, update the doc in the same PR. Borrow
rolldown's [`meta/design/`](https://github.com/rolldown/rolldown/tree/main/meta/design) template (see
[`template.md`](./template.md)) for new entries.

## Index

### Architecture

- [Compiler lifecycle](./compiler-lifecycle.md) — end-to-end `createCompiler(config)` flow (construct → ingest →
  extract → encode → emit → output), build vs watch modes, and which phases are built vs deferred.
- [Crate layering](./crate-layering.md) — Tier 0/1/2/3 dependency model and what lives in each tier.
- [Extraction pipeline](./extraction-pipeline.md) — single-parse flow from source to `ExtractUsage`, parse-error
  contract, fast paths.
- [Project lifecycle](./project-lifecycle.md) — `Project` add / replace / remove semantics for watch mode.
- [Native stylesheet compiler](./stylesheet.md) — CSS emission, static CSS support, ordering, and minification boundary.
- [Scope and boundaries](./scope-and-boundaries.md) — what's deliberately _not_ in the Rust pipeline.
- [Output & host layer (Driver)](./output-and-host-layer.md) — the JS orchestration layer above the pure compiler:
  the `Driver` contract + shared `BaseDriver` (hosts ship in `@pandacss/compiler` node / `@pandacss/compiler-wasm`
  browser), CSS-vs-artifact cadence, sink routing, fs-engine `scan`, and the config-diff algorithm.

### Subsystems

- [Filesystem](./filesystem.md) — `pandacss_fs` trait, os/memory impls, glob via `fast-glob`, WASM compat.
- [Literal evaluator](./literal-evaluator.md) — what folds vs what doesn't (the ts-evaluator parity surface).
- [Cross-file resolution](./cross-file-resolution.md) — `CrossFileResolver`, cache shape, cycle guard.
- [Atomic encoding](./atomic-encoding.md) — encoder walker, condition matcher, recipe entry serialization.
- [Build info](./build-info.md) — `panda.buildinfo.json`: the portable encoder state a design system ships, its
  condensed format, per-module tree-shaking + import resolution, stacked DS-on-DS consume sketch, the version guard, and
  the engine/JS/CLI layering.
- [Virtual styled-system](./virtual-styled-system.md) — DS publishes canonical `styled-system/`; `designSystems` resolves
  manifest preset + dual importMap (DS + app overlay) + overlay codegen for app extensions that need JS/TS modules.
- [Container query theme API](./container-query-theme-api.md) — `theme.containers` as the shared scale for typed
  container conditions, `theme.containerNames` as named query scopes, native CSS props for container declaration, and
  compatibility-only treatment of legacy `containerSizes`/`cq` concepts.

### Boundary

- [Bindings](./bindings.md) — NAPI + WASM cdylibs, mirror types, `WasmFileSystem`/`Extractor` sessions, bundle size.
- [CLI v2 direction](./cli.md) — production CLI host goals for the Rust compiler: diagnostics, CI contracts,
  validation, watch behavior, observability, and staged command parity.
- [Config loading](./config-loading-design.md) — `@pandacss/config-loader`: bundle + serialize a user config into the
  `{ config, callbacks }` snapshot, pattern `codegenSource` capture, and the `@pandacss/compiler/loader` integration.

### Testing

- [Rust testing strategy](./rust-testing.md) — integration-test harness (`main.rs` + `autotests = false`), `insta`
  snapshots, consolidated vs autodiscovered crates, fast iteration commands.

### Performance & operations

- [Performance budget](./performance-budget.md) — `PERF(port)` markers, allocation choices, `FxHashMap` usage.
- [Instrumentation](./instrumentation.md) — `tracing` spans, native trace output, and release-only benchmark policy.
- [Publish namespace](./publish-namespace.md) — placeholder crate names + rename plan before publish.
- [Benchmarks](./bench/) — dated reports comparing implementations. Latest:
  [generated-types-js-vs-rust](./bench/2026-06-01-generated-types-js-vs-rust.mdx) (−99% type instantiations, −21 to −25% memory vs legacy).

## Migration plan vs design notes

These notes describe the _current_ architecture. The Rust/Oxc migration plan and phase-by-phase porting rules live
separately:

- `RUST_OXC_MIGRATION.md` — master plan, phase breakdown, hook semantics.
- `RUST_ENGINE_SPIKE.mdx` — OSS-2400 spike spec, comment markers, unsafe policy.

When a decision in those plans gets implemented, capture the durable form here and link back.
