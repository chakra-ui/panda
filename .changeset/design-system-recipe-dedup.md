---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed recipe rules being emitted twice when both your app and a `designSystem` package use the same recipe.
