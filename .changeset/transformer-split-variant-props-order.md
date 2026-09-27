---
'@pandacss/transformer': patch
---

Fix `splitVariantProps` on transformed `cva` and `sva` recipes returning `[rest, variantProps]`. It now returns
`[variantProps, rest]`, matching the generated `styled-system` recipes.
