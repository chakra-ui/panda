---
title: Config Loading Design
status: current
scope:
  - packages/config-loader
  - crates/pandacss_codegen
  - crates/pandacss_config
---

# Config Loading Design

## Goal

The new Rust codegen still needs a JavaScript-side config loader. User configs are JavaScript or TypeScript modules, and
they can contain functions for patterns, hooks, presets, plugins, and other dynamic extension points. Rust should consume
a serialized input; it should not become responsible for executing arbitrary user config modules.

This is implemented by a **new, self-contained package `@pandacss/config-loader`**. It owns the whole load → serialize
pipeline itself and keeps its dependency surface deliberately small: `@pandacss/types` (config types),
`@pandacss/compiler-shared` (the `SerializedConfig`/`ProjectCallbacks` contract), `rolldown` (bundling), and
`javascript-stringify` (pattern source capture). Neutral helpers it used to borrow from `@pandacss/shared` — `PandaError`
and `compact` — are **inlined** (`src/error.ts`, a local `compact`), and config discovery walks up the tree itself rather
than pulling in `escalade`. It does **not** depend on or wrap the v1 `@pandacss/config`, which stays as
legacy/reference code.

The modules: `find.ts` (walk-up discovery), `bundle.ts` (Rolldown + `data:`-URL eval + dependency collection),
`serialize.ts` (`createConfigSnapshot` — function lowering + pattern source capture), `load-panda-config.ts` (the
`loadPandaConfig` entry that wires them together), plus `error.ts`/`types.ts`.

### Scope (for now)

Preset, plugin, and hook resolution are **intentionally out of scope** in this first cut. The loader bundles and
serializes the user's own config as-authored; presets/hooks will be layered back in once the compiler boundary for them
is settled. Validation is also deferred — the Rust compiler surfaces config diagnostics.

## Legacy Behavior

The legacy loader used `bundle-n-require`:

```ts
const { mod, dependencies } = await bundleNRequire(filepath, {
  cwd,
  interopDefault: true,
})
```

That package bundled the config with esbuild using `write: false`, read the bundled code from memory, temporarily patched
`require.extensions`, and executed the in-memory bundle with CommonJS `module._compile`. No config bundle was written to
disk in the normal path.

The important behavior to preserve is:

- bundle the config in memory,
- evaluate the bundle in memory,
- return the loaded config object,
- return the config dependency list for watch mode.

## Rolldown Loader

The new loader should use Rolldown as the only bundler. The current package already follows the right direction by
generating ESM with Rolldown and loading it through a `data:` URL:

```ts
const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
return import(dataUrl)
```

This should remain the default. We should avoid Vite's temp-file ESM fallback unless we hit a runtime constraint that
requires it. Vite writes temp files because it supports a broader set of config-loader modes and debuggability tradeoffs;
Panda can stay narrower and cheaper if in-memory loading is reliable for our config surface.

The compatibility target is the behavior, not the dependency: in-memory bundle, in-memory execution, and dependency
reporting. The new package should not re-add `bundle-n-require`.

## Result Shape

The proposed package shape is:

```ts
export async function loadPandaConfig(options: LoadConfigOptions): Promise<LoadedPandaConfig>
```

where the result is a **compiler snapshot** that feeds `createCompilerFromSnapshot({ config, callbacks }, options)`
directly:

```ts
interface LoadedPandaConfig {
  path: string
  config: SerializedConfig // JSON-safe; functions lowered to { kind: 'js-callback', id }
  callbacks: ProjectCallbacks // the live utility/pattern functions, keyed by ref id
  dependencies: string[]
}
```

The important split is:

- `config` is the JSON-safe `SerializedConfig` (the same contract defined in `@pandacss/compiler-shared`). Functions are
  lowered to `{ kind: 'js-callback', id }` refs and `RegExp` to `{ kind: 'regex', ... }` so the whole config crosses the
  Rust/wasm boundary as plain data.
- `callbacks` holds the live `utility.transform` / `utility.values` / `pattern.transform` / `pattern.defaultValues`
  functions, keyed by the ref `id`, so the compiler can invoke them during extraction.
- `dependencies` is the module list used by watch mode.

An earlier draft proposed a `codegen: CodegenInput` field, with JS building the codegen payload. That is **not** the
boundary: Rust's `from_config` deserializes `SerializedConfig` into `UserConfig` and computes `TypeData` / the full
`CodegenInput` itself. JS only ships the snapshot; the one source string Rust cannot reconstruct (a pattern's
`transform`) is carried as pattern metadata, below.

## Pattern Codegen Metadata

A pattern's `transform` is lowered to a callback ref for extraction, but codegen also needs its **source** to embed in
the generated pattern module — and Rust cannot stringify a JavaScript function. So during serialization, before the
function is replaced by its ref, the loader captures the source:

```ts
const codegenSource = stringify(compact({
  transform: pattern.transform,
  defaultValues: pattern.defaultValues,
}))
```

`stringify` here is the **`javascript-stringify`** package — the same serializer the legacy generator used. It emits
**valid JS object-literal source** (functions as their own `.toString()` form, method shorthand or arrow, not quoted
strings — unlike `stringifyJson`), so esbuild/Rolldown-emitted transforms, including helper polyfills (`__spreadValues`,
`__objRest`), round-trip faithfully. The result is attached as `config.patterns[name].codegenSource` in the
`SerializedConfig`, and the flow through Rust is:

1. `crates/pandacss_config` — `PatternConfig.codegen_source: Option<String>` (`#[serde(rename = "codegenSource")]`)
   deserializes the field.
2. `crates/pandacss_project::codegen_input()` — `pattern_codegen_meta()` maps each pattern's `codegen_source` into
   `PatternCodegenMeta { config_source }`.
3. `crates/pandacss_codegen` — `patterns.rs::pattern_config_source()` embeds a non-empty `config_source` verbatim;
   patterns without one fall back to the identity transform `(s) => s` (`fallback_pattern_config_source`).

So a pattern authored with a real `transform` emits that transform in the generated `patterns/<name>` module instead of
the identity fallback.

## Dependency Tracking

Dependency tracking should be conservative and cheap:

- include the entry config path,
- include every absolute module id reported by Rolldown chunks,
- **canonicalize through symlinks (`realpathSync`) before computing the path relative to `cwd`**, then dedupe — Rolldown
  reports module ids by realpath, so a symlinked `cwd` (e.g. macOS `/tmp` → `/private/tmp`) would otherwise list the
  entry config twice, once as a messy `../../…` path and once relative,
- preserve the explicit `config.dependencies` escape hatch as an additional dependency source.

This gives watch mode two layers of invalidation:

1. If a config dependency file changes, reload and resolve the config.
2. Once the resolved config changes, compute the affected `ConfigDependency` bits and regenerate only the impacted
   artifacts.

## Compiler Integration

`loadPandaConfig` is Node-only (it bundles with Rolldown and dynamically imports a `data:` URL). To keep
`@pandacss/compiler`'s core entry dependency-light and wasm-adjacent, the loader→compiler wiring lives on a **separate
subpath**, `@pandacss/compiler/loader`:

```ts
import { loadCompiler } from '@pandacss/compiler/loader'

const { compiler, path, dependencies } = await loadCompiler({ cwd })
```

`loadCompiler` calls `loadPandaConfig`, then feeds the snapshot to `createCompilerFromSnapshot({ config, callbacks })`
(live `transform` callbacks included) and returns the built compiler alongside the config `path` and watch
`dependencies`. The main `@pandacss/compiler` entry never imports `@pandacss/config-loader`, so consumers that only need
`createCompiler`/`compile` don't pull in Rolldown.
