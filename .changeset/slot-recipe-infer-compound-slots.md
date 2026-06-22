---
'@pandacss/compiler': patch
---

Fix slot recipe inference to include slots that appear only in `compoundVariants`. Previously, when `slots` was omitted
from an `sva` call, a slot used solely inside a compound variant's `css` was dropped and its styles never emitted.
