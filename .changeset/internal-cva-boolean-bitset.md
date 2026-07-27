---
'@pandacss/transformer': patch
---

Speed up boolean-only `cva` recipes in transformed source. They now dispatch through a bit mask built on first use
instead of a memo key, which is the shape a `cn(base, cond && a, cond && b)` component compiles to.
