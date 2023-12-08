---
'@pandacss/generator': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add a way to specify a recipe's `staticCss` options from inside a recipe config, e.g.:

```js
import { defineRecipe } from '@pandacss/dev'

const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
  },
  staticCss: [{ size: ['*'] }],
})
```

would be the equivalent of defining it inside the main config:

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: {
        size: ['*'],
      },
    },
  },
})
```
