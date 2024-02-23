---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Fix an issue for token names starting with '0'

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    tokens: {
      spacing: {
        '025': {
          value: '0.125rem',
        },
      },
    },
  },
})
```

and then using it like

```ts
css({ margin: '025' })
```

This would not generate the expected CSS because the parser would try to parse `025` as a number (`25`) instead of
keeping it as a string.
