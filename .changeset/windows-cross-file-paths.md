---
'@pandacss/compiler': patch
---

Fix cross-file style extraction on Windows. Resolved module paths are normalized to forward slashes, so tsconfig-aliased and relative `css()` imports match and report their dependencies correctly on Windows; POSIX output is unchanged.
