---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Expose lint-friendly inspection data from `inspectFileSource`, including extracted calls, JSX entries, token references,
component entries, and style entries with safe local key/value spans.

`compiler.spec()` now reports deprecation richer: `tokens.deprecated` and `utilities.deprecated` are maps of
name → deprecation (`true`, or the author's `deprecated: 'use X instead'` message), recipe definitions carry a
`deprecated` flag, and recipes/slotRecipes are exposed as top-level `spec.recipes` / `spec.slotRecipes` (previously
nested under `spec.recipes.recipes`).
