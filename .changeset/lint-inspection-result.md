---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Expose lint-friendly inspection data from `inspectFileSource`, including extracted calls, JSX entries, token references,
component entries, and style entries with safe local key/value spans. Style entries cover every style-writing form —
`css()` (including the `css(a, b)` multi-argument merge), style props, responsive arrays, per-prop conditions, JSX `css`
props (object **and** `css={[...]}` array forms), and recipe styles in `cva` / `sva` / `styled('div', { ... })`
(`base`, `variants`, `compoundVariants`) — and carry per-leaf value spans so tooling can offer precise fixes everywhere.
Each style entry also carries an `owner` (the enclosing call/JSX element) so tooling can group sibling properties from
the same style block.

`compiler.spec()` now reports deprecation richer: `tokens.deprecated` and `utilities.deprecated` are maps of
name → deprecation (`true`, or the author's `deprecated: 'use X instead'` message), recipe definitions carry a
`deprecated` flag, and recipes/slotRecipes are exposed as top-level `spec.recipes` / `spec.slotRecipes` (previously
nested under `spec.recipes.recipes`).

Add `compiler.suggestToken(prop, value)` — given a hardcoded value, returns the token to use (semantic tokens preferred
over the primitives they reference, with hex and px/rem normalization), or `null`. Token references in inspection
results also carry `isVar` (whether the call was `token.var(...)`).
