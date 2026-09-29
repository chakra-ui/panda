---
'@pandacss/compiler': major
'@pandacss/compiler-wasm': major
'@pandacss/types': major
'@pandacss/cli': major
---

Remove Qwik JSX support:

- `jsxFramework: 'qwik'` no longer generates `styled`, `Box`, or pattern components.
- To migrate, remove `jsxFramework` and style Qwik components with `css()`, `cva()`, and pattern functions on the
  `class` attribute.
