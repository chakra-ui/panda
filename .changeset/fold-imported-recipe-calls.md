---
'@pandacss/compiler': patch
---

Fold static calls on a `cva` or `sva` imported from another file to their classes, so fully folded recipes can be
dropped from the bundle.
