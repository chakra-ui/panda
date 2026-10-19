---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `removeUnusedKeyframes` dropping keyframes referenced through animation tokens, including aliases and conditional
values. `panda analyze` now reports those keyframes as used.
