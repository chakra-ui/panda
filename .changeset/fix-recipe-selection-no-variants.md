---
'@pandacss/compiler': patch
---

Fix generated types for recipes with no variants.

Variant-less recipes no longer add a broad string index signature, so `defaultProps` and `createSlotRecipeContext` providers accept valid non-variant props again.
