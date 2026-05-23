---
'@pandacss/node': patch
---

Fix `polyfill: true` leaving the user's `@layer reset, base, tokens, recipes, utilities;` order declaration in the
PostCSS plugin output.
