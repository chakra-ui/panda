---
'@pandacss/token-dictionary': patch
'@pandacss/parser': patch
'@pandacss/types': patch
---

Slightly change the typings so that you can use any string as a `TokenCategory` (colors, spacing, etc).

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  theme: {
    extend: {
      tokens: {
        filters: { // ✅ this is now allowed !
          blurry: {
            value: 'blur(5px)',
          },
        },
      },
  },
   utilities: {
    extend: {
      filter: {
        values: 'filters', // ✅ you can reference your own TokenCategory here
      },
    },
  },
})
```

so that you can use it in your app like this:

```tsx
import { css } from '../styled-system/css'

export const App = () => {
  return (
    <div
      className={css({
        filter: 'blurry', // ✅ this will be suggested by the autocomplete
      })}
    >
      this text will be blurry
    </div>
  )
}
```
