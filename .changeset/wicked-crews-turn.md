---
'@pandacss/config': patch
---

Fix "missing token" warning when using DEFAULT in tokens path

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  validation: 'error',
  theme: {
    semanticTokens: {
      colors: {
        primary: {
          DEFAULT: { value: '#ff3333' },
          lighter: { value: '#ff6666' },
        },
        background: { value: '{colors.primary}' }, // <-- ⚠️ wrong warning
        background2: { value: '{colors.primary.lighter}' }, // <-- no warning, correct
      },
    },
  },
})
```

---

Add a warning when using `value` twice

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  validation: 'error',
  theme: {
    tokens: {
      colors: {
        primary: { value: '#ff3333' },
      },
    },
    semanticTokens: {
      colors: {
        primary: {
          value: { value: '{colors.primary}' }, // <-- ⚠️ new warning for this
        },
      },
    },
  },
})
```
