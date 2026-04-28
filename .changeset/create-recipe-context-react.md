---
'@pandacss/generator': minor
'@pandacss/types': minor
'@pandacss/config': minor
---

add `createRecipeContext` and `createSlotRecipeContext` to the generated `styled-system/jsx` for react projects.

`createRecipeContext(recipe)` returns `{ withContext, PropsProvider, usePropsContext }` — wraps a single (non-slot) recipe so a styled component accepts the recipe's variant props as JSX props, supports `unstyled`, and lets a parent inject default variant props via `PropsProvider` without prop drilling.

`createSlotRecipeContext(slotRecipe)` returns `{ withRootProvider, withProvider, withContext }` — runs a slot recipe once at the root, stores the resolved slot styles in context, and lets each slot consume them without re-running the recipe.

both accept either a recipe directly, `{ key: 'name' }` to look up a config recipe by name, or `{ recipe }`. only react is wired up for now; solid/vue/preact can be added later by mirroring the existing `create-style-context` framework dispatch.
