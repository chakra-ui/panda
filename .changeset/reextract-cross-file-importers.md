---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Fix watch CSS staying stale when a file you import a value from changes. Importers are re-extracted, including through
re-exports, and only when the imported file's content actually changed.
