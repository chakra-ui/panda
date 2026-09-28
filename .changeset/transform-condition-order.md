---
'@pandacss/compiler': patch
---

Fix transformed class names for conditions nested inside a breakpoint or selector (`md: { _hover: … }`), which pointed
at a class the stylesheet didn't define.
