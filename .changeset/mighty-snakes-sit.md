---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add `patterns` to `config.staticCss` and fix the special `*` rule which used to generate the same rule for every
conditions, which is not most people need (it's still possible by explicitly using `conditions: true`).
