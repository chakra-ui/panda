---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix config recipes emitting variants and styles in alphabetical order. Variants, slots, and compound variants now follow
the config again, so later variants override earlier ones and `variantKeys` and `variantMap` keep their declared order.
`globalCss` now puts shorthands before longhands, like recipes.
