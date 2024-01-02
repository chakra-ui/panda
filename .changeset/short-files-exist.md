---
'@pandacss/generator': patch
'@pandacss/node': patch
---

- Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS wasn't
  applied correctly
- Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
  through the config recipes)
