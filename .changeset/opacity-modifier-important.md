---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed an issue where a color with an opacity modifier and `!important` or `!`, like `brand.500/60 !important`, warned
about an invalid opacity modifier.
