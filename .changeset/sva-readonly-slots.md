---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

`sva()` accepts `slots` declared `as const` again, so slot names can be shared with types like
`(typeof slots)[number]`.
