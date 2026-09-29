---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/transformer': patch
---

Ship less recipe code with `transform: true`:

- Static `cva` and `sva` calls, including imported ones, compile into small per-recipe functions. Fully compiled recipes
  drop out of the bundle.
- Compiled recipes keep their API and work with `styled` and `createSlotRecipeContext`. With hashed class names they
  stay on the runtime.
- Fix transformed classes not matching the runtime for nested conditions (`md: { _hover: … }`), projects without a
  preset, compound variants, and `splitVariantProps` order.
