---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix recipe conditions ignoring the order you write them. When two conditions match the same element, like `_dark` and
`&[data-active]`, the one written last now wins, as in plain CSS. Breakpoints still apply mobile-first, after selector
conditions.
