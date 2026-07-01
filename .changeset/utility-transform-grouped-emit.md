---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Fix custom utility `transform` output in the v2 engine.

Transforms that return multiple declarations now emit one class keyed by the utility `className`, preserve `!important`,
resolve tokens before the callback runs, and support nested conditions returned from the transform.
