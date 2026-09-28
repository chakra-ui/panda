---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/transformer': patch
---

With `transform: true`, compile static `cva` and `sva` calls into small recipe-specific functions, so apps no longer
ship the generic recipe runtime for them. Recipes keep `.raw()`, `variantKeys`, `splitVariantProps`, and the rest of
their API. With hashed class names they stay on the runtime, and the transform warns.

Remove the unused `cva`, `sva`, and `StringCvaConfig` exports from `@pandacss/transformer`.
