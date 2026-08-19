---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Extract style props from `styled` `defaultProps` on inline factories, including Solid function accessors. Recipe `defaultProps` also resolve through `recipes.button` and local aliases. Analyze and inspect report those usages too.
