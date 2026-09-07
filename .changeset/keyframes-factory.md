---
'@pandacss/types': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Add a `keyframes()` factory to `styled-system/css` for inline, component-local animations.

`keyframes({ from: {...}, to: {...} })` returns a `kf_…` animation name and emits its `@keyframes` block, tree-shaken to
what a build actually references through `animationName` or the `animation` shorthand. Object form only — a bare
`animationName: 'spin'` already resolves a `theme.keyframes` entry, so there is no named form. Shared, design-system
animations still belong in `theme.keyframes`.
