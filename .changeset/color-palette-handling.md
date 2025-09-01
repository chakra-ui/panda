---
'@pandacss/types': minor
'@pandacss/token-dictionary': minor
'@pandacss/core': minor
'@pandacss/config': minor
'@pandacss/generator': minor
---

Add support for controlling the color palette generation via `theme.colorPalette` property.

```ts
// Disable color palette generation completely
export default defineConfig({
  theme: {
    colorPalette: {
      enabled: false,
    },
  },
})

// Include only specific colors
export default defineConfig({
  theme: {
    colorPalette: {
      include: ['gray', 'blue', 'red'],
    },
  },
})

// Exclude specific colors
export default defineConfig({
  theme: {
    colorPalette: {
      exclude: ['yellow', 'orange'],
    },
  },
})
```
