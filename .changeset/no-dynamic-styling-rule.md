---
'@pandacss/eslint-plugin': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

Add the `no-dynamic-styling` lint rule, on in `recommended`. It flags style values Panda can't read at build time, like
`css({ color })` with `color` from state, so you see the missing CSS in your editor.
