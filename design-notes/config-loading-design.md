---
title: Config Loading Design
status: current
scope:
  - packages/config
  - crates/pandacss_codegen
  - crates/pandacss_config
---

# Config Loading Design

## Goal

The new Rust codegen still needs a JavaScript-side config loader. User configs are JavaScript or TypeScript modules, and
they can contain functions for patterns, hooks, presets, plugins, and other dynamic extension points. Rust should consume
a serialized input; it should not become responsible for executing arbitrary user config modules.

This is implemented by a **new, self-contained package `@pandacss/config`**. It owns the whole load → serialize
pipeline itself and keeps its dependency surface deliberately small: `@pandacss/types` (config types),
`@pandacss/compiler-shared` (the `SerializedConfig`/`ProjectCallbacks` contract), `rolldown` (bundling), and
`javascript-stringify` (pattern source capture). It does **not** depend on `@pandacss/shared` or wrap the v1
`@pandacss/config`, which stays as legacy/reference code. Config discovery walks up the tree itself rather than pulling
in `escalade`, loader-specific errors stay local (`src/error.ts`), and preset merging uses a narrow local implementation
for config sections instead of the legacy generic merge helpers.

The modules: `find.ts` (walk-up discovery), `bundle.ts` (Rolldown + `data:`-URL eval + dependency collection),
`preset.ts` (authored preset recursion + `extend` merging), `sources.ts` (optional resolved-config source metadata),
`serialize.ts` (`createConfigSnapshot` — function lowering + pattern source capture), `load.ts` (the
`loadPandaConfig` entry that wires them together), plus `error.ts`/`types.ts`.

### Scope (for now)

Authored preset resolution is in scope: the loader resolves only presets explicitly listed in `config.presets`, supports
object/async/string-module presets, recursively resolves nested presets, and folds `extend` into the resolved config
before Rust sees it.

Automatic default preset behavior is deferred. The loader does **not** auto-add `@pandacss/preset-base` or
`@pandacss/preset-panda`, and it does not special-case bundled names like `@pandacss/dev/presets`. Plugin and config
hook resolution (`preset:resolved`, `config:resolved`) are also deferred. Validation remains deferred — the Rust
compiler surfaces config diagnostics.

Current flow:

```txt
bundle user config
  -> resolve authored presets + fold extend
  -> apply config defaults
  -> serialize callbacks + pattern codegen source
  -> Rust compiler snapshot
```

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
requires it. Vite writes temp files because it supports a broader set of config modes and debuggability tradeoffs;
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
  metadata?: {
    sources?: ConfigSources
  }
}
```

The important split is:

- `config` is the JSON-safe `SerializedConfig` (the same contract defined in `@pandacss/compiler-shared`). Functions are
  lowered to `{ kind: 'js-callback', id }` refs and `RegExp` to `{ kind: 'regex', ... }` so the whole config crosses the
  Rust/wasm boundary as plain data.
- `callbacks` holds the live `utility.transform` / `utility.values` / `pattern.transform` / `pattern.defaultValues`
  functions, keyed by the ref `id`, so the compiler can invoke them during extraction.
- `dependencies` is the module list used by watch mode.
- `metadata.sources` is optional and only present when requested with `trackSources: true`; it is for JS-side tooling and
  is not part of the Rust compiler snapshot.

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

## Preset Resolution

Preset resolution lives at the `@pandacss/config` boundary, before defaults and before
`createConfigSnapshot()`. The Rust compiler receives a resolved serialized config; it does not resolve JavaScript preset
modules or execute preset functions.

The loader resolves only presets explicitly authored in `config.presets`:

- object presets,
- async object presets,
- string preset modules bundled with Rolldown relative to the current `cwd`,
- recursively nested `presets`.

Automatic default preset behavior is still deferred. The loader does not inject `@pandacss/preset-base` or
`@pandacss/preset-panda`, does not special-case bundled names like `@pandacss/dev/presets`, and does not run preset or
config hooks.

Resolution is depth-first. Nested presets are merged before the preset that contains them, sibling presets preserve
author order, and the user config is merged last. That gives this precedence:

```txt
nested preset base/extend
  -> parent preset base/extend
  -> later sibling preset base/extend
  -> user config base/extend
```

`extend` is folded only for the config sections that support it:

```txt
conditions
theme
patterns
utilities
globalCss
globalVars
globalFontface
globalPositionTry
staticCss
themes
```

Base section entries establish or replace values. `extend` section entries merge into the accumulated section. Arrays in
base entries replace prior arrays; arrays in `extend` entries concatenate. Top-level runtime-only fields
(`presets`, `plugins`, `hooks`, `name`, and unexpected top-level `extend`) are stripped from the resolved config.

String preset dependencies are folded into `LoadedPandaConfig.dependencies` alongside root config bundle dependencies
and explicit resolved `config.dependencies`. Dependency entries are deduped after resolution.

`createConfigSnapshot(config)` remains a pure serializer. It assumes the caller already supplied a resolved config,
strips runtime-only top-level keys, lowers supported functions to callback refs, serializes `RegExp`, and preserves
pattern `codegenSource`.

## Sources Metadata

Source tracking is an optional JS-side debugging/tooling feature. It answers "which authored config or preset
contributed this resolved config path?" without mutating user-authored metadata such as token `extensions`.

It is opt-in:

```ts
const loaded = await loadPandaConfig({ cwd, trackSources: true })
```

When omitted or `false`, the loader uses the normal merge path and does not allocate source entries or path metadata.
When enabled, the result may include:

```ts
interface ConfigSourceEntry {
  kind: 'config' | 'preset'
  name?: string
  specifier?: string
  file?: string
}

interface ConfigSources {
  entries: ConfigSourceEntry[]
  paths: Record<string, number | number[]>
}
```

`entries` stores each source once in resolved merge order. `paths` maps final resolved config paths to integer source
IDs. A `number[]` means multiple sources contributed to a path, usually because objects merged or `extend` concatenated
arrays.

Example:

```ts
{
  entries: [
    { kind: 'preset', name: 'base', specifier: './preset.ts', file: 'preset.ts' },
    { kind: 'config', file: 'panda.config.ts' },
  ],
  paths: {
    'conditions.hover': 0,
    'theme.tokens.colors.brand': [0, 1],
    'theme.tokens.colors.brand.value': 1,
    'staticCss.recipes.badge': [0, 1],
  },
}
```

The paths are resolved paths, not authored `extend` paths. For example,
`theme.extend.tokens.colors.brand.value` records as `theme.tokens.colors.brand.value`.

The tracking policy is deliberately compact. It records useful named boundaries and fields such as conditions,
utilities, patterns, token paths, recipes, slot recipes, global entries, themes, and static CSS groups. It does not record
every scalar in the config. Token normalization also moves source entries when flat token metadata is folded into
`DEFAULT`, so a flat token value that becomes `theme.tokens.colors.black.DEFAULT.value` keeps the original source ID.

`sources` is not passed to Rust by default and is not part of `SerializedConfig`. The Rust compiler does not need it to
produce CSS. If future diagnostics or Studio views need to explain config ownership, JS can use `metadata.sources` to
decorate those results after compilation.

## Dependency Tracking

Dependency tracking should be conservative and cheap:

- include the entry config path,
- include every absolute module id reported by Rolldown chunks,
- include dependencies reported by every bundled string preset module,
- **canonicalize through symlinks (`realpathSync`) before computing the path relative to `cwd`**, then dedupe — Rolldown
  reports module ids by realpath, so a symlinked `cwd` (e.g. macOS `/tmp` → `/private/tmp`) would otherwise list the
  entry config twice, once as a messy `../../…` path and once relative,
- preserve the explicit resolved `config.dependencies` escape hatch as an additional dependency source.

This gives watch mode two layers of invalidation:

1. If a config dependency file changes, reload and resolve the config.
2. Once the resolved config changes, compute the affected `ConfigDependency` bits and regenerate only the impacted
   artifacts.

`loadPandaConfig` also injects `config.cwd ??= options.cwd` so the Rust engine's `scan`/`glob` (which default their
`GlobOptions` from `config.cwd`/`include`/`exclude`) resolve against the project root.

The second layer is `diffConfig(prev, next)`, exported from this package — a structural `microdiff` over two
`SerializedConfig`s that maps each change to the coarse `CodegenDependency` bits the engine regenerates by (plus the
specific recipe/pattern names that changed). Because the diff runs on the serialized config, a `utilities.*.transform`
*body* edit is invisible (the lowered `{ kind:'js-callback', id }` ref is unchanged); pattern transform bodies escape
this via their `codegenSource` string. Precise callback-change detection (hashing lowered sources) is deferred. The diff
feeds the host orchestrator — see [output-and-host-layer](./output-and-host-layer.md).

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
`dependencies`. The main `@pandacss/compiler` entry never imports `@pandacss/config`, so consumers that only need
`createCompiler`/`compile` don't pull in Rolldown.
