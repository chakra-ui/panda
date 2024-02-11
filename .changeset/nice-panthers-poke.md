---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/studio': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add a `imports:created` hook where you can configure additional aliases for the `css` or `styled` factory functions.

They must mirror the same function signature as the default functions and still need to contain static arguments.

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  hooks: {
    'imports:created': ({ configure }) => {
      configure({
        aliases: {
          css: ['xcss'],
          jsxFactory: ['xstyled'],
        },
      })
    },
  },
})
```

```ts
// file.tsx
const className = xcss({ color: 'red' })
// this will be extracted just like the default `css` function

const className = xstyled('div', { base: { color: 'red' } })
// this will be extracted just like the default `styled` function

// or if using the template-literal syntax
const className = xcss`color: red;`
const className2 = xstyled.div`color: red;`
```
