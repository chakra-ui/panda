---
'@pandacss/compiler': patch
'@pandacss/transformer': patch
---

Mark transformed `cva()`, `sva()`, and `styled()` recipe factories as pure so bundlers can remove unused definitions and
their runtime helpers.
