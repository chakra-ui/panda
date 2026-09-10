---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Reuse cross-file analysis across `parseFiles()` batches so shared imported values are read and folded once per batch.
