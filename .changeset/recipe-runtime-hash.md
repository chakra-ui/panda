---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed config recipes throwing `TypeError: v.charCodeAt is not a function` when `hash: true` is set.
