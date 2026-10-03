---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Colors with an opacity modifier and `!important` or `!`, like `brand.500/60 !important`, no longer warn about an invalid
opacity modifier.
