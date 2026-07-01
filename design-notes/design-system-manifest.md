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

A Panda design system is an npm package that ships components and the Panda config they were built against.

The consumer writes one field:

```ts
export default {
  designSystem: '@acme/ds',
}
```

The library publishes one manifest, `panda.lib.json`. The manifest points to the library preset, portable build info,
import roots, fallback files, and optional parent design system. The author creates all of it with:

```sh
panda lib
```

The important boundary: Rust owns pure value logic. TypeScript owns Node resolution and disk writes. That keeps chain
ordering, manifest validation, and hydration logic testable without a fixture filesystem.

## The problem this solves

Today, adopting a component library means hand-wiring several config knobs:

```ts
import { acmePreset } from '@acme/ds/preset'

export default defineConfig({
  presets: ['@pandacss/dev/presets', acmePreset],
  importMap: '@acme/ds',
  include: ['./src/**/*.{ts,tsx}', './node_modules/@acme/ds/dist/panda.buildinfo.json'],
})
```

That is easy to get wrong. The app also re-extracts library components even though the library already extracted them.

`designSystem` replaces that with one consumer field and one author command.

## Goals and non-goals

Goals:

1. One consumer field: `designSystem: '@acme/ds'`.
2. One author command: `panda lib`.
3. No normal re-extraction of design-system source. Hydrate its build info instead.
4. Parent design systems work without source reach-in.
5. Resolution works in workspaces, symlinks, and Docker layers.
6. Misconfiguration gets actionable diagnostics.

Non-goals:

- Plural `designSystem`. Keep the field singular for now.
- Competing token sources as a feature. If both sides define `colors.brand`, local wins and Panda warns.
- Runtime manifest consumption.
- Registry integration or auto-publishing.
- Full micro-frontend federation guidance.

## The model uses two fields

`designSystem` and `include` answer different questions.

- `designSystem`: "What is my design language?" Use this for a package that defines tokens, recipes, conditions, and
  ships `panda.lib.json`.
- `include`: "Which files use that design language?" Use this for app source and packages that consume a design system
  but are not design systems themselves.

A package with `panda.lib.json` belongs in `designSystem`. If it appears in `include`, Panda reports
`design_system_in_include`.

### Why `designSystem` is singular

Cases that look plural are usually not plural:

- `@acme/charts` consumes `@acme/ds`, so it belongs in `include`.
- `@acme/marketing-ds` extends `@acme/foundations`, so the child manifest records the parent.
- Migrating from `@acme/v1` to `@acme/v2` can keep v1 in `include` while v2 becomes the active design system.

The real plural case is two design systems defining the same token path. That creates precedence, condition, layer, and
hash-space questions. We should not add that surface without clear demand.

## The manifest is the package contract

The library publishes `panda.lib.json`. Every path is relative to the manifest's own directory, so the same manifest
works from `node_modules`, a workspace symlink, or a Docker layer.

```jsonc
{
  "schemaVersion": 1,
  "name": "@acme/ds",
  "version": "1.2.3", // informational; never enforced
  "panda": "^2.0.0", // peer range the consumer must satisfy
  "preset": "./panda.preset.mjs", // compiled preset module
  "buildInfo": "./panda.buildinfo.json",
  "importMap": {
    "css": "@acme/ds/css",
    "recipes": "@acme/ds/recipes",
    "patterns": "@acme/ds/patterns",
    "jsx": "@acme/ds/jsx",
    "tokens": "@acme/ds/tokens",
  },
  "designSystem": "@acme/foundations", // optional parent
  "files": ["../src/button.tsx"], // fallback when build info can't hydrate
}
```

Field meanings:

- `preset`: compiled `.mjs` config. It carries token definitions, recipes, utilities, conditions, and font-face config.
- `buildInfo`: portable extraction cache. It carries token usage and encoded atoms/recipes.
- `importMap`: package roots used by the library's compiled JSX.
- `designSystem`: this library's parent design system, if any.
- `panda` and `schemaVersion`: compatibility guards.
- `files`: fallback files for stale or incompatible build info.

## Rust owns values, TypeScript owns files

The compiler exposes value-level design-system operations:

```ts
compiler.designSystem.create(input)
compiler.designSystem.validate(manifest)
compiler.designSystem.load(manifest, { buildInfo })
compiler.designSystem.resolveChain(manifests)
```

These methods take plain data and return plain data. They do not read from disk.

| Layer                 | Owns                                                               | Touches files? |
| --------------------- | ------------------------------------------------------------------ | -------------- |
| Rust engine           | manifest types, create, validate, load, chain ordering             | no             |
| Native/wasm bindings  | flat primitives over the engine                                    | no             |
| `compiler-shared`     | JS facade and shared types                                         | no             |
| TypeScript host + CLI | Node resolution, reading manifests, writing artifacts/package.json | yes            |

## The producer flow

`panda lib` loads the author's config, scans package source, writes artifacts, and syncs package exports.

It writes:

```txt
dist/panda.lib.json
dist/panda.buildinfo.json
dist/panda.preset.mjs
```

`panda.preset.mjs` is bundled from the author config, but app-only fields are stripped:

```txt
designSystem
include
exclude
outdir
cwd
watch
clean
gitignore
importMap
```

That means a nested library ships only its own additions. The parent travels through the manifest's `designSystem`
field.

`panda lib` also safely syncs package exports:

```jsonc
{
  "exports": {
    ".": "./dist/index.js",
    "./panda.lib.json": "./dist/panda.lib.json",
    "./preset": "./dist/panda.preset.mjs",
  },
}
```

It preserves existing root exports, including string and conditional root export forms.

### Fallback files in workspaces and published packages

Build info is the normal path. Consumers should hydrate `panda.buildinfo.json`, not re-scan the library.

`files` is only the fallback path. Panda uses it when build info is stale or incompatible.

By default, `panda lib` infers `files` from the modules it parsed and writes paths relative to `panda.lib.json`:

```txt
packages/ds/
  src/button.tsx
  dist/panda.lib.json
```

```json
{
  "files": ["../src/button.tsx"]
}
```

That is the right default for monorepos and packages that publish source.

Built-only packages should declare the files they actually publish:

```sh
panda lib --files './**/*.{js,mjs}'
```

Do not guess `src/*` to `dist/*`. Node can resolve package exports, but it cannot tell Panda how a library's build
mapped source files to output files. The package author owns that contract.

### Monorepo task runners own the chain

`panda lib` is the producer task. The consumer can be `panda dev`, `@pandacss/vite`, or `@pandacss/postcss`.

In a monorepo, the task runner should wire the chain:

```txt
foundations:panda-lib -> ds:panda-lib -> app:panda-dev
```

The app watches design-system artifacts. It should not silently build every upstream package from source.

Turbo-style setup:

```jsonc
{
  "tasks": {
    "lib": {
      "dependsOn": ["^lib"],
      "outputs": ["dist/panda.lib.json", "dist/panda.buildinfo.json", "dist/panda.preset.mjs"],
    },
    "dev": {
      "cache": false,
      "persistent": true,
    },
    "lib:watch": {
      "cache": false,
      "persistent": true,
    },
  },
}
```

Nx-style setup:

```jsonc
{
  "targetDefaults": {
    "lib": {
      "dependsOn": [{ "projects": "{dependencies}", "target": "lib" }],
      "outputs": [
        "{projectRoot}/dist/panda.lib.json",
        "{projectRoot}/dist/panda.buildinfo.json",
        "{projectRoot}/dist/panda.preset.mjs",
      ],
      "cache": true,
    },
  },
}
```

For local development, run the producer watchers and the app watcher together:

```sh
  panda lib --watch # in each design-system package
  panda dev         # or Vite/PostCSS in the app
```

That keeps ownership clear. Design-system packages produce artifacts. Apps consume artifacts. The repo tool handles
ordering.

Vite owns a dev server, so `@pandacss/vite` registers the design-system manifest, preset, build-info, and manifest
`files` source matches as watch inputs. Artifact changes reload the driver, then re-parse consumer files so app atoms
stay present. Source matches are routed through the compiler's incremental file change path for monorepo feedback while
`panda lib --watch` updates the authoritative artifacts. PostCSS registers the same files through dependency messages;
build tools that honor those messages will rebuild when design-system artifacts or source fallback files change.

## The consumer flow

When an app config has `designSystem: '@acme/ds'`, the host:

1. Resolves `@acme/ds/panda.lib.json`.
2. Reads that manifest.
3. Walks the manifest's parent chain, resolving each parent from the previous manifest's directory.
4. Orders the chain root-first.
5. Imports each `panda.preset.mjs`.
6. Merges presets under the app config, so the app wins.
7. Creates the compiler driver.
8. Hydrates each design system's `panda.buildinfo.json`.

If build info is stale but the manifest has `files`, Panda scans those files relative to the manifest directory and
emits `design_system_buildinfo_stale`. If there are no fallback files, Panda fails closed.

## Flow sketch

```txt
PRODUCER: @acme/ds
────────────────────────────────────────────────────────────

  panda lib
     │
     ▼
  load panda.config.ts
     │
     ├───────────────► scan library source
     │                       │
     │                       ├──► create panda.buildinfo.json
     │                       └──► create panda.lib.json manifest
     │
     └───────────────► compile panda.preset.mjs
                             │
                             ▼
                       strip app-only fields
                       include / outdir / importMap / designSystem

  panda.lib.json + panda.buildinfo.json + panda.preset.mjs
     │
     ▼
  write dist artifacts
     │
     ▼
  sync package.json exports
     ├── ./panda.lib.json -> ./dist/panda.lib.json
     └── ./preset         -> ./dist/panda.preset.mjs
```

```txt
CONSUMER APP
────────────────────────────────────────────────────────────

  designSystem: "@acme/ds"
     │
     ▼
  resolve @acme/ds/panda.lib.json
     │
     ▼
  read manifest
     │
     ▼
  has parent designSystem?
     │
     ├── yes ──► resolve parent chain ──► order root-first
     │
     └── no ───► use current manifest
                              │
                              ▼
                       import panda.preset.mjs
                              │
                              ▼
                       merge configs

        parent DS preset
             ↓
        child DS preset
             ↓
        app config wins

                              │
                              ▼
                       create compiler driver
```

```txt
HYDRATION
────────────────────────────────────────────────────────────

  compiler driver
     │
     ▼
  read panda.buildinfo.json
     │
     ▼
  build info valid?
     │
     ├── yes ──► hydrate pre-extracted atoms / recipes
     │
     └── no
          │
          ▼
      manifest has fallback files?
          │
          ├── yes ──► scan fallback files relative to manifest dir
          │              │
          │              ▼
          │         warn: design_system_buildinfo_stale
          │              │
          │              ▼
          │         continue build
          │
          └── no ───► fail closed

     │
     ▼
  check token path conflicts
     │
     ├── conflict ──► warn: design_system_token_conflict
     │                   local app value wins
     │
     └── no conflict

     │
     ▼
  generate app CSS / codegen
```

## Nested design systems

A design system can extend another design system:

```ts
// @acme/marketing-ds/panda.config.ts
export default {
  designSystem: '@acme/foundations',
  theme: {
    semanticTokens: {
      colors: {
        campaign: { value: '{colors.pink.500}' },
      },
    },
  },
}
```

`panda lib` records `@acme/foundations` in the marketing manifest. A consumer only writes:

```ts
export default {
  designSystem: '@acme/marketing-ds',
}
```

The host resolves the chain against package locations, not the app cwd:

```txt
app -> @acme/marketing-ds -> @acme/foundations
```

Merge and hydrate order is root-first:

```txt
foundations
marketing-ds
app config
```

Cycle and missing-parent failures are config errors.

## Module and type resolution

The manifest `importMap` is the source of package roots:

```jsonc
{
  "css": "@acme/ds/css",
  "recipes": "@acme/ds/recipes",
  "patterns": "@acme/ds/patterns",
  "jsx": "@acme/ds/jsx",
  "tokens": "@acme/ds/tokens",
}
```

The host merges these roots with the app's local styled-system root. That gives two valid roots:

- Library components keep importing `@acme/ds/css`.
- App code keeps importing its local styled-system.

The generated styled-system subpath exports (`./css`, `./recipes`, and friends) are tracked separately in
[virtual-styled-system.md](./virtual-styled-system.md).

## CSS layering and tree-shaking

Build info is keyed by source module. When the app imports one component, Panda can hydrate only the modules reachable
from that import.

Hydrated CSS is emitted under design-system layers, ordered root-first before the app:

```css
@layer ds-foundations, ds-marketing, app;
```

Identical atoms still dedupe by normal atom identity. Versioned federation output is not part of this phase.

## Versioning and breaking changes

A "major change" in a design system is two different things, and Panda treats them differently.

**Engine or format break.** A release whose manifest raises `schemaVersion`, or whose `panda` peer range no longer
matches the consumer, is a hard incompatibility. Hydration fails closed with an actionable error. These are the only
compatibility gates Panda enforces.

**Token-shape break** — renaming, removing, or restructuring tokens. Panda does not police this. The manifest `version`
is informational and never enforced; registry and version policy are non-goals. The design-system author owns declaring
the break through normal semver and a changelog, and the consumer absorbs it by updating the dependency and
regenerating. Panda can watch local design-system artifacts/source fallback files in dev, but package version policy and
registry updates remain outside the manifest contract.

Known limitation: when consumer code references a token the upgraded design system no longer defines, Panda emits it as
a literal CSS value with no diagnostic — so a breaking token removal degrades to dead CSS silently rather than a build
error. The token-aware lint plugin, which reads the resolved config, is the intended guardrail; a build-time warning for
unresolved token references is a possible follow-up.

## Diagnostics

Setup is where this feature succeeds or fails. Diagnostics should say what happened and what to do next.

| Code                                   | Severity | When                                                        |
| -------------------------------------- | -------- | ----------------------------------------------------------- |
| `design_system_manifest_not_found`     | error    | `designSystem` set but no `panda.lib.json` resolves         |
| `design_system_in_include`             | error    | a manifest-bearing package appears in `include`             |
| `design_system_version_mismatch`       | error    | manifest `schemaVersion` does not match the running binding |
| `design_system_peer_range_unsatisfied` | error    | consumer Panda does not satisfy manifest `panda` range      |
| `design_system_cycle`                  | error    | the chain revisits a package                                |
| `design_system_parent_not_found`       | error    | a manifest parent does not resolve from the manifest dir    |
| `design_system_buildinfo_stale`        | warning  | build info fails validation and fallback re-extract is used |
| `design_system_token_conflict`         | warning  | design system and app both define the same token path       |

Errors stop the build. Warnings continue when Panda has a clear fallback. The app config wins token conflicts.

## Delivery phases

1. **Manifest value + engine create/load.** In-memory Rust primitives, no user-facing config.
2. **Single-level `designSystem`. ✅ Complete.** Resolve one manifest, merge preset, validate peer range, hydrate build
   info.
3. **Nested chains. ✅ Complete.** Resolve parent manifests, order root-first, catch cycles and missing parents.
4. **Smart `include`. ✅ Complete.** Bare package specifiers in `include` expand to package source globs.
   Manifest-bearing packages are redirected to `designSystem`.
5. **`panda lib` + propagation. ✅ Complete.** Write manifest/buildinfo/preset, sync safe package exports, warn for
   token conflicts, and fall back on stale build info when `files` exists.
6. **Overlay codegen / virtual styled-system.** App emits only its delta; shared type/runtime surface lands through
   [virtual-styled-system.md](./virtual-styled-system.md).

## Decisions

- **Manifest file.** Use standalone `panda.lib.json`, not a `package.json` field.
- **Stale build info.** Re-extract that layer when `files` exists, warn, and continue.
- **Token conflict.** App config wins, and Panda warns. Conflict detection compares token paths after each design system
  preset and the app config are resolved into canonical `theme.tokens`/`theme.semanticTokens` shapes.
- **Conditions.** Match by name. App condition definitions win on conflict.
- **`staticCss`.** Travels through build info. No manifest field.
- **CSS layer order.** Root design systems before child design systems before the app.
- **Private token visibility.** Out of scope for this manifest. Track as a type-surface problem.
- **Version policy.** The manifest `version` is informational. Panda enforces only `schemaVersion` and the `panda` peer
  range; token-shape breaking changes are the author's semver responsibility, and an unresolved token in consumer code
  currently degrades to a literal value with no diagnostic.

## Field report from real consumers

These questions shaped the design, but they are supporting context rather than architecture.

### Splitting preset and components packages

The preset package is the design system. It ships `panda.lib.json` and belongs in `designSystem`.

The components package consumes that design system. It belongs in smart `include`.

### Bundled declarations cannot find generated styled-system types

This is a bundler externalization problem. The generated types are exported, but DTS bundlers can accidentally
re-resolve a local `styled-system` folder as input.

`panda lib` makes styled-system a real package export. Authors still need guidance to mark styled-system specifiers as
external during component bundling.

### Library and app each have their own styled-system

That breaks runtime identity, duplicates CSS, and can make `cx`/`cva` diverge. The manifest model gives the library and
app one shared runtime surface.

### Workspace package edits refresh JS but not CSS

Bundler HMR can refresh the component while Panda cssgen does nothing. Vite and PostCSS now register design-system
artifacts plus manifest `files` source matches as build deps, so CSS generation wakes up when workspace design-system
source changes.

### Panda should be a peer dependency

A design-system package should peer-depend on Panda. The manifest `panda` field is the range the consumer must satisfy.

## Open follow-ups

- Document and validate bundler externalization for styled-system package exports.
- Decide whether TS path generation is needed or package exports are enough across bundlers.
- Confirm workspace protocol and symlink resolution for `designSystem: '@acme/ds'`.
- Design versioned federation output only if micro-frontend demand appears.

## Related notes

- [Build info](./build-info.md)
- [Virtual styled-system](./virtual-styled-system.md)
- [Config loading](./config-loading-design.md)
- [Compiler diagnostics](./compiler-diagnostics.md)
