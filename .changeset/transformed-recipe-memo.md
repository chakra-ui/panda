---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/transformer': patch
---

Memoize transformed `cva` and `sva` recipes, and make the internal `cx` merge faster: repeated calls are now 5–14x
quicker, and `cx` splits classes on newlines and tabs too. A recipe whose base can't be compiled now stays on the
runtime instead of losing its base classes.
