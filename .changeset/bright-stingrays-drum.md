---
'@pandacss/token-dictionary': patch
'@pandacss/generator': patch
'@pandacss/core': patch
---

Unify the token path syntax when using `formatTokenName`

Example with the following config:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  hooks: {
    'tokens:created': ({ configure }) => {
      configure({
        formatTokenName: (path: string[]) => '$' + path.join('-'),
      })
    },
  },
})
```

Will now allow you to use the following syntax for token path:

```diff
- css({ boxShadow: '10px 10px 10px {colors.$primary}' })
+ css({ boxShadow: '10px 10px 10px {$colors-primary}' })

- token.var('colors.$primary')
+ token.var('$colors-black')
```
