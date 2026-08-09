---
'@pandacss/transformer': patch
---

Fix boolean variants in transformed source. `cva`/`sva` now resolve `{ true: … }` branches for boolean and numeric
values, including boolean `defaultVariants`, instead of matching only string values.
