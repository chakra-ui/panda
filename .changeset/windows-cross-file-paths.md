---
'@pandacss/compiler': patch
---

Fix cross-file style extraction on Windows. Resolved paths use forward slashes so aliased and relative `css()` imports match; POSIX is unchanged.
