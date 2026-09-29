---
'@pandacss/compiler': major
'@pandacss/compiler-wasm': major
'@pandacss/types': major
'@pandacss/cli': major
---

Remove Qwik JSX support. `jsxFramework: 'qwik'` no longer generates `styled`, `Box`, or pattern components; use `css()`,
`cva()`, and pattern functions with Qwik's `class` attribute instead.
