---
'@pandacss/types': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Add a `positionTry()` factory to `styled-system/css` and a `theme.positionTry` key for named CSS anchor-positioning
fallbacks, and remove `globalPositionTry`.

`positionTry('bottom')` or `positionTry({ top: 'anchor(bottom)' })` returns the dashed-ident for `positionTryFallbacks`
and emits the `@position-try` block, tree-shaken to what a build uses. Move `globalPositionTry` entries to
`theme.positionTry` and reference them through the factory. A block that must emit unconditionally with a hand-authored
name belongs in a plain `.css` file.
