---
'@pandacss/token-dictionary': patch
---

Fix an issue when using a semantic token with one (but not all) condition using the color opacity modifier

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        colors: {
          black: { value: 'black' },
          white: { value: 'white' },
        },
      },
      semanticTokens: {
        colors: {
          fg: {
            value: {
              base: '{colors.black/87}',
              _dark: '{colors.white}', // <- this was causing a weird issue
            },
          },
        },
      },
    },
  },
})
```
