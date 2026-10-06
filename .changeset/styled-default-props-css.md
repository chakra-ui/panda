---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed a TypeScript error when passing `css` or style props in the `styled` factory's `defaultProps`. The styles were
already applied at runtime, only the types rejected them.
