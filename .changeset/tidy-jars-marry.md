---
'@pandacss/shared': patch
---

Speed up `memo` for single-string arguments by using the string itself as the cache key instead of
`JSON.stringify(args)`. This mainly benefits `hypenateProperty`, which runs once per style property at runtime.
