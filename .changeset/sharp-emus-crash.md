---
'@pandacss/extractor': patch
'@pandacss/parser': patch
'@pandacss/core': patch
---

Fix an issue where spreading an identifier in a sva `slots` array would prevent expected CSS from being generated

```ts
import { sva } from 'styled-system/css'
const parts = ['positioner', 'content']

const card = sva({
  slots: [...parts], // <- spreading here was causing the below CSS not to be generated, it's now fixed ✅
  base: {
    root: {
      p: '6',
    },
  },
})
```
