---
'@pandacss/transformer': patch
---

Memoize `cva`/`sva` results in transformed source, so a component re-rendering with the same variant props reuses its
class string instead of rebuilding it.
