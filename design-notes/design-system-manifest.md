---
title: Design Systems (`designSystem`)
status: draft
scope:
  - crates/pandacss_project
  - crates/pandacss_config
  - packages/compiler-shared
  - packages/compiler
  - packages/compiler-wasm
  - packages/config
  - packages/cli
related:
  - build-info.md
  - virtual-styled-system.md
  - config-loading-design.md
  - compiler-diagnostics.md
---

# Design Systems (`designSystem`)

## Summary

A Panda design system (DS) is an npm package that ships components **and** the Panda configuration those components were
built against. Today, adopting one is the single biggest paper-cut in Panda: every consuming app has to hand-coordinate
four config knobs and re-extract every component it imports. This note specifies a first-class replacement — one config
field for consumers (`designSystem: '@acme/ds'`) backed by a small **manifest** (`panda.lib.json`) the library publishes —
and resolves the design decisions end to end so the path forward is unambiguous.

The manifest ties together everything a consumer needs: the library's preset, its portable extraction cache, its import
paths, and a pointer to its **own** parent design system. Resolving `designSystem` reads that manifest, merges the preset,
wires `importMap`, hydrates the pre-extracted styles, and walks the parent chain. The library author produces all of it with
one command, `panda lib`.

The hard logic — generating the manifest, loading it, walking a chain of parents, and guarding versions — lives in the Rust
engine as **pure functions over in-memory values**. The filesystem and Node module resolution stay in the TypeScript host.
That boundary is the load-bearing decision of this design: it keeps the bug-prone logic unit-testable without writing or
reading a single file.

## The problem

A design system today is three packages and a documentation burden:

1. A **preset** package (tokens, recipes, conditions, utilities).
2. A **components** package, plus instructions telling every app to add its glob to `include`.
3. An **`importMap` override** so the shipped components import from the DS, not the consumer's local `styled-system`.
4. A **`buildinfo`** path the consumer must wire by hand to avoid re-extracting.

So a consumer's config looks like this, and every field is a chance to get it wrong:

```ts
import { acmePreset } from '@acme/ds/preset'

export default defineConfig({
  presets: ['@pandacss/dev/presets', acmePreset],
  importMap: '@acme/ds',
  include: ['./src/**/*.{ts,tsx}', './node_modules/@acme/ds/dist/panda.buildinfo.json'],
})
```

On top of the coordination cost, **the consumer re-extracts every component it imports** — the library already did that
work, and it's thrown away. The pain compounds in the shapes real users actually have:

- **Monorepo with an internal UI package.** Which package gets a `panda.config.ts`? Both? Does the app re-generate the
  library's CSS or reuse it? There is no clear answer today.
- **Docker builds.** A `prepare` script runs `panda` during install, but config resolution is cwd-relative and only some
  workspace files are copied into the build layer, so resolution fails.
- **A shared config hidden inside a library** (e.g. font-face declarations). Every consuming app has a different layout, so
  the fonts resolve in some and not others.
- **Composed design systems.** A `marketing-ds` built on `foundations` has to bake `import { foundationsPreset }` into its
  own source — the exact `node_modules` reach-in we want to eliminate.
- **Distribution at scale.** Shipping a DS to npm breaks the per-package `styled-system` generation model; teams fall back
  to bundler aliasing that is fragile and hard to explain.

The goal is to make all of that one field for the consumer and one command for the author, and to make the engine reuse the
library's extraction instead of repeating it.

## Field report: questions from real consumers

These are the questions library authors actually hit when shipping a component library on Panda — gathered so the design is
validated against real pain, not a hypothetical. Each maps to a part of this design; three are already answered, two are
open action items tracked below.

| # | The question | Answer | Where |
| - | ------------ | ------ | ----- |
| 1 | *I split my library into a preset package and a components package, and the components import from the preset's `styled-system`. Now every consumer has to point their `outdir` at my package's path. How do I ship this cleanly?* | The preset package is the **design system** — it ships `panda.lib.json`, and the consumer writes one field, `designSystem`. The components package *consumes* that DS but isn't one itself, so it belongs in the consumer's smart **`include`**. The manifest's `importMap` keeps the shipped components importing from the DS's own styled-system, so **no consumer ever aliases `outdir`** — that's the whole point of decoupling the styled-system from the components. | [`importMap`](#the-manifest-pandalibjson), [smart `include`](#the-model-two-fields-two-questions) |
| 2 | *My bundler pulls too much into the type declarations — Panda's generated types "aren't exported by styled-system/…", and my component's exported type collapses to `undefined`. Why?* | **A bundler-external problem, not a codegen gap.** Panda's generated types *are* exported; the DTS pass is re-resolving the local `styled-system` folder as a bundle input and failing. The DS model fixes the root cause: the styled-system becomes a **real package export** the bundler can resolve and externalize. Authoring guidance: mark the styled-system specifiers `external` so type builds reference the published declarations instead of inlining them. **Open: author-side bundling guidance** (below). | [Module/type resolution](#module-and-type-resolution) + open item |
| 3 | *If my library and the consuming app each have their own `styled-system`, what actually goes wrong?* | Three things, worst first: (a) **broken runtime identity** — two copies of the JSX runtime mean two React contexts, so a library's slot-recipe provider and the app don't share state; (b) **duplicated CSS** for identical atoms; (c) **`cx`/`cva` divergence** across the copies. Sharing one styled-system via the DS manifest is what lets a library and an app share runtime code — the promise made real. | [CSS layering/dedup](#css-layering-tree-shaking-and-federation) |
| 4 | *In a monorepo, editing a component in a workspace package refreshes the DOM but the CSS doesn't update until I fully restart. How do I fix it?* | The bundler's HMR re-runs the component's JS, but Panda's cssgen never fired — the edited package's source isn't a tracked build dependency. DS/`include` resolution must register **cross-package source globs as watched build deps** and re-run cssgen on change, independent of the bundler. **Open: cross-package watch dependency** (below). | [Loading the manifest](#loading-the-manifest-consumer) + open item |
| 5 | *Should Panda's dev package be a `dependency` or a `peerDependency` of my library?* | **Peer.** A design system declares it as a peer; the manifest's `panda` field is the range a consumer's Panda must satisfy. One Panda per install, no version-doubling. | [`panda` + `schemaVersion`](#the-manifest-pandalibjson) |

### Open action items

- **Author-side bundling guidance (from #2).** `panda lib` ships the styled-system as package exports, but DS authors still
  run their own bundler over component source. Document — and have `panda lib` scaffold/validate — that the styled-system
  specifiers are marked `external` so DTS builds reference the published types rather than re-resolving a local folder. This
  is docs + a setup check, not engine code.
- **Cross-package watch dependency (from #4).** Resolving `designSystem`/smart-`include` must register the consumed package's
  source globs (and `buildInfo` path) as cssgen build dependencies so a watch run regenerates CSS on a dependency-source
  edit, not just on `panda.lib.json`/lockfile changes. Today only the manifest paths are registered (see
  [Loading the manifest](#loading-the-manifest-consumer)); the source-glob case is the gap.

## Goals and non-goals

**Goals**

1. **One consumer field.** `designSystem: '@acme/ds'` replaces the four-knob coordination.
2. **One author command.** `panda lib` produces every artifact the consumer needs and is idempotent.
3. **No re-extraction.** The consumer hydrates the library's pre-extracted styles; it parses only its own source.
4. **Composition without reach-in.** A DS declares only its own parent and its own additions — never imports a grandparent's
   preset from source.
5. **Resolves where users build.** Workspaces, symlinks, and Docker layers — resolution must not assume cwd equals the
   package location.
6. **Diagnoses setup mistakes.** Misconfiguration is the common failure; the compiler should say what's wrong and how to fix it.

**Non-goals (for now)**

- **Plural `designSystem`.** A single field; see [Why singular](#why-singular). Plural is a non-breaking future addition.
- **Multiple competing token sources.** Two packages both defining `colors.brand` differently is a conflict, not a feature.
- **Micro-frontend federation guidance** — version-namespaced output for many DS versions on one page. The content-addressed
  hashing here makes identical versions dedupe naturally (see [Federation and versioning](#federation-and-versioning)), but
  full MFE guidance is a separate effort.
- **Runtime (non-build-time) manifest consumption**, registry integration, or auto-publishing.

## The model: two fields, two questions

`designSystem` and `include` answer different questions and stay distinct:

- **`designSystem`** — *"What is my design language?"* A package that defines tokens/recipes/conditions and ships a
  `panda.lib.json`. Its preset becomes part of the consumer's config; its styles arrive pre-extracted.
- **`include`** — *"Which files use that design language?"* Globs, plus (with **smart `include`**) bare package specifiers
  for libraries that *consume* a DS but aren't one themselves — e.g. a charts package built on `@acme/ds`.

A package with a manifest belongs under `designSystem`. A package without one, named in `include`, is auto-globbed and
re-extracted. Putting a manifest-bearing package in `include` is a setup error we diagnose and redirect — silently
accepting it would re-extract a library that already shipped its extraction.

### Why singular

`designSystem` is `string`, not `string | string[]`. The cases that look plural are three different things:

- App uses `@acme/ds` **and** `@acme/charts` — charts *consumes* a DS, it isn't one. → `include`.
- App uses `@company/foundations` **and** `@company/marketing-ds` — marketing-ds extends foundations via **its own**
  manifest entry. Composition happens at the library level; the consumer sees one entry. → [chains](#nested--recursive-design-systems).
- Migrating `@acme/v1` → `@acme/v2` — set `designSystem: '@acme/v2'`, keep `@acme/v1` in `include` during the migration.

The genuinely-plural case (two token sources both defining `colors.brand`) isn't a use case — supporting it forces
decisions on token-conflict resolution, condition reconciliation, layer priority, and hash-space merging for ~zero real
demand. Singular keeps the surface honest; plural can be added without breaking anyone if demand appears.

## The manifest (`panda.lib.json`)

The library publishes one JSON file. **Every path is relative to the manifest's own directory**, so it resolves identically
whether read from `node_modules`, a workspace symlink, or a Docker layer:

```jsonc
{
  "schemaVersion": 1,
  "name": "@acme/ds",
  "version": "1.2.3",            // informational; powers the drift receipt, never enforced
  "panda": "^2.0.0",             // peer range — the version contract both sides agree on
  "preset": "./preset.mjs",      // compiled preset module (the library ships no source .ts)
  "buildInfo": "./panda.buildinfo.json",
  "importMap": {
    "css": "@acme/ds/css",
    "recipes": "@acme/ds/recipes",
    "patterns": "@acme/ds/patterns",
    "jsx": "@acme/ds/jsx",
    "tokens": "@acme/ds/tokens"
  },
  "designSystem": "@acme/foundations", // OPTIONAL — this library's OWN parent DS (recorded by `panda lib`)
  "files": ["./dist/**/*.{js,mjs}"]    // re-extract fallback when build info can't be hydrated
}
```

Why each field lives in the manifest rather than elsewhere:

- **`preset`** — the configuration contract: token *definitions*, utilities, recipes, conditions, font faces. It is a
  **compiled `.mjs`**, not source `.ts`: a consumer must never need a TypeScript toolchain to read a dependency, and presets
  carry executable shape (callbacks, transforms) that can't be expressed in JSON. The font-resolution pain dissolves here —
  the library's font-face config travels in its preset and merges into every consumer.
- **`buildInfo`** — a path to the **portable encoder state** (the library's atoms/recipes from extracting its own source,
  interned and tree-shakeable). The manifest *points at* it; it does not embed it, so the two regenerate independently. The
  build-info wire format and tree-shaking model are detailed in [build-info.md](./build-info.md); for this note, what matters
  is that it carries token *usage* (path + resolved value), not token *definitions* — definitions come from `preset`. That
  split is what lets a consumer re-theme the same token paths.
- **`importMap`** — so the library's compiled JSX keeps importing from `@acme/ds/css` rather than the consumer's local
  `styled-system`. The host normalizes it and merges it with the consumer's own map.
- **`designSystem`** — the **parent pointer**, and the mechanism that makes composition work without reach-in. Set only when
  the library's own config declared a `designSystem`. See [Nested / recursive design systems](#nested--recursive-design-systems).
- **`panda` + `schemaVersion`** — the version guard, and the answer to "dependency or peer dependency?": `@pandacss/dev` is a
  **peer** dependency of a design system, and `panda` is the range a consumer's Panda must satisfy.
- **`files`** — the consumer-side fallback. If the build info can't be hydrated (version skew, fingerprint drift), the
  consumer re-extracts these globs instead of failing. Recommended in every published manifest.

## Where this runs: Rust engine vs TypeScript host

This is the design's spine. The manifest's **generation and consumption are pure functions over values**, exposed as a
compiler namespace that mirrors the existing `compiler.buildInfo.*`:

```ts
compiler.designSystem.create({ panda })            // Project value → manifest value (producer)
compiler.designSystem.validate(manifest)           // schema + peer range compatible? { ok } | { ok: false, reason }
compiler.designSystem.load(manifest, { buildInfo }) // consumer: merge preset facts + hydrate → resolved layer
compiler.designSystem.resolveChain(manifests)       // ordered manifest values → dedup'd, cycle-checked merge/hydrate plan
```

Every method takes and returns plain data. `resolveChain` in particular is handed the **already-read** manifest values — the
host did the disk reads and Node resolution — and returns the order to merge and hydrate. So the recursion logic, the part
most likely to harbor bugs, is exercised with hand-authored manifest arrays and **zero filesystem**.

| Layer | Language | Owns | Touches fs? |
| --- | --- | --- | --- |
| Engine (`pandacss_project`, `pandacss_config`) | **Rust** | manifest value type, `create`, `validate`, `resolveChain`, hydrate wiring, version + cycle guards | no |
| Bindings (`packages/compiler/crate`, `compiler-wasm/crate`) | **Rust** | mirror the flat primitives across native + browser | no |
| JS namespace (`compiler-shared`) | **TS** | `compiler.designSystem.*`, manifest (de)serialization, importMap normalization | no |
| Host (`packages/cli`, driver) | **TS** | Node module resolution, reading/writing `panda.lib.json` + `package.json` exports, `--watch` | **yes — all of it** |

Only the bottom row touches disk. Everything above is values. So "does the chain walk handle a 7-deep stack, a shared-parent
diamond, and a cycle?" is a set of in-memory Rust unit tests, not a tree of sandbox packages.

## Generating the manifest (producer)

`compiler.designSystem.create({ panda })` turns a built `Project` into a manifest value:

1. The engine already holds the merged config, encoder state, and the `exports` map (export name → module). `create` reads
   them; it does not re-extract.
2. It stamps `name`/`version` from the supplied package identity, `panda` from the author-declared peer range, and
   `schemaVersion` from the running binding.
3. It records the producer's **own** `designSystem` parent (from the producer's resolved config), so the manifest carries the
   chain link.
4. It emits paths as placeholders relative to the eventual output root; the host fills concrete relative paths when it writes.

`panda lib` is the only fs-aware part: glob `src/`, drive the engine to build the `Project`, call `create`, write
`panda.lib.json` + `panda.buildinfo.json` + the compiled `preset.mjs`, and sync `package.json` exports. It reads from `src/`
(not a bundler's `dist/`), so it is bundler-agnostic, and it is **idempotent** — running it twice produces no diff. It
supersedes the older two-step `ship`/`emit-pkg` flow, which is removed (a documented breaking change). `panda lib --watch`
rebuilds on `src/` changes via the same watcher the app dev mode uses.

```jsonc
// package.json — exports synced by `panda lib`
{
  "exports": {
    "./panda.lib.json": "./dist/panda.lib.json",
    "./preset":         "./dist/preset.mjs",
    "./css":            "./dist/css/index.mjs",
    "./recipes/*":      "./dist/recipes/*"
  }
}
```

## Loading the manifest (consumer)

When the consumer's config has `designSystem: '@acme/ds'`:

1. The host **resolves** `@acme/ds/panda.lib.json` via Node module resolution.
2. It reads that manifest and any parent chain (next section), then calls `resolveChain([…])` for the ordered plan.
3. For each manifest in the plan (root-first, so parents merge before children):
   - **Merge preset** into the effective config, *under* the user's local config — user overrides win, the same override
     semantics as any preset. The consumer does **not** also list the DS preset in `presets`.
   - **Merge importMap** — prepend the DS roots, keep the app's local `outdir` (dual-root rules in [virtual-styled-system.md](./virtual-styled-system.md)).
   - **`validate`** the build info against the resolved compiler (schema + peer range + config fingerprint). On mismatch,
     re-extract the manifest's `files` for that layer and emit a warning.
   - **Hydrate** the build info, tree-shaken to the consumer's actual imports (only the modules it uses).
4. Extract the consumer's own `src/` as normal; its atoms merge into the same encoder. The library's components are never
   re-extracted.

The resolved manifest and build-info paths are registered as build dependencies, so watch mode and `pnpm update @acme/ds`
both trigger regeneration.

## Nested / recursive design systems

A design system built on another is the hard case, and the manifest's `designSystem` field is the entire mechanism. Each
library declares **only its own parent** and **only its own additions** — never an `import { parentPreset }` baked into
source. That import is exactly the `node_modules` reach-in this feature removes.

```ts
// @acme/marketing-ds/panda.config.ts
export default defineConfig({
  designSystem: '@acme/foundations', // recorded into THIS library's manifest by `panda lib`
  presets: [marketingPreset],        // marketing's own additions only
})
```

The consumer lists only the leaf; `foundations` is pulled in transitively:

```ts
// app/panda.config.ts
export default defineConfig({
  designSystem: '@acme/marketing-ds',
  include: ['./src/**/*.{ts,tsx}'],
})
```

### The walk

The host reads each level's manifest and hands the collected values to `resolveChain`. Two invariants make it correct, and
both are tested in-memory:

- **Resolve each parent against the previous manifest's directory, not the consumer's cwd.** `marketing-ds`'s parent
  `foundations` is resolved relative to where `marketing-ds` is installed. This is what makes transitive parents work when
  the consumer depends only on the immediate child — and it is the fix for the Docker case, where cwd-relative resolution
  breaks because only part of the workspace exists in the build layer.
- **Cycle guard.** `A → B → A` is caught by walking with a visited set and surfaced as a diagnostic, not a stack overflow.

`resolveChain` returns the dedup'd, ordered list: root → leaf for preset merge (so leaf and app override ancestors), and each
build info hydrated under its own name (re-hydrating one layer replaces just that layer). The governing rule: **preset chain
= config inheritance; build info = per-package extraction cache.** Never merge build-info blobs across packages — merge only
emit output and presets.

## Module and type resolution

Three resolution problems, three answers:

- **"Where is the package?"** — Bare specifiers (`@acme/ds` in `designSystem`, bare names in smart `include`) resolve via the
  host's Node resolution, trying `…/panda.lib.json` first, then `…/package.json`. This is a host concern; the engine never
  resolves modules. The resolve-against-manifest-dir rule above keeps it working in workspaces and Docker layers.
- **"Which import is a Panda import?"** — The manifest's `importMap` carries the DS roots so the library's compiled JSX
  resolves to `@acme/ds/css`, not the app's local `styled-system`. The host merges DS roots with the app's `outdir` into a
  dual-root map; the extractor matches by substring. [virtual-styled-system.md](./virtual-styled-system.md) is the authority
  on normalization; this note only requires that the manifest is the *source* of the DS roots.
- **"Does the IDE know about these tokens?"** — The DS ships its `styled-system/types` via `package.json` exports, and the
  consumer's codegen emits a **merged** type surface (DS contract + app extensions) so `strictTokens` enforces against the
  composed system.

## CSS layering, tree-shaking, and federation

**Tree-shaking.** A DS shipping 100 components shouldn't push 100 components' CSS into an app that imports 10. Build info is
keyed per source module, and the consumer hydrates only the modules its imports reach (subpath imports resolve directly;
barrel imports resolve through the `exports` map). Panda-native scanning over-includes safely; a future bundler plugin is the
precise opt-in.

**Layering.** Each design system's hydrated CSS is emitted under a named cascade layer, `@layer ds-{name}`, with a single
ordering statement declaring root-before-leaf-before-app. So `foundations` sits under `marketing-ds` sits under the app, and
override precedence matches preset inheritance.

### Federation and versioning

Several federated micro-frontends on one page can use the same DS at the same or different versions. Two mechanisms already
cover the common case without new surface:

- **Identical versions dedupe for free.** Atom class names are content-addressed (hash of property + resolved value), so two
  MFEs on `@acme/ds@1.2.3` produce byte-identical classes that collapse on the page.
- **Incompatible versions fail safe.** The `panda` peer range + `schemaVersion` + config-fingerprint guard catches a
  cross-version hash collision (same atom, different class) at load time and falls back to re-extraction for that layer
  rather than emitting conflicting output.

Explicit version-namespaced output (one bundle per DS version, hash keyed by DS identity) is the genuinely federated case and
is deferred — it needs a coordination story across independently built apps that this field doesn't own.

## Diagnostics

Setup is where this feature lives or dies — most failures are misconfiguration, and a diagnostic's job is to say what's wrong
and how to fix it, not just refuse. These follow the shared `Diagnostic` model and the `code`/`severity` conventions in
[compiler-diagnostics.md](./compiler-diagnostics.md). Proposed stable codes:

| Code | Severity | When | Guidance |
| --- | --- | --- | --- |
| `design_system_manifest_not_found` | error | `designSystem` set but no `panda.lib.json` resolves | "Install `@acme/ds`, or — if it isn't a Panda design system — build it with `panda lib`." |
| `design_system_in_include` | error | a manifest-bearing package appears in `include` | "Move `@acme/ds` to `designSystem`; `include` is for files, not design systems." Batched, so every offender reports at once. |
| `design_system_version_mismatch` | error | manifest `schemaVersion` ≠ running binding | Directional: consumer newer → "rebuild the lib with `panda lib`"; consumer older → "upgrade `@pandacss/dev` here, or rebuild the lib." |
| `design_system_peer_range_unsatisfied` | error | consumer Panda outside manifest `panda` range | "This project's Panda doesn't satisfy `@acme/ds`'s `panda: ^2.0.0`." |
| `design_system_cycle` | error | the chain revisits a package | "Design-system cycle: `@a` → `@b` → `@a`. A design system can't depend on itself." |
| `design_system_parent_not_found` | error | a manifest's parent doesn't resolve from that manifest's dir | "`@acme/marketing-ds` declares parent `@acme/foundations`, not installed alongside it." |
| `design_system_buildinfo_stale` | warning | build info fails `validate`; re-extract fallback used | "Re-extracting `@acme/ds` source; rebuild it with `panda lib` to restore the fast path." |
| `design_system_token_conflict` | warning | DS and consumer both define the same token path | "`colors.brand` is defined by both `@acme/ds` and this config; the local value wins." |
| `design_system_version_changed` | info | manifest `version` differs from persisted state between runs | Backward-looking receipt: `[designSystem] @acme/ds: 1.0.0 → 1.1.0`. No network, never enforced. |

The split is deliberate: anything that breaks resolution is an `error`; drift and conflict with a defined fallback are
`warning`; the version receipt is `info`. The engine owns chain/version/conflict diagnostics (it holds the resolved state);
the host owns not-found/peer-range (it owns module resolution). Panda never makes a registry call, never nudges to upgrade,
and never checks versions against anything but the consumer's own lockfile — staying on `@acme/ds@1.0.0` forever is fully
supported.

## Delivery in phases

The feature is too large to land safely at once. Each phase is independently mergeable, is a no-op for existing users until
the field is wired, and is ordered so the **fs-free engine primitives land and are tested before any host wiring depends on
them**.

1. **Manifest value + engine gen/load (no user-facing change).** `DesignSystemManifest` type; `create` + `validate` over a
   `Project` value; (de)serialization. Unit-tested in-memory at Rust + native + wasm levels. No config field, no CLI.
2. **`designSystem`, single level. ✅ Complete.** Public `designSystem` config field; host
   (`packages/config` `loadDesignSystemPreset`) resolves the manifest, merges its preset as the lowest layer (user wins),
   auto-wires the dual-root importMap (DS roots + local outdir), and validates the manifest's `schemaVersion` + Panda
   peer-range before loading — a consumer outside the DS's major (e.g. Panda <2 against a `^2.0.0` DS) is rejected.
   The node driver (`packages/compiler` `hydrateDesignSystem`) hydrates the library's build info, keyed by DS name, so its
   components are never re-extracted. Diagnostics: not-found, version-mismatch, peer-range. Manifest/preset/build-info
   registered as build deps. _Deferred to later phases:_ build-info tree-shaking to app imports (optimization) and the
   stale-build-info `files` re-extract fallback (Phase 5).
3. **Nested chains. ✅ Complete.** A manifest's own `designSystem` field links to its parent. The host
   (`packages/config` `loadDesignSystemChain`) walks that chain, resolving each parent against the **previous manifest's
   directory** (not the consumer cwd, so transitive parents work in workspaces and Docker layers), guards cycles with a
   visited set, and merges presets root → leaf (ancestors lowest, leaf and app override). The node driver
   (`packages/compiler` `hydrateDesignSystem`) hydrates each level under its own name. Diagnostics: cycle,
   parent-not-found. The engine `resolveChain` primitive (root-first order, diamond dedup, cycle path) lands with single
   level and is tested as in-memory arrays (depth-N, diamond, cycle); the host walk is tested end-to-end (depth-2 merge
   order, dual importMap roots, resolve-against-manifest-dir, cycle, parent-not-found).
4. **Smart `include`.** Bare specifiers resolve via Node resolution: manifest present → redirect; no manifest → auto-glob +
   extract. Diagnostic: in-include (batched).
5. **`panda lib` + propagation.** The command (+ `--watch`): glob `src/` → `create` → write manifest/buildinfo/preset → sync
   exports. Register resolved paths as build deps; drift receipt + persisted state; stale-buildinfo fallback; token-conflict
   warning. Remove `ship`/`emit-pkg` with a migration note.
6. **Overlay codegen / virtual styled-system.** The app emits only its delta; per-package layer ordering; merged type
   surface. Tracked in [virtual-styled-system.md](./virtual-styled-system.md).

Phases 1–3 carry the technically hard logic and are all proven without touching disk. Phases 4–6 are host and ergonomics
wiring on top.

## Decisions

These were open; resolving them is the point of the note. Each is a recommendation with rationale, not a deferral.

- **Manifest location → standalone `panda.lib.json`.** Not a `package.json` field. It is explicit, discoverable, listed in
  `exports`, and can be generated/gitignored without churning `package.json`. The cost (one more file) is worth the clarity.
- **Stale build-info → re-extract that layer, warn, don't fail.** If the manifest ships `files`, hydrate failure falls back
  to re-extracting that one library's source and emits `design_system_buildinfo_stale`. Fail closed only when no `files`
  fallback exists. This keeps a version skew from breaking the whole build. `files` should be in every published manifest.
- **Token conflict → local wins, warn.** Consistent with preset override semantics: the consumer's config beats the DS. Emit
  `design_system_token_conflict` so the override is visible, not silent.
- **Conditions → name-keyed, consumer wins.** A library's `_dark` selector and the consumer's are reconciled by name; the
  consumer's definition wins on conflict. A library that needs a bespoke dark selector should name its condition distinctly
  rather than redefining `_dark`.
- **`staticCss` → travels automatically, no manifest field.** A library's `staticCss` rules are extracted into its build info
  at `panda lib` time like any other usage, so they hydrate into the consumer with everything else. No separate opt-in field;
  no separate CSS blob.
- **CSS layer ordering → `@layer ds-{name}`, root-first.** A single layer-order statement declares ancestors before
  descendants before the app, matching preset inheritance precedence.
- **Public/private token visibility → out of scope here.** Stripping raw/component tokens from a consumer's IntelliSense while
  keeping them usable inside the DS is a real need, but it is a preset/type-surface concern orthogonal to the manifest. Track
  it separately.

## Unresolved questions

- **TS path generation.** Does the consumer need generated `tsconfig` `paths` for the DS styled-system, or do `package.json`
  exports suffice across all bundlers? Leaning on exports; revisit if a bundler can't resolve the dual-root map.
- **Workspace protocol resolution.** `designSystem: '@acme/ds'` where the dependency is `workspace:*` — confirm the
  resolve-against-manifest-dir walk handles the symlink without special-casing.
- **Versioned federation output.** One CSS bundle per DS version for independently built micro-frontends — the deferred
  federated case; needs a cross-app coordination story before it's worth building.

## Related notes

- [Build info](./build-info.md) — the portable extraction cache the manifest points at; wire format, hydrate, tree-shaking.
- [Virtual styled-system](./virtual-styled-system.md) — consume-side styled-system delivery, dual-root importMap, overlay codegen.
- [Config loading](./config-loading-design.md) — preset resolution and the config snapshot the host merges into.
- [Compiler diagnostics](./compiler-diagnostics.md) — the `Diagnostic` model and code/severity conventions these follow.
