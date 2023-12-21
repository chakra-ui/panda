---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Automatically extract/generate CSS for `sva` even if `slots` are not statically extractable, since it will only produce
atomic styles, we don't care much about slots for `sva` specifically

Currently the CSS won't be generated if the `slots` are missing which can be problematic when getting them from another
file, such as when using `Ark-UI` like `import { comboboxAnatomy } from '@ark-ui/anatomy'`

```ts
import { sva } from '../styled-system/css'
import { slots } from './slots'

const card = sva({
  slots, // ❌ did NOT work -> ✅ will now work as expected
  base: {
    root: {
      p: '6',
      m: '4',
      w: 'md',
      boxShadow: 'md',
      borderRadius: 'md',
      _dark: { bg: '#262626', color: 'white' },
    },
    content: {
      textStyle: 'lg',
    },
    title: {
      textStyle: 'xl',
      fontWeight: 'semibold',
      pb: '2',
    },
  },
})
```
