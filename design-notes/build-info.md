# Build Info

## Summary

`panda.buildinfo.json` is the **portable encoder state a design-system library ships** so a consuming app reuses its
pre-extracted styles instead of re-extracting the components. It backs `designSystem` + `panda buildinfo`. The JS
surface is one namespace:

```ts
compiler.buildInfo.create({ panda }) // producer (panda buildinfo); configFingerprint is engine-owned
compiler.buildInfo.configFingerprint // this compiler's fingerprint (introspection; strict consume guard deferred)
compiler.buildInfo.validate(info) // schema-compatible? (discriminated { ok })
compiler.buildInfo.modulesFor(info, ['Button']) // barrel imports → module keys
compiler.buildInfo.hydrate(info, { name, only }) // consumer (designSystem); `only` tree-shakes
```

It's a regenerable, key-validated cache: produce it from source, hydrate it (tree-shaken to imported components), and a
version guard falls back to re-extraction when the two sides can't safely share.

## Canonical scope

This note owns the build-info payload, token identity, hydration, module/export tree-shaking, and stacked hydrate
semantics. The `designSystem` field, `panda/lib.json`, parent-chain resolution, and diagnostics are owned by
[design-system-manifest.md](./design-system-manifest.md). Dual importMap and overlay codegen are owned by
[virtual-styled-system.md](./virtual-styled-system.md).

## Format (condensed)

Interned + positional so a 100-component library doesn't bloat. **Hashes aren't shipped** — `Atom`'s hash is one-way and
recomputed on hydrate.

```jsonc
{
  "schemaVersion": 5,
  "panda": "^2.0.0",                               // peer range (collision guard); author-supplied
  "configFingerprint": "cfg1-…",                          // engine fingerprint of output-affecting config
  "strings": ["color", "red", "padding", "4px", "colors.brand", "vt_xxx"], // intern table
  "atoms": [{ "p": 0, "v": 1 }],                   // [propIdx, valueIdx]; token values use `{ t, v }`
  "tokenRefs": [4],                                  // string indices for runtime token CSS-var usage
  "recipes": { "base": [...], "variants": [...] }, // interned EncodedRecipesSnapshot groups
  "viewTransitions": [{ "cls": 5, "old": { "opacity": 0 }, "new": { "opacity": 1 } }],
  "modules": {
    "button": { "atoms": [0], "recipes": [0], "tokenRefs": [0] },
    "transitions": { "viewTransitions": [0] }
  },
  "exports": { "Button": "button", "slide": "transitions" }
}
```

A value is a bare index (string), `{ t, v }` (token path + resolved value), or `{ n }` (number — preserving the
px-driving type tag). Full atom/recipe data is kept (not pre-built CSS) so the consumer re-emits with **token identity**
preserved instead of reducing tokens to opaque CSS values. Top-level `tokenRefs` entries point into `strings`; each
module's `tokenRefs` entries point into that top-level array, preserving import-based tree-shaking.

**Token definitions are not in build info.** The artifact carries token _usage_ (path + producer-resolved value at
extraction time); the consumer's **tokens layer** still comes from its own config (typically the lib preset merged in
via the manifest — see [design-system-manifest.md](./design-system-manifest.md)). Hydrated utilities reference
`var(--path)`; the consumer's `TokenDictionary` supplies the final CSS value at emit time.

Runtime `token()` / `token.var()` calls that require a CSS variable are carried separately in `tokenRefs`. They may not
produce an atom or recipe—for example, an exported `token.var('colors.brand')` value—but still seed `removeUnusedTokens`
after hydration. Primitive `token()` calls that inline a non-variable value are intentionally not retained.

## Token identity (re-emit half)

End-to-end pipeline (engine + bindings):

1. **Extract** — `token('colors.brand.500')` / category-relative `'brand.500'` on a token-backed utility folds to
   `Literal::Token { path, value }` (path preserved, value = producer-resolved CSS).
2. **Encode** — `AtomValue::Token { path, value }`; wire JSON for live atoms still exposes the resolved string (backward
   compatible).
3. **Build info** — `BuildValue::Token { t, v }` interned in the artifact; round-trips through JSON.
4. **Hydrate** — consumer project restores `AtomValue::Token`; atoms dedup/hash on path + resolved value.
5. **Emit** — utilities keep `var(--…)` when the consumer utility/token contract matches; the **consumer tokens layer**
   provides the themed value (lib `#ef4444` vs consumer `#3b82f6` for the same path).

This is **correctness-critical for cross-theme consumption** and is covered at Rust + native binding levels
(`build_info_preserves_token_identity`, `hydrates token-backed build info against the consumer theme`). It does **not**
replace preset delivery: the cross-config tests intentionally give both sides the same utility definition
(`color.values: 'colors'`) and token paths — only the _values_ differ.

## Tree-shaking

The unit is the **library source file** (`button.tsx` → module `button`), reusing the encoder's per-`FileEntry` grouping
— no `Atom` rewrite. Atoms attribute to their **call site's** file, so transitive helpers/patterns land in the right
module and shared tokens stay module-independent (tokens layer). Two exports in one file share one module: import either
and you hydrate both.

### Opt-in consume narrowing

```ts
optimize: {
  treeshakeDesignSystem: true
}
```

Off by default — without it, every design-system build-info module hydrates. With it on, the host scans the app's
`include` sources **once** and feeds every package in the `designSystem` chain (`designSystemImportSelections` on the
native/wasm compiler). Export names go to `designSystem.load({ imports })` → `modulesFor()` → `hydrate({ only })`.

| app import                                                       | result                                        |
| ---------------------------------------------------------------- | --------------------------------------------- |
| `{ Button } from '@acme/ds'`                                     | modules for `Button` only                     |
| `@acme/ds/button` (subpath)                                      | stem / module key (`button`, `button.tsx`, …) |
| `export { Button } from '@acme/ds'`                              | same as a named import                        |
| `import *` / `export *` / side-effect / `import()` / `require()` | all modules                                   |
| no DS imports                                                    | nothing                                       |
| `@acme/ds/css`, `/tokens`, `/recipes`, `/patterns`, `/jsx`       | ignored (styled-system subpaths)              |

Every merged, layer, keyframe, or split CSS read/write runs the shared Driver preparation hook. `NodeDriver` uses that
hook to call `syncDesignSystemTreeShake`. The scan prefers in-memory source from `applyChange` over disk, so watch hosts
generate CSS from the latest imports.

If `imports` is non-empty but nothing resolves (missing `exports` map, typo), load **fails open** to full hydrate —
better over-include CSS than ship an empty sheet. Modules that only publish `tokenRefs` stay selected under narrowing so
token pruning still sees live refs.

### How names map to modules

The barrel case needs `exports`, which the **engine** emits (it has the AST; the CLI would have to re-parse): export
facts resolve to the style-contributing module (`pandacss_extractor::collect_export_info` → `FileEntry.exports` →
`BuildInfo.exports`). A component consumed via JSX (`<Button>`) attributes its recipe to its module like any call, so
its export resolves to the recipe-carrying module. Consumer lookup is O(1) via `modulesFor`. Covered today:
locally-declared exports (`export function/const/class`, `export { local as Public }`), named re-exports
(`export { X as Y } from './y'`), star re-exports (`export * from './y'`), and default re-exports
(`export { default as Button } from './button'`). Namespace stars (`export * as DS from './ds'`) intentionally fall back
to the namespace-import path for now.

## Recipes, slot recipes, patterns

Two paths, by how the engine encodes each:

- **Atoms path** — **patterns** and **inline `cva`/`sva`** both decompose to plain **atoms** in their module, so they
  travel + tree-shake through `atoms` with no extra structure. (Verified: an inline `cva` leaves the recipe snapshot
  empty and lands in `atoms`.)
- **Keyed recipe path** — **config recipes + slot recipes** emit grouped class names (`.button`, `.tabs__root--…`), a
  separate keyed structure. Build info carries the interned `EncodedRecipesSnapshot` (base/variant groups; slots carry a
  `slot`) with per-module provenance. Hydrate merges the deserialized groups into the consumer's **emit snapshot** — the
  emitter consumes the flat `EncodedRecipesSnapshot`, so there's no `RecipePartKey`/`RecipeVariantKey` reconstruction or
  refcount surgery.

## View transitions

`viewTransition({…})` has its own path, separate from atoms and config recipes. Build info stores a top-level
`viewTransitions` array, deduplicated by final `class_name`, plus per-module indices. Slot bodies remain opaque JSON.

During hydration, library entries merge before local entries. A design system that hydrates and republishes a parent
serializes only its own `view_transitions`. It must not emit the parent's data again. This matches the rule that
excludes `buildinfo:*` atom files.

See [view-transition-api.md](./view-transition-api.md).

## Collision safety

`validate` checks the wire `schemaVersion` and required top-level shape without changing state. `hydrate` calls it
first. If any intern, atom, recipe, token-ref, or view-transition index is invalid, the engine rejects the entire input
and returns `{ ok: false, reason: 'corrupt' }`. It does not throw or hydrate partial CSS.

When `files` is available, the host recovers by extracting the library source again. Manifest schema and Panda version
range checks are separate package-contract gates and remain fail-closed.

`configFingerprint` is the **engine's own** fingerprint (`Project::config_fingerprint`, also exposed on the NAPI binding
as `configFingerprint()`), not a JS re-derivation. It hashes the resolved `UserConfig` with machine-local IO / codegen
fields removed and object keys canonically ordered, so the same producer configuration fingerprints identically across
checkouts. It is recorded for introspection today, but is not a strict consumer guard: an app legitimately extends the
design-system config and would fail full-config equality. The host separately compares normalized effective
`hash`/`prefix`/`separator` values before using prebuilt class names; a broader contract fingerprint remains deferred.

## Layering

- **Rust engine** (`crates/pandacss_project/src/build_info.rs`) owns the primitive: `Project::build_info()` (serialize,
  source-keyed) + `Project::hydrate()` (additive, schema guard). Knows atoms/recipes + per-file grouping, not packages.
- **NAPI** (`packages/compiler/crate`) **and WASM** (`packages/compiler-wasm/crate`) expose the same flat primitives —
  `serializeBuildInfo(panda)` / `applyBuildInfo` / `buildInfoSchemaVersion` / `configFingerprint`.
- **JS namespace** (`compiler-shared/src/build-info.ts`) builds `compiler.buildInfo.*` and owns validation + import
  resolution; attached identically by the native (`@pandacss/compiler`) and browser (`@pandacss/compiler-wasm`) hosts.
  The engine emits `exports` itself, so both bindings carry it.
- **`panda buildinfo`** (CLI, `packages/cli/src/commands/buildinfo.ts`) is the only package-aware layer: loads config →
  `parseFiles` → `buildInfo.create({ panda })` → writes `panda.buildinfo.json`. It remaps the engine's absolute scan
  keys to `cwd`-relative POSIX module ids — both `modules` keys and `exports` values; the `configFingerprint` is the
  engine's fingerprint (no JS hashing).

## Design-system boundary

`BuildInfo` stays the low-level engine payload: extracted atoms/recipes, module provenance, exports, and schema guard.
It is not the package manifest and it does not carry the executable preset. The package-level contract that ties a
preset, build-info file, import map, fallback files, and optional parent design system together is
[design-system-manifest.md](./design-system-manifest.md).

When a consumer uses `designSystem`, the host hydrates each manifest's build-info artifact. Narrowing is opt-in via
`optimize.treeshakeDesignSystem` — see [Opt-in consume narrowing](#opt-in-consume-narrowing) above.

Consume-side package layout, dual importMap, overlay codegen, and DS npm exports are covered in
[virtual-styled-system.md](./virtual-styled-system.md).

This also means `configFingerprint` should likely evolve from strict full-config equality toward a **contract shape**
check for design-system consumption: utility names/categories, class-name rules, conditions, recipe names, and similar
output-affecting contracts must match, while token values can differ so consumers can theme the same token paths.

## Stacked design systems (DS on DS)

A design system built on another design system still ships **its own** build info + preset. Build info answers “what did
**this package’s source files** extract?” — not “what does the whole inherited stack know?” Preset merge answers “what
**config contract** does the consumer need?” — including upstream tokens, utilities, and recipes.

**Rule of thumb:** preset chain = config inheritance; build info = per-package extraction cache.

### What each package ships

Every design-system package publishes a manifest (see [design-system-manifest.md](./design-system-manifest.md)) with two
artifacts:

| Artifact    | Role                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preset`    | Executable config — usually `presets: ['@acme/base/preset']` plus local extensions. Defines the encoding contract (utilities, recipes, conditions, token paths). |
| `buildInfo` | Portable encoder state from **`panda buildinfo` on this repo’s sources only**. Does not embed upstream build info.                                               |

Example stack:

```txt
@acme/base
  ├── panda.preset.js
  └── panda.buildinfo.json          ← styles extracted from base’s components

@acme/ui   (presets: [@acme/base])
  ├── panda.preset.js               ← extends base (tokens, recipes, …)
  └── panda.buildinfo.json          ← styles extracted from ui’s source only

@app
  ├── designSystem: '@acme/ui'       ← manifest resolves ui preset (ui preset already extends base)
  └── hydrate: ui buildInfo (+ base if needed; see stacked scenarios)
```

### Producer behavior (middle DS)

When `@acme/ui` runs `panda buildinfo`:

- Scans **ui repo files** with ui’s **fully merged config** (base preset folded in + ui overrides).
- Stamps `configFingerprint` for that **merged** encoding contract — not base alone.
- Captures token usages, atoms, and recipes **at ui call sites** only.

Styles that live purely in base and are never touched in ui source **do not** appear in ui’s build info. Pure re-exports
(`export { Button } from '@acme/base'`) contribute export names to ui’s package surface but not base’s extracted styles
— those remain in **base’s** artifact.

Ui wrappers that add local `css()` / JSX / recipe usage **do** land in ui’s build info (the delta on top of base).

### Consumer behavior (engine today)

The engine supports **multiple hydrates** with distinct `name`s — additive per package, replace-on-rehydrate for the
same name:

```ts
app.buildInfo.hydrate(baseInfo, { name: '@acme/base', only: baseModules })
app.buildInfo.hydrate(uiInfo, { name: '@acme/ui', only: uiModules })
```

Under the hood:

- Atoms attach to synthetic files `buildinfo:{name}` (re-hydrating the same `name` replaces that layer).
- Recipe snapshots store in `hydrated_recipes` keyed by `name` and **merge** into the emit snapshot at CSS generation.
- Atom dedup is content-addressed — identical atoms from two libs collapse to one utility class.

Tree-shaking is **per artifact, per module key**: `modulesFor(uiInfo, ['Card'])` → ui module keys; base modules need a
separate `modulesFor(baseInfo, …)` pass when the app imports base components directly or via re-exports ui does not
cover in its artifact.

### Scenarios

**App imports only from `@acme/ui` (ui re-exports base components).**

- **Preset:** App merges ui preset → inherits base contract through ui’s preset chain.
- **Build info:** Hydrate ui for ui-native modules. Also hydrate base when the app uses re-exported base components
  whose styles are **not** in ui’s artifact (common when ui is a thin barrel over base).

**`@acme/ui` is itself a library producer.**

- Ui’s `configFingerprint` reflects base + ui — consumers must match that **full** contract (via ui preset), not base
  alone.
- Ui’s build info remains ui-local extraction; base consumers still need base’s artifact for base-only components.

**Token theming across the stack.**

- Build info carries token _path_ + producer-resolved value (`{ t, v }`); emit uses the **consumer’s** token layer.
- Base defines `colors.brand.500`; ui may extend in preset; app themes the same path — works when utility/token
  contracts align.

### Host consume boundary

Manifest resolution and diagnostics are owned by [design-system-manifest.md](./design-system-manifest.md). The
build-info-specific rule is: hydrate each package independently; never merge build-info JSON blobs. Presets merge in the
config layer, while build info merges only through hydrated emit output. On a build-info schema, shape, or corruption
failure for one layer, the host falls back to that package's published source when `files` exists, or fails closed for
that layer.

**Transitive discovery that is still deferred:**

- Today: parent chains travel through `manifest.designSystem`. There is no separate plural dependency list that says “ui
  also needs base build info” unless the parent is declared as that chain.
- Build-info `exports` maps are **in-repo only** — they do not resolve into `node_modules`. Cross-package barrel
  resolution is a host concern (manifest + import graph).

### Practical guidance

```txt
1. Ship build info from every layer consumers can import from.
2. App hydrates each package in the manifest chain. Import-based tree-shaking is still a host follow-up.
3. Match class-name options across producer and consumer; broader contract fingerprinting is still deferred.
4. When in doubt, declare the parent in `manifest.designSystem` so the consumer hydrates both layers.
```

Track remaining stacked-DS consume work under [Remaining — consume polish](#remaining--consume-polish) below.

## vs legacy (v1)

v1 (`StyleEncoder.toJSON`/`fromJSON` + `panda ship`, ~30 LOC of JS) dumps the encoder's whole atomic `Set` + recipe map
as verbose serialized hash strings (`color]___[value:red`). Both re-emit with the consumer's context; v2 changes four
things:

- **Density** — intern table + positional int tuples vs repeated self-describing strings (the 100-component-DS fix).
- **Tree-shaking** — v1 has **none** (whole state dumped; import 10/100 → ship 100, discussion #3522 #8). v2 has
  per-module `modules` + `hydrate({ only })`.
- **Recipes** — v1 ships variant hashes only and **regenerates base from the consumer's config** (consumer must own the
  lib's recipe config; inline `cva`/`sva` can't travel). v2 ships the full snapshot — self-contained, lib's base wins.
- **Guard** — v1 has a string `schemaVersion` only. v2 adds the engine `configFingerprint` + author `panda` range (#3522
  #11).

v1's edge: simplicity and eyeball-debuggable hashes. v2 trades that for the above + engine ownership. Not yet ported
from `panda ship`: the `styles.css` / package scaffolding fallback for non-Panda consumers.

## Built vs deferred

- ✅ Atoms + **recipes/slot recipes** round-trip with per-module tree-shaking; patterns via atoms; recipe usage via
  **call _and_ JSX** (`<Button>`, `<Tabs.Root>`). Version guard, `modulesFor`. Tested at Rust + native + **wasm** levels
  (recipe CSS equality, tree-shaking).
- ✅ **Engine `exports`** — export name → module for style-contributing modules, so a barrel import of a
  recipe-consuming component resolves to (and hydrates) the right module. Covers local exports, named re-exports, star
  re-exports, and default re-export aliases across already-parsed relative files.
- ✅ **`panda buildinfo`** producer wired into `packages/cli`: portable artifact (relative `modules`/`exports`, stable
  `configFingerprint`), `--outfile` / `--minify` / `--panda`. Tested end-to-end (produce → read → hydrate → CSS).
- ✅ **Cross-config token cascade test** — lib build info can be hydrated into a consumer with a different token value
  for the same path: hydrated utilities keep `var(--token)` and the consumer token layer provides the final value.
- ✅ **Token identity round-trip** — `Literal::Token` → `AtomValue::Token` → `BuildValue::Token { t, v }` → hydrate →
  consumer re-emit against the consumer `TokenDictionary`. Producer-resolved values in the artifact are informational;
  emit uses the consumer theme.

The **producer artifact + both bindings are done**. The **token re-emit half** is done at the engine level. The singular
`designSystem` consume path (including opt-in import narrowing) is wired through config loading and the Node driver.
What's left is virtual overlay polish and the items below.

### Remaining — consume polish

- ✅ **Import-based hydration narrowing** — `optimize.treeshakeDesignSystem` (see
  [Opt-in consume narrowing](#opt-in-consume-narrowing)). Covered in
  `packages/compiler/__tests__/design-system/hydrate.test.ts`.
- ⬜ **Plural dependency metadata** — transitive build info for a middle DS that re-exports upstream components without
  making that upstream package its `manifest.designSystem` parent.
- ⬜ **Per-package CSS layers** — emit hydrated CSS under package-scoped layers such as `@layer ds-acme-ui`.
- ⬜ **cssgen scan cost** — with the flag on, every `cssgen` / `writeCss` re-globs and import-scans the full `include`
  set before the tree-shake key short-circuit. Fine for small apps; may want a cheaper dirty check later.

### Remaining — `exports` completeness

- ⬜ **Namespace re-export precision** — `export * as DS from './y'` currently falls back to namespace-import hydration
  instead of exposing a nested export surface. That keeps `modulesFor()` flat while preserving correctness.

### Loose ends

- ⬜ `panda ship` parity: the `styles.css` / package-scaffolding fallback for non-Panda consumers (v1 had it).
- ⬜ `staticCss` / `globalCss` capture in the producer isn't wired.
