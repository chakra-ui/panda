---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Reduce allocations during CSS call and JSX extraction by reusing owned style keys and values.
