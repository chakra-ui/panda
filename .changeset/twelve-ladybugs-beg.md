---
'@pandacss/config': minor
'@pandacss/types': minor
---

- Add support for `staticCss` in presets allowing you create sharable, pre-generated styles
- Add support for extending `staticCss` defined in presets

```jsx
const presetWithStaticCss = definePreset({
  staticCss: {
    recipes: {
      // generate all button styles and variants
      button: ['*'],
    },
  },
})

export default defineConfig({
  presets: [presetWithStaticCss],
  staticCss: {
    extend: {
      recipes: {
        // extend and pre-generate all sizes for card
        card: [{ size: ['small', 'medium', 'large'] }],
      },
    },
  },
})
```
