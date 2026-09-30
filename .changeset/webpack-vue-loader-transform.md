---
'@pandacss/transformer': patch
'@pandacss/webpack': patch
---

Fix `new PandaWebpackPlugin({ transform: true })` to compile static style calls in `.vue` files handled by `vue-loader`.
