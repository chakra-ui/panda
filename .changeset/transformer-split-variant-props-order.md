---
'@pandacss/transformer': patch
---

Fix `splitVariantProps` on transformed recipes returning its two halves in the wrong order. It now returns
`[variantProps, rest]`, like styled-system recipes.
