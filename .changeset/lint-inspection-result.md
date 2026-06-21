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

Add `compiler.suggestToken(prop, value)` — given a hardcoded value, returns the token to use (semantic tokens preferred
over the primitives they reference, with hex and px/rem normalization), or `null`. Token references in inspection
results also carry `isVar` (whether the call was `token.var(...)`).
