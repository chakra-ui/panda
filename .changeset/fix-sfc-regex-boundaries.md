---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix SFC expression scanning when JavaScript regex literals contain closing braces, so styles later in the expression are still extracted.
