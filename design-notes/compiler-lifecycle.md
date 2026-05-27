# Compiler Lifecycle

## Summary

`createCompiler(config)` is the single public entry to the engine on both bindings (`@pandacss/compiler` native,
`@pandacss/compiler-wasm` browser). It returns a **long-lived, stateful compiler**, not a one-shot function.

Source files flow _in_ through `parseFile`, accumulate as a deduplicated atom/recipe registry, and `compile()` _drains_
that registry to CSS.

This note traces the end-to-end flow and marks which phases exist today versus which are still stubs. It's the
bird's-eye complement to [project-lifecycle](./project-lifecycle.md) (the registry mechanics) and
[extraction-pipeline](./extraction-pipeline.md) (the per-file parse flow).

The session shape is deliberate. The expensive work — compiling config into matchers, utilities, conditions, token
dictionary, recipes — happens once at construction (`System`), so callers pay it once and reuse the instance across many
files and rebuilds.

A free `compile(files, config)` would re-pay that per call, and the browser binding can't host a synchronous FS-less
function anyway. One configured instance, many files, is the only shape coherent across the native (sync) and wasm
(async + explicit `WasmFileSystem`) runtimes.

## Phases

Source flows through six phases. Phases 0–4 and the output shape are built on the native path; optimization and
incremental stylesheet patching are still deferred. Each heading reads as **phase — state · crate(s)**.

### 0 · Construction — ✅ built · `pandacss_config` + `pandacss_project`

`config → System::new` compiles the immutable runtime (matchers, utilities, conditions, tokens, recipes); `Project`
wraps it with the mutable per-file state.

### 1 · Ingestion — ⚠️ single-file only · host + `pandacss_fs`

Discover source files (glob `include` / `exclude`), read them, feed each through `parseFile`.

### 2 · Extraction — ✅ built · `pandacss_extractor`

Oxc parse → scan imports → match the import map → extract `css` / `cva` / `sva` / JSX → fold literals and cross-file
references.

### 3 · Encoding — ✅ built · `pandacss_encoder` + `pandacss_project`

Style usage → atoms `(prop, value, conditions)`; recipes decomposed; JS transform callbacks fire. Maintained as an
incremental, refcounted union.

### 4 · Emission — ✅ built · `pandacss_stylesheet`

Atoms + recipes → CSS rules: conditions → selectors / media queries, class names, cascade layers, and the supported
native static CSS subset. The crate emits formatted CSS or writer-minified CSS directly; it does not parse CSS.

Covered static CSS today: `staticCss.css`, `staticCss.recipes`, global `recipes: "*"`, recipe-level `recipe.staticCss`,
slot recipes, compound variant CSS, and responsive/configured condition expansion. Token `:root`, reset, base/global,
keyframes, `staticCss.patterns`, and `staticCss.themes` remain outside this native emission path.

### 5 · Optimization — ❌ unbuilt

No native CSS optimizer runs today. `StylesheetOptions::minify` controls only writer formatting; there is deliberately no
raw whitespace post-process because that corrupts valid CSS. If optimization lands, it should be CSS-aware
(`lightningcss` or an equivalent parser-backed pass).

### 6 · Output — ✅ built · `compiler_napi` + `pandacss_stylesheet`

`compile()` returns `{ css, sourceMap, manifest, diagnostics }`.

> CSS output = **static** (config-derived: tokens, reset, base, global) **+ dynamic** (extraction-derived: atoms,
> recipes). Emission merges both, so it is _not_ a pure function of the extraction registry.

## Two driving modes

The public API surface _is_ the lifecycle surface — the watch methods aren't incidental:

- **Build (one-shot):** `createCompiler(config)` → glob + `parseFile` each → `compile()` → write. Stateless from the
  caller's view, stateful underneath.
- **Dev / watch:** `createCompiler` once → initial `parseFile` sweep → on FS event, `refreshFile` (re-parse only known
  paths) / `removeFile` → `compile()` re-emits. The refcounted atom union (see
  [project-lifecycle](./project-lifecycle.md)) makes each update O(changed file's atoms), and the manifest tells the
  host whether the CSS actually changed (HMR no-op vs reload).

`extract(source, path)` sits outside both modes: a stateless peek returning raw calls/jsx for tooling/linting/parity,
registering nothing.

## JS ↔ Rust boundary

- **JS host owns:** config loading/resolution, `styled-system/*` **codegen** (the API user code imports — the compiler
  _consumes references_ to it, never generates it), file watching + glob orchestration, the PostCSS plugin shell, and
  the transform **callbacks** (arbitrary user functions can't live in Rust).
- **Rust owns:** parse → extract → encode → emit, plus the project atom/recipe registry. Optimization and persistent
  caches are not built yet.
- **Contract across it:** a resolved config snapshot + callback refs in; `{ css, sourceMap, manifest, diagnostics }`
  out. Diagnostics flow back at every phase (parse errors already do — see the parse-error contract in
  [extraction-pipeline](./extraction-pipeline.md)).

## The manifest

`compile()`'s `manifest` (`hashes`, `tokens`) is load-bearing, not decoration: it's the cache key + change-detection
signal. The host diffs hashes to decide whether to push CSS (HMR) or skip; a `cacheDir` lets a cold build skip
re-extraction of unchanged files. It's the seam where phase 6 meets the (future) `pandacss_cache` crate.

## Guardrails

- **`compile()` must drain instance state.** `compiler.compile()` emits from exactly the `atoms()`/`recipes()` the
  instance accumulated; otherwise "compile" and "parseFile + atoms" drift into two different notions of project state.
  Keep that invariant.
- **Batch ingestion + parallelism.** Phase 1 is single-file. A `parseFiles(iter)` seam (with `rayon`) is the natural
  place for per-file parallelism without disturbing the single-file API (noted in
  [project-lifecycle](./project-lifecycle.md)).
- **Static CSS ownership.** `pandacss_stylesheet` owns utility and recipe static CSS. Reset/base/global/token-`:root`/
  keyframes and theme token artifacts are still config-derived outputs owned outside this native stylesheet pass.
- **Incremental CSS emission.** `Project` updates its atom registry incrementally, but `compile()` still sorts and emits
  from the whole project-wide atom set. A cached per-file/per-bucket emitter is a separate design, not a hidden behavior
  of the current crate.
- **Sourcemaps.** `CompileOutput.sourceMap` is in the contract but unspecified; mapping emitted rules back to source
  spans needs the spans extraction already carries to survive encoding.

## Related

- [project-lifecycle](./project-lifecycle.md) — the registry add/replace/remove mechanics behind phases 1–3.
- [extraction-pipeline](./extraction-pipeline.md) — the per-file parse → `ExtractUsage` flow (phase 2).
- [atomic-encoding](./atomic-encoding.md) — usage → atoms + recipe decomposition (phase 3).
- [stylesheet](./stylesheet.md) — native CSS emission and current non-optimizer boundary (phase 4/5).
- [crate-layering](./crate-layering.md) — where each phase's crate sits in the tier model.
- [bindings](./bindings.md) — how `createCompiler` is exposed across NAPI + wasm.
- [scope-and-boundaries](./scope-and-boundaries.md) — what's deliberately _not_ in the Rust pipeline.
