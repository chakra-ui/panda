---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

`optimize.treeshakeDesignSystem` now keeps the styles of design-system modules that an imported component imports, like
a `Label` rendered by a `Checkbox`. Design systems need to rerun `panda lib` to regenerate their build info.
