---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `optimize.removeUnusedKeyframes` dropping keyframes used through an animations token, like
`css({ animation: 'pulse' })`. `panda analyze` now counts those keyframes as used too.
