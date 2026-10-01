---
'@pandacss/compiler-shared': patch
'@pandacss/vite': patch
'@pandacss/bun': patch
---

The Vite and Bun plugins no longer print the same warning twice, once when a file is parsed and again when the
stylesheet is built.
