---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Add `compiler.designSystem` helpers for `panda.lib.json` manifests.

The new helpers create, validate, load, and order design-system manifests so consumers can adopt a library through the
`designSystem` config field.
