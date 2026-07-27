---
'@pandacss/transformer': patch
---

Speed up recipes in transformed source. `cva` now resolves through a precomputed table of class strings instead of
rebuilding a memo key on every call.
