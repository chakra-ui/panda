---
title: Output & Host Layer (Driver)
status: current
scope:
  - packages/compiler
  - packages/compiler-wasm
  - packages/compiler-shared
  - packages/config-loader
---

# Output & Host Layer (Driver)

## Summary

The Rust `Compiler` owns **reads + compute** — `config + sources → { css, artifacts }`, including source discovery and
file reading via its platform filesystem engine (`pandacss_fs`). It never **writes** files and never decides where output
goes. Everything between "a project on disk (or in a browser)" and the engine — config load/reload + diff, output
cadence, watch wiring, and routing the engine's string outputs to a sink — lives in a **host layer** above the compiler.
This note pins down that layer's shape so we don't smear write/sink policy back into the engine: the orchestrator is a
**Driver** (compiler-toolchain sense — cf. clang `Driver`, `rustc_driver`), there are exactly **two** Driver types split
by *environment*, and consumers are thin *adapters*, not Driver subtypes. It also specifies the **config diffing
algorithm** the Driver needs on reload.

The shared `Driver` contract (the interface + `ConfigDiff` / `SourceChange` / `ArtifactFilter`) **and the shared
orchestration** (`BaseDriver` + `selectArtifacts`) live in **`@pandacss/compiler-shared`**. Each platform's host ships
*inside* its binding package — there is no separate driver package — and a thin `BaseDriver` subclass supplies only what
differs by environment (config access, `reload`, single-change IO); everything identical (introspection caching, `scan`,
batched changes, artifact selection, `compile`, watch-target derivation) lives in `BaseDriver`:

- **`@pandacss/compiler`** (node) — the native binding **and** `createNodeDriver` / `writeArtifacts`. Adds `@pandacss/config-loader`.
- **`@pandacss/compiler-wasm`** (browser) — the wasm binding **and** `createBrowserDriver`.

Both are backed by the engine's `scan`/`glob` (see [filesystem](./filesystem.md)) and config-loader's `diffConfig`. The
v1 analog is `packages/node/src/builder.ts` (`Builder`); v2's Driver is thinner because the Rust `Project` absorbed the
incremental/affected tracking the v1 `Builder` did by hand (`fileModifiedMap`, `checkFilesChanged`, `affecteds`), and the
fs engine absorbed globbing + reading.

## The layering

```
Layer 3 — Consumers / sinks  (per-tool policy: WHERE output goes)
  CLI build     codegen→disk · extract · compile()→ write styles.css
  CLI codegen   codegen→disk only                       (no CSS)
  CLI cssgen    compile()→ write styles.css only         (no artifacts)
  CLI --watch   same, held open, fed file-change events
  PostCSS       codegen→disk (once / on config change) · compile()→ root.append(css)   ← string, not file
  Bundler       codegen→disk · compile()→ virtual module string
  Playground    everything → memory
  Studio        read-only: atoms()/tokens()/reports, no output
        │  thin adapters
        ▼
Layer 2 — Driver  (host orchestrator — ships in @pandacss/compiler[-wasm])
  • load config (config-loader) + build Compiler · reload + diff on config change
  • scan() → engine globs + reads + parses (no JS glob); applyChange routes single events
  • cadence: artifacts (config-change gated) vs CSS (every build) are DISTINCT operations
  • register deps for the watcher / postcss; writeArtifacts sink (node)
  • returns strings; the consumer chooses the CSS sink
        │  drives
        ▼
Layer 1 — Engine  @pandacss/compiler[-wasm] (Rust)   ← reads + compute; NO writes
  parseFile / refreshFile / removeFile
  glob(opts) → string[]                              ← discovery via pandacss_fs
  scan(opts) → { count, diagnostics }                ← glob + read + parse, in Rust
  generateArtifacts / generateAffectedArtifacts → CodegenArtifact[] { path, code }   (outdir-less)
  compile() → { css, manifest, layerRanges }
  (incremental + affected tracking + source globbing/reading live HERE)
```

Three principles fall out of this:

1. **CSS output is polymorphic.** It is *not* always a file write — the PostCSS plugin does `root.append(css)`, a bundler
   returns a virtual module, the playground keeps it in memory. There is no single "write CSS" behavior to own, so
   `compile()` returns the string and the consumer routes it. (We deliberately did **not** add `writeCss` to the engine
   or loader.)
2. **CSS gen and artifact gen are distinct operations on distinct cadences** — mirroring v1's `panda cssgen` vs
   `panda codegen`. Artifacts regenerate rarely (config change); CSS regenerates every build. The Driver exposes them as
   separate methods, never a combined "build everything."
3. **Reads + artifact writes via the engine; CSS routing via the host.** Source discovery + reading run through the
   Rust `pandacss_fs` engine (`scan`/`glob`/`sources`). Artifact *writing* also goes through the engine fs
   (`compiler.writeArtifacts(outdir)` — disk on native, the in-memory fs on wasm), so there's no JS `node:fs` and the
   browser gets artifact-writing for free. **CSS stays a returned string** the consumer routes (file / postcss
   `root.append` / virtual module) — it's the polymorphic sink. `generateArtifacts()` still returns the `{path,code}[]`
   for hosts that want a custom/virtual artifact sink.

## Introspection (`spec` + `introspect`)

The engine exposes one **`compiler.spec()`** snapshot — `TypeData` (conditions, tokens incl. `deprecated`, utilities
incl. `shorthands`/`deprecated`, patterns, recipes) plus `propertyOrder`, `jsxFactory`, `importMap`. It crosses the
boundary once. **`introspect(spec)`** (in `@pandacss/compiler-shared`) indexes it into O(1) queries —
`isValidProperty`, `resolveShorthand`, `getPropCategory`, `isColorProperty`, `isValidToken`/`isDeprecatedToken`/
`isColorToken`, `conditions`, `patterns`/`recipes`, `jsxFactory`, and `sortProps`/`compareProps` (canonical property
order). The Driver caches it as `driver.introspect` (rebuilt on `reload`). This is the shared surface a linter,
formatter, or reporter builds on — never a per-item engine call in a hot loop.

## The Driver interface (sketch)

```ts
interface Driver {
  readonly compiler: Compiler // engine handle (swapped on reload)
  readonly config: SerializedConfig
  readonly configPath?: string
  readonly configDependencies: string[]
  readonly introspect: Introspection // cached query surface over spec()

  reload(): Promise<ConfigDiff> // re-load + diff; rebuild compiler if changed
  scan(): ScanReport // engine globs + reads + parses
  applyChange(change: SourceChange): boolean // one watcher event
  applyChanges(changes: SourceChange[]): boolean[] // batch
  artifacts(filter?: ArtifactFilter): CodegenArtifact[] // {path,code}[] for custom sinks
  writeArtifacts(outdir: string, cwd?: string): string[] // engine-fs sink (disk/memory)
  compile(): CompileOutput // CSS string + manifest; caller routes css
  watchTargets(): { sources: string[]; dirs: string[]; config: string[] } // patterns, base dirs, config deps
}
```

Note what is **absent** vs v1's `Builder`: no `fileModifiedMap`, no `checkFilesChanged`, no `affecteds` bookkeeping, and
no JS glob. The Rust `Project` (`refreshFile` / `removeFile` / `generateAffectedArtifacts`) owns incremental + affected
state, and the fs engine (`scan` / `glob`) owns discovery + reading — so the Driver shrinks to config lifecycle +
cadence + sink routing + watch wiring.

## Two Driver types — split only by environment

Exactly one axis warrants distinct types: *where Panda runs*, because the `Compiler` and the config source are
entangled with it. Each host is a `BaseDriver` subclass living in its platform binding package.

| | **`@pandacss/compiler`** (node host) | **`@pandacss/compiler-wasm`** (browser host) |
| --- | --- | --- |
| Compiler | native NAPI binding (same package) | wasm binding (same package) |
| Filesystem | `OsFileSystem` (real disk) | `MemoryFileSystem` (`Compiler.fs`) |
| Config source | `@pandacss/config-loader` (Rolldown bundles `panda.config.ts` from disk) | a pre-built `ConfigSnapshot` handed in — Rolldown is Node-only, the browser can't bundle the config the same way |
| Sources | `scan()` globs + reads real disk | host stages files into `Compiler.fs` (the driver's `sources` option / `applyChange`), then `scan()` globs the in-memory tree |
| wasm init | n/a | real browsers pass an initialized `pkg-web` `module`; omitting it falls back to the `pkg-node` `loadWasm` path (Node/SSR/tests) |

`createNodeDriver({ cwd })` and `createBrowserDriver({ snapshot, sources, module? })` implement the same `Driver`
interface (from `@pandacss/compiler-shared`); only construction + the IO adapter differ. **Why the host lives in its
binding package (not its own):** the host and its binding co-vary 1:1 — the node host only ever wraps the native
compiler, the browser host only ever wraps wasm — so a separate driver package bought no swappability, only an extra
hop and a duplicated implementation. The browser-dependency split is already enforced at the binding-package boundary:
`@pandacss/compiler` runs `loadNativeBinding()` at module top-level and pulls Rolldown / `node:fs`, while
`@pandacss/compiler-wasm` pulls neither — so folding each host into its platform package keeps the browser dependency
set honest, and the shared `BaseDriver` keeps the two from duplicating orchestration.

### Consumers are adapters, not Driver subtypes

Build-vs-watch is a **cadence** (one-shot = `scan() → artifacts() → compile()`; watch = the same Driver held open, fed
`applyChange()` events), and the sink is the **consumer's** job. So CLI commands, the PostCSS plugin, bundler plugins,
the playground, and Studio are thin adapters that construct the right Driver and route its string outputs — not new
Driver types. A third Driver type only earns its place if a consumer's *orchestration* genuinely diverges (not just its
sink/cadence); none does today (even read-only Studio is "a Driver whose output methods you don't call").

PostCSS plugin, as the proof case (the v1 `builder.ts` consumer):

```ts
const driver = await createNodeDriver({ cwd })
await writeArtifacts(driver.artifacts(), { outdir, cwd }) // once
// per build:
const diff = await driver.reload()
if (diff.hasChanged) await writeArtifacts(driver.artifacts({ dependencies: diff.dependencies }), { outdir, cwd })
driver.scan() // engine globs + reads + parses real disk
root.append(driver.compile().css) // ← string into the postcss Root, NOT a file
driver.watchTargets().config.forEach((file) => result.messages.push({ type: 'dependency', file }))
```

`writeArtifacts(artifacts, { outdir, cwd })` is the one reusable sink helper worth extracting (artifacts go to disk as
files in nearly every consumer, on the config-change cadence). It belongs in Layer 2, never the engine.

**Layer-name awareness.** To recognize the user's `@layer reset, base, …;` directive in the input CSS, the plugin needs
the *resolved* layer names — but their defaults are applied Rust-side, so they're absent from the serialized config when
the user didn't rename them. The engine exposes `compiler.layers()` → `{ reset, base, tokens, recipes, utilities }`
(overrides merged over defaults) so the host reads them from one source instead of re-deriving Rust's defaults in JS.
(Reset CSS itself, incl. `preflight.scope`/`level`, is fully emitted by `compile()` — see [stylesheet](./stylesheet.md).)

## Config diffing

On `reload()` the Driver needs a config diff to know *which* artifacts to regenerate instead of rewriting everything. It
is a pure function of two `SerializedConfig`s and belongs in **`@pandacss/config-loader`** (a config concern;
config-loader already depends on `@pandacss/compiler-shared`, so it can emit `CodegenDependency`).

```ts
import type { CodegenDependency, SerializedConfig } from '@pandacss/compiler-shared'
import type { Difference } from 'microdiff'

interface ConfigDiff {
  hasChanged: boolean
  /** Coarse deps → feed Driver.artifacts({ dependencies }) / generateAffectedArtifacts. */
  dependencies: CodegenDependency[]
  /** Fine-grained, to avoid rewriting every file: which entries changed. */
  recipes: string[]
  patterns: string[]
  /** Raw microdiff output, surfaced to the `config:change` hook + telemetry. */
  changes: Difference[]
}

export function diffConfig(prev: SerializedConfig | undefined, next: SerializedConfig): ConfigDiff
```

### Algorithm

```
1. prev == undefined            → { hasChanged: true, dependencies: ALL }   (full regen)
2. changes = microdiff(prev, next)
   changes.length == 0          → { hasChanged: false, dependencies: [] }
3. for each change.path: match against a path → CodegenDependency table, e.g.
     theme.tokens.* | theme.semanticTokens.*   → 'tokens'
     theme.recipes.* | theme.slotRecipes.*     → 'recipes'   (+ push name → recipes[])
     patterns.*                                → 'patterns'  (+ push name → patterns[])
     conditions.*                              → 'conditions'
     utilities.*                               → 'utilities'
     theme.breakpoints.*                       → 'conditions', 'tokens'
     jsxFramework | jsxFactory | jsxStyleProps → their own dep
     prefix | separator | hash | syntax | themes → their own dep
   dedupe into a Set
4. state transitions: recipes 0↔1+ toggles the create-recipe helper + recipe index
```

This mirrors v1's `diffConfigs` (`microdiff` + `artifactMatchers` in `packages/config/src/diff-config.ts`), but maps to
v2's **coarse `CodegenDependency` enum** (the engine's `generateAffectedArtifacts(CodegenDependency[])` seam) instead of
v1's per-file `ArtifactId` set. The fine-grained `recipes[]` / `patterns[]` ride alongside for when we want per-entry
file scoping.

### The serialized-config caveat (known gap)

Diffing runs on the **`SerializedConfig`**, where functions are lowered to `{ kind: 'js-callback', id }` with a *stable*
id. So editing a `utilities.*.transform` **body** produces a byte-identical ref → `microdiff` sees no change → the
utility artifact would not regenerate. Patterns are the exception: we capture `pattern.transform` as a `codegenSource`
*string* (see [config-loading-design](./config-loading-design.md)), so a pattern body edit *does* diff. The current
`diffConfig` is **structural-only** — it ships with this gap documented (in code + tests) and the hashing fix deferred.
Resolution options:

1. **Hash callback sources into the serialized config** — attach a short content hash of each lowered function's
   `.toString()` (`{ kind: 'js-callback', id, hash }`). A body edit flips the hash → diffs precisely, `diffConfig` stays
   a pure structural diff, and pattern/utility handling becomes symmetric. **Preferred.**
2. **Coarse fallback on config-file change** — any change to the config *file* (already dep-watched) forces regen of all
   function-dependent artifacts (`patterns`, `recipes`, `utilities`). Simple, over-regenerates slightly, never wrong.
3. **Diff pre-serialization** (the live resolved config) — most faithful to v1, but the diff input would no longer be the
   artifact we ship to Rust, and live functions compare by reference (every reload = new refs = always "changed") unless
   stringified — which collapses back into option 1.

## Unresolved Questions

- **Callback-change detection** — `diffConfig` is structural-only today (gap above). Implement option 1 (hash lowered
  callback sources during serialization) when utility-transform-edit invalidation matters; needs the Rust
  `SerializedConfig` deserialize to tolerate the extra `hash` field on the callback ref.
- **`writeArtifacts` clean step** — current helper writes full-or-affected sets; it does **not** delete stale files
  (renamed/removed recipes/patterns leave orphans). Add a clean pass when watch cadence needs it.
- **CLI / plugin adapters** — `createNodeDriver` (in `@pandacss/compiler`) exists; the consumer adapters (CLI commands,
  PostCSS plugin, bundler plugins) that drive it aren't built yet. The Driver interface is the shared seam.
- **`applyChange` reads** — the node driver reads a single changed file via `node:fs` when `content` is omitted (the
  bulk `scan` uses the engine fs). Acceptable, but a single-file engine read would keep it fully uniform.
- **Browser `pkg-web` path is untested in CI** — `createBrowserDriver`'s tests run in Node and exercise the `pkg-node`
  `loadWasm` fallback; the real-browser `module` (initialized `pkg-web`) branch is covered by types only. Needs a
  browser/jsdom smoke test (or playground integration) to verify end-to-end.

## Related

- [config-loading-design](./config-loading-design.md) — produces the `{ config, callbacks }` snapshot the Driver builds
  from, and is where `diffConfig` lives.
- [compiler-lifecycle](./compiler-lifecycle.md) — the Layer-1 `Compiler` phases the Driver orchestrates.
- [project-lifecycle](./project-lifecycle.md) — the engine's `refresh_file` / `remove_file` semantics the Driver routes
  change events into.
- [bindings](./bindings.md) — native vs wasm split that the two Driver types mirror.
