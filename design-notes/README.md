# Rust Design Notes

Architectural decisions for the Panda v2 Rust pipeline (`crates/*` and `packages/compiler/crate`). Each doc captures
_why_ something is shaped the way it is, not how to use it — for usage, read the rustdoc.

These docs are point-in-time records. When you change the underlying design, update the doc in the same PR. Borrow
rolldown's [`meta/design/`](https://github.com/rolldown/rolldown/tree/main/meta/design) template (see
[`template.md`](./template.md)) for new entries.

## Index

### Architecture

- [Compiler lifecycle](./compiler-lifecycle.md) — end-to-end `createCompiler(config)` flow (construct → ingest → extract
  → encode → emit → output), build vs watch modes, and which phases are built vs deferred.
- [Crate layering](./crate-layering.md) — Tier 0/1/2/3 dependency model and what lives in each tier.
- [Extraction pipeline](./extraction-pipeline.md) — single-parse flow from source to `ExtractUsage`, parse-error
  contract, fast paths.
- [Project lifecycle](./project-lifecycle.md) — `Project` add / replace / remove semantics for watch mode.
- [Native stylesheet compiler](./stylesheet.md) — CSS emission, static CSS support, ordering, and minification boundary.
- [Scope and boundaries](./scope-and-boundaries.md) — what's deliberately _not_ in the Rust pipeline.
- [Output & host layer (Driver)](./output-and-host-layer.md) — the JS orchestration layer above the pure compiler: the
  `Driver` contract + shared `BaseDriver` (hosts ship in `@pandacss/compiler` node / `@pandacss/compiler-wasm` browser),
  CSS-vs-artifact cadence, sink routing, fs-engine `scan`, and the config-diff algorithm.
- [Hooks](./hooks.md) — v2 plugin hook model: public `plugins` are named hook bundles over one ordered hook registry.
  Covers the boundary-cost hook taxonomy (config/output hooks are host-only and free; `parser:before` needs
  Rust-evaluated filters), Rolldown-style `{ filter, handler }` object hooks, native SFC adapters, the span/sourcemap
  contract, and migration from v1 root `hooks`.

### Subsystems

- [Filesystem](./filesystem.md) — `pandacss_fs` trait, os/memory impls, glob via `fast-glob`, WASM compat.
- [Literal evaluator](./literal-evaluator.md) — what folds vs what doesn't (the ts-evaluator parity surface).
- [Cross-file resolution](./cross-file-resolution.md) — `CrossFileResolver`, cache shape, cycle guard.
- [JSX tag matching](./jsx-tag-matching.md) — `jsxMatchTag`: declarative successor to v1 `matchTag`/`matchTagProp`;
  match/ignore JSX tags by name, pattern, or import source, plus per-rule prop control. Why it's data, not a callback.
- [Recipe variant dynamic diagnostics](./recipe-variant-diagnostics.md) — `recipe_variant_dynamic`: warn when config
  recipe variant props are dynamic at call/JSX sites (JIT emits defaults only); JSX tag → recipe key and prop →
  `variant_props` matching rules.
- [Atomic encoding](./atomic-encoding.md) — encoder walker, condition matcher, recipe entry serialization.
- [Compound variant cascade](./compound-variant-cascade.md) — give compounds their own `recipes.compound_variants`
  sub-layer (below `utilities`) so `css()` can override them; how the named compound class carries into the codegen
  recipe runtime, and the config-recipe vs `cva` fork.
- [Build info](./build-info.md) — `panda.buildinfo.json`: the portable encoder state a design system ships, its
  condensed format, per-module tree-shaking + import resolution, stacked DS-on-DS consume sketch, the version guard, and
  the engine/JS/CLI layering.
- [Design-system manifest](./design-system-manifest.md) — `designSystem: '@acme/ds'`: the `panda.lib.json` manifest,
  gen + load as fs-free compiler methods (`compiler.designSystem.*`), the parent-chain walk for nested design systems,
  module/type resolution, setup diagnostics, and the incremental PR breakdown.
- [Virtual styled-system](./virtual-styled-system.md) — DS publishes canonical `styled-system/`; `designSystems`
  resolves manifest preset + dual importMap (DS + app overlay) + overlay codegen for app extensions that need JS/TS
  modules.
- [Chakra UI design-system migration](./chakra-ui-design-system-migration.md) — Chakra-specific plan for replacing
  Emotion with a Panda v2 design-system package using a real Chakra-owned styled-system package, one app-composed
  `styled-system`, build info, component extraction metadata, framework aliases, and TypeScript path resolution.
- [Container query theme API](./container-query-theme-api.md) — `theme.containers` as the shared scale for typed
  container conditions, `theme.containerNames` as named query scopes, native CSS props for container declaration, and
  migration guidance for legacy `containerSizes`/`cq` concepts.
- [Token reference syntax](./token-reference-syntax.md) — `tokenSyntax: '$'`: Stitches-style `$` token syntax in style
  values, replacing the v1 `tokens:created` rename hook. Includes the v1 → v2 migration guide.

### Boundary

- [Bindings](./bindings.md) — NAPI + WASM cdylibs, mirror types, `WasmFileSystem`/`Extractor` sessions, bundle size.
- [CLI v2 direction](./cli.md) — production CLI host goals for the Rust compiler: lifecycle commands, schema-backed
  flags, diagnostics, CI contracts, watch behavior, debug artifacts, and observability.
- [CLI analyze command](./cli-analyze.md) — proposed `panda analyze` usage-report command: naming, scopes, JSON/report
  outputs, UI mode, and the `inspectFileSource` aggregation boundary.
- [Config loading](./config-loading-design.md) — `@pandacss/config`: bundle + serialize a user config into the
  `{ config, callbacks }` snapshot, pattern `codegenSource` capture, and the `@pandacss/compiler/loader` integration.
- [Panda lint plugins](./lint-plugins.md) — ESLint and Oxlint plugins backed by shared internal utilities,
  compiler-backed source inspection, and `inspectFileSource`.
- [Config authoring language service](./config-authoring-language-service.md) — preset-aware editor intelligence for
  `panda.config.*` without ambient generated types.
- [Language service implementation](./language-service-implementation.md) — `compiler/tooling` subpath,
  `@pandacss/language-server`, VS Code extension, phased rollout, migration from `panda-vscode`.

### Testing

- [Rust testing strategy](./rust-testing.md) — integration-test harness (`main.rs` + `autotests = false`), `insta`
  snapshots, consolidated vs autodiscovered crates, fast iteration commands.

### Performance & operations

- [Performance budget](./performance-budget.md) — `PERF(port)` markers, allocation choices, `FxHashMap` usage.
- [Instrumentation](./instrumentation.md) — `tracing` spans, native trace output, and release-only benchmark policy.
- [Publish namespace](./publish-namespace.md) — placeholder crate names + rename plan before publish.
- [Benchmarks](./bench/) — dated reports comparing implementations. Latest:
  [generated-types-js-vs-rust](./bench/2026-06-01-generated-types-js-vs-rust.mdx) (−99% type instantiations, −21 to −25%
  memory vs legacy).

## Migration plan vs design notes

These notes describe the _current_ architecture. The earlier Rust/Oxc migration and spike planning docs were folded into
the relevant design notes or left in git history. When a decision is implemented, capture the durable form here and link
back to the specific note.
