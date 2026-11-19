---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/eslint-plugin': patch
---

Fixed `consistent-property-style` rewriting a pattern's own property when it shares a name with a utility shorthand,
like `scrollFade({ y: 32 })` to `translateY`.
