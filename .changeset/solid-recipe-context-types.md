---
'@pandacss/compiler': patch
---

Fix Solid components built with `createRecipeContext` / `createSlotRecipeContext` losing their prop types, and remove
type errors from the generated `jsx` types for Solid, Preact and Vue. `ComponentPropsOf` is now `ComponentProps` in
every framework.
