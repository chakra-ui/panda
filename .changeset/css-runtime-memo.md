---
'@pandacss/compiler': patch
---

Speed up the generated `css()` runtime. Calling `css({ ... })` inline with the same styles now
reuses a cached result instead of re-serializing on every call, so style-heavy trees render
noticeably faster (~3x on a dense SSR page).
