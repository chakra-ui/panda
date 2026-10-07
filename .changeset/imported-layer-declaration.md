---
'@pandacss/vite': patch
'@pandacss/webpack': patch
'@pandacss/compiler-shared': patch
---

Panda now adds its CSS when your `@layer reset, base, tokens, recipes, utilities;` line lives in a file you `@import`,
not only in the entry stylesheet. With `polyfill: true`, the Vite plugin also removes that imported line.

`pandacss()` from `@pandacss/vite` now returns an array of plugins. `plugins: [pandacss()]` works as before.
