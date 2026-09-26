---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

`optimize.treeshakeDesignSystem` now keeps the parent styles a stacked design system uses, instead of dropping them.
Rebuild the middle design system with `panda lib` to pick this up.
