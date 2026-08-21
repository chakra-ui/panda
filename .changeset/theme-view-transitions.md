---
'@pandacss/types': minor
'@pandacss/dev': minor
'@pandacss/config': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Add `theme.viewTransitions` so a preset can name shared view-transition bags. Call `viewTransition('slide')` and Panda inlines `"vt_slide"`. Unused names stay out of the CSS.
