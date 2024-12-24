---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
'@pandacss/types': minor
---

Add support for semantic tokens in composite shadow `blur`, `offsetX`, `offsetY` and `spread` properties.

This enables the use of semantic tokens in composite shadow properties.

```ts
// panda.config.ts

export default defineConfig({
  theme: {
    tokens: {
      // ...
      shadows: {
        sm: {
          value: {
            offsetX: '{spacing.3}',
            offsetY: '{spacing.3}',
            blur: '1rem',
            spread: '{spacing.3}',
            color: '{colors.red}',
          },
        },
      },
    },
  },
})
```
