---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Run custom utility `transform` callbacks inside `cva`/`sva` recipes when you use the utility's shorthand. The recipe path dispatched on the raw shorthand, so it skipped the transform and emitted the utility key as a literal CSS property (for example `color-variable: ...` instead of your transform's output). It now resolves the shorthand to the canonical key first, matching atomic `css()`.
