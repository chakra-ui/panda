---
'@pandacss/parser': patch
'@pandacss/core': patch
'@pandacss/node': patch
---

Change recipes `className` to be optional, both for `recipes` and `slotRecipes`, with a fallback to its name.

```ts
import { defineConfig } from '@pandacss/core'

export default defineConfig({
  recipes: {
    button: {
      className: 'button', // 👈 was mandatory, is now optional
      variants: {
        size: {
          sm: { padding: '2', borderRadius: 'sm' },
          md: { padding: '4', borderRadius: 'md' },
        },
      },
    },
  },
})
```
