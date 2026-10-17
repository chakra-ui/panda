---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Fix a slow first build with the PostCSS plugin in projects that have imports Panda can't resolve. Adding many files at once now checks those imports once per batch instead of once per file.
