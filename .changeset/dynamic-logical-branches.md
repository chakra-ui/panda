---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix missing styles when a ternary tests a runtime value initialized with `??`, `||`, or `&&`. Keep both reachable style
branches instead of treating the fallback as a constant.
