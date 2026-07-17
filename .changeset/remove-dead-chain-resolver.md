---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Remove the unused `designSystem.resolveChain` API. Chain resolution already happens in the config loader.
