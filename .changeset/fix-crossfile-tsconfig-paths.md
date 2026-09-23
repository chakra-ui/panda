---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fold values imported through a tsconfig `paths` alias, so aliased tokens and styles are included in the output.
Bulk parsing also avoids retrying unresolved imports for every file, preventing cross-file extraction from slowing down as projects grow.
