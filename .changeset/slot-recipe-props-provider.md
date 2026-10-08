---
'@pandacss/compiler': minor
---

Add `PropsProvider` and `usePropsContext` to `createSlotRecipeContext`, so a group component can share variant props with
every `withProvider` and `withRootProvider` part below it.

`PropsProvider` is typed to take a `value` in every framework, matching the runtime. Vue code that passed props
directly (`<PropsProvider size="lg">`) still works but now needs `value={{ size: 'lg' }}` to type-check, and Vue's
`usePropsContext` is typed as the `ComputedRef` it returns.
