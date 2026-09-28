---
'@pandacss/compiler': patch
---

Fix transformed `cva` and `sva` compound variants matching `2` and `'2'` (or `true` and `'true'`) as the same value.
Compounds and `defaultVariants` now keep the type written in the config, so transformed recipes match the styled-system
runtime.
