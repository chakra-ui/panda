---
'@pandacss/compiler': patch
---

Fix `recipe.raw({ size: null })` on an imported `cva` or `sva` resolving to the default variant at build time. Like the
runtime, `null` now selects no option instead of falling back to `defaultVariants`.
