---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/shared': patch
'@pandacss/core': patch
---

Fix issue where setting the pattern `jsx` option with dot notation didn't work.

```jsx
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  patterns: {
    extend: {
      grid: {
        jsx: ['Form.Group', 'Grid'],
      },
      stack: {
        jsx: ['Form.Action', 'Stack'],
      },
    },
  },
})
```
