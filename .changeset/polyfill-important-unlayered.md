---
'@pandacss/compiler': patch
---

Fix `polyfill: true` letting unlayered `!important` CSS override Panda's `!important` utilities. Every layered
`!important` rule now outranks unlayered ones, as native cascade layers do.
