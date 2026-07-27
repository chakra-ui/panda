---
'@pandacss/transformer': patch
---

Speed up recipes with string variants in transformed source. `cva` now indexes a table of resolved class strings
instead of rebuilding a memo key on every call.
