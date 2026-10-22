---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix source inspection missing the token on values of utilities that build their values from `theme()`, like `mt: '2'` or `mx: { base: '-2' }`.
