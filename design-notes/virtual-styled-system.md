---
title: Virtual Styled-System (Design-System Consume)
status: draft
scope:
  - packages/config
  - packages/cli_v2
  - packages/compiler-shared
  - crates/pandacss_codegen
related:
  - OSS-2355
  - discussion/3522 #7
---

# Virtual Styled-System (Design-System Consume)

## Summary

A published design system should ship a **canonical `styled-system/` runtime** (types + `css` / recipes / patterns /
jsx helpers) on npm. Consuming apps should **not** regenerate and re-alias a full copy of that tree. Instead,
`designSystems` registers DS packages; the host resolves each manifest → **preset + buildInfo + styled-system
entrypoints**, merges presets without a duplicate `presets: ['@acme/ds/preset']` entry, and sets **`importMap` to both
the DS package paths and the app’s local `outdir`**. App `panda codegen` emits only the **overlay** artifacts required
when the app extends the merged config in ways that need new JS/TS modules (patterns with transforms, app JSX names,
callbacks, merged types).

This note is the consume-side companion to [build-info.md](./build-info.md) (portable extraction) and
[config-loading-design.md](./config-loading-design.md) (config snapshot). Discussion context: [Panda #3522](https://github.com/chakra-ui/panda/discussions/3522) item #7 (virtual / shared styled-system).

## Problem

Today each Panda project runs `panda codegen` and materializes a full local `styled-system/`. That works in monorepos
where every package owns its codegen. It breaks for npm-published design systems:

- DS ships `dist/styled-system`; app codegen produces a **second** tree.
- Consumers wire **bundler aliases** (`@/styled-system` → `@acme/ds/dist/...`) — fragile at scale.
- App preset extensions that need **generated modules** (custom patterns, JSX factories, merged types) have no clear
  split between “reuse DS runtime” and “emit app delta.”

## Goals

1. **DS owns the base styled-system** — published via `package.json` exports, built in DS CI.
2. **`designSystems` is the entrypoint** — manifest supplies `preset`, `buildInfo`, and styled-system import paths; no
   parallel `presets: ['@acme/ds/preset']` for registered DS packages.
3. **Dual `importMap`** — extraction matches imports from **both** `@acme/ds/...` (node_modules) **and**
   `./styled-system/...` (app overlay).
4. **Overlay codegen** — app runs codegen only for config extensions that require new JS/TS files; not a duplicate of the
   DS tree.
5. **Build-info hydrate** — DS component CSS travels via `panda.buildinfo.json`; app does not re-extract DS source.

Non-goals (for now): npm/pnpm **overrides** of a global `styled-system` package name; bundler-specific alias
generation (Panda-owned `importMap` is the primary contract).

## Manifest (package surface)

Each design-system npm package ships a manifest (JSON or `package.json` field — exact wire format TBD):

```json
{
  "schemaVersion": 1,
  "name": "@acme/ui",
  "panda": "^2.0.0",
  "preset": "./panda.preset.js",
  "buildInfo": "./styled-system/panda.buildinfo.json",
  "styledSystem": {
    "css": "@acme/ui/css",
    "recipes": "@acme/ui/recipes",
    "patterns": "@acme/ui/patterns",
    "jsx": "@acme/ui/jsx",
    "tokens": "@acme/ui/tokens"
  },
  "extends": "@acme/base"
}
```

`styledSystem` values are **import specifiers** (package export subpaths), not filesystem paths. The host maps them
into `importMap` after resolving the installed package location.

## Consumer config shape

```ts
// panda.config.ts — target (sketch)
export default {
  designSystems: ['@acme/ui'],
  // App overlay — merged on top of manifest preset(s); NOT a second DS preset import:
  patterns: { hero: { transform, properties } },
  conditions: { sidebar: '& [data-sidebar] &' },
  theme: { extend: { tokens: { … } } },
}
```

**No** `presets: ['@acme/ui/preset']` when `@acme/ui` is in `designSystems`. Escape hatch: `presets` remains for
non-DS config (`@pandacss/preset-base`, internal shared presets) and explicit overrides.

## Config resolution order

```txt
1. Resolve designSystems[] → manifests (node_modules / workspace)
2. Resolve manifest.extends / dependencies → transitive DS presets (stacked DS)
3. Import + merge manifest preset(s) → effective DS config
4. Merge user panda.config on top (app patterns, conditions, theme.extend, …)
5. Apply config defaults
6. Derive effective importMap (DS paths + local outdir) — see below
7. createConfigSnapshot → Rust compiler + callbacks
8. Hydrate each manifest buildInfo (tree-shaken to app imports)
9. codegen → local overlay only (see Codegen split)
10. cssgen / watch
```

Steps 1–8 are host/`config` + compiler; step 9 is `panda codegen` (or driver codegen phase).

## `importMap` input shapes (v1 parity)

Author-facing `config.importMap` accepts **three input forms** (same contract as v1 `@pandacss/types` / `packages/core/src/import-map.ts`). The host **normalizes** all forms to a single internal `ImportMapOutput` — category keys with **`string[]`** values — before `createConfigSnapshot` and the Rust extractor.

```ts
type ImportMapInput = {
  css?: string | string[]
  recipes?: string | string[]
  patterns?: string | string[]
  jsx?: string | string[]
  tokens?: string | string[]
}

type ImportMapOption = string | ImportMapInput

// Author config:
importMap?: ImportMapOption | ImportMapOption[]
```

### String — one styled-system root

Expands to every category by appending the conventional subpath:

```ts
importMap: '@acme/ui'
// normalizes to:
{
  css: ['@acme/ui/css'],
  recipe: ['@acme/ui/recipes'],
  pattern: ['@acme/ui/patterns'],
  jsx: ['@acme/ui/jsx'],
  tokens: ['@acme/ui/tokens'],
}
```

### Array of strings — multiple roots (DS + local)

Each entry expands like the string form; results are **concatenated per category**:

```ts
importMap: ['@acme/ui', './styled-system']
// normalizes to:
{
  css: ['@acme/ui/css', './styled-system/css'],
  recipe: ['@acme/ui/recipes', './styled-system/recipes'],
  pattern: ['@acme/ui/patterns', './styled-system/patterns'],
  jsx: ['@acme/ui/jsx', './styled-system/jsx'],
  tokens: ['@acme/ui/tokens', './styled-system/tokens'],
}
```

This is the **recommended author shape** for DS consume when not relying solely on auto-wiring: one string for the DS
package root, one for the app `outdir` basename.

### Object — per-category control

Each field is `string | string[]`. Omitted categories default to `{outdir}/{category}` (legacy v1 behavior):

```ts
importMap: {
  css: ['@acme/ui/css', './styled-system/css'],
  patterns: './styled-system/patterns', // app overlay only — DS patterns matched via @acme/ui root elsewhere
}
```

Use the object form when categories should **not** share the same roots (e.g. DS for `css`/`recipes`, local-only for
`patterns`/`jsx` after overlay codegen).

### Internal contract (Rust / snapshot)

After normalization, `SerializedConfig.importMap` is always the expanded object with **`recipe`** (singular key, v2 Rust
alias for `recipes`). The extractor matches import sources by **substring** against each category array (see
[extraction-pipeline.md](./extraction-pipeline.md)).

Normalization lives in **`@pandacss/compiler-shared`** (`normalizeImportMap`, `prepareCompilerConfig`), applied in
`config` snapshots and native/wasm bindings before Rust. Rust only accepts the expanded `ImportMapOutput` shape.

## `designSystems` + `importMap` merge

When `designSystems` is registered, the host **does not** require a duplicate DS preset entry. It **does** still derive
import paths for extraction:

1. For each resolved manifest, read `styledSystem` export roots (or derive from package name like string form above).
2. Normalize user `importMap` (if any) via the same string | array | object rules.
3. **Merge** auto DS paths with user paths — default: **prepend DS roots, append user roots** per category (same as
   array-of-strings semantics).

**Minimal app config (auto-wired):**

```ts
export default {
  designSystems: ['@acme/ui'],
  patterns: { hero: { … } },
  // importMap omitted → host synthesizes:
  //   ['@acme/ui', '<outdir>']  (string array merge)
}
```

**Explicit dual-root (equivalent):**

```ts
export default {
  designSystems: ['@acme/ui'],
  importMap: ['@acme/ui', 'styled-system'],
  patterns: { hero: { … } },
}
```

**Fine-grained (object):**

```ts
export default {
  designSystems: ['@acme/ui'],
  importMap: {
    css: '@acme/ui/css',
    recipes: '@acme/ui/recipes',
    patterns: ['@acme/ui/patterns', 'styled-system/patterns'],
    jsx: ['@acme/ui/jsx', 'styled-system/jsx'],
  },
}
```

**Why both DS and local must appear (in any form):**

| Source import | Matched when |
| ------------- | ------------ |
| `import { css } from '@panda/css'` | Bundler/tsconfig resolves to a path substring in `importMap.css` (DS and/or local) |
| `import { button } from '@acme/ui/recipes'` | DS root in `importMap.recipe` |
| `import { hero } from '@panda/patterns'` | Local `styled-system/patterns` in `importMap.pattern` (overlay codegen) |
| DS package source using `@acme/ui/css` | DS root in `importMap.css` |

User `importMap` **merges with** auto-generated DS entries; it does not replace them unless an explicit opt-out is
added later (`importMapDesignSystems: false` or similar — TBD).

Stacked DS (`@acme/ui` extends `@acme/base`): merged importMap includes **each registered DS root** that appears in
manifest resolution (leaf first), then user roots, then local outdir. Transitive preset merge already folded base into the
effective config; importMap only needs paths that appear in **source imports**.

## Dual-root resolution (summary)

Regardless of author syntax, the **effective** normalized map for a typical DS app looks like:

```ts
{
  css: ['@acme/ui/css', 'styled-system/css'],
  recipe: ['@acme/ui/recipes', 'styled-system/recipes'],
  pattern: ['@acme/ui/patterns', 'styled-system/patterns'],
  jsx: ['@acme/ui/jsx', 'styled-system/jsx'],
  tokens: ['@acme/ui/tokens', 'styled-system/tokens'],
}
```

String/array/object are equivalent ways to author that; `designSystems` auto-wiring produces the same via
`['@acme/ui', outdir]`.

## Codegen split: DS base vs app overlay

### DS publishes (CI, once)

Full styled-system for **DS config at publish time**:

```txt
@acme/ui/styled-system/
  css/          ← css(), cva(), cx(), …
  recipes/
  patterns/
  jsx/
  types/        ← SystemStyleObject for DS contract
  tokens/
  panda.buildinfo.json
```

### App generates (overlay, when needed)

`panda codegen` runs against the **merged config** (DS preset + app extensions) but writes **only artifacts the DS
package does not ship**:

| Extension kind | Needs local JS/TS? | Overlay output |
| -------------- | -------------------- | -------------- |
| Tokens / semantic tokens | Types only (optional) | `types/` merge or augment |
| Utilities (standard) | Types only | `types/` |
| Conditions | Types only | `types/` |
| Config recipes (new names) | `recipes/*.mjs` + types | `recipes/`, `types/` |
| Pattern + `transform` | `patterns/*.mjs`, `codegenSource`, jsx | `patterns/`, `jsx/`, `types/` |
| `utility.transform` / `utility.values` | callbacks + types | callbacks in snapshot; no duplicate `css()` |
| App-only JSX pattern | `jsx/*.mjs` | `jsx/`, `types/` |

**Default overlay layout:**

```txt
app/styled-system/
  css/index.mjs           ← re-export @acme/ui/css (optional barrel; importMap may skip if dual-path)
  patterns/hero.mjs       ← app-only
  jsx/hero.mjs
  types/index.d.ts        ← merged DS + app (codegen from full effective config)
  index.mjs               ← optional public barrel for the app package
```

Codegen **must not** re-emit DS recipe/pattern files that already exist at `@acme/ui/...` unless the effective config
**changes** a DS-owned definition (warn / conflict — policy TBD).

### When overlay codegen runs

- App adds/changes patterns, conditions, recipes, or callbacks that need files.
- `diffConfig` / codegen deps signal `patterns.*`, `conditions.*`, etc. changed.
- DS version bump: refresh lockfile; re-run overlay codegen if merged types change — DS base imports update via
  node_modules, not regeneration.

Config-only extensions (tokens, simple utilities) may need **types-only** regen with **no** new runtime modules — DS
`css()` in node_modules remains sufficient for CSS emit.

## End-to-end flow (app consuming `@acme/ui`)

```txt
@app
  panda.config.ts          designSystems: ['@acme/ui'], patterns: { hero }
        │
        ├─► manifest @acme/ui → preset + buildInfo + styledSystem paths
        │
        ├─► merged config ──► compiler (extract app source, emit app CSS)
        │
        ├─► importMap normalize → ['@acme/ui', 'styled-system'] (or equivalent object)
        │
        ├─► hydrate(buildInfo) ──► DS component CSS without re-extracting DS
        │
        └─► codegen (overlay) ──► styled-system/patterns/hero.* , types/
```

**App source:**

```tsx
import { css } from '@panda/css'           // → @acme/ui/css (importMap)
import { Button } from '@acme/ui/jsx/button'
import { hero } from '@panda/patterns'     // → ./styled-system/patterns/hero
```

## Stacked DS

Middle DS (`@acme/ui`) preset already extends `@acme/base`. App lists `designSystems: ['@acme/ui']` only; host resolves
`extends` and merges both presets. importMap uses **ui** styled-system paths by default; add **base** paths when the app
imports `@acme/base/...` directly. Hydrate ui buildInfo first; hydrate base when imports require base-only modules not
covered by ui’s artifact (see [build-info.md — Stacked design systems](./build-info.md#stacked-design-systems-ds-on-ds)).

## Package exports (DS)

```jsonc
{
  "name": "@acme/ui",
  "exports": {
    "./preset": "./panda.preset.js",
    "./manifest.json": "./panda.manifest.json",
    "./css": "./styled-system/css/index.mjs",
    "./recipes/*": "./styled-system/recipes/*",
    "./patterns/*": "./styled-system/patterns/*",
    "./jsx/*": "./styled-system/jsx/*",
    "./types": "./styled-system/types/index.d.ts"
  }
}
```

## Built vs deferred

- ✅ **Build info** — produce, hydrate, tree-shake, token identity ([build-info.md](./build-info.md)).
- ✅ **importMap** as substring arrays — extractor supports multiple paths per category today (normalized `ImportMapOutput` only).
- ✅ **Preset merge** — `config` resolves authored presets.
- ✅ **importMap normalization** — `normalizeImportMap` / `prepareCompilerConfig` in
  [`packages/compiler-shared/src/import-map.ts`](../packages/compiler-shared/src/import-map.ts); applied in
  `config` snapshots and native/wasm compiler bindings before Rust.
- ⬜ **`designSystems` config field** — resolve manifest, merge preset, derive importMap, hydrate buildInfo.
- ⬜ **importMap auto-wiring** — prepend DS manifest roots + append `outdir`; merge with user string/array/object.
- ⬜ **Manifest wire format** — `styledSystem` paths, `extends`, optional `dependencies`.
- ⬜ **Overlay codegen** — emit only app delta; skip DS-owned modules; merged types from effective config.
- ⬜ **Virtual styled-system DX** — no bundler aliases required for DS consume; TS `paths` generation optional.

## Unresolved questions

- Manifest location: standalone `panda.manifest.json` vs `package.json` `"panda"` field vs `"exports"` convention.
- importMap merge: append-only vs user override wins vs explicit `importMap.designSystems: false` opt-out.
- Overlay codegen conflict when app redefines a DS pattern/recipe name.
- TS project references: generate `paths` in tsconfig from effective importMap or rely on package exports only.
- Monorepo workspace: `designSystems: ['workspace:@acme/ui']` resolution.
- Whether local `styled-system/css` re-export barrel is required or dual importMap alone is enough for all bundlers.

## Related

- [Build info](./build-info.md) — portable extraction, manifest sketch, stacked DS hydrate.
- [Config loading](./config-loading-design.md) — snapshot, callbacks, preset resolution.
- [Compiler lifecycle](./compiler-lifecycle.md) — Rust owns extract/emit + artifact generation; JS host orchestrates writes.
- [Output & host layer](./output-and-host-layer.md) — driver orchestration, config diff → codegen deps.
- [Panda #3522](https://github.com/chakra-ui/panda/discussions/3522) — virtual / shared styled-system (#7), buildinfo tree-shaking (#8).
