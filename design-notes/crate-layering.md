# Crate Layering

## Summary

The `crates/` workspace is organized as a tiered dependency line, not a flat bag of crates. Dependencies point one way —
infrastructure crates know nothing about parsing, parsing crates know nothing about traversal, traversal crates know
nothing about orchestration. The shape makes refactors correctness-preserving and stops future contributors from
accidentally coupling a leaf crate to walker machinery.

## The tiers

### Tier 0 — infrastructure

`pandacss_fs`, `pandacss_shared`.

`pandacss_fs` is the filesystem abstraction with `os` / `memory` feature-gated impls. Core crates depend on the
`FileSystem` trait, never `std::fs` directly, so the same code compiles to `wasm32-unknown-unknown`. See
[filesystem](./filesystem.md) for the full design.

`pandacss_shared` holds dependency-free helpers and the **single source of truth for CSS property names**
(`css_properties::CSS_PROPERTY_NAMES`, `@generated` from mdn-data). Both the extractor (`is_css_property` membership)
and the codegen (`CssProperties` interface members) read it, so "valid to extract" and "offered in the types" can't
diverge.

### Tier 1 — leaf data + parsing

`pandacss_config`, `pandacss_tokens`, `pandacss_recipes`.

Pure data models with parsing from serializable config or `pandacss_extractor::Literal` to typed shapes. No traversal,
no encoding, no I/O. `pandacss_config::UserConfig` is the canonical resolved config input consumed by project/system
construction. `pandacss_recipes` depends on `pandacss_extractor` for `Literal`, but only as a serializable input shape —
not for walker machinery.

### Tier 2 — process

`pandacss_extractor`, `pandacss_encoder`, `pandacss_stylesheet`.

`pandacss_extractor` parses sources via Oxc and produces `Literal` values plus `ExtractedCall` / `ExtractedJsx` records.
`pandacss_encoder` consumes Tier 1 types (`Recipe`, `SlotRecipe`, `Literal`) and produces atomic `Atom` records. They're
sibling tiers — different axes of work, neither depends on the other.

`pandacss_utility` carries config-derived utility metadata (shorthands, value aliases, per-property layer overrides) and
the `StyleNormalizer` consumed by `process_atomic_with`. It depends on `pandacss_encoder` for the `NormalizeAtomic`
trait it implements — the one documented sibling-Tier-2 dep, in service of fusing the normalize+walk passes.

`pandacss_stylesheet` consumes encoded atoms, recipe snapshots, utility metadata, and the supported static CSS config
subset to produce CSS strings. It depends on `pandacss_encoder` for snapshot/atom types (not on `pandacss_project` —
the project is a dev-dep used only for test wiring). It is an emitter/minifying writer, not a CSS optimizer.

### Tier 3 — façade

`pandacss_project`.

The `Project` crate wires everything together. `System` compiles immutable config-derived runtime state from
`pandacss_config::UserConfig` into `pandacss_project::Config`; `Project` owns mutable build/watch state. This crate is the primary entry point for
`@pandacss/compiler` and the recommended entry point for any Rust consumer. Read-only DX surface; the binding talks to
this, not to the lower tiers directly. See [project-lifecycle](./project-lifecycle.md).

### Future crates

Don't keep empty placeholder crates. When the implementation exists, add the crate at the boundary it actually earns:

- CSS optimization — Tier 2 only once a real CSS-aware optimizer exists.
- Compile orchestration — Tier 3 only if it does more than `Project` plus emitter calls.
- Persistent cache — separate infrastructure/process crate only once real cache behavior exists.

## Standing answers to merge questions

These come up periodically — the standing answer is here so we don't re-litigate.

**"Should `pandacss_encoder` + `pandacss_recipes` merge into one `core` crate?"** — No. Dependencies go one way (encoder
reads Recipe; recipes doesn't know about Encoder), and Tier-1 consumers should not pull `smallvec` / walker machinery
transitively. Merging is reversible later; splitting clean code post-merge is annoying.

**"Should `pandacss_project` own file discovery?"** — No, not yet. Globbing now lives in `pandacss_fs::FileSystem::glob`
(via `fast-glob`), and the binding/JS host calls it explicitly. When `.gitignore`-aware walking lands, it goes in a
separate `pandacss_discover` crate built on `pandacss_fs` + the `ignore` crate.

**"Should `pandacss_project` mutate source files?"** — No. `ParsedFile` is intentionally read-only. It is _not_ a
ts-morph `SourceFile` analog — naming it `SourceFile` would invite `copy()` / `move()` / `applyTextChanges()` requests
that don't fit Panda's extractor role.

**"Should `pandacss_extractor` know about `pandacss_tokens`?"** — Yes, but narrowly. `pandacss_extractor` depends on
`pandacss_tokens` so the static evaluator can fold `token('colors.red.500')` calls. The dependency is one-directional;
`pandacss_tokens` knows nothing about `pandacss_extractor`.

## Why one-way

Panda v2 is fundamentally a one-way pipeline:

```
extract → encode → emit
```

The crate layout makes that direction visible at the dependency level. When asked "where does feature X go?", trace the
data direction:

- New parsing of a `Literal` shape → Tier 1 (`pandacss_recipes`, `pandacss_tokens`, or a new sibling).
- New resolved-config input shape → Tier 1 (`pandacss_config`) plus compilation in Tier 3 (`pandacss_project::System`).
- New traversal that emits atoms → Tier 2 (extend `pandacss_encoder`).
- New CSS emission from atoms/recipes/static CSS → Tier 2 (`pandacss_stylesheet`).
- New CSS optimization after emission → future Tier 2 CSS-aware optimizer.
- New cross-cutting orchestration that owns multi-file state → Tier 3 (`pandacss_project`).
- New I/O or mutation → probably a new crate, not any existing one.

## Related

- [project-lifecycle](./project-lifecycle.md)
- [scope-and-boundaries](./scope-and-boundaries.md)
