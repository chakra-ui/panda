---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed generated `styled-system/jsx`, `helpers`, and recipe runtime failing to type-check with `outExtension: 'ts'`. The
JSX runtime is now typed for React, Preact, Solid, and Vue, and its declarations use far fewer `any` types.
