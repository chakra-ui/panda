---
'@pandacss/compiler': patch
---

Warn about unknown conditions, like `_hover` without a preset that defines it, in recipes, slot recipes, `globalCss`,
`textStyles`, `layerStyles`, and `animationStyles`. Their styles were dropped or emitted as a selector that never
matches, with no warning.
