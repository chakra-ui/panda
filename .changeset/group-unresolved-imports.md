---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Group unresolved imports by directory and specifier, so adding a file in watch mode checks each missing module once instead of once per importer.
