---
'@pandacss/compiler': patch
'@pandacss/transformer': patch
---

Fix transformed `cva` and `sva` recipes crashing when passed to `styled` or `createSlotRecipeContext`. `styled()` chains
built on them now resolve like untransformed code.
