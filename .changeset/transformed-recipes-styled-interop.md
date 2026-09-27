---
'@pandacss/compiler': patch
'@pandacss/transformer': patch
---

Fix transformed `cva` and `sva` recipes crashing when passed to `styled` or `createSlotRecipeContext`. They now support
`.raw()` and `.merge()`, and `styled()` chains resolve the same as untransformed code.
