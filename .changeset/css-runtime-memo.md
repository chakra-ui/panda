---
'@pandacss/compiler': patch
---

Generated `css()` caches repeated inline styles instead of re-serializing every call (~3x faster on dense SSR pages).
