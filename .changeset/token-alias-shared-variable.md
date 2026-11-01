---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `no-deprecated` and `panda analyze` reporting a deprecated token when the style used a different token that compiles to the same CSS variable.
