---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Fix slow first builds with the PostCSS plugin in projects with many `include` entries (74s to 8s on 10k sources).
