---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Fix `treeshakeDesignSystem` loading the wrong component's styles when several components export the same name, like
`Root` in Ark UI–based design systems.
