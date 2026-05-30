---
title: Output & Host Layer (Driver)
status: draft
scope:
  - packages/compiler
  - packages/config-loader
  - (future) packages/node — v2 host layer, not yet built
---

# Output & Host Layer (Driver)

## Summary

The Rust `Compiler` is pure compute: `config + sources → { css, artifacts }`. It never writes files, never
globs a project, never decides where output goes. Everything between "a project on disk (or in a browser)" and "the
engine" — config load/reload, source discovery, output cadence, watch wiring, and routing the engine's string outputs
to a sink — lives in a **host layer** above the compiler. This note pins down that layer's shape so we don't smear it
back into the engine: the orchestrator is called a **Driver** (compiler-toolchain sense — cf. clang `Driver`,
`rustc_driver`), there are exactly **two** Driver types split by *environment*, and consumers are thin *adapters*, not
Driver subtypes. It also specifies the **config diffing algorithm** the Driver needs on reload.

This layer is **not yet built**. The v1 analog is `packages/node/src/builder.ts` (`Builder`); v2's Driver is a thinner
version of it because the Rust `Project` absorbed the incremental/affected tracking the v1 `Builder` did by hand
(`fileModifiedMap`, `checkFilesChanged`, `affecteds`).

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
Layer 2 — Driver  (host orchestrator — THIS NOTE; not built yet)
  • load config (config-loader) + build Compiler · reload + diff on config change
  • discover sources (glob) + read + feed parseFile / refreshFile / removeFile
  • cadence: artifacts (config-change gated) vs CSS (every build) are DISTINCT operations
  • register deps for the watcher / postcss
  • returns strings; the consumer chooses the sink
        │  drives
        ▼
Layer 1 — Engine  @pandacss/compiler (Rust)   ← PURE compute, no IO
  parseFile / refreshFile / removeFile
  generateArtifacts / generateAffectedArtifacts → CodegenArtifact[] { path, code }   (outdir-less)
  compile() → { css, manifest, layerRanges }
  (incremental + affected tracking lives HERE now, not in the host)
```

Two principles fall out of this and are the reason the engine stays pure:

1. **CSS output is polymorphic.** It is *not* always a file write — the PostCSS plugin does `root.append(css)`, a bundler
   returns a virtual module, the playground keeps it in memory. There is no single "write CSS" behavior to own, so
   `compile()` returns the string and the consumer routes it. (We deliberately did **not** add `writeCss` to the engine
   or loader.)
2. **CSS gen and artifact gen are distinct operations on distinct cadences** — mirroring v1's `panda cssgen` vs
   `panda codegen`. Artifacts regenerate rarely (config change); CSS regenerates every build. The Driver exposes them as
   separate methods, never a combined "build everything."

## The Driver interface (sketch)

```ts
interface DriverOptions {
  cwd: string
  configPath?: string // else findConfig({ cwd })
}

interface Driver {
  readonly compiler: Compiler // Layer-1 engine handle (live)
  readonly config: SerializedConfig
  readonly configPath: string
  readonly configDependencies: string[] // config + imported modules → watch these

  // ── Config lifecycle ──────────────────────────────────────────
  /** Re-load config, diff vs current, rebuild the compiler if changed.
   *  Returns the diff so the caller decides what to regen + which hooks to fire. */
  reload(): Promise<ConfigDiff>

  // ── Source ingestion (engine owns the incremental state) ──────
  /** Glob include/exclude, read, parseFile each. → count parsed. */
  ingest(): Promise<number>
  /** Route ONE change event into the engine. false = unknown path, ignored. */
  applyChange(change: { path: string; kind: 'add' | 'change' | 'unlink'; content?: string }): boolean

  // ── Outputs: distinct operations, distinct cadence ────────────
  /** Codegen. Full set, or only artifacts affected by a config diff.
   *  Returns strings; the sink writes. */
  artifacts(filter?: Pick<ConfigDiff, 'dependencies'>): CodegenArtifact[]
  /** CSS gen. Returns the string + manifest; caller routes it. */
  css(): CompileOutput

  // ── Watch wiring ──────────────────────────────────────────────
  watchTargets(): { sources: string[]; config: string[] }
}
```

Note what is **absent** vs v1's `Builder`: no `fileModifiedMap`, no `checkFilesChanged`, no `affecteds` bookkeeping. The
Rust `Project` (`refreshFile` / `removeFile` / `generateAffectedArtifacts`) owns that now, so the Driver shrinks to
config lifecycle + IO + cadence + sink routing.

## Two Driver types — split only by environment

Exactly one axis warrants distinct types: *where Panda runs*, because the `Compiler` and the config source are
entangled with it.

| | **NodeDriver** | **BrowserDriver** |
| --- | --- | --- |
| Compiler | native NAPI binding | wasm binding |
| Filesystem | `OsFileSystem` (real disk) | in-memory (`Compiler.fs`) |
| Config source | `@pandacss/config-loader` (Rolldown bundles `panda.config.ts` from disk) | a pre-built `ConfigSnapshot` handed in — Rolldown is Node-only, the browser can't bundle the config the same way |
| Sources | glob + read from disk | `addSource(path, content)` pushed in by the host |

`createNodeDriver({ cwd })` and `createBrowserDriver({ snapshot, sources })` share the same interface above; only
construction + the IO adapter differ.

### Consumers are adapters, not Driver subtypes

Build-vs-watch is a **cadence** (one-shot = `ingest() → artifacts() → css()`; watch = the same Driver held open, fed
`applyChange()` events), and the sink is the **consumer's** job. So CLI commands, the PostCSS plugin, bundler plugins,
the playground, and Studio are thin adapters that construct the right Driver and route its string outputs — not new
Driver types. A third Driver type only earns its place if a consumer's *orchestration* genuinely diverges (not just its
sink/cadence); none does today (even read-only Studio is "a Driver whose output methods you don't call").

PostCSS plugin, as the proof case (the v1 `builder.ts` consumer):

```ts
const driver = await createNodeDriver({ cwd })
writeArtifacts(driver.artifacts(), { outdir, cwd }) // once
// per build:
const diff = await driver.reload()
if (diff.hasChanged) writeArtifacts(driver.artifacts({ dependencies: diff.dependencies }), { outdir, cwd })
await driver.ingest()
root.append(driver.css().css) // ← string into the postcss Root, NOT a file
driver.watchTargets().config.forEach((file) => result.messages.push({ type: 'dependency', file }))
```

`writeArtifacts(artifacts, { outdir, cwd })` is the one reusable sink helper worth extracting (artifacts go to disk as
files in nearly every consumer, on the config-change cadence). It belongs in Layer 2, never the engine.

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

### The serialized-config caveat (decide before implementing)

Diffing runs on the **`SerializedConfig`**, where functions are lowered to `{ kind: 'js-callback', id }` with a *stable*
id. So editing a `utilities.*.transform` **body** produces a byte-identical ref → `microdiff` sees no change → the
utility artifact would not regenerate. Patterns are the exception: we capture `pattern.transform` as a `codegenSource`
*string* (see [config-loading-design](./config-loading-design.md)), so a pattern body edit *does* diff. This asymmetry
must be resolved:

1. **Hash callback sources into the serialized config** — attach a short content hash of each lowered function's
   `.toString()` (`{ kind: 'js-callback', id, hash }`). A body edit flips the hash → diffs precisely, `diffConfig` stays
   a pure structural diff, and pattern/utility handling becomes symmetric. **Preferred.**
2. **Coarse fallback on config-file change** — any change to the config *file* (already dep-watched) forces regen of all
   function-dependent artifacts (`patterns`, `recipes`, `utilities`). Simple, over-regenerates slightly, never wrong.
3. **Diff pre-serialization** (the live resolved config) — most faithful to v1, but the diff input would no longer be the
   artifact we ship to Rust, and live functions compare by reference (every reload = new refs = always "changed") unless
   stringified — which collapses back into option 1.

## Unresolved Questions

- **Callback-change detection** — pick option 1/2/3 above (leaning 1: hash callback sources during serialization).
- **`writeArtifacts` signature** — incremental? affected-only? clean stale files? Depends on how the Driver drives
  cadence; lock it when Layer 2 work starts.
- **Where the v2 host layer ships** — a v2 `@pandacss/node`, or split (CLI vs plugin shared core)? The Driver interface
  is the same regardless.
- **BrowserDriver config loading** — confirm the browser always receives a pre-built `ConfigSnapshot` (no in-browser
  bundling), or whether a wasm-friendly bundling path is ever needed.

## Related

- [config-loading-design](./config-loading-design.md) — produces the `{ config, callbacks }` snapshot the Driver builds
  from, and is where `diffConfig` lives.
- [compiler-lifecycle](./compiler-lifecycle.md) — the Layer-1 `Compiler` phases the Driver orchestrates.
- [project-lifecycle](./project-lifecycle.md) — the engine's `refresh_file` / `remove_file` semantics the Driver routes
  change events into.
- [bindings](./bindings.md) — native vs wasm split that the two Driver types mirror.
