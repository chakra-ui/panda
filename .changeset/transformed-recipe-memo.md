---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/transformer': patch
---

Speed up transformed `cva` and `sva` recipes by caching results per prop combination, and speed up class merging.
Classes split across newlines or tabs now merge too, and a recipe whose base can't be compiled stays on the runtime
instead of losing its base classes.
