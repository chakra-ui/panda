---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Recipes kept in a local object now compile to plain functions, so their config no longer ships in the bundle.

```ts
const styles = { button: cva({ ... }) }

styles.button({ size: 'sm' })
```

This applies when the recipe is only called. Type-only uses, like `RecipeVariantProps<typeof styles.button>`, don't count.
