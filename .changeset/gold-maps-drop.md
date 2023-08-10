---
'@pandacss/generator': patch
'@pandacss/types': patch
---

Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook) dependency
