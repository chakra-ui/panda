---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

`strictTokens` now accepts common CSS keywords that have no token to replace them, like `maxWidth: 'none'`,
`filter: 'none'`, `fill: 'none'` and `float: 'left'`. `transitionProperty` also accepts any property name or list, like
`'opacity, transform'`.
