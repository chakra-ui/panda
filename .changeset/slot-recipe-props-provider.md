---
'@pandacss/compiler': minor
---

Add `PropsProvider` and `usePropsContext` to `createSlotRecipeContext`. A group component can now set variant props
once for every compound component inside it. `PropsProvider` is typed to take a `value` in every framework.

```tsx
const { withProvider, PropsProvider } = createSlotRecipeContext(card)

function CardGroup(props) {
  const [variantProps, restProps] = card.splitVariantProps(props)
  return (
    <PropsProvider value={variantProps}>
      <div {...restProps} />
    </PropsProvider>
  )
}

<CardGroup size="lg">
  <Card.Root>...</Card.Root>
  <Card.Root>...</Card.Root>
</CardGroup>
```
