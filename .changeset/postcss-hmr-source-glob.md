---
'@pandacss/compiler': patch
'@pandacss/postcss': patch
---

Fix hot module reloading with the PostCSS integration (`@pandacss/dev/postcss`). Editing a component now updates its styles live, instead of leaving them stale until you restart the dev server.
