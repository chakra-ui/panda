---
'@pandacss/compiler': minor
'@pandacss/compiler-shared': minor
'@pandacss/compiler-wasm': minor
---

Add `getFontfaceCss()` and `semanticTokens()` to the compiler. `getFontfaceCss()` returns the resolved `@font-face` CSS on its own; `semanticTokens()` returns each semantic token's value resolved per theme and condition, so tools no longer have to re-derive them from raw config.
