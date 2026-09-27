---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/transformer': patch
---

Compile static `cva`, `sva`, and styled recipe configs into specialized functions, so they no longer ship the generic
recipe runtime. Exported recipes keep their metadata (`variantKeys`, `config`, `splitVariantProps`, …) through one
shared `attachRecipe` helper, and static `.raw()` results are preserved.
