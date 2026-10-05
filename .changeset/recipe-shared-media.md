---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Recipes on the same breakpoint now share one `@media` block, written after the plain recipe rules as in v1, so a
responsive variant style wins over a plain one.
