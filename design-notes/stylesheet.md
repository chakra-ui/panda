# Native Stylesheet Compiler

## Summary

`pandacss_stylesheet` is the native CSS emission crate. It consumes a resolved `UserConfig`, borrowed dynamic atoms from
`Project`, and recipe snapshots, then returns formatted or writer-minified CSS. It intentionally emits CSS; it does not
run a CSS-aware optimizer today.

The crate replaced the earlier planned split between `pandacss_emitter` and `pandacss_optimizer`. Keeping emission,
static CSS expansion, and writer formatting in one crate gives a smaller dependency surface while the optimizer phase is
not implemented. If a real optimizer lands, it should be CSS-aware (for example `lightningcss`) rather than a raw
whitespace pass.

## Ownership

The stylesheet crate owns:

- Dynamic atomic CSS emission from `Atom` records.
- Config recipe and slot recipe CSS emission from `EncodedRecipesSnapshot`.
- The supported native `staticCss` subset:
  - `staticCss.css`
  - `staticCss.recipes`
  - global `staticCss.recipes: "*"`
  - recipe-level `recipe.staticCss`
  - recipe wildcard variants
  - base recipe styles
  - slot recipes
  - compound variant CSS
  - static responsive and configured condition expansion
- Layer declarations and non-empty layer blocks.
- Modern breakpoint media syntax (`@media (width >= 48rem)`).
- Writer-level minification: omit indentation/newlines/optional declaration spaces.

The stylesheet crate does **not** own:

- Token `:root` CSS, reset, base/global CSS, keyframes, or theme token artifacts.
- `staticCss.patterns` or `staticCss.themes`; unsupported native paths report diagnostics instead of silently emitting
  partial CSS.
- CSS parsing, rule merging, prefixing, shorthand folding, or AST minification.
- Incremental stylesheet patching for watch mode.

## Ordering

Atom ordering is shared through `pandacss_encoder::compare_atoms_by_emit_order`:

1. condition chain
2. property
3. value sort key

The value key is allocation-free: `(discriminant, &str)`. This comparator is used by both `pandacss_project` snapshots
and final stylesheet emission so dynamic atoms and recipe atomic atoms share one cascade order.

Recipe group entries are sorted at final emission time. `Project::snapshot()` does not sort each group's entries because
the emitter is the last CSS-output boundary and would otherwise re-sort them.

## Performance Shape

`Project.compile()` passes borrowed atoms into `pandacss_stylesheet::compile()`. Static atoms are held in a local owned
buffer and appended as borrowed references, avoiding a deep clone of the project-wide atom set.

`compile()` builds `TokenDictionary` and `Utility` once per call and shares that instance between static CSS expansion
and emission. The emitter avoids per-comparator heap allocation, uses `Cow<str>` for common declaration values, and keeps
owned class names owned through prefix formatting where possible.

`merge_encoded_recipes()` is skipped when the static recipe snapshot is empty, avoiding a full recipe snapshot clone for
projects that do not use native static recipes.

The current build/watch emit cost is still `O(total atoms log total atoms)` per `compile()` call. This is acceptable for
cold builds after the allocation fixes, but it is not an incremental watch-mode design. A future cached emitter would
need a different API: per-file or per-bucket emitted CSS, invalidation by changed atoms, and stable ordering across
affected buckets.

## Minification Boundary

`StylesheetOptions::minify` controls writer formatting only. When `minify` is true, `CssWriter` omits indentation,
newlines, and optional spaces it owns.

There is deliberately no `optimize` option. A previous raw character whitespace pass was removed because it could corrupt
valid CSS, for example descendant selectors (`.x :hover`) and quoted values (`content: "a  b"`). Any future optimizer
must parse CSS and preserve CSS semantics.

## Related

- [Compiler lifecycle](./compiler-lifecycle.md)
- [Atomic encoding](./atomic-encoding.md)
- [Crate layering](./crate-layering.md)
- [Scope and boundaries](./scope-and-boundaries.md)
