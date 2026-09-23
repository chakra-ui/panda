---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fold values imported through a tsconfig `paths` alias, so aliased tokens and styles are included in the output.
This also speeds up `cssgen` in large projects that use aliased cross-package imports.
