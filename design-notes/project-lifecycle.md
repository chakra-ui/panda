# Project Lifecycle

## Summary

`Project` is the Tier-3 façade that owns build / dev-server session state. The primary construction path is
`Config -> System -> Project`: `System::new(config)` compiles immutable config-derived runtime state, then `Project`
owns the mutable per-file buckets and caches. Source files flow in through `parse_file`; the project extracts usages,
decomposes `cva()` / `sva()` recipes, and feeds the results into a shared atomic encoder. The contract is
**per-file replacement**: re-adding a path drops its previous contribution before re-encoding, so removed or renamed
styles can't linger as ghost atoms in watch mode.

## Construction

```rust
let mut project = Project::from_config(config)?;

// Equivalent lower-level shape when the caller wants to keep the compiled system.
let system = System::new(config)?;
let mut project = Project::new(system);
```

Config-derived construction is fallible. `System::new(config) -> pandacss_project::Result<System>` is where serialized
config is compiled into fast Rust runtime structures: extractor matchers, JSX extraction config, utility metadata,
conditions, breakpoints, patterns, recipes, and the token dictionary bridge. `Project::from_config(config)` simply
builds a `System` and wraps it in a fresh project.

`Project::from_matchers(matchers)` and `Project::from_extractor_config(config)` remain low-level/test constructors for
extractor-focused scenarios. They bypass config compilation and should not be the default path for production callers.

## Lifecycle methods

| Method                         | Behavior                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `parse_file(path, source)`     | Extract + encode. Replaces any prior bucket for `path`. Returns a `ParseFileReport` with per-call counts. |
| `refresh_file(path, source)`   | Re-parses _only if_ `path` is already known. Returns `false` for unknown paths.                      |
| `remove_file(path)`            | Drops atoms + recipes + diagnostics for `path`. Idempotent; returns `true` if the path was known.    |
| `get_file(path)`               | Returns a borrowed `ParsedFile<'_>` view, or `None`.                                                 |
| `clear()`                      | Drops every path's state but keeps the compiled `System`.                                            |
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
atom_counts: FxHashMap<Atom, u32>
```

The project maintains the global atom union incrementally. Adding a file increments each atom's refcount and inserts
first-seen atoms into `atoms_cache`; removing or replacing a file decrements the old bucket and removes atoms whose
count reaches zero. This makes watch-mode updates O(file atoms) instead of O(total project atoms), while `atoms()` still
returns a cheap borrowed `&FxHashSet`.

## Recipe registry

`recipes` and `slot_recipes` are `BTreeMap<RecipeKey, …>` keyed by `(file, span_start)`. The `BTreeMap` gives stable
iteration order across runs, which matters for snapshot tests and for tooling that diffs project state between builds.
Config recipes live in the compiled `System` and are copied into each fresh project; inline recipes discovered from
source files live in the per-file project state.

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

Re-process via `Project::refresh_file` or `parse_file`.

## Cross-file resolver

```rust
let project = Project::from_config(config)?.with_cross_file(resolver);
```

`with_cross_file` is a construction-time convenience that patches the compiled extractor config before files are parsed.
Longer term, filesystem and resolver setup should be folded into the config/system creation path so production callers
can keep using `Project::from_config(config)` as the single entrypoint.

## Reflection: per-file parallelism

Not yet done. Per-file parallelism is worth doing eventually via `rayon`, but it's tied to a deferred bulk-file API. A
`parse_files(iter)` shape is the natural seam — once batch input lands, the parallelism can opt in there without
disturbing the single-file API surface.

## Related

- [crate-layering](./crate-layering.md)
- [extraction-pipeline](./extraction-pipeline.md)
- [atomic-encoding](./atomic-encoding.md)
