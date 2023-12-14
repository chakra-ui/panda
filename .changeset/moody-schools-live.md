---
'@pandacss/postcss': patch
'@pandacss/astro': patch
---

Fix a regression with the @pandacss/astro integration where the automatically provided `base.css` would be ignored by
the @pandacss/postcss plugin
