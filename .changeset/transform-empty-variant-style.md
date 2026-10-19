---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix source transforms leaving a `cva()` or `sva()` call on the runtime when a variant option or slot has an empty style,
like `false: {}` or `trigger: {}`. These now compile to class strings like the rest of the recipe.
