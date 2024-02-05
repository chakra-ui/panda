---
'@pandacss/config': patch
---

Fix the regression caused by the downstream bundle-n-require package, which tries to load custom conditions first. This
led to a `could not resolve @pandacss/dev` error
