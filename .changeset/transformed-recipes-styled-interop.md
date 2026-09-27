---
'@pandacss/transformer': patch
---

Fix transformed `cva` and `sva` recipes crashing when passed to `styled` or `createSlotRecipeContext`. They now support
`.raw()` and `.merge()`. In a `styled(Base, …)` chain, the child's `base` now wins over a parent variant.
