---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Refresh cached cross-file exports when the resolved module itself changes, is deleted, or is recreated. Long-lived
compiler sessions no longer reuse stale direct exports when re-extracting an importer.
