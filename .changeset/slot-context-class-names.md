---
'@pandacss/compiler': minor
---

Added `useClassNames` to `createSlotRecipeContext`. It returns each slot's class name, for parts that render their own
markup.

Also fixed Solid `withContext` parts not updating when the root's variant props change.
