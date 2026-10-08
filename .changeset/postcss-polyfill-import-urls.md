---
'@pandacss/postcss': patch
---

Fix `polyfill: true` breaking relative `url()`s, like fonts, in stylesheets pulled in with `@import`.
