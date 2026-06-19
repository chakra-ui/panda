---
'@pandacss/compiler': patch
---

Fix generated types when a recipe has no variants. `RecipeSelection` now resolves to `{}` instead of a `{ [x: string]: string }` index signature for variant-less recipes, which previously poisoned surrounding props.

- `styled('div', { base }, { defaultProps: { 'aria-hidden': false } })` no longer errors on non-string `defaultProps`.
- `createSlotRecipeContext` providers built from a no-variant `sva`/`cva` recipe no longer reject valid children.
