---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `cva()` and `sva()` calls staying in the bundle when a variant or slot has an empty style, like `false: {}`.
