---
'@pandacss/parser': patch
'@pandacss/core': patch
'@pandacss/token-dictionary': patch
---

Fix issue where using `token()` or `token.var()` function from `styled-system/tokens` doesn't get resolved by the
compiler.

```tsx
import { token } from 'styled-system/tokens'
import { css } from 'styled-system/css'

css({
  // This didn't work before, but now it does
  outline: `2px solid ${token('colors.gray.500')}`,

  // This has always worked
  outline: `2px solid token('colors.gray.500')`,
})
```

This also supports fallback values.

```tsx
css({
  color: token('colors.brand.primary', '#3b82f6'),
})
```
