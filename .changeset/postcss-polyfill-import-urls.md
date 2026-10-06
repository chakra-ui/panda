---
'@pandacss/postcss': patch
---

Fixed `polyfill: true` breaking relative `url()`s, like fonts, in stylesheets pulled in with `@import`. Vite resolves
them from the imported file again instead of the entry stylesheet.
