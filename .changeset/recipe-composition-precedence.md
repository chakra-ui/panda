---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix explicit properties in config recipes and slot recipes losing to `textStyle`, `layerStyle`, or `animationStyle`
defaults when their values sort earlier. Preserve overrides within nested compositions and when custom utilities emit
the same CSS property.
