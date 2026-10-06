---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed generated code failing to type-check with `outExtension: 'ts'`. `styled-system` now passes a strict type check for
React, Preact, Solid, and Vue, and the JSX declarations use far fewer `any` types.
