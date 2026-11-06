---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/cli': patch
---

Fix watch rebuild failures caused by unrelated binary files such as `.DS_Store` in source directories.
