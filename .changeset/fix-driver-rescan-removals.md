---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Fix `Driver.parseFiles()` retaining atoms from source files removed since the previous scan. Full-project rescans now
reconcile scan- and watcher-owned files, including recovery from dropped watcher events.
