---
'@pandacss/compiler': minor
---

Add `PropsProvider` and `usePropsContext` to `createSlotRecipeContext`. `PropsProvider` is now typed to take a `value`
in every framework.

```tsx
const { withProvider, PropsProvider } = createSlotRecipeContext(card)

<PropsProvider value={{ size: 'lg' }}>
  <Card.Root>...</Card.Root>
</PropsProvider>
```
