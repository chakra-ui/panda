# Build Info

## Summary

`panda.buildinfo.json` is the **portable encoder state a design-system library ships** so a consuming app reuses its
pre-extracted styles instead of re-extracting the components. It backs `designSystem` + `panda buildinfo`. The JS surface is
one namespace:

```ts
compiler.buildInfo.create({ panda }) // producer (panda buildinfo); configFingerprint is engine-owned
compiler.buildInfo.configFingerprint // this compiler's own fingerprint (compare vs an artifact's)
compiler.buildInfo.validate(info) // schema-compatible? (discriminated { ok })
compiler.buildInfo.modulesFor(info, ['Button']) // barrel imports → module keys
compiler.buildInfo.hydrate(info, { name, only }) // consumer (designSystem); `only` tree-shakes
```

It's a regenerable, key-validated cache: produce it from source, hydrate it (tree-shaken to imported components), and a
version guard falls back to re-extraction when the two sides can't safely share.

## Format (condensed)

Interned + positional so a 100-component library doesn't bloat. **Hashes aren't shipped** — `Atom`'s hash is one-way and
recomputed on hydrate.

```jsonc
{
  "schemaVersion": 2,
  "panda": "^2.0.0",                               // peer range (collision guard); author-supplied
  "configFingerprint": "cfg1-…",                          // engine fingerprint of output-affecting config
  "strings": ["color", "red", "padding", "4px"],   // intern table (every prop/cond/value string)
  "atoms": [{ "p": 0, "v": 1 }],                   // [propIdx, valueIdx]; token values use `{ t, v }`
  "recipes": { "base": [...], "variants": [...] }, // interned EncodedRecipesSnapshot groups
  "modules": { "button": { "atoms": [0], "recipes": [0] } }, // per-module indices into atoms[]/recipe groups
  "exports": { "Button": "button" }                // export name → module key (added by panda buildinfo)
}
```

A value is a bare index (string), `{ t, v }` (token path + resolved value), or `{ n }` (number — preserving the
px-driving type tag). Full atom/recipe data is kept (not pre-built CSS) so the consumer re-emits with **token identity**
preserved instead of reducing tokens to opaque CSS values.

**Token definitions are not in build info.** The artifact carries token _usage_ (path + producer-resolved value at
extraction time); the consumer's **tokens layer** still comes from its own config (typically the lib preset merged in via
the manifest — see [Design-system manifest](#design-system-manifest)). Hydrated utilities reference `var(--path)`; the
consumer's `TokenDictionary` supplies the final CSS value at emit time.

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
module and shared tokens stay module-independent (tokens layer).

The filter follows the app's imports, which rarely name a file:

| app import                            | resolves via                     |
| ------------------------------------- | -------------------------------- |
| `@acme/ds/button` (subpath)           | the subpath _is_ the module key  |
| `{ Button } from '@acme/ds'` (barrel) | `exports["Button"]` → `"button"` |
| `* as DS` (namespace)                 | all modules (no tree-shaking)    |

The barrel case needs `exports`, which the **engine** emits (it has the AST; the CLI would have to re-parse): export facts
resolve to the style-contributing module (`pandacss_extractor::collect_export_info` → `FileEntry.exports` →
`BuildInfo.exports`). A component consumed via JSX (`<Button>`) attributes its recipe to its module like any call, so its
export resolves to the recipe-carrying module. Consumer lookup is O(1) via `modulesFor`. Covered today: locally-declared
exports (`export function/const/class`, `export { local as Public }`), named re-exports (`export { X as Y } from './y'`),
star re-exports (`export * from './y'`), and default re-exports (`export { default as Button } from './button'`). Namespace
stars (`export * as DS from './ds'`) intentionally fall back to the namespace-import path for now.
Panda-native scanning is primary (over-includes safely); a bundler plugin is the precise opt-in.

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

## Collision safety

`validate` is pure and checks the wire `schemaVersion` against the running binding (`buildInfoSchemaVersion()`) — a
cross-version hashing change is the real corruption vector (same atom, different class name). `hydrate` validates first;
an incompatible artifact is a no-op (`{ ok: false, reason }`) the host handles by re-extracting the lib's source. The
peer-range / `configFingerprint` checks share the `reason` union and are layered on by the host (it knows the running version).
Same-version libs merge cleanly — atom hashes are content-addressed.

`configFingerprint` is the **engine's own** fingerprint (`Project::config_fingerprint`, also exposed on the NAPI binding as
`configFingerprint()`), not a JS re-derivation: the engine is the component that knows which config drives encoding. It
hashes the resolved `UserConfig` with machine-local IO / codegen fields removed (`cwd`/`outdir`/`include`/`exclude`/
`importMap`/`jsx*`/`syntax`/codegen flags/validation) and object keys canonically ordered, so two libraries that differ
only in those compare as compatible and the same library fingerprints identically across checkouts. The producer
(`buildInfo.create({ panda })`) supplies only the published peer range; the host reads its own
`compiler.buildInfo.configFingerprint` to compare against an artifact's `configFingerprint`.

## Layering

- **Rust engine** (`crates/pandacss_project/src/build_info.rs`) owns the primitive: `Project::build_info()` (serialize,
  source-keyed) + `Project::hydrate()` (additive, schema guard). Knows atoms/recipes + per-file grouping, not packages.
- **NAPI** (`packages/compiler/crate`) **and WASM** (`packages/compiler-wasm/crate`) expose the same flat primitives —
  `serializeBuildInfo(panda)` / `applyBuildInfo` / `buildInfoSchemaVersion` / `configFingerprint`.
- **JS namespace** (`compiler-shared/src/build-info.ts`) builds `compiler.buildInfo.*` and owns validation + import
  resolution; attached identically by the native (`@pandacss/compiler`) and browser (`@pandacss/compiler-wasm`) hosts.
  The engine emits `exports` itself, so both bindings carry it.
- **`panda buildinfo`** (CLI, `cli_v2/src/commands/buildinfo.ts`) is the only package-aware layer: loads config →
  `parseFiles` → `buildInfo.create({ panda })` → writes `panda.buildinfo.json`. It remaps the engine's absolute scan keys
  to `cwd`-relative POSIX module ids — both `modules` keys and `exports` values; the `configFingerprint` is the engine's
  fingerprint (no JS hashing).

## Design-system manifest

`BuildInfo` should stay the low-level engine payload: extracted atoms/recipes, module provenance, exports, schema guard.
It should **not** become the preset artifact. The package-level consume shape should be a design-system manifest that ties
the extracted style usage to the library's Panda preset:

```json
{
  "schemaVersion": 1,
  "name": "@acme/ds",
  "panda": "^2.0.0",
  "buildInfo": "./styled-system/panda.buildinfo.json",
  "preset": "./panda.preset.js"
}
```

`designSystem: '@acme/ds'` would resolve this manifest, import/merge the preset into the consumer config, create the
consumer `System`, read `buildInfo`, scan consumer imports, call `modulesFor()`, then hydrate only the used modules. Prefer
linking to a JS preset over embedding it in JSON: presets may carry utilities, recipes, conditions, transforms, and other
config shape that should remain executable/config-native.

This also means `configFingerprint` should likely evolve from strict full-config equality toward a **contract shape**
check for design-system consumption: utility names/categories, class-name rules, conditions, recipe names, and similar
output-affecting contracts must match, while token values can differ so consumers can theme the same token paths.

## vs legacy (v1)

v1 (`StyleEncoder.toJSON`/`fromJSON` + `panda ship`, ~30 LOC of JS) dumps the encoder's whole atomic `Set` + recipe map
as verbose serialized hash strings (`color]___[value:red`). Both re-emit with the consumer's context; v2 changes four
things:

- **Density** — intern table + positional int tuples vs repeated self-describing strings (the 100-component-DS fix).
- **Tree-shaking** — v1 has **none** (whole state dumped; import 10/100 → ship 100, discussion #3522 #8). v2 has
  per-module `modules` + `hydrate({ only })`.
- **Recipes** — v1 ships variant hashes only and **regenerates base from the consumer's config** (consumer must own the
  lib's recipe config; inline `cva`/`sva` can't travel). v2 ships the full snapshot — self-contained, lib's base wins.
- **Guard** — v1 has a string `schemaVersion` only. v2 adds the engine `configFingerprint` + author `panda` range (#3522 #11).

v1's edge: simplicity and eyeball-debuggable hashes. v2 trades that for the above + engine ownership. Not yet ported
from `panda ship`: the `styles.css` / package scaffolding fallback for non-Panda consumers.

## Built vs deferred

- ✅ Atoms + **recipes/slot recipes** round-trip with per-module tree-shaking; patterns via atoms; recipe usage via
  **call _and_ JSX** (`<Button>`, `<Tabs.Root>`). Version guard, `modulesFor`. Tested at Rust + native + **wasm** levels
  (recipe CSS equality, tree-shaking).
- ✅ **Engine `exports`** — export name → module for style-contributing modules, so a barrel import of a recipe-consuming
  component resolves to (and hydrates) the right module. Covers local exports, named re-exports, star re-exports, and
  default re-export aliases across already-parsed relative files.
- ✅ **`panda buildinfo`** producer wired into `cli_v2`: portable artifact (relative `modules`/`exports`, stable
  `configFingerprint`), `--outfile` / `--minify` / `--panda`. Tested end-to-end (produce → read → hydrate → CSS).
- ✅ **Cross-config token cascade test** — lib build info can be hydrated into a consumer with a different token value for
  the same path: hydrated utilities keep `var(--token)` and the consumer token layer provides the final value.
- ✅ **Token identity round-trip** — `Literal::Token` → `AtomValue::Token` → `BuildValue::Token { t, v }` → hydrate →
  consumer re-emit against the consumer `TokenDictionary`. Producer-resolved values in the artifact are informational;
  emit uses the consumer theme.

The **producer artifact + both bindings are done**; the **token re-emit half** is done at the engine level. What's left
is mostly the **consume** half (manifest → preset merge → `designSystem` wiring) plus a few loose ends.

### Remaining — consume half (Phase 4, the value)

- ⬜ **`designSystem` consume wiring** — `designSystem: '@acme/ds'` → resolve manifest → merge lib preset → scan the
  consumer's DS imports → `modulesFor` → `hydrate({ only })` → emit under `@layer ds-{name}`. The "app actually uses it"
  path; not built.
- ⬜ **Preset delivery via manifest.** Build info does not ship token/utility/recipe _definitions_ — the manifest's
  `preset` field does. Real apps still need `designSystem` to import/merge the lib preset into the consumer config before
  hydration so token paths, utilities, and recipes exist on the consumer side. The engine cross-config test simulates
  this by giving both sides matching utility/token contracts manually.

### Remaining — `exports` completeness

- ⬜ **Namespace re-export precision** — `export * as DS from './y'` currently falls back to namespace-import hydration
  instead of exposing a nested export surface. That keeps `modulesFor()` flat while preserving correctness.

### Loose ends

- ⬜ `panda ship` parity: the `styles.css` / package-scaffolding fallback for non-Panda consumers (v1 had it).
- ⬜ `validate` peer-range (`pandaRange`) is host-deferred (no semver dep); `staticCss` / `globalCss` capture in the
  producer isn't wired.
- ⚠️ Three pre-existing `compiler-wasm` tests fail once the (gitignored) wasm binary is rebuilt — `derives JSX pattern
  matchers`, `refresh and remove update the atom set` (looks like a real refresh-replace bug), `tracks conditional config
  recipe variants`. Orthogonal to build info (untouched by this work); needs a separate look.
