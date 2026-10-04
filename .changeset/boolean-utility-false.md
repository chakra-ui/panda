---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed a boolean utility's `false` value, like `md: { srOnly: false }`, missing from the stylesheet.
