---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/compiler-shared': minor
---

The design system spec now describes more than tokens:

- `recipes`, `slotRecipes` and `patterns`, keyed by name, with variants, defaults and resolved property kinds
- `keyframes`, `colorPalettes`, `textStyles`, `layerStyles` and `animationStyles`
- `originalValue` on tokens: the value before reference expansion or derivation

Empty tables are left out. The reader gains `recipes()`, `slotRecipes()`, `patterns()`, `keyframes()`, `colorPalettes()`
and `composition(kind)`.
