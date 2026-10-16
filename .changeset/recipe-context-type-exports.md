---
'@pandacss/compiler': patch
---

If you build a component library on Panda's `jsx` helpers, your `.d.ts` builds work again. Since 2.1.2, exporting a
`withProvider` or `withContext` component could fail with TS2742 or TS4023, or copy the whole props type into your
declarations. Types like `SlotRecipeProviderComponent` and `WithProviderOptions` are exported from `styled-system/jsx`
again, as they were in 2.1.1.
