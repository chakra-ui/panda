---
'@pandacss/transformer': patch
'@pandacss/webpack': patch
---

`new PandaWebpackPlugin({ transform: true })` now rewrites static style calls in `.vue` files handled by `vue-loader`.
