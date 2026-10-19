---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `removeUnusedKeyframes` dropping keyframes that are only used through an animation token.
