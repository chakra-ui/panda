---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed a boolean utility's `false` value missing from the stylesheet, so `css({ srOnly: true, md: { srOnly: false } })` shows the element again from `md` up. A `false` value on a plain CSS property now emits nothing, and a utility transform that returns no styles in `globalCss` no longer leaks a raw declaration.
