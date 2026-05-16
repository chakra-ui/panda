# Project Lifecycle

## Summary

`PandaProject` is the Tier-3 façade that owns build / dev-server session state. Source files flow in through
`parse_file`; the project extracts usages, decomposes `cva()` / `sva()` recipes, and feeds the results into a shared
atomic encoder. The contract is **per-file replacement**: re-adding a path drops its previous contribution before
re-encoding, so removed or renamed styles can't linger as ghost atoms in watch mode.

## Lifecycle methods

| Method                         | Behavior                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `parse_file(path, source)`     | Extract + encode. Replaces any prior bucket for `path`. Returns a `FileReport` with per-call counts. |
| `refresh_file(path, source)`   | Re-parses _only if_ `path` is already known. Returns `false` for unknown paths.                      |
| `remove_file(path)`            | Drops atoms + recipes + diagnostics for `path`. Idempotent; returns `true` if the path was known.    |
| `get_file(path)`               | Returns a borrowed `ParsedFile<'_>` view, or `None`.                                                 |
| `clear()`                      | Drops every path's state but keeps the `ExtractorConfig`.                                            |
| `atoms()`                      | Deduplicated union across every currently-known file.                                                |
| `recipes()` / `slot_recipes()` | Stable-order iterators keyed by `(file, span_start)`.                                                |
| `summary()`                    | Cheap aggregate counts.                                                                              |

## Watch-mode contract

Watch mode is the reason every mutator goes through the "drop, then insert" pattern. Without it, a file edited from

```js
css({ color: 'red' })
```

to

```js
css({ color: 'blue' })
```

would leave both atoms in the union. With the drop-first rule, the old atom evaporates and the global view is always the
current state.

`refresh_file` exists so watch consumers can filter file-change events without keeping their own bookkeeping:

```rust
for event in watcher {
    if !project.refresh_file(event.path, fs::read_to_string(event.path)?) {
        // unknown path — vendored sources, generated output, etc.
    }
}
```

## Atoms cache

```rust
atoms_cache: FxHashSet<Atom>
```

Rebuilt **eagerly** on every add / remove. The eager rebuild trades allocation churn on each mutation for a zero-work
`&FxHashSet` borrow on every read. Read is the hot path — emitters, manifest writers, and tooling all call `atoms()`
repeatedly between mutations — so the tradeoff is right for the access pattern.

Capacity hint is the largest single-file bucket, growing on insert if multiple files contribute distinct atoms. For
projects where every file contributes overlapping atoms (typical), the initial capacity is close to the steady-state
size and growth is rare.

## Recipe registry

`recipes` and `slot_recipes` are `BTreeMap<RecipeKey, …>` keyed by `(file, span_start)`. The `BTreeMap` gives stable
iteration order across runs, which matters for snapshot tests and for tooling that diffs project state between builds.

Span-keyed entries protect against line edits: re-adding a path drops _every_ entry where `key.file == path` before
inserting fresh ones, so shifting a `cva()` call down by a few lines doesn't leave an orphan entry at the old span.

## ParsedFile read-only contract

```rust
pub struct ParsedFile<'a> {
    path: &'a str,
    atoms: &'a FxHashSet<Atom>,
    diagnostics: &'a [Diagnostic],
    recipes: &'a BTreeMap<RecipeKey, Recipe>,
    slot_recipes: &'a BTreeMap<RecipeKey, SlotRecipe>,
}
```

**Read-only by design.** Unlike ts-morph's `SourceFile`, this view does not mutate, copy, move, save, or emit anything —
Panda is an extractor, not a codemod toolkit. Naming it `SourceFile` would invite `applyTextChanges()` requests; the
current naming is deliberate.

Methods are limited to:

- Path metadata: `path()`, `basename()`, `extension()` (no leading dot, Rust convention), `directory()`.
- Extraction results: `atoms()`, `recipes()`, `slot_recipes()`.
- Diagnostics: `diagnostics()`.

Re-process via `PandaProject::refresh_file` or `parse_file`.

## Builder methods

```rust
let project = PandaProject::new(matchers)
    .with_token_dictionary(dict)
    .with_cross_file(resolver);
```

Both are optional; the simple "no plugins" case stays simple (`PandaProject::new(matchers)`).

## Reflection: per-file parallelism

Not yet done. Per-file parallelism is worth doing eventually via `rayon`, but it's tied to a deferred bulk-file API. A
`parse_files(iter)` shape is the natural seam — once batch input lands, the parallelism can opt in there without
disturbing the single-file API surface.

## Related

- [crate-layering](./crate-layering.md)
- [extraction-pipeline](./extraction-pipeline.md)
- [atomic-encoding](./atomic-encoding.md)
