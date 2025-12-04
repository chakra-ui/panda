---
'@pandacss/core': patch
'@pandacss/generator': patch
---

Fix `cssgen --splitting` not fully respecting `staticCss: { recipes: "*" }`.

- When `staticCss: { recipes: "*" }` is set globally, individual recipes with their own `staticCss` property would
  override the global wildcard, potentially omitting variants.

- Split CSS generation was missing recipes that only have base styles (no variants).
