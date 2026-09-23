---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fold values imported through a tsconfig `paths` alias, so aliased tokens and styles are included in the output.
This also avoids a large build slowdown in projects that import across packages through those aliases.
