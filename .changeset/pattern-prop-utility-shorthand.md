---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix lint rules treating a pattern's own property as a utility when it shares a name with a shorthand.
`consistent-property-style` no longer rewrites `scrollFade({ y: 32 })` or `<ScrollFade y={32} />` to `translateY`.
