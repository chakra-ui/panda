---
'@pandacss/compiler': patch
---

Fix `createSlotRecipeContext` dropping `sva()` slot classes in React, Preact, and Vue. Parts of an
`sva({ className: 'card' })` recipe get `card__root`, `card__title`, … again, as in Solid and 1.x.
