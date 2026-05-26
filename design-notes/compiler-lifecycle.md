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

Source flows through six phases. Phases 0–3 are the shipped path; 4–6 are not built yet — which is why `compile()`
returns an empty stylesheet today. Each heading reads as **phase — state · crate(s)**.

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

### 4 · Emission — ❌ unbuilt · `pandacss_emitter`

Atoms + recipes → CSS rules: conditions → selectors / media queries, class-name hashing, `@layer` assignment, plus the
static config CSS (token `:root` vars, reset, base, global, keyframes).

### 5 · Optimization — ❌ unbuilt · `pandacss_optimizer`

Dedupe, merge, sort by layer, minify (lightningcss, or the postcss path for output parity).

### 6 · Output — ❌ stub · `pandacss_engine`

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
- **Rust owns:** parse → extract → encode → emit → optimize, plus the incremental caches.
- **Contract across it:** a resolved config snapshot + callback refs in; `{ css, sourceMap, manifest, diagnostics }`
  out. Diagnostics flow back at every phase (parse errors already do — see the parse-error contract in
  [extraction-pipeline](./extraction-pipeline.md)).

## The manifest

`compile()`'s `manifest` (`hashes`, `tokens`) is load-bearing, not decoration: it's the cache key + change-detection
signal. The host diffs hashes to decide whether to push CSS (HMR) or skip; a `cacheDir` lets a cold build skip
re-extraction of unchanged files. It's the seam where phase 6 meets the (future) `pandacss_cache` crate.

## Unresolved Questions

- **`compile()` must drain instance state.** Today's stub calls a free native placeholder that ignores the registry.
  When emission lands, `compiler.compile()` must emit from exactly the `atoms()`/`recipes()` the instance accumulated —
  otherwise "compile" and "parseFile + atoms" drift into two different notions of project state. Keep that invariant.
- **Batch ingestion + parallelism.** Phase 1 is single-file. A `parseFiles(iter)` seam (with `rayon`) is the natural
  place for per-file parallelism without disturbing the single-file API (noted in
  [project-lifecycle](./project-lifecycle.md)).
- **Static CSS ownership.** Reset/base/global/token-`:root`/keyframes are config-derived, not extracted. Decide whether
  the emitter pulls them from `System` directly or whether the host composes them — affects layer ordering and the
  manifest's token list.
- **Sourcemaps.** `CompileOutput.sourceMap` is in the contract but unspecified; mapping emitted rules back to source
  spans needs the spans extraction already carries to survive encoding.

## Related

- [project-lifecycle](./project-lifecycle.md) — the registry add/replace/remove mechanics behind phases 1–3.
- [extraction-pipeline](./extraction-pipeline.md) — the per-file parse → `ExtractUsage` flow (phase 2).
- [atomic-encoding](./atomic-encoding.md) — usage → atoms + recipe decomposition (phase 3).
- [crate-layering](./crate-layering.md) — where each phase's crate sits in the tier model.
- [bindings](./bindings.md) — how `createCompiler` is exposed across NAPI + wasm.
- [scope-and-boundaries](./scope-and-boundaries.md) — what's deliberately _not_ in the Rust pipeline.
